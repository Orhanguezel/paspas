-- =================================================================
-- Proje Teklifi Yazılımcı Notları
-- /admin/proje-teklifi sayfasında doküman bazlı dev notları
-- =================================================================

CREATE TABLE IF NOT EXISTS `proje_teklifi_notlari` (
  `id` char(36) NOT NULL,
  `dokuman_key` varchar(64) NOT NULL,
  `dokuman_baslik` varchar(255) DEFAULT NULL,
  `not_tipi` varchar(32) NOT NULL DEFAULT 'note',
  `baslik` varchar(255) DEFAULT NULL,
  `icerik` text NOT NULL,
  `etiketler` json DEFAULT NULL,
  `oncelik` varchar(16) NOT NULL DEFAULT 'normal',
  `durum` varchar(16) NOT NULL DEFAULT 'open',
  `created_by_user_id` char(36) DEFAULT NULL,
  `updated_by_user_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_proje_teklifi_dokuman` (`dokuman_key`, `created_at`),
  KEY `idx_proje_teklifi_durum` (`durum`, `oncelik`),
  KEY `idx_proje_teklifi_user` (`created_by_user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
