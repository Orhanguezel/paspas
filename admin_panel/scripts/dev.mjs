#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const projectDir = process.cwd();

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

const port = resolvePort();
ensurePortAvailable(port);
clearStaleLock();

const child = spawn('next', ['dev', '--webpack'], {
  cwd: projectDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096',
  },
  shell: true,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
