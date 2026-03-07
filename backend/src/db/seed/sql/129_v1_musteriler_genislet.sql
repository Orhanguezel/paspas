-- ============================================================================
-- PASPAS ERP V1 — musteriler tablosu genisletme
-- Yeni alanlar: kod, ilgili_kisi, email
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'kod'
);
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `kod` varchar(32) DEFAULT NULL AFTER `tur`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'ilgili_kisi'
);
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `ilgili_kisi` varchar(255) DEFAULT NULL AFTER `ad`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND COLUMN_NAME = 'email'
);
SET @s := IF(@col = 0, 'ALTER TABLE `musteriler` ADD COLUMN `email` varchar(255) DEFAULT NULL AFTER `telefon`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @mus_no := 0;
UPDATE `musteriler`
SET `kod` = CONCAT('MUS-', LPAD((@mus_no := @mus_no + 1), 3, '0'))
WHERE (`kod` IS NULL OR `kod` = '') AND `tur` = 'musteri'
ORDER BY `created_at`, `id`;

SET @ted_no := 0;
UPDATE `musteriler`
SET `kod` = CONCAT('TED-', LPAD((@ted_no := @ted_no + 1), 3, '0'))
WHERE (`kod` IS NULL OR `kod` = '') AND `tur` = 'tedarikci'
ORDER BY `created_at`, `id`;

UPDATE `musteriler`
SET `kod` = CONCAT('MUS-', LEFT(REPLACE(`id`, '-', ''), 6))
WHERE `kod` IS NULL OR `kod` = '';

ALTER TABLE `musteriler`
  MODIFY COLUMN `kod` varchar(32) NOT NULL;

SET @idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'musteriler' AND INDEX_NAME = 'uq_musteriler_kod'
);
SET @s := IF(@idx = 0, 'ALTER TABLE `musteriler` ADD UNIQUE INDEX `uq_musteriler_kod` (`kod`)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
