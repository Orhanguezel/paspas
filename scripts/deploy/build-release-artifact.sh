#!/usr/bin/env bash
set -Eeuo pipefail

export PATH="${BUN_INSTALL:-$HOME/.bun}/bin:$PATH"

SOURCE_REPO="${PASPAS_SOURCE_REPO:-$(git rev-parse --show-toplevel)}"
TARGET_REF="${1:-HEAD}"
OUTPUT_DIR="${PASPAS_ARTIFACT_DIR:-/tmp}"
BUILD_ROOT=''

log() { printf '\n==> %s\n' "$*"; }
die() { printf '\nHATA: %s\n' "$*" >&2; exit 1; }
cleanup() {
  if [[ -n "$BUILD_ROOT" && -d "$BUILD_ROOT/source" ]]; then
    git -C "$SOURCE_REPO" worktree remove --force "$BUILD_ROOT/source" >/dev/null 2>&1 || true
  fi
  [[ -n "$BUILD_ROOT" && -d "$BUILD_ROOT" ]] && rm -rf -- "$BUILD_ROOT"
}
trap cleanup EXIT

command -v bun >/dev/null || die 'bun bulunamadi'
command -v rsync >/dev/null || die 'rsync bulunamadi'
command -v tar >/dev/null || die 'tar bulunamadi'

COMMIT="$(git -C "$SOURCE_REPO" rev-parse "$TARGET_REF^{commit}")"
SHORT_COMMIT="$(git -C "$SOURCE_REPO" rev-parse --short=12 "$COMMIT")"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-$SHORT_COMMIT"
BUILD_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/paspas-release-build.XXXXXX")"
SRC="$BUILD_ROOT/source"
STAGE="$BUILD_ROOT/$RELEASE_ID"
ARTIFACT="$OUTPUT_DIR/paspas-release-$RELEASE_ID.tar.gz"

mkdir -p "$OUTPUT_DIR" "$STAGE"
git -C "$SOURCE_REPO" worktree add --detach "$SRC" "$COMMIT"

copy_standalone() {
  local app_dir=$1 output_dir=$2
  local standalone="$app_dir/.next/standalone"
  [[ -d "$standalone" ]] || die "Standalone cikti yok: $standalone"
  mkdir -p "$output_dir"
  rsync -a "$standalone/" "$output_dir/"
  local server server_dir
  server="$(find "$output_dir" -maxdepth 4 -type f -name server.js | head -n 1)"
  [[ -n "$server" ]] || die "server.js bulunamadi: $output_dir"
  server_dir="$(dirname "$server")"
  mkdir -p "$server_dir/.next"
  rsync -a "$app_dir/.next/static/" "$server_dir/.next/static/"
  [[ -d "$app_dir/public" ]] && rsync -a "$app_dir/public/" "$server_dir/public/"
  [[ "$server" = "$output_dir/server.js" ]] || ln -s "${server#"$output_dir/"}" "$output_dir/server.js"
}

log 'backend artifact'
(
  cd "$SRC/backend"
  bun install --frozen-lockfile
  bun run build
)
mkdir -p "$STAGE/backend"
rsync -a "$SRC/backend/dist/" "$STAGE/backend/dist/"
rsync -a "$SRC/backend/node_modules/" "$STAGE/backend/node_modules/"
cp "$SRC/backend/package.json" "$SRC/backend/bun.lock" "$STAGE/backend/"

log 'admin standalone artifact'
(
  cd "$SRC/admin_panel"
  bun install --frozen-lockfile
  PANEL_API_URL='http://127.0.0.1:8078' NEXT_PUBLIC_API_URL='/api' NEXT_PUBLIC_API_BASE_URL='/api' bun run build
)
copy_standalone "$SRC/admin_panel" "$STAGE/admin"

log 'frontend /promats artifact'
(
  cd "$SRC/frontend"
  bun install --frozen-lockfile
  set -a; source .env.production; set +a
  rm -rf .next
  PROMATS_BASE_PATH='/promats' NEXT_PUBLIC_BASE_PATH='/promats' bun run build
)
copy_standalone "$SRC/frontend" "$STAGE/frontend-subpath"

log 'frontend root-domain artifact'
(
  cd "$SRC/frontend"
  rm -rf .next
  # Next her production build'de .env.production dosyasini otomatik okur. Subpath
  # dosyasi yerinde kalirsa bos env override'larini /promats ile yeniden doldurur.
  cp .env.production.promats-root .env.production
  set -a; source .env.production; set +a
  PROMATS_BASE_PATH='' NEXT_PUBLIC_BASE_PATH='' bun run build
)
copy_standalone "$SRC/frontend" "$STAGE/frontend-root"

cat >"$STAGE/RELEASE" <<EOF
release_id=$RELEASE_ID
commit=$COMMIT
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

(
  cd "$STAGE"
  find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum >SHA256SUMS
)
tar -C "$BUILD_ROOT" -czf "$ARTIFACT" "$RELEASE_ID"
sha256sum "$ARTIFACT" >"$ARTIFACT.sha256"

log "artifact hazir: $ARTIFACT"
printf '%s\n' "$ARTIFACT"
