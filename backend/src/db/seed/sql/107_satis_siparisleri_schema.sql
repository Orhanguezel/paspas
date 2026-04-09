CREATE TABLE IF NOT EXISTS `satis_siparisleri` (
  `id` char(36) NOT NULL,
  `siparis_no` varchar(64) NOT NULL,
  `musteri_id` char(36) NOT NULL,
  `siparis_tarihi` date NOT NULL,
  `termin_tarihi` date DEFAULT NULL,
  `durum` varchar(32) NOT NULL DEFAULT 'taslak',
  `aciklama` varchar(500) DEFAULT NULL,
  `ekstra_indirim_orani` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_satis_siparisleri_siparis_no` (`siparis_no`),
  KEY `idx_satis_siparisleri_musteri_id` (`musteri_id`),
  KEY `idx_satis_siparisleri_durum` (`durum`),
  KEY `idx_satis_siparisleri_is_active` (`is_active`),
  CONSTRAINT `fk_satis_siparisleri_musteri`
    FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `siparis_kalemleri` (
  `id` char(36) NOT NULL,
  `siparis_id` char(36) NOT NULL,
  `urun_id` char(36) NOT NULL,
  `miktar` decimal(12,4) NOT NULL,
  `birim_fiyat` decimal(12,2) NOT NULL DEFAULT 0.00,
  `sira` int unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_siparis_kalemleri_siparis_id` (`siparis_id`),
  KEY `idx_siparis_kalemleri_urun_id` (`urun_id`),
  KEY `idx_siparis_kalemleri_sira` (`sira`),
  CONSTRAINT `fk_siparis_kalemleri_siparis`
    FOREIGN KEY (`siparis_id`) REFERENCES `satis_siparisleri` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_siparis_kalemleri_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
