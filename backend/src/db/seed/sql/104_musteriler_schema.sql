CREATE TABLE IF NOT EXISTS `musteriler` (
  `id` char(36) NOT NULL,
  `tur` varchar(32) NOT NULL DEFAULT 'musteri',
  `ad` varchar(255) NOT NULL,
  `telefon` varchar(32) DEFAULT NULL,
  `adres` varchar(500) DEFAULT NULL,
  `iskonto` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_musteriler_ad` (`ad`),
  KEY `idx_musteriler_tur` (`tur`),
  KEY `idx_musteriler_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
