#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const projectDir = process.cwd();
const repoRoot = path.resolve(projectDir, '..');
const backendDir = path.join(repoRoot, 'backend');

const DEV_HEALTH_TIMEOUT_MS = 400;
const DEV_BOOT_TIMEOUT_MS = 20000;

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function resolvePort() {
  const envFromFiles = {
    ...parseEnvFile(path.join(projectDir, '.env')),
    ...parseEnvFile(path.join(projectDir, '.env.local')),
  };
  const raw = process.env.PORT || envFromFiles.PORT || '3000';
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 3000;
}

function getListeningPids(port) {
  const result = spawnSync('ss', ['-ltnpH'], { encoding: 'utf8' });
  if (result.status !== 0) return [];

  const pids = new Set();
  for (const line of result.stdout.split(/\r?\n/)) {
    if (!line.includes(`:${port} `) && !line.includes(`:${port}\n`) && !line.endsWith(`:${port}`)) {
      continue;
    }
    for (const match of line.matchAll(/pid=(\d+)/g)) {
      pids.add(Number(match[1]));
    }
  }
  return [...pids];
}

function isProjectProcess(pid) {
  try {
    const cwd = realpathSync(`/proc/${pid}/cwd`);
    return cwd === projectDir;
  } catch {
    return false;
  }
}

function killPid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    return;
  }

  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
  }

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // already gone
  }
}

function ensurePortAvailable(port) {
  const pids = getListeningPids(port);
  if (pids.length === 0) return;

  const foreignPids = [];
  for (const pid of pids) {
    if (isProjectProcess(pid)) {
      console.log(`[dev] Port ${port} occupied by stale admin process ${pid}, terminating.`);
      killPid(pid);
    } else {
      foreignPids.push(pid);
    }
  }

  if (foreignPids.length > 0) {
    console.error(
      `[dev] Port ${port} is already in use by another process: ${foreignPids.join(', ')}. ` +
      'Stop that process or change PORT in .env.local.',
    );
    process.exit(1);
  }
}

function clearStaleLock() {
  const lockPath = path.join(projectDir, '.next', 'dev', 'lock');
  try {
    unlinkSync(lockPath);
    console.log('[dev] Removed stale Next.js dev lock.');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return;
    throw error;
  }
}

function normalizeBaseUrl(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  return v.replace(/\/+$/, '');
}

function resolvePanelApiBase() {
  const envFromFiles = {
    ...parseEnvFile(path.join(projectDir, '.env')),
    ...parseEnvFile(path.join(projectDir, '.env.local')),
  };

  const panelApiUrl = normalizeBaseUrl(process.env.PANEL_API_URL || envFromFiles.PANEL_API_URL);
  if (panelApiUrl) return `${panelApiUrl}/api`;

  const nextPublicApiBase = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || envFromFiles.NEXT_PUBLIC_API_BASE_URL,
  );
  if (nextPublicApiBase) return nextPublicApiBase;

  const nextPublicApiUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_URL || envFromFiles.NEXT_PUBLIC_API_URL,
  );
  if (nextPublicApiUrl) return nextPublicApiUrl;

  return 'http://localhost:8078/api';
}

function parseBackendOrigin(apiBase) {
  try {
    const u = new URL(apiBase);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

function isLocalBackend(origin) {
  try {
    const u = new URL(origin);
    return u.hostname === '127.0.0.1' || u.hostname === 'localhost';
  } catch {
    return false;
  }
}

async function isBackendHealthy(origin) {
  if (!origin) return false;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), DEV_HEALTH_TIMEOUT_MS);
    const res = await fetch(`${origin}/health`, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackend(origin, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isBackendHealthy(origin)) return true;
    await wait(500);
  }
  return false;
}

async function ensureBackendReady() {
  const apiBase = resolvePanelApiBase();
  const backendOrigin = parseBackendOrigin(apiBase);
  if (!backendOrigin || !isLocalBackend(backendOrigin)) {
    return { child: null, origin: backendOrigin };
  }

  if (await isBackendHealthy(backendOrigin)) {
    console.log(`[dev] Backend reachable: ${backendOrigin}`);
    return { child: null, origin: backendOrigin };
  }

  if (!existsSync(backendDir)) {
    console.error(`[dev] Backend not reachable (${backendOrigin}) and backend directory not found: ${backendDir}`);
    process.exit(1);
  }

  console.log(`[dev] Backend not reachable at ${backendOrigin}. Starting backend from ${backendDir} ...`);
  const backendChild = spawn('bun', ['run', 'dev'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  });

  const ready = await waitForBackend(backendOrigin, DEV_BOOT_TIMEOUT_MS);
  if (!ready) {
    console.error(
      `[dev] Backend did not become healthy in ${DEV_BOOT_TIMEOUT_MS / 1000}s (${backendOrigin}/health).`,
    );
    try {
      backendChild.kill('SIGTERM');
    } catch {
      // ignore
    }
    process.exit(1);
  }

  console.log(`[dev] Backend is ready: ${backendOrigin}`);
  return { child: backendChild, origin: backendOrigin };
}

const port = resolvePort();
ensurePortAvailable(port);
clearStaleLock();

const { child: backendChild } = await ensureBackendReady();

const child = spawn('next', ['dev', '--webpack'], {
  cwd: projectDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
  },
  shell: true,
});

let shuttingDown = false;
function shutdownAll() {
  if (shuttingDown) return;
  shuttingDown = true;

  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }

  if (backendChild) {
    try {
      backendChild.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
}

process.on('SIGINT', shutdownAll);
process.on('SIGTERM', shutdownAll);

child.on('exit', (code, signal) => {
  if (backendChild) {
    try {
      backendChild.kill('SIGTERM');
    } catch {
      // ignore
    }
  }

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
