-- ============================================================================
-- PASPAS ERP V1 — categories tablosu + standart ERP kategorileri
-- urun / yarimamul / hammadde
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `categories` (
  `id` char(36) NOT NULL,
  `kod` varchar(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` longtext DEFAULT NULL,
  `storage_asset_id` char(36) DEFAULT NULL,
  `alt` varchar(255) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `has_cart` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_unlimited` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int NOT NULL DEFAULT 0,
  `whatsapp_number` varchar(50) DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `varsayilan_tedarik_tipi` varchar(32) NOT NULL DEFAULT 'uretim',
  `uretim_alanlari_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `operasyon_tipi_gerekli` tinyint(1) NOT NULL DEFAULT 1,
  `varsayilan_operasyon_tipi` varchar(32) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_kod_uq` (`kod`),
  UNIQUE KEY `categories_slug_uq` (`slug`),
  KEY `categories_active_idx` (`is_active`),
  KEY `categories_order_idx` (`display_order`),
  KEY `categories_storage_asset_idx` (`storage_asset_id`),
  CONSTRAINT `categories_storage_asset_fk`
    FOREIGN KEY (`storage_asset_id`) REFERENCES `storage_assets` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (
  `id`, `kod`, `name`, `slug`, `description`, `display_order`,
  `varsayilan_tedarik_tipi`, `uretim_alanlari_aktif`,
  `operasyon_tipi_gerekli`, `varsayilan_operasyon_tipi`,
  `is_active`, `is_featured`, `is_unlimited`, `has_cart`
) VALUES
  (
    'c0000001-0000-4000-8000-000000000001',
    'urun',
    'Urun',
    'urun',
    'Nihai mamul urunler. Operasyon tipi ve uretim planlama alanlari kullanilir.',
    10,
    'uretim',
    1,
    1,
    'tek_tarafli',
    1, 0, 0, 1
  ),
  (
    'c0000001-0000-4000-8000-000000000002',
    'yarimamul',
    'Yarimamul',
    'yarimamul',
    'Uretim icinde kullanilan ara urunler. Varsayilan olarak tek operasyon mantigi uygulanir.',
    20,
    'uretim',
    1,
    0,
    NULL,
    1, 0, 0, 1
  ),
  (
    'c0000001-0000-4000-8000-000000000003',
    'hammadde',
    'Hammadde',
    'hammadde',
    'Satın alma veya fason teminli hammadde girdileri. Uretim operasyon alanlari kullanilmaz.',
    30,
    'satin_alma',
    0,
    0,
    NULL,
    1, 0, 0, 1
  )
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `slug` = VALUES(`slug`),
  `description` = VALUES(`description`),
  `display_order` = VALUES(`display_order`),
  `varsayilan_tedarik_tipi` = VALUES(`varsayilan_tedarik_tipi`),
  `uretim_alanlari_aktif` = VALUES(`uretim_alanlari_aktif`),
  `operasyon_tipi_gerekli` = VALUES(`operasyon_tipi_gerekli`),
  `varsayilan_operasyon_tipi` = VALUES(`varsayilan_operasyon_tipi`),
  `is_active` = VALUES(`is_active`),
  `has_cart` = VALUES(`has_cart`);
