-- CRM V2/6: fırsat ürünleri, serbest ihtiyaç notu ve fırsat-teklif bağı.

CREATE TABLE IF NOT EXISTS `firsat_urunleri` (
  `id` char(36) NOT NULL,
  `firsat_id` char(36) NOT NULL,
  `urun_id` char(36) NOT NULL,
  `miktar` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `birim_fiyat` decimal(14,2) NULL,
  `para_birimi` char(3) NOT NULL DEFAULT 'TRY',
  `aciklama` varchar(500) NULL,
  `sira` int unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_firsat_urunleri_firsat_sira` (`firsat_id`, `sira`),
  CONSTRAINT `fk_firsat_urunleri_firsat` FOREIGN KEY (`firsat_id`) REFERENCES `crm_deals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_firsat_urunleri_urun` FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_deal_ihtiyaclari` (
  `firsat_id` char(36) NOT NULL,
  `ihtiyac_notu` text NULL,
  `teslim_beklentisi` date NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`firsat_id`),
  CONSTRAINT `fk_crm_deal_ihtiyac_firsat` FOREIGN KEY (`firsat_id`) REFERENCES `crm_deals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_deal_teklifleri` (
  `firsat_id` char(36) NOT NULL,
  `teklif_id` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`firsat_id`),
  UNIQUE KEY `uq_crm_deal_teklif_teklif` (`teklif_id`),
  CONSTRAINT `fk_crm_deal_teklif_firsat` FOREIGN KEY (`firsat_id`) REFERENCES `crm_deals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_deal_teklif_teklif` FOREIGN KEY (`teklif_id`) REFERENCES `teklifler` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

