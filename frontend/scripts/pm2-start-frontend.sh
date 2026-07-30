#!/usr/bin/env bash
set -euo pipefail

MANIFEST=".next/prerender-manifest.json"
PORT="${PORT:-3095}"
HOST="${HOST:-127.0.0.1}"

if [[ ! -f "$MANIFEST" ]]; then
  echo "[pm2-start] Missing $MANIFEST, running production build..."
  /home/orhan/.bun/bin/bun run build
fi

echo "[pm2-start] Starting Next.js on ${HOST}:${PORT}"
exec /home/orhan/.bun/bin/bun run start -- -p "$PORT" -H "$HOST"
