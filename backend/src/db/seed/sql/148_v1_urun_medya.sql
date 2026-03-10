CREATE TABLE IF NOT EXISTS `urun_medya` (
  `id` char(36) NOT NULL,
  `urun_id` char(36) NOT NULL,
  `tip` varchar(16) NOT NULL DEFAULT 'image' COMMENT 'image | video | url',
  `url` varchar(1024) NOT NULL,
  `storage_asset_id` char(36) DEFAULT NULL,
  `baslik` varchar(255) DEFAULT NULL,
  `sira` int unsigned NOT NULL DEFAULT 0,
  `is_cover` tinyint unsigned NOT NULL DEFAULT 0 COMMENT 'Kapak görseli mi?',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_urun_medya_urun_id` (`urun_id`),
  KEY `idx_urun_medya_sira` (`sira`),
  CONSTRAINT `fk_urun_medya_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
