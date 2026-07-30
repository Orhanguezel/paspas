#!/usr/bin/env bash
# Promats web (frontend) deploy — git-tabanli tek cati.
# VPS'te calistir: bash scripts/deploy/deploy-promats-web.sh
# promats-frontend PM2 process'i /var/www/paspas/frontend/.next/standalone'dan calisir (PORT 3010).
set -euo pipefail
export PATH="/root/.bun/bin:$PATH"

REPO=/var/www/paspas
cd "$REPO"
echo "==> git pull"
git fetch origin --quiet && git reset --hard origin/main

cd "$REPO/frontend"
echo "==> bun install"
bun install

echo "==> temiz build (onceki standalone + kopyalanan static/public kalintisi ENOTEMPTY yapar)"
rm -rf .next/standalone

echo "==> build (standalone, /promats basePath)"
# .env.production'daki TUM NEXT_PUBLIC_* degiskenleri build'e girmeli (ozellikle
# NEXT_PUBLIC_API_URL) — yoksa client bundle /api/v1 fallback'e duser ve
# /api/v1/site_settings/* 404 verir. Env'i source ederek build'e tasi.
set -a; [ -f .env.production ] && source .env.production; set +a
PROMATS_BASE_PATH="${PROMATS_BASE_PATH:-/promats}" NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/promats}" bun run build

echo "==> standalone'i tamamla (Next.js static + public)"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> restart"
pm2 restart promats-frontend --update-env
sleep 5
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "http://127.0.0.1:3010/promats/tr" || echo "000")
echo "==> /promats/tr -> HTTP $code"
[ "$code" = "200" ] && echo "Deploy OK" || { echo "UYARI: 200 degil"; exit 1; }
