CREATE TABLE IF NOT EXISTS `uretim_emirleri` (
  `id` char(36) NOT NULL,
  `emir_no` varchar(64) NOT NULL,
  `siparis_id` char(36) DEFAULT NULL,
  `urun_id` char(36) NOT NULL,
  `recete_id` char(36) DEFAULT NULL,
  `planlanan_miktar` decimal(12,4) NOT NULL,
  `uretilen_miktar` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `baslangic_tarihi` date DEFAULT NULL,
  `bitis_tarihi` date DEFAULT NULL,
  `durum` varchar(32) NOT NULL DEFAULT 'planlandi',
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_uretim_emirleri_emir_no` (`emir_no`),
  KEY `idx_uretim_emirleri_siparis_id` (`siparis_id`),
  KEY `idx_uretim_emirleri_urun_id` (`urun_id`),
  KEY `idx_uretim_emirleri_recete_id` (`recete_id`),
  KEY `idx_uretim_emirleri_durum` (`durum`),
  CONSTRAINT `fk_uretim_emirleri_siparis`
    FOREIGN KEY (`siparis_id`) REFERENCES `satis_siparisleri` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_uretim_emirleri_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_uretim_emirleri_recete`
    FOREIGN KEY (`recete_id`) REFERENCES `receteler` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
