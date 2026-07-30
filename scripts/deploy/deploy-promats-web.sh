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

echo "==> build (standalone, /promats basePath)"
PROMATS_BASE_PATH=/promats NEXT_PUBLIC_BASE_PATH=/promats bun run build

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
