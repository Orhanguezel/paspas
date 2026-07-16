-- 213: Durus kayitlari -> vardiya kaydi bagi
-- V19/R3: BITIR ve DURAKLAT akislari ortak VardiyaSecici'ye gecirildi; duraklatma
-- istegi artik vardiyaKayitId tasiyor. repoDuraklat bu degeri durus_kayitlari'na
-- yazabilsin diye kolon eklenir (209'un operator_gunluk_kayitlari icin yaptiginin esi).
-- Idempotent: INFORMATION_SCHEMA kontrolu ile kolon yoksa eklenir.

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'durus_kayitlari'
    AND COLUMN_NAME = 'vardiya_kayit_id'
);

SET @stmt := IF(
  @col_exists = 0,
  'ALTER TABLE `durus_kayitlari` ADD COLUMN `vardiya_kayit_id` char(36) NULL DEFAULT NULL AFTER `makine_kuyruk_id`, ADD KEY `idx_durus_vardiya_kayit_id` (`vardiya_kayit_id`)',
  'SELECT 1'
);

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `durus_kayitlari` dk
JOIN `vardiya_kayitlari` vk
  ON vk.`makine_id` = dk.`makine_id`
 AND vk.`baslangic` <= dk.`baslangic`
 AND COALESCE(vk.`bitis`, '2099-01-01 00:00:00') > dk.`baslangic`
SET dk.`vardiya_kayit_id` = vk.`id`
WHERE dk.`vardiya_kayit_id` IS NULL;
