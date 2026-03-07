CREATE TABLE IF NOT EXISTS `kaliplar` (
  `id` char(36) NOT NULL,
  `kod` varchar(64) NOT NULL,
  `ad` varchar(255) NOT NULL,
  `aciklama` varchar(500) DEFAULT NULL,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kaliplar_kod` (`kod`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tatiller` (
  `id` char(36) NOT NULL,
  `ad` varchar(255) NOT NULL,
  `tarih` date NOT NULL,
  `baslangic_saati` varchar(5) NOT NULL,
  `bitis_saati` varchar(5) NOT NULL,
  `aciklama` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tatiller_tarih_saatleri` (`tarih`, `baslangic_saati`, `bitis_saati`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tatil_makineler` (
  `id` char(36) NOT NULL,
  `tatil_id` char(36) NOT NULL,
  `makine_id` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tatil_makineler_tatil_makine` (`tatil_id`, `makine_id`),
  KEY `idx_tatil_makineler_makine` (`makine_id`),
  CONSTRAINT `fk_tatil_makineler_tatil`
    FOREIGN KEY (`tatil_id`) REFERENCES `tatiller` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_tatil_makineler_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
