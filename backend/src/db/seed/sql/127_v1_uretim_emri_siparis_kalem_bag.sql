-- ============================================================================
-- PASPAS ERP V1 — uretim_emirleri siparis kalemi ve musteri ozet alanlari
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uretim_emirleri' AND COLUMN_NAME = 'siparis_kalem_id');
SET @s := IF(@col = 0, 'ALTER TABLE `uretim_emirleri` ADD COLUMN `siparis_kalem_id` char(36) DEFAULT NULL AFTER `siparis_id`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uretim_emirleri' AND COLUMN_NAME = 'musteri_ozet');
SET @s := IF(@col = 0, 'ALTER TABLE `uretim_emirleri` ADD COLUMN `musteri_ozet` varchar(255) DEFAULT NULL AFTER `recete_id`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uretim_emirleri' AND COLUMN_NAME = 'musteri_detay');
SET @s := IF(@col = 0, 'ALTER TABLE `uretim_emirleri` ADD COLUMN `musteri_detay` varchar(1000) DEFAULT NULL AFTER `musteri_ozet`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uretim_emirleri' AND INDEX_NAME = 'idx_uretim_emirleri_siparis_kalem_id');
SET @s := IF(@idx = 0, 'ALTER TABLE `uretim_emirleri` ADD INDEX `idx_uretim_emirleri_siparis_kalem_id` (`siparis_kalem_id`)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
