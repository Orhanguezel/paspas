-- 209: Operator gunluk kayitlari -> vardiya kaydi bagi
-- Gecikmeli girislerde vardiya analizinin kayit_tarihi'nden tahmin yapmak yerine
-- kaydin ait oldugu vardiya_kayitlari satirini kullanmasi icin.
-- Idempotent: INFORMATION_SCHEMA kontrolu ile kolon yoksa eklenir.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'operator_gunluk_kayitlari'
    AND COLUMN_NAME = 'vardiya_kayit_id'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `operator_gunluk_kayitlari` ADD COLUMN `vardiya_kayit_id` char(36) NULL DEFAULT NULL AFTER `emir_operasyon_id`, ADD KEY `idx_operator_gunluk_vardiya_kayit_id` (`vardiya_kayit_id`)',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `operator_gunluk_kayitlari` ogk
JOIN `vardiya_kayitlari` vk
  ON vk.`makine_id` = ogk.`makine_id`
 AND vk.`baslangic` <= ogk.`kayit_tarihi`
 AND COALESCE(vk.`bitis`, '2099-01-01 00:00:00') > ogk.`kayit_tarihi`
SET ogk.`vardiya_kayit_id` = vk.`id`
WHERE ogk.`vardiya_kayit_id` IS NULL;
