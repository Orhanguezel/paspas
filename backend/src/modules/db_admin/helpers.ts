// =============================================================
// FILE: src/routes/admin/helpers.ts
// =============================================================
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  existsSync,
  unlinkSync,
  createWriteStream,
  createReadStream,
} from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { createGunzip } from "node:zlib";
import { spawn } from "node:child_process";

const pump = promisify(pipeline);

export function tmpFilePath(suffix = "") {
  const id = randomBytes(8).toString("hex");
  return join(tmpdir(), `dbdump_${id}${suffix}`);
}

export function rmSafe(p?: string) {
  if (!p) return;
  try {
    if (existsSync(p)) unlinkSync(p);
  } catch {}
}

export async function gunzipIfNeeded(path: string): Promise<string> {
  if (!/\.gz$/i.test(path)) return path;
  const out = path.replace(/\.gz$/i, "") || path + ".sql";
  await pump(createReadStream(path), createGunzip(), createWriteStream(out));
  return out;
}

/* ---- mysqldump & mysql ---- */

type Cfg = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function baseArgs(cfg: Cfg) {
  const args = ["-h", cfg.host, "-P", String(cfg.port), "-u", cfg.user];
  if (cfg.password) args.push(`-p${cfg.password}`);
  return args;
}

type DumpAttempt = {
  bin: string;
  args: string[];
};

async function tryDump(
  bin: string,
  args: string[],
  outPath: string
): Promise<{ ok: true } | { ok: false; code?: number; stderr: string }> {
  return new Promise((res) => {
    const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    const ws = createWriteStream(outPath);
    let stderr = "";

    p.stdout.pipe(ws);
    p.stderr.on("data", (d) => {
      stderr += String(d || "");
    });

    p.on("error", (e) => {
      try {
        ws.close();
      } catch {}
      res({
        ok: false,
        stderr: (e && (e as any).message) || String(e),
      });
    });

    p.on("close", (code) => {
      if (code === 0) {
        res({ ok: true });
      } else {
        try {
          ws.close();
        } catch {}
        res({
          ok: false,
          code: code ?? undefined,
          stderr,
        });
      }
    });
  });
}

/**
 * Gelişmiş dump:
 *  - Bin autodetect: MYSQLDUMP_BIN env > mysqldump > mariadb-dump > /usr/bin/...
 *  - İlk deneme: routines+triggers+events
 *  - Hata olursa: routines/events/triggers'sız fallback
 */
export async function runMysqlDumpAll(cfg: Cfg, outPath: string): Promise<void> {
  const common = [
    "--single-transaction",
    "--quick",
    "--skip-lock-tables",
    "--no-tablespaces",
    // "--set-gtid-purged=OFF", // ❌ bazı mysqldump / mariadb-dump sürümleri bu flag'i tanımıyor
  ];

  const fullFlags = ["--routines", "--triggers", "--events"];
  const minimalFlags: string[] = [];

  const bins = [
    process.env.MYSQLDUMP_BIN?.trim(),
    "mysqldump",
    "mariadb-dump",
    "/usr/bin/mysqldump",
    "/usr/bin/mariadb-dump",
  ].filter(Boolean) as string[];

  const attempts: DumpAttempt[] = [];
  for (const bin of bins) {
    attempts.push({
      bin,
      args: [...baseArgs(cfg), ...common, ...fullFlags, cfg.database],
    });
    attempts.push({
      bin,
      args: [...baseArgs(cfg), ...common, ...minimalFlags, cfg.database],
    });
  }

  let lastErr = "";
  for (const a of attempts) {
    console.log("[mysqldump] trying:", a.bin, a.args.join(" "));
    const r = await tryDump(a.bin, a.args, outPath);
    if (r.ok) {
      console.log("[mysqldump] success with", a.bin);
      return;
    }
    lastErr = `[${a.bin}] exit=${"code" in r ? r.code : "spawn_error"} :: ${
      r.stderr?.slice(0, 800) || "no-stderr"
    }`;
    console.error("[mysqldump] failed attempt:", lastErr);
  }

  throw new Error(`mysqldump failed (all attempts). ${lastErr}`);
}
