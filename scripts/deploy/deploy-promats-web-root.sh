#!/usr/bin/env bash
# Promats web (frontend) — KOK DOMAIN prod deploy (promats.com.tr, basePath YOK).
# VPS'te calistir: bash scripts/deploy/deploy-promats-web-root.sh
# promats-web PM2 process'i /var/www/promats-com-tr/frontend/.next/standalone'dan calisir (PORT 3012).
# Ayri checkout: /var/www/promats-com-tr — /var/www/paspas'taki /promats subpath test build'inden
# BAGIMSIZ (o hala panel.avrasyaotomotiv.net/promats'ta calismaya devam eder, bu script ona dokunmaz).
set -euo pipefail
export PATH="/root/.bun/bin:$PATH"

REPO=/var/www/promats-com-tr
cd "$REPO"
echo "==> git pull"
git fetch origin --quiet && git reset --hard origin/main

cd "$REPO/frontend"
echo "==> bun install"
bun install

echo "==> tam temiz build (.next cache dahil)"
rm -rf .next

echo "==> build (standalone, basePath yok — kok domain)"
# .env.production: NEXT_PUBLIC_API_URL=https://promats.com.tr/api/web/promats (client bundle icin)
# API_BASE_URL=http://127.0.0.1:8078/api/web/promats (server-only — build/SSR sirasinda kendi
# domain'ine HTTPS self-fetch yapmasin diye; sertifika/nginx her zaman hazir olmayabilir).
set -a; [ -f .env.production ] && source .env.production; set +a
bun run build

echo "==> standalone'i tamamla (Next.js static + public)"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> restart"
PORT=3012 pm2 restart promats-web --update-env
sleep 5
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "http://127.0.0.1:3012/tr" || echo "000")
echo "==> /tr -> HTTP $code"
[ "$code" = "200" ] && echo "Deploy OK" || { echo "UYARI: 200 degil"; exit 1; }
