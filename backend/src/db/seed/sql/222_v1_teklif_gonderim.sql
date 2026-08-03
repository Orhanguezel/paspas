-- 222: Teklif gönderimi + public görüntüleme (V2 Adım 3)
-- teklifler'e: goruntuleme_token (public link), gonderim_at, ilk_goruntuleme_at
-- + teklif_gonderimleri (gönderim kaydı: e-posta/whatsapp/manuel)
-- Idempotent: INFORMATION_SCHEMA guard (mevcut veriye dokunmaz).

-- goruntuleme_token
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='goruntuleme_token');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `goruntuleme_token` char(36) NULL AFTER `donusen_siparis_id`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- gonderim_at
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='gonderim_at');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `gonderim_at` datetime NULL AFTER `goruntuleme_token`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ilk_goruntuleme_at
SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND COLUMN_NAME='ilk_goruntuleme_at');
SET @s := IF(@c=0, 'ALTER TABLE `teklifler` ADD COLUMN `ilk_goruntuleme_at` datetime NULL AFTER `gonderim_at`', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Mevcut tekliflere token ata (her satır ayrı UUID)
UPDATE `teklifler` SET `goruntuleme_token` = UUID() WHERE `goruntuleme_token` IS NULL OR `goruntuleme_token` = '';

-- Token için benzersiz index (yoksa ekle)
SET @i := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='teklifler' AND INDEX_NAME='uq_teklif_token');
SET @s := IF(@i=0, 'ALTER TABLE `teklifler` ADD UNIQUE KEY `uq_teklif_token` (`goruntuleme_token`)', 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- Gönderim kaydı
CREATE TABLE IF NOT EXISTS `teklif_gonderimleri` (
  `id` char(36) NOT NULL,
  `teklif_id` char(36) NOT NULL,
  `kanal` varchar(24) NOT NULL,
  `alici_email` varchar(255) NULL,
  `durum` varchar(24) NOT NULL DEFAULT 'basarili',
  `hata_mesaji` varchar(1000) NULL,
  `created_by` char(36) NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teklif_gonderim` (`teklif_id`, `created_at`),
  CONSTRAINT `fk_teklif_gonderim_teklif`
    FOREIGN KEY (`teklif_id`) REFERENCES `teklifler` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
