import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const DIST_DIR = resolve(process.cwd(), 'dist');

const JS_RE = /\.(m?js)$/i;

const IMPORT_FROM_RE = /(import\s+[^'"]*?from\s*|export\s+[^'"]*?from\s*)(["'])(\.{1,2}\/[^"']+)\2/g;
const DYNAMIC_IMPORT_RE = /(import\()\s*(["'])(\.{1,2}\/[^"']+)\2(\s*\))/g;

function hasExt(spec) {
  return /\.[cm]?[jt]s$|\.json$/i.test(spec);
}

function resolveWithJs(fileDir, spec) {
  const abs = resolve(fileDir, spec);
  if (existsSync(abs + '.js')) return spec + '.js';
  if (existsSync(join(fileDir, spec, 'index.js'))) return spec + '/index.js';
  // yoksa yine de .js ekle (çoğu durumda doğru hedef)
  return hasExt(spec) ? spec : spec + '.js';
}

function fixFile(filePath) {
  let code = readFileSync(filePath, 'utf8');
  const dir = dirname(filePath);

  code = code.replace(IMPORT_FROM_RE, (_, pre, q, spec) => {
    const fixed = resolveWithJs(dir, spec);
    return `${pre}${q}${fixed}${q}`;
  });

  code = code.replace(DYNAMIC_IMPORT_RE, (_, pre, q, spec, post) => {
    const fixed = resolveWithJs(dir, spec);
    return `${pre}${q}${fixed}${q}${post}`;
  });

  writeFileSync(filePath, code, 'utf8');
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (JS_RE.test(p)) fixFile(p);
  }
}

if (!existsSync(DIST_DIR)) {
  console.error('dist/ yok, önce tsc çalışmalı.');
  process.exit(1);
}

walk(DIST_DIR);
console.log('✔ ESM uzantıları düzeltildi.');