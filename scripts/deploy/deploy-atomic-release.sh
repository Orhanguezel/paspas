#!/usr/bin/env bash
set -Eeuo pipefail

export PATH="/root/.bun/bin:$PATH"

SOURCE_REPO="${PASPAS_SOURCE_REPO:-/var/www/paspas}"
RUNTIME_ROOT="${PASPAS_RUNTIME_ROOT:-/var/www/paspas-runtime}"
RELEASES_DIR="$RUNTIME_ROOT/releases"
BUILDS_DIR="$RUNTIME_ROOT/builds"
CURRENT_LINK="$RUNTIME_ROOT/current"
SHARED_DIR="$RUNTIME_ROOT/shared"
ECOSYSTEM_FILE="$SOURCE_REPO/scripts/deploy/ecosystem.atomic.config.cjs"
KEEP_RELEASES="${PASPAS_KEEP_RELEASES:-3}"
TARGET_REF="${1:-origin/main}"
BUILD_DIR=''
PREVIOUS_TARGET=''
SWITCHED=0

log() { printf '\n==> %s\n' "$*"; }
die() { printf '\nHATA: %s\n' "$*" >&2; exit 1; }

cleanup() {
  if [[ -n "$BUILD_DIR" && -d "$BUILD_DIR/source" ]]; then
    git -C "$SOURCE_REPO" worktree remove --force "$BUILD_DIR/source" >/dev/null 2>&1 || true
  fi
  [[ -n "$BUILD_DIR" && -d "$BUILD_DIR" ]] && rm -rf -- "$BUILD_DIR"
}

on_exit() {
  local exit_code=$?
  trap - EXIT
  if [[ "$exit_code" != 0 && "$SWITCHED" = 1 ]]; then
    printf '\nUYARI: release sonrasi hata; onceki PM2 durumu geri yukleniyor.\n' >&2
    if [[ -n "$PREVIOUS_TARGET" && -d "$PREVIOUS_TARGET" ]]; then
      ln -sfn "$PREVIOUS_TARGET" "$RUNTIME_ROOT/current.next"
      mv -Tf "$RUNTIME_ROOT/current.next" "$CURRENT_LINK"
    fi
    pm2 delete paspas-api paspas-panel promats-frontend promats-web >/dev/null 2>&1 || true
    pm2 resurrect >/dev/null 2>&1 || true
  fi
  cleanup
  exit "$exit_code"
}
trap on_exit EXIT
trap 'exit 130' INT TERM

[[ -d "$SOURCE_REPO/.git" ]] || die "Git repo bulunamadi: $SOURCE_REPO"
[[ -f "$ECOSYSTEM_FILE" ]] || die "PM2 config bulunamadi: $ECOSYSTEM_FILE"
command -v bun >/dev/null || die 'bun bulunamadi'
command -v pm2 >/dev/null || die 'pm2 bulunamadi'
command -v rsync >/dev/null || die 'rsync bulunamadi'

AVAILABLE_KB="$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)"
[[ "$AVAILABLE_KB" -ge 4194304 ]] || die 'Build hostunda en az 4 GiB kullanilabilir RAM gerekli. Production VPS uzerinde build yapmayin; build-release-artifact.sh ile artifact uretin.'

mkdir -p "$RELEASES_DIR" "$BUILDS_DIR" "$SHARED_DIR"

log "hedef commit cozuluyor: $TARGET_REF"
git -C "$SOURCE_REPO" fetch origin --quiet
COMMIT="$(git -C "$SOURCE_REPO" rev-parse "$TARGET_REF^{commit}")"
SHORT_COMMIT="$(git -C "$SOURCE_REPO" rev-parse --short=12 "$COMMIT")"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-$SHORT_COMMIT"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
BUILD_DIR="$BUILDS_DIR/$RELEASE_ID"
[[ ! -e "$RELEASE_DIR" ]] || die "Release zaten var: $RELEASE_DIR"

mkdir -p "$BUILD_DIR"
git -C "$SOURCE_REPO" worktree add --detach "$BUILD_DIR/source" "$COMMIT"
SRC="$BUILD_DIR/source"
STAGE="$BUILD_DIR/release"
mkdir -p "$STAGE"

if [[ ! -f "$SHARED_DIR/backend.env" ]]; then
  [[ -f "$SOURCE_REPO/backend/.env" ]] || die "Backend env bulunamadi: $SOURCE_REPO/backend/.env"
  install -m 0600 "$SOURCE_REPO/backend/.env" "$SHARED_DIR/backend.env"
fi

copy_standalone() {
  local app_dir=$1
  local output_dir=$2
  local standalone="$app_dir/.next/standalone"
  [[ -d "$standalone" ]] || die "Standalone cikti yok: $standalone"
  mkdir -p "$output_dir"
  rsync -a "$standalone/" "$output_dir/"

  local server
  server="$(find "$output_dir" -maxdepth 4 -type f -name server.js | head -n 1)"
  [[ -n "$server" ]] || die "server.js bulunamadi: $output_dir"
  local server_dir
  server_dir="$(dirname "$server")"
  mkdir -p "$server_dir/.next"
  rsync -a "$app_dir/.next/static/" "$server_dir/.next/static/"
  [[ -d "$app_dir/public" ]] && rsync -a "$app_dir/public/" "$server_dir/public/"
  if [[ "$server" != "$output_dir/server.js" ]]; then
    ln -s "${server#"$output_dir/"}" "$output_dir/server.js"
  fi
}

