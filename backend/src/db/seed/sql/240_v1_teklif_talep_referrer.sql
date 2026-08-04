-- 240: Web teklif talebinin yönlendiren sayfası.
-- Idempotent; mevcut satırlara dokunmaz.
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklif_talepleri' AND COLUMN_NAME='referrer');
SET @s := IF(@c=0,
  'ALTER TABLE `teklif_talepleri` ADD COLUMN `referrer` varchar(1000) NULL AFTER `kaynak_sayfa`',
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
