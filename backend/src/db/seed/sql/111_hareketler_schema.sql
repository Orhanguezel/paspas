CREATE TABLE IF NOT EXISTS `hareketler` (
  `id` char(36) NOT NULL,
  `urun_id` char(36) NOT NULL,
  -- hareket_tipi: 'giris' | 'cikis' | 'duzeltme'
  `hareket_tipi` varchar(32) NOT NULL,
  -- referans_tipi: 'uretim_emri' (yarı mamul üretim girişi) | 'montaj' (yarı mamul çıkışı, asıl ürün girişi, hammadde çıkışı) | 'siparis' (sevkiyat) | 'satin_alma' | 'sayim' | 'manuel'
  `referans_tipi` varchar(32) DEFAULT NULL,
  `referans_id` char(36) DEFAULT NULL,
  `miktar` decimal(12,4) NOT NULL,
  `aciklama` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hareketler_urun` (`urun_id`),
  KEY `idx_hareketler_tip` (`hareket_tipi`),
  KEY `idx_hareketler_created_at` (`created_at`),
  CONSTRAINT `fk_hareketler_urun`
    FOREIGN KEY (`urun_id`) REFERENCES `urunler` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
