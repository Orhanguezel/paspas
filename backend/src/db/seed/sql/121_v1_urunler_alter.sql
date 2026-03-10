-- ============================================================================
-- PASPAS ERP V1 — urunler tablosu genisletme
-- Yeni alanlar: kategori, tedarik_tipi, kdv_orani, operasyon_tipi
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- kategori: urun | yari_mamul | hammadde
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'urunler' AND COLUMN_NAME = 'kategori');
SET @s := IF(@col = 0, 'ALTER TABLE `urunler` ADD COLUMN `kategori` varchar(32) NOT NULL DEFAULT ''urun'' AFTER `id`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tedarik_tipi: uretim | satin_alma
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'urunler' AND COLUMN_NAME = 'tedarik_tipi');
SET @s := IF(@col = 0, 'ALTER TABLE `urunler` ADD COLUMN `tedarik_tipi` varchar(32) NOT NULL DEFAULT ''uretim'' AFTER `kategori`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kdv_orani: varsayilan %20
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'urunler' AND COLUMN_NAME = 'kdv_orani');
SET @s := IF(@col = 0, 'ALTER TABLE `urunler` ADD COLUMN `kdv_orani` decimal(5,2) NOT NULL DEFAULT 20.00 AFTER `birim_fiyat`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- operasyon_tipi: kategori metadata'si gerektiriyorsa kullanilir, digerlerinde NULL kalir
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'urunler' AND COLUMN_NAME = 'operasyon_tipi');
SET @s := IF(@col = 0, 'ALTER TABLE `urunler` ADD COLUMN `operasyon_tipi` varchar(32) DEFAULT NULL AFTER `kdv_orani`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @is_not_null := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'urunler'
    AND COLUMN_NAME = 'operasyon_tipi'
    AND IS_NULLABLE = 'NO'
);
SET @s := IF(@is_not_null = 1, 'ALTER TABLE `urunler` MODIFY COLUMN `operasyon_tipi` varchar(32) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- kategori index
SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'urunler' AND INDEX_NAME = 'idx_urunler_kategori');
SET @s := IF(@idx = 0, 'ALTER TABLE `urunler` ADD INDEX `idx_urunler_kategori` (`kategori`)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mevcut hammadde urunleri guncelle
UPDATE `urunler` SET `kategori` = 'hammadde', `tedarik_tipi` = 'satin_alma'
WHERE `kod` LIKE 'HM-%';

-- Mamul urunleri guncelle (varsayilan zaten 'urun' ve 'uretim')
UPDATE `urunler` SET `kategori` = 'urun', `tedarik_tipi` = 'uretim'
WHERE `kod` NOT LIKE 'HM-%';

UPDATE `urunler`
SET `operasyon_tipi` = NULL
WHERE `tedarik_tipi` <> 'uretim';
