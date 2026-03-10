-- ============================================================================
-- PASPAS ERP — Logo & Favicon storage_assets seed
-- /admin_panel/public/logo ve /admin_panel/public/favicon dosyalarını
-- storage_assets tablosuna ekler
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET @seed_ts = '2026-01-01 00:00:00.000';

-- ============================================================================
-- LOGO dosyaları
-- ============================================================================
INSERT INTO storage_assets (
  `id`, `user_id`, `name`, `bucket`, `path`, `folder`, 
  `mime`, `size`, `width`, `height`, `url`,
  `provider`, `metadata`, `created_at`, `updated_at`
)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT('storage-asset:', src.`path`)), 1, 8), '-',
    SUBSTR(MD5(CONCAT('storage-asset:', src.`path`)), 9, 4), '-',
    SUBSTR(MD5(CONCAT('storage-asset:', src.`path`)), 13, 4), '-',
    SUBSTR(MD5(CONCAT('storage-asset:', src.`path`)), 17, 4), '-',
    SUBSTR(MD5(CONCAT('storage-asset:', src.`path`)), 21, 12)
  )) AS `id`,
  NULL AS `user_id`,
  src.`name`,
  src.`bucket`,
  src.`path`,
  src.`folder`,
  src.`mime`,
  src.`size`,
  src.`width`,
  src.`height`,
  src.`url`,
  'local' AS `provider`,
  src.`metadata`,
  @seed_ts,
  @seed_ts
FROM (
  -- Logo files
  SELECT 
    'promats-logo.svg' AS `name`,
    'site-media' AS `bucket`,
    'logo/promats-logo.svg' AS `path`,
    'logo' AS `folder`,
    'image/svg+xml' AS `mime`,
    22545 AS `size`,
    NULL AS `width`,
    NULL AS `height`,
    '/logo/promats-logo.svg' AS `url`,
    JSON_OBJECT('category', 'logo', 'description', 'Promats ana logo SVG') AS `metadata`
  
  UNION ALL SELECT 
    'promats-logo.png',
    'site-media',
    'logo/promats-logo.png',
    'logo',
    'image/png',
    52525,
    NULL,
    NULL,
    '/logo/promats-logo.png',
    JSON_OBJECT('category', 'logo', 'description', 'Promats ana logo PNG')
  
  UNION ALL SELECT 
    'og-image.svg',
    'site-media',
    'logo/og-image.svg',
    'logo',
    'image/svg+xml',
    463,
    NULL,
    NULL,
    '/logo/og-image.svg',
    JSON_OBJECT('category', 'logo', 'description', 'Open Graph meta image')

  -- Favicon files
  UNION ALL SELECT 
    'promats-favicon.svg',
    'site-media',
    'favicon/promats-favicon.svg',
    'favicon',
    'image/svg+xml',
    89492,
    NULL,
    NULL,
    '/favicon/promats-favicon.svg',
    JSON_OBJECT('category', 'favicon', 'description', 'Favicon SVG')

  UNION ALL SELECT 
    'promats-favicon.png',
    'site-media',
    'favicon/promats-favicon.png',
    'favicon',
    'image/png',
    66998,
    NULL,
    NULL,
    '/favicon/promats-favicon.png',
    JSON_OBJECT('category', 'favicon', 'description', 'Favicon PNG büyük')

  UNION ALL SELECT 
    'promats-favicon-32.png',
    'site-media',
    'favicon/promats-favicon-32.png',
    'favicon',
    'image/png',
    2463,
    32,
    32,
    '/favicon/promats-favicon-32.png',
    JSON_OBJECT('category', 'favicon', 'description', 'Favicon 32x32 PNG')

  UNION ALL SELECT 
    'promats-favicon.ico',
    'site-media',
    'favicon/promats-favicon.ico',
    'favicon',
    'image/x-icon',
    922,
    NULL,
    NULL,
    '/favicon/promats-favicon.ico',
    JSON_OBJECT('category', 'favicon', 'description', 'Favicon ICO')
) AS src
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `mime` = VALUES(`mime`),
  `size` = VALUES(`size`),
  `width` = VALUES(`width`),
  `height` = VALUES(`height`),
  `url` = VALUES(`url`),
  `metadata` = VALUES(`metadata`),
  `updated_at` = VALUES(`updated_at`);

-- ============================================================================
-- site_settings branding güncelleme — logo ve favicon referansları
-- ============================================================================
UPDATE site_settings 
SET `value` = JSON_OBJECT(
  'branding', JSON_OBJECT(
    'app_name', 'Promats Üretim ERP',
    'app_copyright', 'Promats Universal Paspaslar',
    'theme_color', '#2563eb',
    'logo_url', '/logo/promats-logo.svg',
    'login_logo_url', '/logo/promats-logo.svg',
    'favicon_16', '/favicon/promats-favicon.svg',
    'favicon_32', '/favicon/promats-favicon-32.png',
    'favicon_ico', '/favicon/promats-favicon.ico',
    'apple_touch_icon', '/favicon/promats-favicon.png',
    'meta', JSON_OBJECT(
      'title', 'Promats Üretim ERP',
      'description', 'Promats Universal Paspaslar üretim yönetim paneli. Siparişler, üretim emirleri, stok ve satın alma yönetimi.',
      'og_url', 'https://promats.com.tr/admin',
      'og_title', 'Promats Üretim ERP',
      'og_description', 'Promats Universal Paspaslar ERP paneli ile üretim ve sipariş yönetimini merkezi olarak yapın.',
      'og_image', '/logo/og-image.svg',
      'twitter_card', 'summary_large_image'
    )
  )
),
`updated_at` = CURRENT_TIMESTAMP(3)
WHERE `key` = 'ui_admin_config';
