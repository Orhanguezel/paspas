-- 242: Süreli ve iptal edilebilir public teklif bağlantıları.
-- Idempotent; eski aktif tokenlara migration anından itibaren 30 gün tanır.

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='goruntuleme_token_expires_at');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `goruntuleme_token_expires_at` datetime NULL AFTER `goruntuleme_token`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='goruntuleme_token_revoked_at');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `goruntuleme_token_revoked_at` datetime NULL AFTER `goruntuleme_token_expires_at`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

UPDATE `teklifler`
SET `goruntuleme_token_expires_at` = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
WHERE `goruntuleme_token` IS NOT NULL AND `goruntuleme_token_expires_at` IS NULL;

SET @i := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND INDEX_NAME='idx_teklif_public_token_validity');
SET @s := IF(@i=0, 'ALTER TABLE `teklifler` ADD KEY `idx_teklif_public_token_validity` (`goruntuleme_token_expires_at`,`goruntuleme_token_revoked_at`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
