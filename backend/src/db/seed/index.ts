import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { env } from '@/core/env';
import { cleanSql, splitStatements, logStep } from './utils';

// ESM için __dirname/__filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../../..');

type Flags = {
  noDrop?: boolean;
  only?: string[]; // ör: ["40","41","50"] -> sadece o dosyalar
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {};
  for (const a of argv.slice(2)) {
    if (a === '--no-drop') flags.noDrop = true;
    else if (a.startsWith('--only=')) {
      flags.only = a.replace('--only=', '').split(',').map(s => s.trim());
    }
  }
  return flags;
}

function assertSafeToDrop(dbName: string) {
  const allowDrop = process.env.ALLOW_DROP === 'true';
  const isProd = process.env.NODE_ENV === 'production';
  const isSystem = ['mysql','information_schema','performance_schema','sys'].includes(dbName.toLowerCase());
  if (isSystem) throw new Error(`Sistem DB'si drop edilemez: ${dbName}`);
  if (isProd && !allowDrop) throw new Error('Prod ortamda DROP için ALLOW_DROP=true bekleniyor.');
}

async function dropAndCreate(root: mysql.Connection) {
  assertSafeToDrop(env.DB.name);
  await root.query(`DROP DATABASE IF EXISTS \`${env.DB.name}\`;`);
  await root.query(
    `CREATE DATABASE \`${env.DB.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
}

async function createRoot(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    multipleStatements: true,
  });
}

async function createConnToDb(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
    multipleStatements: true,
    // unicode_ci ile uyumlu
    charset: 'utf8mb4_unicode_ci',
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTooManyConnections(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String(err.code ?? '') : '';
  const errno = 'errno' in err ? Number(err.errno) : 0;
  return code === 'ER_CON_COUNT_ERROR' || errno === 1040;
}

function stopLocalBackendDevProcesses(): number {
  const pidSet = new Set<number>();
  const currentPid = process.pid;

  try {
    const ssOutput = execFileSync('ss', ['-ltnp'], {
      cwd: backendRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const portPattern = new RegExp(`:${env.PORT}\\b`);
    for (const line of ssOutput.split('\n')) {
      if (!portPattern.test(line)) continue;
      for (const match of line.matchAll(/pid=(\d+)/g)) {
        const pid = Number(match[1]);
        if (pid && pid !== currentPid) pidSet.add(pid);
      }
    }
  } catch {
    // ignore ss lookup failures
  }

  try {
    const output = execFileSync('ps', ['-eo', 'pid=,args='], {
      cwd: backendRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    for (const line of output.split('\n').map((row) => row.trim()).filter(Boolean)) {
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) continue;
      const pid = Number(match[1]);
      const args = match[2];
      if (pid === currentPid) continue;
      if (
        args.includes('bun --hot src/index.ts') ||
        args.includes('node scripts/dev.mjs') ||
        args.includes('dist/index.js')
      ) {
        try {
          const cwd = fs.readlinkSync(`/proc/${pid}/cwd`);
          if (cwd === backendRoot) pidSet.add(pid);
        } catch {
          // ignore cwd read failures
        }
      }
    }
  } catch {
    // ignore ps lookup failures
  }

  for (const pid of pidSet) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore individual kill failures
    }
  }

  return pidSet.size;
}

async function connectWithRecovery<T>(factory: () => Promise<T>, label: string): Promise<T> {
  try {
    return await factory();
  } catch (err) {
    if (!isTooManyConnections(err)) throw err;

    const stopped = stopLocalBackendDevProcesses();
    if (stopped > 0) {
      logStep(`🧹 ${label}: fazla MySQL bağlantısı nedeniyle ${stopped} lokal backend süreci kapatıldı`);
      await sleep(1500);
      return factory();
    }

    throw err;
  }
}

function shouldRun(file: string, flags: Flags) {
  if (!flags.only?.length) return true;
  const m = path.basename(file).match(/^(\d+)/);
  const prefix = m?.[1];
  return prefix ? flags.only.includes(prefix) : false;
}

/** admin değişkenlerini ENV'den oku + bcrypt üret */
function getAdminVars() {
  const email = (process.env.ADMIN_EMAIL || 'orhanguzell@gmail.com').trim();
  const id = (process.env.ADMIN_ID || '4f618a8d-6fdb-498c-898a-395d368b2193').trim();
  const plainPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = bcrypt.hashSync(plainPassword, 12);
  return { email, id, passwordHash };
}


/** SQL string güvenli tek tırnak escape */
function sqlStr(v: string) {
  return v.replaceAll("'", "''");
}

/** Dosyayı oku, temizle, admin değişkenlerini enjekte et */
function prepareSqlForRun(
  rawSql: string,
  admin: { email: string; id: string; passwordHash: string },
) {
  let sql = cleanSql(rawSql);

  const header = [
    `SET @ADMIN_EMAIL := '${sqlStr(admin.email)}';`,
    `SET @ADMIN_ID := '${sqlStr(admin.id)}';`,
    `SET @ADMIN_PASSWORD_HASH := '${sqlStr(admin.passwordHash)}';`,
  ].join('\n');

  sql = sql
    .replaceAll('{{ADMIN_BCRYPT}}', admin.passwordHash)
    .replaceAll('{{ADMIN_PASSWORD_HASH}}', admin.passwordHash)
    .replaceAll('{{ADMIN_EMAIL}}', admin.email)
    .replaceAll('{{ADMIN_ID}}', admin.id);

  sql = `${header}\n${sql}`;
  return sql;
}

async function runSqlFile(
  conn: mysql.Connection,
  absPath: string,
  adminVars: { email: string; id: string; passwordHash: string },
) {
  const name = path.basename(absPath);
  logStep(`⏳ ${name} çalışıyor...`);
  const raw = fs.readFileSync(absPath, 'utf8');

  const sql = prepareSqlForRun(raw, adminVars);
  const statements = splitStatements(sql);

  await conn.query('SET NAMES utf8mb4;');
  await conn.query("SET time_zone = '+00:00';");

  for (const stmt of statements) {
    if (!stmt) continue;
    await conn.query(stmt);
  }
  logStep(`✅ ${name} bitti`);
}

async function main() {
  const flags = parseFlags(process.argv);

  // 1) Root ile drop + create (opsiyonel)
  const root = await connectWithRecovery(createRoot, 'root bağlantısı');
  try {
    if (!flags.noDrop) {
      logStep('💣 DROP + CREATE başlıyor');
      await dropAndCreate(root);
      logStep('🆕 DB oluşturuldu');
    } else {
      logStep('⤵️ --no-drop: DROP/CREATE atlanıyor');
    }
  } finally {
    await root.end();
  }

  // 2) DB bağlantısı
  const conn = await connectWithRecovery(createConnToDb, 'DB bağlantısı');

  try {
    // 3) Admin değişkenlerini hazırla
    const ADMIN = getAdminVars();

    // 4) SQL klasörünü bul (öncelik env, sonra dist/sql, yoksa src/sql)
    const envDir = process.env.SEED_SQL_DIR && process.env.SEED_SQL_DIR.trim();
    const distSql = path.resolve(__dirname, 'sql');
    const srcSql  = path.resolve(__dirname, '../../../src/db/seed/sql');
    const sqlDir  = envDir ? path.resolve(envDir) : (fs.existsSync(distSql) ? distSql : srcSql);

    const files = fs.readdirSync(sqlDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const f of files) {
      const abs = path.join(sqlDir, f);
      if (!shouldRun(abs, flags)) {
        logStep(`⏭️ ${f} atlandı (--only filtresi)`);
        continue;
      }
      await runSqlFile(conn, abs, ADMIN);
    }
    logStep('🎉 Seed tamamlandı.');
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
