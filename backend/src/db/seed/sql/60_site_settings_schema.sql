-- ============================================================================
-- PROMATS ERP — site_settings schema + seed
-- ============================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET @seed_ts = '2026-01-01 00:00:00.000';

DROP TABLE IF EXISTS `site_settings`;

CREATE TABLE `site_settings` (
  `id` CHAR(36) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_uq` (`key`),
  KEY `site_settings_key_idx` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELETE FROM `site_settings`;

-- =============================================================
-- BRAND / UI
-- =============================================================
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`)
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
  SELECT 'brand_name' AS `key`, '"Promats Universal Paspaslar"' AS `value`
  UNION ALL SELECT 'brand_display_name', '"Promats ERP"'
  UNION ALL SELECT 'brand_logo_text', '"Promats"'
  UNION ALL SELECT 'brand_subtitle', '"Oto Paspas Üretim Yönetim Sistemi"'
  UNION ALL SELECT 'brand_tagline', '"3D, 4D, 5D derin havuzlu oto paspas üretimi"'
  UNION ALL SELECT 'ui_theme', '{"primaryHex":"#1B4332","darkMode":"light","radius":"0.375rem"}'
  UNION ALL SELECT 'site_version', '"1.0.0"'
  UNION ALL SELECT 'admin_path', '"/admin"'
) AS src;

-- =============================================================
-- CONTACT
-- =============================================================
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`)
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
  SELECT 'contact_phone_display' AS `key`, '"+90 (212) 485 75 70"' AS `value`
  UNION ALL SELECT 'contact_phone_tel', '"+902124857570"'
  UNION ALL SELECT 'contact_email', '"info@promats.com.tr"'
  UNION ALL SELECT 'contact_address', '"İkitelli OSB Mah. Mutsan Sanayi Sitesi M1 Blok No: 20/22/24 Başakşehir, İstanbul"'
  UNION ALL SELECT 'contact_whatsapp_link', '"https://wa.me/902124857570"'
) AS src;

-- =============================================================
-- ERP COMPANY PROFILE
-- =============================================================
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`)
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
  SELECT 'contact_info' AS `key`, JSON_OBJECT(
    'phone', '+90 212 485 75 70',
    'email', 'info@promats.com.tr',
    'whatsapp', '+90 212 485 75 70',
    'address', 'Ikitelli OSB Mah. Mutsan Sanayi Sitesi M1 Blok No: 20/22/24 Basaksehir, Istanbul'
  ) AS `value`
  UNION ALL SELECT 'company_profile', JSON_OBJECT(
    'company_name', 'Promats Uretim',
    'legal_name', 'Promats Universal Paspaslar San. ve Tic. Ltd. Sti.',
    'slogan', 'Otomotiv paspas uretim ve planlama merkezi',
    'tax_office', 'Ikitelli',
    'tax_number', '1234567890',
    'mersis_number', '0123456789000001',
    'trade_registry_number', '987654',
    'phone', '+90 212 485 75 70',
    'email', 'admin@promats.com',
    'website', 'https://promats.com.tr',
    'address', 'Ikitelli OSB Mah. Mutsan Sanayi Sitesi M1 Blok No: 20/22/24 Basaksehir, Istanbul',
    'district', 'Basaksehir',
    'city', 'Istanbul',
    'postal_code', '34490',
    'production_address', 'Demirciler Sanayi Sitesi, Basaksehir / Istanbul',
    'shipment_contact_name', 'Sevkiyat Merkezi',
    'shipment_contact_phone', '+90 212 485 75 71',
    'finance_contact_name', 'Muhasebe Birimi',
    'finance_contact_email', 'muhasebe@promats.com',
    'about', 'Promats, otomotiv paspas uretimi, siparis planlama ve sevkiyat operasyonlarini tek merkezden yoneten uretim sirketidir.'
  )
) AS src;

-- =============================================================
-- SOCIAL MEDIA
-- =============================================================
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`)
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
  SELECT 'socials' AS `key`, '{"instagram":"https://www.instagram.com/promats2017","facebook":"https://www.facebook.com/promats.otopaspas.9"}' AS `value`
  UNION ALL SELECT 'social_facebook_url', '"https://www.facebook.com/promats.otopaspas.9"'
  UNION ALL SELECT 'social_instagram_url', '"https://www.instagram.com/promats2017"'
) AS src;

-- =============================================================
-- STORAGE / UPLOAD CONFIG
-- =============================================================
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`)
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
  SELECT 'storage_driver' AS `key`, '"local"' AS `value`
  UNION ALL SELECT 'storage_local_root', '"/uploads"'
  UNION ALL SELECT 'storage_local_base_url', '"/uploads"'
) AS src;

-- =============================================================
-- SMTP / MAIL CONFIG
-- =============================================================
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`)
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
  SELECT 'smtp_host' AS `key`, '"smtp.example.com"' AS `value`
  UNION ALL SELECT 'smtp_port', '587'
  UNION ALL SELECT 'smtp_username', '"info@promats.com.tr"'
  UNION ALL SELECT 'smtp_password', '"__SET_IN_ENV__"'
  UNION ALL SELECT 'smtp_from_email', '"info@promats.com.tr"'
  UNION ALL SELECT 'smtp_from_name', '"Promats ERP"'
  UNION ALL SELECT 'smtp_ssl', 'false'
) AS src;

-- =============================================================
-- ADMIN UI CONFIG
-- =============================================================
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`)
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
    '{
      "default_locale":"tr",
      "theme":{"mode":"light","preset":"soft-pop","font":"inter"},
      "layout":{"sidebar_variant":"inset","sidebar_collapsible":"icon","navbar_style":"sticky","content_layout":"full-width"},
      "branding":{
        "app_name":"Promats Üretim ERP",
        "app_copyright":"Promats Universal Paspaslar",
        "html_lang":"tr",
        "theme_color":"#1B4332"
      }
    }' AS `value`
) AS src;
