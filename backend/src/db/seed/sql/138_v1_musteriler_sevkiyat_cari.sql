SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @cari_kodu_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'musteriler'
    AND COLUMN_NAME = 'cari_kodu'
);

SET @cari_kodu_sql := IF(
  @cari_kodu_exists = 0,
  'ALTER TABLE `musteriler` ADD COLUMN `cari_kodu` varchar(64) NULL AFTER `adres`;',
  'SELECT 1;'
);

PREPARE stmt FROM @cari_kodu_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sevkiyat_notu_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'musteriler'
    AND COLUMN_NAME = 'sevkiyat_notu'
);

SET @sevkiyat_notu_sql := IF(
  @sevkiyat_notu_exists = 0,
  'ALTER TABLE `musteriler` ADD COLUMN `sevkiyat_notu` varchar(500) NULL AFTER `cari_kodu`;',
  'SELECT 1;'
);

PREPARE stmt FROM @sevkiyat_notu_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
