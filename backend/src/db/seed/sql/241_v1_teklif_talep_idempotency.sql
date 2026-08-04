-- 241: Ağ tekrarlarında çift web talebi oluşmasını engelleyen idempotency anahtarı.
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklif_talepleri' AND COLUMN_NAME='idempotency_key');
SET @s := IF(@c=0,
  'ALTER TABLE `teklif_talepleri` ADD COLUMN `idempotency_key` char(36) NULL AFTER `ip_hash`',
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @i := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklif_talepleri' AND INDEX_NAME='uq_teklif_talep_idempotency');
SET @s := IF(@i=0,
  'ALTER TABLE `teklif_talepleri` ADD UNIQUE KEY `uq_teklif_talep_idempotency` (`idempotency_key`)',
  'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
