-- 239: Promats teklif şablonları
-- Idempotent ve veri-korumalı: tablo yoksa oluşturur, varsayılan satırı upsert eder.
CREATE TABLE IF NOT EXISTS `teklif_sablonlari` (
  `id` char(36) NOT NULL,
  `ad` varchar(160) NOT NULL,
  `dil` varchar(8) NOT NULL DEFAULT 'tr',
  `logo_asset_id` char(36) NULL,
  `ayarlar` json NULL,
  `varsayilan` tinyint unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teklif_sablon_dil` (`dil`, `varsayilan`),
  CONSTRAINT `fk_teklif_sablon_logo`
    FOREIGN KEY (`logo_asset_id`) REFERENCES `storage_assets` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `teklif_sablonlari` (`id`,`ad`,`dil`,`ayarlar`,`varsayilan`)
VALUES ('37000000-0000-4000-8000-000000000001','Promats Standart Teklif','tr',JSON_OBJECT(),1)
ON DUPLICATE KEY UPDATE `id`=VALUES(`id`);
