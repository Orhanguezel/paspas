#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

app_root="${PASPAS_APP_ROOT:-/var/www/paspas}"
backup_root="${PASPAS_BACKUP_ROOT:-/var/backups/paspas-automatic}"
env_file="${PASPAS_ENV_FILE:-${app_root}/backend/.env}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
work="${backup_root}/.partial-${stamp}"
target="${backup_root}/daily/${stamp}"
runtime="$(mktemp -d /run/paspas-backup.XXXXXX)"
ok=0

notify() {
  local message="$1" cfg="${runtime}/curl.conf"
  [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]] || return 0
  printf 'url = "https://api.telegram.org/bot%s/sendMessage"\nsilent\ndata-urlencode = "chat_id=%s"\ndata-urlencode = "text=%s"\n' \
    "$TELEGRAM_BOT_TOKEN" "$TELEGRAM_CHAT_ID" "$message" >"$cfg"
  curl --config "$cfg" >/dev/null 2>&1 || true
}

finish() {
  local rc=$?
  if (( rc != 0 || ok == 0 )); then
    rm -rf -- "$work"
    notify "Paspas yedekleme BASARISIZ: $(hostname) ${stamp} (rc=${rc})"
  fi
  rm -rf -- "$runtime"
  exit "$rc"
}
trap finish EXIT

exec 9>"/run/lock/paspas-backup.lock"
flock -n 9 || { echo "backup_already_running"; exit 1; }
[[ -r "$env_file" ]] || { echo "env_file_unreadable"; exit 1; }
set -a
# shellcheck disable=SC1090
. "$env_file"
set +a

mkdir -p "$backup_root/daily" "$work"
db_cnf="${runtime}/mysql.cnf"
printf '[client]\nhost=%s\nport=%s\nuser=%s\npassword=%s\n' \
  "${DB_HOST:-127.0.0.1}" "${DB_PORT:-3306}" "$DB_USER" "$DB_PASSWORD" >"$db_cnf"

mysqldump --defaults-extra-file="$db_cnf" --single-transaction --quick \
  --routines --triggers --events --hex-blob --set-gtid-purged=OFF "$DB_NAME" \
  | gzip -9 >"$work/database.sql.gz"
gzip -t "$work/database.sql.gz"

mkdir "$work/uploads"
previous="$(readlink -f "$backup_root/latest" 2>/dev/null || true)"
if [[ -n "$previous" && -d "$previous/uploads" ]]; then cp -al "$previous/uploads/." "$work/uploads/"; fi
rsync -a --delete "$app_root/uploads/" "$work/uploads/"

tar -czf "$work/config.tar.gz" /etc/nginx/sites-enabled /root/.pm2/dump.pm2 \
  /etc/systemd/system/paspas-*.service /etc/systemd/system/paspas-*.timer 2>/dev/null || \
  tar -czf "$work/config.tar.gz" /etc/nginx/sites-enabled /root/.pm2/dump.pm2

(cd "$work" && sha256sum database.sql.gz config.tar.gz >SHA256SUMS)
(cd "$work" && sha256sum -c SHA256SUMS)
printf '{"created_at":"%s","host":"%s","database":"%s","upload_bytes":%s}\n' \
  "$stamp" "$(hostname)" "$DB_NAME" "$(du -sb "$work/uploads" | cut -f1)" >"$work/manifest.json"
mv "$work" "$target"
ln -sfn "$target" "$backup_root/latest"

mapfile -t old < <(find "$backup_root/daily" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r | tail -n +15)
for name in "${old[@]}"; do rm -rf -- "$backup_root/daily/$name"; done

if [[ -n "${PASPAS_REMOTE_RSYNC_TARGET:-}" ]]; then
  rsync -a --delete-delay "$target/" "${PASPAS_REMOTE_RSYNC_TARGET%/}/${stamp}/"
fi

ok=1
notify "Paspas yedekleme basarili: $(hostname) ${stamp}"
echo "$target"
