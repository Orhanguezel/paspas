-- Promats Google olcum ayarlari (2026-11-10).
-- GTM-K6XBW5WK yayindaki G-RF7H08PL6W etiketini icerir.
-- Bos GTM-5L84JNXC kapsayicisi bilerek eklenmez; cift yukleme yapilmaz.
SET NAMES utf8mb4;

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`)
VALUES
  (UUID(), 'web.promats.frontend.ga4_measurement_id', 'G-RF7H08PL6W', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'web.promats.frontend.ga4_property_id', '563587381', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'web.promats.frontend.gtm_container_id', 'GTM-K6XBW5WK', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `updated_at` = CURRENT_TIMESTAMP(3);
