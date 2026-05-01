-- ============================================================================
-- PASPAS ERP V1 — Musteriler bayi profili ve public sinyal kaynaklari
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'website_url');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `website_url` varchar(500) DEFAULT NULL AFTER `sevkiyat_notu`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'google_maps_url');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `google_maps_url` varchar(500) DEFAULT NULL AFTER `website_url`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'instagram_url');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `instagram_url` varchar(500) DEFAULT NULL AFTER `google_maps_url`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'facebook_url');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `facebook_url` varchar(500) DEFAULT NULL AFTER `instagram_url`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'bayi_segment');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `bayi_segment` varchar(32) DEFAULT NULL AFTER `facebook_url`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'kredi_limit');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `kredi_limit` decimal(12,2) DEFAULT NULL AFTER `bayi_segment`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'mevcut_bakiye');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `mevcut_bakiye` decimal(12,2) DEFAULT NULL AFTER `kredi_limit`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'vade_gunu');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `vade_gunu` int unsigned DEFAULT NULL AFTER `mevcut_bakiye`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'portal_enabled');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `portal_enabled` tinyint unsigned NOT NULL DEFAULT 0 AFTER `vade_gunu`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'portal_status');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `portal_status` varchar(32) NOT NULL DEFAULT ''not_invited'' AFTER `portal_enabled`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'public_veri_izni');
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `public_veri_izni` tinyint unsigned NOT NULL DEFAULT 0 AFTER `portal_status`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `musteriler`
SET `website_url` = CONCAT('https://www.', LOWER(SUBSTRING_INDEX(`email`, '@', -1)))
WHERE (`website_url` IS NULL OR `website_url` = '')
  AND `email` LIKE '%@%.%'
  AND LOWER(SUBSTRING_INDEX(`email`, '@', -1)) NOT IN ('gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com');

UPDATE `musteriler`
SET `bayi_segment` = CASE
  WHEN `tur` = 'tedarikci' THEN NULL
  WHEN `ad` LIKE '%İhracat%' OR `ad` LIKE '%Ihracat%' OR `ad` LIKE '%GmbH%' THEN 'ihracat'
  WHEN COALESCE(`iskonto`, 0) BETWEEN 0 AND 7 THEN 'toptanci'
  WHEN COALESCE(`iskonto`, 0) BETWEEN 8 AND 25 THEN 'otomotiv'
  WHEN COALESCE(`iskonto`, 0) > 25 THEN 'kucuk_bayi'
  ELSE `bayi_segment`
END
WHERE `bayi_segment` IS NULL;
