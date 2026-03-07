-- ============================================================================
-- PASPAS ERP — urunler tablosu storage görsel alanları (geriye dönük uyumluluk)
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'image_url'
);
SET @add_col_sql := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `image_url` varchar(1024) DEFAULT NULL AFTER `renk`',
  'SELECT 1'
);
PREPARE stmt_col1 FROM @add_col_sql;
EXECUTE stmt_col1;
DEALLOCATE PREPARE stmt_col1;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'storage_asset_id'
);
SET @add_col_sql := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `storage_asset_id` char(36) DEFAULT NULL AFTER `image_url`',
  'SELECT 1'
);
PREPARE stmt_col2 FROM @add_col_sql;
EXECUTE stmt_col2;
DEALLOCATE PREPARE stmt_col2;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'image_alt'
);
SET @add_col_sql := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `image_alt` varchar(255) DEFAULT NULL AFTER `storage_asset_id`',
  'SELECT 1'
);
PREPARE stmt_col3 FROM @add_col_sql;
EXECUTE stmt_col3;
DEALLOCATE PREPARE stmt_col3;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND CONSTRAINT_NAME = 'fk_urunler_storage_asset'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_fk_sql := IF(
  @fk_exists = 0,
  'ALTER TABLE `urunler` ADD CONSTRAINT `fk_urunler_storage_asset` FOREIGN KEY (`storage_asset_id`) REFERENCES `storage_assets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk FROM @add_fk_sql;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND INDEX_NAME = 'idx_urunler_storage_asset'
);

SET @add_idx_sql := IF(
  @idx_exists = 0,
  'ALTER TABLE `urunler` ADD INDEX `idx_urunler_storage_asset` (`storage_asset_id`)',
  'SELECT 1'
);
PREPARE stmt_idx FROM @add_idx_sql;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
