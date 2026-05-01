SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'stok_takip_aktif'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `stok_takip_aktif` tinyint unsigned NOT NULL DEFAULT 1 AFTER `rezerve_stok`',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
