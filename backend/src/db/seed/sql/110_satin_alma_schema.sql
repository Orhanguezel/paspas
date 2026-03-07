CREATE TABLE IF NOT EXISTS `satin_alma_siparisleri` (
  `id` char(36) NOT NULL,
  `siparis_no` varchar(64) NOT NULL,
  `tedarikci_id` char(36) NOT NULL,
  `siparis_tarihi` date NOT NULL,
  `termin_tarihi` date DEFAULT NULL,
  `durum` varchar(32) NOT NULL DEFAULT 'taslak',
  `aciklama` varchar(500) DEFAULT NULL,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_satin_alma_siparisleri_no` (`siparis_no`),
  KEY `idx_satin_alma_tedarikci` (`tedarikci_id`),
  CONSTRAINT `fk_satin_alma_tedarikci`
    FOREIGN KEY (`tedarikci_id`) REFERENCES `musteriler` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `satin_alma_kalemleri` (
  `id` char(36) NOT NULL,
  `siparis_id` char(36) NOT NULL,
  `urun_id` char(36) NOT NULL,
  `miktar` decimal(12,4) NOT NULL,
  `birim_fiyat` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sira` int unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_satin_alma_kalemleri_siparis` (`siparis_id`),
  KEY `idx_satin_alma_kalemleri_urun` (`urun_id`),
  CONSTRAINT `fk_satin_alma_kalem_siparis`
    FOREIGN KEY (`siparis_id`) REFERENCES `satin_alma_siparisleri` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_satin_alma_kalem_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
