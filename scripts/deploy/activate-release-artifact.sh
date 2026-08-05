#!/usr/bin/env bash
set -Eeuo pipefail

export PATH="/root/.bun/bin:$PATH"

ARTIFACT="${1:-}"
SOURCE_REPO="${PASPAS_SOURCE_REPO:-/var/www/paspas}"
RUNTIME_ROOT="${PASPAS_RUNTIME_ROOT:-/var/www/paspas-runtime}"
RELEASES_DIR="$RUNTIME_ROOT/releases"
CURRENT_LINK="$RUNTIME_ROOT/current"
SHARED_DIR="$RUNTIME_ROOT/shared"
ECOSYSTEM_FILE="$SOURCE_REPO/scripts/deploy/ecosystem.atomic.config.cjs"
KEEP_RELEASES="${PASPAS_KEEP_RELEASES:-3}"
STAGING=''
PREVIOUS_TARGET=''
SWITCHED=0

log() { printf '\n==> %s\n' "$*"; }
die() { printf '\nHATA: %s\n' "$*" >&2; exit 1; }
cleanup() { [[ -n "$STAGING" && -d "$STAGING" ]] && rm -rf -- "$STAGING"; }
on_exit() {
  local exit_code=$?
  trap - EXIT
  if [[ "$exit_code" != 0 && "$SWITCHED" = 1 ]]; then
    printf '\nUYARI: aktivasyon basarisiz; onceki PM2 durumu geri yukleniyor.\n' >&2
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

[[ -f "$ARTIFACT" ]] || die "Artifact bulunamadi: $ARTIFACT"
[[ -f "$ECOSYSTEM_FILE" ]] || die "PM2 config bulunamadi: $ECOSYSTEM_FILE"
mkdir -p "$RELEASES_DIR" "$SHARED_DIR"
STAGING="$(mktemp -d "$RUNTIME_ROOT/activate.XXXXXX")"
tar -xzf "$ARTIFACT" -C "$STAGING"
mapfile -t roots < <(find "$STAGING" -mindepth 1 -maxdepth 1 -type d)
[[ "${#roots[@]}" = 1 ]] || die 'Artifact tek release dizini icermeli'
RELEASE_DIR="${roots[0]}"
[[ -f "$RELEASE_DIR/RELEASE" && -f "$RELEASE_DIR/SHA256SUMS" ]] || die 'Release manifesti eksik'
(
  cd "$RELEASE_DIR"
  sha256sum -c SHA256SUMS
)
RELEASE_ID="$(basename "$RELEASE_DIR")"
FINAL_RELEASE="$RELEASES_DIR/$RELEASE_ID"
[[ ! -e "$FINAL_RELEASE" ]] || die "Release zaten var: $FINAL_RELEASE"

if [[ ! -f "$SHARED_DIR/backend.env" ]]; then
  [[ -f "$SOURCE_REPO/backend/.env" ]] || die 'Backend env bulunamadi'
  install -m 0600 "$SOURCE_REPO/backend/.env" "$SHARED_DIR/backend.env"
fi
ln -s "$SHARED_DIR/backend.env" "$RELEASE_DIR/backend/.env"
mv "$RELEASE_DIR" "$FINAL_RELEASE"

smoke_process() {
  local name=$1 cwd=$2 script=$3 port=$4 path=$5 interpreter=$6
  log "artifact smoke: $name ($port$path)"
  pm2 delete "$name" >/dev/null 2>&1 || true
  PORT="$port" HOST='127.0.0.1' HOSTNAME='127.0.0.1' NODE_ENV='production' API_BASE_URL='http://127.0.0.1:8078/api/web/promats' \
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

smoke_process release-smoke-api "$FINAL_RELEASE/backend" dist/index.js 3901 /health /root/.bun/bin/bun
smoke_process release-smoke-admin "$FINAL_RELEASE/admin" server.js 3902 /auth/login node
smoke_process release-smoke-subpath "$FINAL_RELEASE/frontend-subpath" server.js 3903 /promats/tr node
smoke_process release-smoke-root "$FINAL_RELEASE/frontend-root" server.js 3904 /tr node

[[ -L "$CURRENT_LINK" ]] && PREVIOUS_TARGET="$(readlink -f "$CURRENT_LINK")"
log "atomik current gecisi: $RELEASE_ID"
ln -sfn "$FINAL_RELEASE" "$RUNTIME_ROOT/current.next"
mv -Tf "$RUNTIME_ROOT/current.next" "$CURRENT_LINK"
SWITCHED=1
pm2 delete paspas-api paspas-panel promats-frontend promats-web >/dev/null 2>&1 || true
PASPAS_RUNTIME_ROOT="$RUNTIME_ROOT" pm2 start "$ECOSYSTEM_FILE" --update-env

log 'production smoke'
for check in '8078:/health' '3000:/auth/login' '3010:/promats/tr' '3012:/tr'; do
  port="${check%%:*}"; path="${check#*:}"; code='000'
  for _ in $(seq 1 20); do
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$port$path" || true)"
    [[ "$code" = 200 ]] && break
    sleep 1
  done
  [[ "$code" = 200 ]] || die "production smoke basarisiz: $port$path HTTP $code"
done

pm2 save
SWITCHED=0
mapfile -t old_releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r | tail -n "+$((KEEP_RELEASES + 1))")
for old in "${old_releases[@]}"; do
  old_path="$RELEASES_DIR/$old"
  [[ "$old_path" = "$(readlink -f "$CURRENT_LINK")" ]] || rm -rf -- "$old_path"
done

log "Aktivasyon OK: $RELEASE_ID"
