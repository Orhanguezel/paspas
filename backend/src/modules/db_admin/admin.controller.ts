// =============================================================
// FILE: src/routes/admin/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { env } from "@/core/env";
import {
  createPool,
  type Pool,
  type PoolConnection,
  type RowDataPacket,
} from "mysql2/promise";
import { z } from "zod";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { extname, join } from "node:path";
import { createGunzip } from "node:zlib";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { runMysqlDumpAll, tmpFilePath, rmSafe } from "./helpers";
import { insertAdminAuditLog } from "@/modules/admin_audit/repository";
import { randomUUID } from "node:crypto";
import _fetch from "node-fetch";
const fetchAny: typeof fetch = (globalThis as any).fetch || (_fetch as any);

// ❗ Fallback dump için (INSERT value escape)
import { escape as sqlEscape } from "mysql2";

/* ---------- DB config ---------- */
function DB() {
  return {
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
  };
}

/* ---------- mysql2 pool (multipleStatements) ---------- */
let _pool: Pool | null = null;
function pool(): Pool {
  if (_pool) return _pool;
  const cfg = DB();
  _pool = createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    charset: "utf8mb4",
    multipleStatements: true,
  });
  return _pool!;
}

/* ---------- Snapshot storage (uploads/db_snapshots) ---------- */

const SNAPSHOT_DIR = join(process.cwd(), "uploads", "db_snapshots");
const SNAPSHOT_INDEX_FILE = join(SNAPSHOT_DIR, "index.json");

type DbSnapshotMeta = {
  id: string;
  filename: string;
  label?: string | null;
  note?: string | null;
  created_at: string;
  size_bytes?: number | null;
};

