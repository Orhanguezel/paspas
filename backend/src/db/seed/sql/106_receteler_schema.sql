CREATE TABLE IF NOT EXISTS `receteler` (
  `id` char(36) NOT NULL,
  `kod` varchar(64) NOT NULL,
  `ad` varchar(255) NOT NULL,
  `urun_id` char(36) DEFAULT NULL,
  `aciklama` varchar(500) DEFAULT NULL,
  `hedef_miktar` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_receteler_kod` (`kod`),
  KEY `idx_receteler_ad` (`ad`),
  KEY `idx_receteler_urun_id` (`urun_id`),
  KEY `idx_receteler_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recete_kalemleri` (
  `id` char(36) NOT NULL,
  `recete_id` char(36) NOT NULL,
  `urun_id` char(36) NOT NULL,
  `miktar` decimal(12,4) NOT NULL,
  `fire_orani` decimal(5,2) NOT NULL DEFAULT 0.00,
  `sira` int unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recete_kalemleri_recete_id` (`recete_id`),
  KEY `idx_recete_kalemleri_urun_id` (`urun_id`),
  KEY `idx_recete_kalemleri_sira` (`sira`),
  CONSTRAINT `fk_recete_kalemleri_recete`
    FOREIGN KEY (`recete_id`) REFERENCES `receteler` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_recete_kalemleri_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
