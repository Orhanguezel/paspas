CREATE TABLE IF NOT EXISTS `makineler` (
  `id` char(36) NOT NULL,
  `kod` varchar(64) NOT NULL,
  `ad` varchar(255) NOT NULL,
  `tonaj` decimal(10,2) DEFAULT NULL,
  `saatlik_kapasite` decimal(10,2) DEFAULT NULL,
  `calisir_24_saat` tinyint unsigned NOT NULL DEFAULT 0,
  `durum` varchar(32) NOT NULL DEFAULT 'aktif',
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_makineler_kod` (`kod`),
  KEY `idx_makineler_durum` (`durum`),
  KEY `idx_makineler_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `makine_kuyrugu` (
  `id` char(36) NOT NULL,
  `makine_id` char(36) NOT NULL,
  `uretim_emri_id` char(36) NOT NULL,
  `sira` int unsigned NOT NULL DEFAULT 0,
  `planlanan_sure_dk` int unsigned NOT NULL DEFAULT 0,
  `durum` varchar(32) NOT NULL DEFAULT 'bekliyor',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_makine_kuyrugu_makine_sira` (`makine_id`,`sira`),
  KEY `idx_makine_kuyrugu_emir` (`uretim_emri_id`),
  CONSTRAINT `fk_makine_kuyrugu_makine`
    FOREIGN KEY (`makine_id`) REFERENCES `makineler` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_makine_kuyrugu_emir`
    FOREIGN KEY (`uretim_emri_id`) REFERENCES `uretim_emirleri` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