log 'backend kuruluyor ve build aliniyor'
(
  cd "$SRC/backend"
  bun install --frozen-lockfile
  bun run build
)
mkdir -p "$STAGE/backend"
rsync -a "$SRC/backend/dist/" "$STAGE/backend/dist/"
rsync -a "$SRC/backend/node_modules/" "$STAGE/backend/node_modules/"
cp "$SRC/backend/package.json" "$SRC/backend/bun.lock" "$STAGE/backend/"
ln -s "$SHARED_DIR/backend.env" "$STAGE/backend/.env"

log 'admin panel standalone build aliniyor'
(
  cd "$SRC/admin_panel"
  bun install --frozen-lockfile
  PANEL_API_URL='http://127.0.0.1:8078' \
    NEXT_PUBLIC_API_URL='/api' \
    NEXT_PUBLIC_API_BASE_URL='/api' \
    bun run build
)
copy_standalone "$SRC/admin_panel" "$STAGE/admin"

log 'Promats /promats varyanti build aliniyor'
(
  cd "$SRC/frontend"
  bun install --frozen-lockfile
  set -a
  [[ -f .env.production ]] && source .env.production
  set +a
  rm -rf .next
  PROMATS_BASE_PATH='/promats' NEXT_PUBLIC_BASE_PATH='/promats' bun run build
)
copy_standalone "$SRC/frontend" "$STAGE/frontend-subpath"

log 'Promats kok-domain varyanti build aliniyor'
(
  cd "$SRC/frontend"
  rm -rf .next
  set -a
  [[ -f .env.production.promats-root ]] && source .env.production.promats-root
  set +a
  PROMATS_BASE_PATH='' NEXT_PUBLIC_BASE_PATH='' bun run build
)
copy_standalone "$SRC/frontend" "$STAGE/frontend-root"

cat >"$STAGE/RELEASE" <<EOF
release_id=$RELEASE_ID
commit=$COMMIT
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

mv "$STAGE" "$RELEASE_DIR"

smoke_process() {
  local name=$1 cwd=$2 script=$3 port=$4 path=$5 interpreter=$6
  log "release smoke: $name ($port$path)"
  pm2 delete "$name" >/dev/null 2>&1 || true
  PORT="$port" HOST='127.0.0.1' HOSTNAME='127.0.0.1' NODE_ENV='production' \
    pm2 start "$cwd/$script" --name "$name" --cwd "$cwd" --interpreter "$interpreter" --update-env >/dev/null
  local code='000'
  for _ in $(seq 1 20); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$port$path" || true)"
    [[ "$code" = 200 ]] && break
    sleep 1
  done
  pm2 delete "$name" >/dev/null 2>&1 || true
  [[ "$code" = 200 ]] || die "$name smoke basarisiz: HTTP $code"
}

smoke_process release-smoke-api "$RELEASE_DIR/backend" dist/index.js 3901 /health /root/.bun/bin/bun
smoke_process release-smoke-admin "$RELEASE_DIR/admin" server.js 3902 /auth/login node
smoke_process release-smoke-subpath "$RELEASE_DIR/frontend-subpath" server.js 3903 /promats/tr node
smoke_process release-smoke-root "$RELEASE_DIR/frontend-root" server.js 3904 /tr node

if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_TARGET="$(readlink -f "$CURRENT_LINK")"
fi

log "atomik current gecisi: $RELEASE_ID"
ln -sfn "$RELEASE_DIR" "$RUNTIME_ROOT/current.next"
mv -Tf "$RUNTIME_ROOT/current.next" "$CURRENT_LINK"
SWITCHED=1

pm2 delete paspas-api paspas-panel promats-frontend promats-web >/dev/null 2>&1 || true
PASPAS_RUNTIME_ROOT="$RUNTIME_ROOT" pm2 start "$ECOSYSTEM_FILE" --update-env

log 'production smoke'
for check in \
  '8078:/health' \
  '3000:/auth/login' \
  '3010:/promats/tr' \
  '3012:/tr'; do
  port="${check%%:*}"
  path="${check#*:}"
  code='000'
  for _ in $(seq 1 20); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$port$path" || true)"
    [[ "$code" = 200 ]] && break
    sleep 1
  done
  [[ "$code" = 200 ]] || die "production smoke basarisiz: $port$path HTTP $code"
done

pm2 save
SWITCHED=0
log 'eski release temizligi'
mapfile -t old_releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r | tail -n "+$((KEEP_RELEASES + 1))")
for old in "${old_releases[@]}"; do
  old_path="$RELEASES_DIR/$old"
  [[ "$old_path" = "$(readlink -f "$CURRENT_LINK")" ]] || rm -rf -- "$old_path"
done

log "Deploy OK: $RELEASE_ID"
