-- 202: urunler'e alt_grup — urun_grubu ile ayni kalip (ad-tabanli varchar).
-- urun_grubu="Paspas", alt_grup="Maximum" gibi. FK yok (mevcut urun_grubu kalibi).
-- Idempotent: INFORMATION_SCHEMA kontrolu ile yalnizca yoksa eklenir.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'alt_grup'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `alt_grup` varchar(128) NULL DEFAULT NULL AFTER `urun_grubu`, ADD KEY `idx_urunler_alt_grup` (`alt_grup`)',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
