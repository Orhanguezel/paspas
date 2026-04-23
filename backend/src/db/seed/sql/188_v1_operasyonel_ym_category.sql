SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `categories` (
  `id`,
  `kod`,
  `name`,
  `slug`,
  `description`,
  `display_order`,
  `varsayilan_birim`,
  `varsayilan_kod_prefixi`,
  `recetede_kullanilabilir`,
  `varsayilan_tedarik_tipi`,
  `uretim_alanlari_aktif`,
  `operasyon_tipi_gerekli`,
  `varsayilan_operasyon_tipi`,
  `is_active`,
  `is_featured`,
  `is_unlimited`,
  `has_cart`
) VALUES (
  'c0000001-0000-4000-8000-000000000004',
  'operasyonel_ym',
  'Operasyonel YM',
  'operasyonel_ym',
  'Operasyonu tanimlanan yari mamuller. Sag/sol veya tek parca operasyonu bu kartta tutulur.',
  30,
  'adet',
  'OYM',
  1,
  'uretim',
  1,
  0,
  NULL,
  1,
  0,
  0,
  1
)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `slug` = VALUES(`slug`),
  `description` = VALUES(`description`),
  `display_order` = VALUES(`display_order`),
  `varsayilan_birim` = VALUES(`varsayilan_birim`),
  `varsayilan_kod_prefixi` = VALUES(`varsayilan_kod_prefixi`),
  `recetede_kullanilabilir` = VALUES(`recetede_kullanilabilir`),
  `varsayilan_tedarik_tipi` = VALUES(`varsayilan_tedarik_tipi`),
  `uretim_alanlari_aktif` = VALUES(`uretim_alanlari_aktif`),
  `operasyon_tipi_gerekli` = VALUES(`operasyon_tipi_gerekli`),
  `varsayilan_operasyon_tipi` = VALUES(`varsayilan_operasyon_tipi`),
  `is_active` = VALUES(`is_active`),
  `is_featured` = VALUES(`is_featured`),
  `is_unlimited` = VALUES(`is_unlimited`),
  `has_cart` = VALUES(`has_cart`);

UPDATE `categories`
SET `display_order` = 40
WHERE `kod` = 'hammadde';
