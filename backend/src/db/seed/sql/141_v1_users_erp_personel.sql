-- PASPAS ERP V1 — Users modulu ERP personel alanlari

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'erp_personel_kodu'
);
SET @s := IF(@col = 0, 'ALTER TABLE `users` ADD COLUMN `erp_personel_kodu` varchar(64) NULL AFTER `phone`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'erp_departman'
);
SET @s := IF(@col = 0, 'ALTER TABLE `users` ADD COLUMN `erp_departman` varchar(64) NULL AFTER `erp_personel_kodu`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'erp_ekip'
);
SET @s := IF(@col = 0, 'ALTER TABLE `users` ADD COLUMN `erp_ekip` varchar(64) NULL AFTER `erp_departman`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'varsayilan_makine_id'
);
SET @s := IF(@col = 0, 'ALTER TABLE `users` ADD COLUMN `varsayilan_makine_id` char(36) NULL AFTER `erp_ekip`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'erp_notlar'
);
SET @s := IF(@col = 0, 'ALTER TABLE `users` ADD COLUMN `erp_notlar` varchar(500) NULL AFTER `varsayilan_makine_id`', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE `users`
SET
  `erp_personel_kodu` = CASE
    WHEN `erp_personel_kodu` IS NOT NULL AND `erp_personel_kodu` <> '' THEN `erp_personel_kodu`
    WHEN `email` = 'admin@promats.com' THEN 'PRS-ADM-001'
    WHEN `email` = 'operator@promats.com' THEN 'PRS-OPR-001'
    WHEN `email` = 'satinalma@promats.com' THEN 'PRS-SAT-001'
    WHEN `email` = 'sevkiyat@promats.com' THEN 'PRS-SEV-001'
    ELSE CONCAT('PRS-', UPPER(LEFT(REPLACE(SUBSTRING_INDEX(`email`, '@', 1), '.', ''), 8)))
  END,
  `erp_departman` = CASE
    WHEN `erp_departman` IS NOT NULL AND `erp_departman` <> '' THEN `erp_departman`
    WHEN `email` = 'operator@promats.com' THEN 'Uretim'
    WHEN `email` = 'satinalma@promats.com' THEN 'Satin Alma'
    WHEN `email` = 'sevkiyat@promats.com' THEN 'Lojistik'
    ELSE 'Yonetim'
  END,
  `erp_ekip` = CASE
    WHEN `erp_ekip` IS NOT NULL AND `erp_ekip` <> '' THEN `erp_ekip`
    WHEN `email` = 'operator@promats.com' THEN 'Enjeksiyon'
    WHEN `email` = 'satinalma@promats.com' THEN 'Tedarik'
    WHEN `email` = 'sevkiyat@promats.com' THEN 'Sevkiyat'
    ELSE 'Merkez'
  END,
  `erp_notlar` = CASE
    WHEN `erp_notlar` IS NOT NULL AND `erp_notlar` <> '' THEN `erp_notlar`
    WHEN `email` = 'operator@promats.com' THEN 'Makine kuyrugu ve vardiya islemlerinde aktif kullanici.'
    WHEN `email` = 'satinalma@promats.com' THEN 'Kritik stok ve satin alma taslaklarini takip eder.'
    WHEN `email` = 'sevkiyat@promats.com' THEN 'Sevkiyat ve teslim akislarindan sorumlu.'
    ELSE 'ERP yonetim kullanicisi.'
  END;

UPDATE `users` u
LEFT JOIN `makineler` m ON m.`kod` = 'ENJ-01'
SET u.`varsayilan_makine_id` = COALESCE(u.`varsayilan_makine_id`, m.`id`)
WHERE u.`email` = 'operator@promats.com';
