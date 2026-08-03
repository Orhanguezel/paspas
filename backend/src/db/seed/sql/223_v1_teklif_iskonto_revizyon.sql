-- 223: Teklif iskonto onay akışı + revizyon (R0/R1/R2) snapshot (V2 Adım 5)
-- teklifler'e: iskonto_onaylandi, iskonto_onaylayan_user_id, iskonto_onay_at
-- + teklif_revizyonlari (durum sıfırlanmadan önce tam anlık görüntü)
-- Idempotent: INFORMATION_SCHEMA guard (mevcut veriye dokunmaz).

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='iskonto_onaylandi');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `iskonto_onaylandi` tinyint unsigned NOT NULL DEFAULT 0 AFTER `iskonto_tutari`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='iskonto_onaylayan_user_id');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `iskonto_onaylayan_user_id` char(36) NULL AFTER `iskonto_onaylandi`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='iskonto_onay_at');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `iskonto_onay_at` datetime NULL AFTER `iskonto_onaylayan_user_id`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

CREATE TABLE IF NOT EXISTS `teklif_revizyonlari` (
  `id` char(36) NOT NULL,
  `teklif_id` char(36) NOT NULL,
  `revizyon_no` int unsigned NOT NULL,
  `snapshot` json NOT NULL,
  `neden` varchar(500) NOT NULL,
  `created_by` char(36) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teklif_revizyon` (`teklif_id`, `revizyon_no`),
  CONSTRAINT `fk_teklif_revizyon_teklif`
    FOREIGN KEY (`teklif_id`) REFERENCES `teklifler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
