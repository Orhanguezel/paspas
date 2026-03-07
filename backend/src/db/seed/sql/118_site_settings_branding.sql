-- ============================================================================
-- SITE SETTINGS: Branding & SEO ayarları
-- ui_admin_config → Admin panel branding (fetch-branding.ts tarafından okunur)
-- ============================================================================
SET @seed_ts = '2026-01-01 00:00:00.000';

INSERT INTO site_settings (`id`, `key`, `value`, `created_at`, `updated_at`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 1, 8), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 9, 4), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 13, 4), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 17, 4), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 21, 12)
  )),
  src.`key`,
  src.`value`,
  @seed_ts,
  @seed_ts
FROM (
  SELECT
    'ui_admin_config' AS `key`,
    JSON_OBJECT(
      'branding', JSON_OBJECT(
        'app_name', 'Promats Üretim ERP',
        'app_copyright', 'Promats Universal Paspaslar',
        'theme_color', '#2563eb',
        'logo_url', '',
        'login_logo_url', '',
        'favicon_16', '/favicon/favicon.svg',
        'favicon_32', '/favicon/favicon.svg',
        'apple_touch_icon', '/apple/apple-touch-icon.png',
        'meta', JSON_OBJECT(
          'title', 'Promats Üretim ERP',
          'description', 'Promats Universal Paspaslar üretim yönetim paneli. Siparişler, üretim emirleri, stok ve satın alma yönetimi.',
          'og_url', 'https://promats.com.tr/admin',
          'og_title', 'Promats Üretim ERP',
          'og_description', 'Promats Universal Paspaslar ERP paneli ile üretim ve sipariş yönetimini merkezi olarak yapın.',
          'og_image', '/logo/og-image.png',
          'twitter_card', 'summary_large_image'
        )
      )
    ) AS `value`
) AS src
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ============================================================================
-- Genel site bilgileri
-- ============================================================================

INSERT INTO site_settings (`id`, `key`, `value`, `created_at`, `updated_at`)
SELECT
  LOWER(CONCAT(
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 1, 8), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 9, 4), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 13, 4), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 17, 4), '-',
    SUBSTR(MD5(CONCAT('site-setting:', src.`key`)), 21, 12)
  )),
  src.`key`,
  src.`value`,
  @seed_ts,
  @seed_ts
FROM (
  SELECT 'site_name' AS `key`, '"Promats Universal Paspaslar"' AS `value`
  UNION ALL SELECT 'site_description', '"Otomotiv paspas üretim ve ERP yönetim sistemi"'
  UNION ALL SELECT 'site_url', '"https://promats.com.tr"'
  UNION ALL SELECT 'company_name', '"Promats Universal Paspaslar San. ve Tic. Ltd. Şti."'
  UNION ALL SELECT 'company_phone', '"+90 212 000 00 00"'
  UNION ALL SELECT 'company_email', '"info@promats.com.tr"'
  UNION ALL SELECT 'company_address', '"İstanbul, Türkiye"'
  UNION ALL SELECT 'default_locale', '"tr"'
  UNION ALL SELECT 'app_locales', '["tr"]'
) AS src
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
