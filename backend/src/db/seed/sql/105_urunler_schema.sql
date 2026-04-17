CREATE TABLE IF NOT EXISTS `urunler` (
  `id` char(36) NOT NULL,
  -- kategori: categories.kod'a refans — 'urun' (asıl ürün, montaj sonucu) | 'yarimamul' (sağ/sol/parça) | 'hammadde' (plastik, ambalaj, etiket vs.)
  `kategori` varchar(32) NOT NULL DEFAULT 'urun',
  `tedarik_tipi` varchar(32) NOT NULL DEFAULT 'uretim',
  `urun_grubu` varchar(128) DEFAULT NULL,
  `kod` varchar(64) NOT NULL,
  `ad` varchar(255) NOT NULL,
  `aciklama` varchar(500) DEFAULT NULL,
  `birim` varchar(16) NOT NULL DEFAULT 'kg',
  `renk` varchar(64) DEFAULT NULL,
  `image_url` varchar(1024) DEFAULT NULL,
  `storage_asset_id` char(36) DEFAULT NULL,
  `image_alt` varchar(255) DEFAULT NULL,
  `stok` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `kritik_stok` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `rezerve_stok` decimal(12,4) NOT NULL DEFAULT 0.0000,
  `birim_fiyat` decimal(12,2) DEFAULT NULL,
  `kdv_orani` decimal(5,2) NOT NULL DEFAULT 20.00,
  -- operasyon_tipi: sadece kategori='urun' için anlamlı. 'tek_tarafli' (sağ==sol, parça x2) | 'cift_tarafli' (sağ+sol). Yarı mamul/malzemede NULL.
  `operasyon_tipi` varchar(32) DEFAULT NULL,
  `is_active` tinyint unsigned NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_urunler_kod` (`kod`),
  KEY `idx_urunler_ad` (`ad`),
  KEY `idx_urunler_is_active` (`is_active`),
  KEY `idx_urunler_storage_asset` (`storage_asset_id`),
  CONSTRAINT `fk_urunler_storage_asset`
    FOREIGN KEY (`storage_asset_id`) REFERENCES `storage_assets` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
