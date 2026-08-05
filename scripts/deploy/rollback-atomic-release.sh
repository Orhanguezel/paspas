#!/usr/bin/env bash
set -Eeuo pipefail

RUNTIME_ROOT="${PASPAS_RUNTIME_ROOT:-/var/www/paspas-runtime}"
SOURCE_REPO="${PASPAS_SOURCE_REPO:-/var/www/paspas}"
RELEASES_DIR="$RUNTIME_ROOT/releases"
CURRENT_LINK="$RUNTIME_ROOT/current"
ECOSYSTEM_FILE="$SOURCE_REPO/scripts/deploy/ecosystem.atomic.config.cjs"
TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  current="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"
  while IFS= read -r candidate; do
    [[ "$candidate" = "$current" ]] || { TARGET="$candidate"; break; }
  done < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d | sort -r)
elif [[ "$TARGET" != /* ]]; then
  TARGET="$RELEASES_DIR/$TARGET"
fi

[[ -d "$TARGET" ]] || { echo "Rollback release bulunamadi: $TARGET" >&2; exit 1; }
[[ -f "$TARGET/RELEASE" ]] || { echo "Gecersiz release: $TARGET" >&2; exit 1; }

ln -sfn "$TARGET" "$RUNTIME_ROOT/current.next"
mv -Tf "$RUNTIME_ROOT/current.next" "$CURRENT_LINK"
pm2 delete paspas-api paspas-panel promats-frontend promats-web >/dev/null 2>&1 || true
PASPAS_RUNTIME_ROOT="$RUNTIME_ROOT" pm2 start "$ECOSYSTEM_FILE" --update-env
pm2 save

for check in '8078:/health' '3000:/auth/login' '3010:/promats/tr' '3012:/tr'; do
  port="${check%%:*}"
  path="${check#*:}"
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:$port$path" || true)"
  printf '%s%s -> HTTP %s\n' "$port" "$path" "$code"
  [[ "$code" = 200 ]] || exit 1
done

echo "Rollback OK: $TARGET"