function ensureSnapshotDir() {
  try {
    if (!existsSync(SNAPSHOT_DIR)) {
      mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function loadSnapshotIndex(): DbSnapshotMeta[] {
  try {
    if (!existsSync(SNAPSHOT_INDEX_FILE)) return [];
    const raw = readFileSync(SNAPSHOT_INDEX_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const mapped = parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const id = String((item as any).id || "");
        const filename = String((item as any).filename || "");
        if (!id || !filename) return null;

        const created_at =
          typeof (item as any).created_at === "string"
            ? (item as any).created_at
            : new Date().toISOString();

        const size_raw = (item as any).size_bytes;
        const size_bytes =
          typeof size_raw === "number"
            ? size_raw
            : size_raw == null
            ? null
            : Number.isFinite(Number(size_raw))
            ? Number(size_raw)
            : null;

        const label = (item as any).label ?? null;
        const note = (item as any).note ?? null;

        const meta: DbSnapshotMeta = {
          id,
          filename,
          label,
          note,
          created_at,
          size_bytes,
        };
        return meta;
      })
      .filter((x) => !!x) as DbSnapshotMeta[];

    return mapped;
  } catch {
    return [];
  }
}

function saveSnapshotIndex(list: DbSnapshotMeta[]) {
  try {
    ensureSnapshotDir();
    writeFileSync(SNAPSHOT_INDEX_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch {
    // ignore
  }
}

/* ---------- yardımcılar ---------- */
interface TableRow extends RowDataPacket {
  name: string;
}

/**
 * JS fallback dumper:
 *  - Tüm tabloları listeler
 *  - SHOW CREATE TABLE ile şema
 *  - INSERT INTO ... VALUES (...), (...); blokları
 */
async function dumpDbViaConnection(
  cfg: { host: string; port: number; user: string; password: string; database: string },
  outPath: string
) {
  const p = pool();
  const conn = await p.getConnection();
  const ws = createWriteStream(outPath, { encoding: "utf8" });

  const write = (chunk: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const ok = ws.write(chunk, (err) => {
        if (err) reject(err);
        else resolve();
      });
      if (!ok) {
        ws.once("drain", () => resolve());
      }
    });

  try {
    const tables = await listTables(conn, cfg.database);

    // DB charset bilgisi
    const [vars] = await conn.query<RowDataPacket[]>(
      "SELECT @@character_set_database AS cs, @@collation_database AS co"
    );
    const cs = vars?.[0]?.cs || "utf8mb4";
    const co = vars?.[0]?.co || "utf8mb4_unicode_ci";

    await write(`-- Simple SQL dump generated at ${new Date().toISOString()}\n\n`);
    await write(
      `CREATE DATABASE IF NOT EXISTS ${backtickIdent(
        cfg.database
      )} /*!40100 DEFAULT CHARACTER SET ${cs} COLLATE ${co} */;\n`
    );
    await write(`USE ${backtickIdent(cfg.database)};\n\n`);

    for (const table of tables) {
      // ---- CREATE TABLE
      const [createRows] = await conn.query<RowDataPacket[]>(
        `SHOW CREATE TABLE ${backtickIdent(table)}`
      );
      const createSql =
        (createRows?.[0] as any)?.["Create Table"] ??
        (createRows?.[0] as any)?.["Create Table"];

      if (!createSql) continue;

      await write(
        `\n\n-- ----------------------------\n-- Table structure for ${backtickIdent(
          table
        )}\n-- ----------------------------\n`
      );
      await write(`DROP TABLE IF EXISTS ${backtickIdent(table)};\n`);
      await write(`${createSql};\n\n`);

      // ---- DATA
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT * FROM ${backtickIdent(table)}`
      );
      const data = rows as Record<string, any>[];
      if (!data.length) continue;

      await write(
        `-- ----------------------------\n-- Records of ${backtickIdent(
          table
        )}\n-- ----------------------------\n`
      );

      const columns = Object.keys(data[0]);
      const colList = columns.map((c) => backtickIdent(c)).join(", ");
      const insertPrefix = `INSERT INTO ${backtickIdent(
        table
      )} (${colList}) VALUES `;

      const chunkSize = 100;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const valuesSql = chunk
          .map((row) => {
            const vals = columns.map((col) => {
              const v = row[col];
              if (v === null || typeof v === "undefined") return "NULL";
              return sqlEscape(v);
            });
            return `(${vals.join(", ")})`;
          })
          .join(",\n");

        await write(insertPrefix + "\n" + valuesSql + ";\n");
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      ws.end((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    conn.release();
  }
}

async function listTables(
  conn: PoolConnection,
  dbName: string
): Promise<string[]> {
  const [rows] = await conn.query<TableRow[]>(
    `SELECT TABLE_NAME AS name
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?`,
    [dbName]
  );
  return rows.map((r) => r.name);
}

function backtickIdent(name: string) {
  return "`" + String(name).replace(/`/g, "``") + "`";
}

function isGzipContent(
  ct: string | null | undefined,
  ce: string | null | undefined,
  url?: string
) {
  const ctype = (ct || "").toLowerCase();
  const cenc = (ce || "").toLowerCase();
  return (
    cenc.includes("gzip") ||
    ctype.includes("application/gzip") ||
    (url || "").toLowerCase().endsWith(".gz")
  );
}

async function gunzipBuffer(buf: Uint8Array): Promise<Buffer> {
  return new Promise((res, rej) => {
    const chunks: Buffer[] = [];
    const gun = createGunzip();
    gun.on("data", (c: Buffer) => chunks.push(c));
    gun.on("end", () => res(Buffer.concat(chunks)));
    gun.on("error", rej);
    gun.end(Buffer.from(buf));
  });
}

/* ---------- ortak import yürütücüsü ---------- */
const ImportSqlSchema = z.object({
  sql: z.string().min(1),
  dryRun: z.boolean().optional().default(false),
  truncateBefore: z.boolean().optional().default(false),
});

async function runSqlImport({
  sql,
  dryRun,
  truncateBefore,
}: z.infer<typeof ImportSqlSchema>) {
  const cfg = DB();
  const p = pool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS=0; SET SQL_SAFE_UPDATES=0;");

    if (truncateBefore) {
      const tables = await listTables(conn, cfg.database);
      for (const t of tables) {
        await conn.query(`TRUNCATE TABLE ${backtickIdent(t)};`);
      }
    }

    await conn.query(sql); // multipleStatements: true

    if (dryRun) {
      await conn.rollback();
      return { ok: true as const, dryRun: true as const };
    }

    await conn.commit();
    return { ok: true as const };
  } catch (err: any) {
    try {
      await conn.rollback();
    } catch {}
    return {
      ok: false as const,
      error: err?.message || "SQL import failed",
    };
  } finally {
    try {
      await conn.query("SET FOREIGN_KEY_CHECKS=1;");
    } catch {}
    conn.release();
  }
}

/* =======================================================================
 * INFO: GET /admin/db/info
 * ======================================================================= */
export const adminGetDbInfo: RouteHandler = async (_req, reply) => {
  const cfg = DB();
  const p = pool();
  const conn = await p.getConnection();

  try {
    const [tableRows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS tableCount,
              COALESCE(SUM(TABLE_ROWS), 0) AS totalRows,
              ROUND(COALESCE(SUM(DATA_LENGTH + INDEX_LENGTH), 0) / 1024 / 1024, 2) AS dbSizeMb
         FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?`,
      [cfg.database]
    );
    const stats = tableRows?.[0] ?? {};

    ensureSnapshotDir();
    const snapshotCount = loadSnapshotIndex().length;

    let environment: "demo" | "seed" | "production" = "production";
    const reasons: string[] = [];

    try {
      const [demoUsers] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM users WHERE email = 'admin@paspas.local'`
      );
      if (Number(demoUsers?.[0]?.cnt) > 0) {
        environment = "demo";
        reasons.push("Demo kullanici (admin@paspas.local) mevcut");
      }
    } catch { /* table may not exist */ }

    if (environment !== "demo") {
      try {
        const [erpCounts] = await conn.query<RowDataPacket[]>(
          `SELECT
            (SELECT COUNT(*) FROM urunler) AS urunler,
            (SELECT COUNT(*) FROM musteriler) AS musteriler,
            (SELECT COUNT(*) FROM satis_siparisleri) AS siparisler`
        );
        const c = erpCounts?.[0] ?? {};
        if (Number(c.urunler) === 0 && Number(c.musteriler) === 0 && Number(c.siparisler) === 0) {
          environment = "seed";
          reasons.push("ERP tablolari bos (urunler, musteriler, satis_siparisleri)");
        }
      } catch { /* tables may not exist */ }
    }

    if (environment === "production" && reasons.length === 0) {
      reasons.push("ERP tablolarinda veri mevcut, demo isaretcisi yok");
    }

    return reply.send({
      tableCount: Number(stats.tableCount ?? 0),
      totalRows: Number(stats.totalRows ?? 0),
      dbSizeMb: Number(stats.dbSizeMb ?? 0),
      snapshotCount,
      environment,
      environmentReason: reasons,
    });
  } finally {
    conn.release();
  }
};

/* =======================================================================
 * EXPORT: GET /admin/db/export  (+ explicit audit log for GET)
 * ======================================================================= */
export const adminExportSql: RouteHandler = async (req, reply) => {
  const cfg = DB();
  const stamp = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename = `dump_${stamp.getFullYear()}${pad(
    stamp.getMonth() + 1
  )}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(
    stamp.getMinutes()
  )}.sql`;

  const tmpOut = tmpFilePath(".sql");

  try {
    // 1) Önce mysqldump dene
    try {
      await runMysqlDumpAll(cfg, tmpOut);
      req.log.info("db export via mysqldump completed");
    } catch (err: any) {
      const msg = String(err?.message || "");
      req.log.error({ err }, "db export via mysqldump failed");

      // ENOENT veya spawn_error -> binary yok / çalışmıyor → JS fallback
      if (msg.includes("ENOENT") || msg.includes("spawn_error")) {
        req.log.warn(
          { err },
          "mysqldump/mariadb-dump bulunamadı, JS fallback dumper kullanılacak"
        );
        await dumpDbViaConnection(cfg, tmpOut);
      } else {
        // mysqldump başka sebeple çökerse doğrudan hata dön
        throw err;
      }
    }

    // 2) Artık tmpOut hazır, stream olarak gönder
    const stream = createReadStream(tmpOut);
    stream.on("close", () => rmSafe(tmpOut));
    stream.on("error", () => rmSafe(tmpOut));

    // Audit log for GET export (hook only captures POST/PUT/PATCH/DELETE)
    const user = (req as any).user ?? {};
    insertAdminAuditLog({
      id: randomUUID(),
      actor_user_id: user.sub ?? user.id ?? null,
      actor_email: user.email ?? null,
      actor_role: user.role ?? null,
      action: "GET /admin/db/export",
      resource: "db",
      resource_id: null,
      method: "GET",
      path: "/api/admin/db/export",
      route: "/db/export",
      status_code: 200,
      request_id: req.id ?? null,
      ip: req.ip ?? null,
      user_agent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null,
      payload: { action: "full_db_export", filename },
    }).catch((err) => req.log.warn({ err }, "db_export_audit_failed"));

    return reply
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(stream);
  } catch (err: any) {
    req.log.error({ err }, "db export failed (final)");

    const msg = err?.message || "export_failed";
    rmSafe(tmpOut);
    return reply.code(500).send({
      error: {
        message: msg,
      },
    });
  }
};

/* =======================================================================
 * IMPORT (JSON): POST /admin/db/import-sql
 * ======================================================================= */
export const adminImportSqlText: RouteHandler = async (req, reply) => {
  const body = ImportSqlSchema.parse(req.body || {});
  const res = await runSqlImport(body);
  if (!res.ok) return reply.code(400).send(res);
  return reply.send(res);
};

/* =======================================================================
 * IMPORT (URL): POST /admin/db/import-url
 * ======================================================================= */
const UrlBody = z.object({
  url: z.string().url(),
  dryRun: z.boolean().optional().default(false),
  truncateBefore: z.boolean().optional().default(false),
});

export const adminImportSqlFromUrl: RouteHandler = async (req, reply) => {
  const { url, dryRun, truncateBefore } = UrlBody.parse(req.body || {});
  const r = await fetchAny(url);
  if (!r.ok) return reply.code(400).send({ ok: false, error: "URL fetch failed" });

  const ct = r.headers.get("content-type");
  const ce = r.headers.get("content-encoding");

  const arr = await r.arrayBuffer();
  let u8 = new Uint8Array(arr);

  if (isGzipContent(ct, ce, url)) {
    try {
      u8 = new Uint8Array(await gunzipBuffer(u8));
    } catch {
      return reply.code(400).send({ ok: false, error: "Gzip decompress failed" });
    }
  }

  const sql = Buffer.from(u8).toString("utf8");
  const res = await runSqlImport({ sql, dryRun, truncateBefore });
  if (!res.ok) return reply.code(400).send(res);
  return reply.send(res);
};

/* =======================================================================
 * IMPORT (FILE): POST /admin/db/import-file
 * ======================================================================= */
export const adminImportSqlFromFile: RouteHandler = async (req, reply) => {
  const mp: any = await (req as any).file?.();
  if (!mp) return reply.code(400).send({ ok: false, error: "No file" });

  const ext = extname(mp.filename || "").toLowerCase();
  const isGz = ext === ".gz";

  const buf: Buffer = await mp.toBuffer();
  let u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

  if (isGz) {
    try {
      u8 = new Uint8Array(await gunzipBuffer(u8));
    } catch {
      return reply.code(400).send({ ok: false, error: "Gzip decompress failed" });
    }
  }

  const sql = Buffer.from(u8).toString("utf8");

  const fields: Record<string, any> = (mp as any).fields || {};
  const truncateBefore =
    typeof fields.truncateBefore !== "undefined"
      ? String(fields.truncateBefore).toLowerCase() === "true"
      : String(fields.truncate_before_import ?? "").toLowerCase() === "true";

  const res = await runSqlImport({ sql, dryRun: false, truncateBefore });
  if (!res.ok) return reply.code(400).send(res);
  return reply.send(res);
};

/* =======================================================================
 * SNAPSHOT: CREATE / LIST / RESTORE / DELETE
 * ======================================================================= */

const SnapshotCreateSchema = z.object({
  label: z.string().trim().min(1).max(255).optional(),
  note: z.string().trim().max(1000).optional(),
});

const SnapshotRestoreBody = z.object({
  dryRun: z.boolean().optional().default(false),
  truncateBefore: z.boolean().optional().default(true),
});

/** GET /admin/db/snapshots */
export const adminListDbSnapshots: RouteHandler = async (_req, reply) => {
  ensureSnapshotDir();
  const index = loadSnapshotIndex();

  // Önce dosyası olanları enrich edip (veya null) map'le
  const mapped: (DbSnapshotMeta | null)[] = index.map(
    (meta): DbSnapshotMeta | null => {
      const full = join(SNAPSHOT_DIR, meta.filename);
      if (!existsSync(full)) return null;

      try {
        const st = statSync(full);
        return {
          ...meta,
          size_bytes: st.size,
          created_at: meta.created_at || st.mtime.toISOString(),
        };
      } catch {
        return null;
      }
    }
  );

  // Null'ları at, en yeni en üstte
  const items: DbSnapshotMeta[] = mapped
    .filter((x): x is DbSnapshotMeta => x !== null)
    .sort((a: DbSnapshotMeta, b: DbSnapshotMeta) =>
      b.created_at.localeCompare(a.created_at)
    );

  return reply.send(items);
};



/** POST /admin/db/snapshots */
export const adminCreateDbSnapshot: RouteHandler = async (req, reply) => {
  const cfg = DB();
  ensureSnapshotDir();
  const body = SnapshotCreateSchema.parse(req.body || {});

  const stamp = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(
    stamp.getDate()
  )}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}`;

  const id = randomBytes(8).toString("hex");
  const filename = `snapshot_${ts}_${id}.sql`;
  const fullPath = join(SNAPSHOT_DIR, filename);

  try {
    try {
      await runMysqlDumpAll(cfg, fullPath);
      req.log.info({ filename }, "db snapshot via mysqldump completed");
    } catch (err: any) {
      const msg = String(err?.message || "");
      req.log.error({ err, filename }, "db snapshot via mysqldump failed");

      if (msg.includes("ENOENT") || msg.includes("spawn_error")) {
        req.log.warn(
          { err, filename },
          "mysqldump/mariadb-dump yok, snapshot için JS fallback dumper kullanılacak"
        );
        await dumpDbViaConnection(cfg, fullPath);
      } else {
        throw err;
      }
    }

    const st = statSync(fullPath);
    const meta: DbSnapshotMeta = {
      id,
      filename,
      label: body.label ?? null,
      note: body.note ?? null,
      created_at: st.mtime.toISOString(),
      size_bytes: st.size,
    };

    const index = loadSnapshotIndex().filter((x) => x.id !== id);
    index.push(meta);
    saveSnapshotIndex(index);

    return reply.send(meta);
  } catch (err: any) {
    req.log.error({ err }, "db snapshot create failed");
    try {
      if (existsSync(fullPath)) unlinkSync(fullPath);
    } catch {
      // ignore
    }
    return reply.code(500).send({
      ok: false,
      error: err?.message || "snapshot_create_failed",
    });
  }
};

/** POST /admin/db/snapshots/:id/restore */
export const adminRestoreDbSnapshot: RouteHandler = async (req, reply) => {
  const { id } = (req.params || {}) as { id?: string };
  if (!id) return reply.code(400).send({ ok: false, error: "snapshot_id_required" });

  ensureSnapshotDir();
  const index = loadSnapshotIndex();
  const meta = index.find((x) => x.id === id);
  if (!meta) return reply.code(404).send({ ok: false, error: "snapshot_not_found" });

  const fullPath = join(SNAPSHOT_DIR, meta.filename);
  if (!existsSync(fullPath)) {
    return reply.code(404).send({ ok: false, error: "snapshot_file_missing" });
  }

  const { dryRun, truncateBefore } = SnapshotRestoreBody.parse(req.body || {});

  try {
    const sql = readFileSync(fullPath, "utf8");
    const res = await runSqlImport({ sql, dryRun, truncateBefore });
    if (!res.ok) return reply.code(400).send(res);
    return reply.send(res);
  } catch (err: any) {
    req.log.error({ err, id }, "db snapshot restore failed");
    return reply.code(500).send({
      ok: false,
      error: err?.message || "snapshot_restore_failed",
    });
  }
};

/** DELETE /admin/db/snapshots/:id */
export const adminDeleteDbSnapshot: RouteHandler = async (req, reply) => {
  const { id } = (req.params || {}) as { id?: string };
  if (!id) return reply.code(400).send({ ok: false, error: "snapshot_id_required" });

  ensureSnapshotDir();
  const index = loadSnapshotIndex();
  const meta = index.find((x) => x.id === id);
  if (!meta) return reply.code(404).send({ ok: false, error: "snapshot_not_found" });

  const fullPath = join(SNAPSHOT_DIR, meta.filename);

  try {
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  } catch (err: any) {
    req.log.error({ err, id }, "snapshot file delete failed");
  }

  const next = index.filter((x) => x.id !== id);
  saveSnapshotIndex(next);

  return reply.send({ ok: true, message: "snapshot_deleted" });
};
