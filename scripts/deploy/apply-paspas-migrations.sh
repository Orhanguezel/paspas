#!/bin/bash
# apply-paspas-migrations — yalnizca YENI sql dosyalarini uygular, uygulananlari izler.
# Ilk calismada mevcut tum dosyalar "uygulanmis" baseline olarak isaretlenir
# (DB zaten onlari iceriyor). Sonraki her deploy yalnizca yeni dosyalari calistirir.
# Boylece demo-veri/branding seed'leri tekrar calismaz (musteri ayarlari korunur).
set -euo pipefail

DB_USER="${DB_USER:-app}"; DB_PASS="${DB_PASS:?DB_PASS gerekli}"; DB_NAME="${DB_NAME:-promats_erp}"
SQL_DIR="/var/www/paspas/backend/src/db/seed/sql"
MYSQL="mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}"

echo "→ Migration takip tablosu hazirlaniyor..."
$MYSQL -e "CREATE TABLE IF NOT EXISTS _applied_sql_files (
  filename VARCHAR(255) NOT NULL PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" 2>/dev/null

COUNT=$($MYSQL -N -e "SELECT COUNT(*) FROM _applied_sql_files;" 2>/dev/null)

if [ "$COUNT" = "0" ]; then
  echo "→ Ilk calisma: mevcut tum seed dosyalari baseline olarak isaretleniyor (CALISTIRILMADAN)..."
  for f in "$SQL_DIR"/*.sql; do
    base=$(basename "$f")
    $MYSQL -e "INSERT IGNORE INTO _applied_sql_files (filename) VALUES ('${base}');" 2>/dev/null
  done
  echo "→ Baseline tamam: $($MYSQL -N -e 'SELECT COUNT(*) FROM _applied_sql_files;' 2>/dev/null) dosya isaretlendi."
  echo "=== Migration: yeni dosya yok (ilk baseline) ✓ ==="
  exit 0
fi

APPLIED=0
for f in "$SQL_DIR"/*.sql; do
  base=$(basename "$f")
  already=$($MYSQL -N -e "SELECT COUNT(*) FROM _applied_sql_files WHERE filename='${base}';" 2>/dev/null)
  if [ "$already" = "0" ]; then
    echo "→ Yeni migration uygulaniyor: ${base}"
    $MYSQL < "$f"
    $MYSQL -e "INSERT INTO _applied_sql_files (filename) VALUES ('${base}');" 2>/dev/null
    APPLIED=$((APPLIED+1))
  fi
done
echo "=== Migration tamam: ${APPLIED} yeni dosya uygulandi ✓ ==="
