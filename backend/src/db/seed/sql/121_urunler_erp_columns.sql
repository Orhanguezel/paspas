-- ============================================================================
-- PASPAS ERP — urunler tablosuna ERP alanları ekleme
-- kategori, tedarik_tipi, kdv_orani, operasyon_tipi
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- kategori: urun | yariamul | hammadde
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'kategori'
);
SET @add_sql := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `kategori` varchar(32) NOT NULL DEFAULT ''urun'' AFTER `id`',
  'SELECT 1'
);
PREPARE stmt FROM @add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- tedarik_tipi: uretim | satin_alma
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'tedarik_tipi'
);
SET @add_sql := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `tedarik_tipi` varchar(32) NOT NULL DEFAULT ''uretim'' AFTER `kategori`',
  'SELECT 1'
);
PREPARE stmt FROM @add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- kdv_orani
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'kdv_orani'
);
SET @add_sql := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `kdv_orani` decimal(5,2) NOT NULL DEFAULT 20.00 AFTER `birim_fiyat`',
  'SELECT 1'
);
PREPARE stmt FROM @add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- operasyon_tipi: tek_tarafli | cift_tarafli
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'operasyon_tipi'
);
SET @add_sql := IF(
  @col_exists = 0,
  'ALTER TABLE `urunler` ADD COLUMN `operasyon_tipi` varchar(32) NOT NULL DEFAULT ''tek_tarafli'' AFTER `kdv_orani`',
  'SELECT 1'
);
PREPARE stmt FROM @add_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
