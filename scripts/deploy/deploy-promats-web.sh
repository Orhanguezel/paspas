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

echo "==> tam temiz build (.next cache dahil — yoksa NEXT_PUBLIC_* env degisikligi"
echo "    client bundle'a yansimaz, /api/v1 fallback'te kalir)"
rm -rf .next

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

# nginx kok-alias asset senkronu: /assets ve /userfiles istekleri (basePath'siz, next/image
# unoptimized) nginx tarafindan ESKI konumdan servis edilir; deploy ise yeni konuma gelir.
# Bu bosluk yeni eklenen her gorselde 404 verir. Repo asset'lerini nginx konumuna senkronla.
# --delete YOK (additive): userfiles/ altindaki panel yuklemeleri korunur.
echo "==> nginx kok-alias asset senkronu"
NGINX_PUB=/var/www/promats/frontend/frontend/public
if [ -d "$NGINX_PUB" ]; then
  mkdir -p "$NGINX_PUB/assets"
  rsync -a public/assets/ "$NGINX_PUB/assets/"
  [ -d public/userfiles ] && { mkdir -p "$NGINX_PUB/userfiles"; rsync -a public/userfiles/ "$NGINX_PUB/userfiles/"; }
  echo "    -> $NGINX_PUB/assets senkronlandi"
fi

echo "==> restart"
pm2 restart promats-frontend --update-env
sleep 5
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "http://127.0.0.1:3010/promats/tr" || echo "000")
echo "==> /promats/tr -> HTTP $code"
[ "$code" = "200" ] && echo "Deploy OK" || { echo "UYARI: 200 degil"; exit 1; }
