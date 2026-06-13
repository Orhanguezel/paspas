-- 203: satin_alma_kalemleri'ne satir bazli termin_tarihi.
-- Kullanici siparis geneline termin girerse satirlara o uygulanir (uygulama
-- katmaninda fallback: kalem.termin_tarihi ?? siparis.termin_tarihi).
-- Her satir icin farkli termin girilebilir.
-- Idempotent: INFORMATION_SCHEMA kontrolu ile yalnizca yoksa eklenir.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'satin_alma_kalemleri'
    AND COLUMN_NAME = 'termin_tarihi'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `satin_alma_kalemleri` ADD COLUMN `termin_tarihi` date NULL DEFAULT NULL AFTER `birim_fiyat`',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
