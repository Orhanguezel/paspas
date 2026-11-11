-- Promats public GEO crawler and llms source cleanup (2026-11-11).
-- Existing editorial facts are preserved; only stale route/source fields change.
SET NAMES utf8mb4;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.approved_sources', 'https://promats.com.tr/tr\nhttps://promats.com.tr/en',
      '$.crawler_disallow', '/api/\n/admin/\n/me/',
      '$.llms_sections', '## Key Pages\n- Products: https://promats.com.tr/en/products\n- Manufacturing: https://promats.com.tr/en/production\n- OEM manufacturing: https://promats.com.tr/en/oem-manufacturing\n- Resources: https://promats.com.tr/en/resources\n- Contact: https://promats.com.tr/en/contact'
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE `key` IN (
  'web.promats.frontend.geo_seo.locale.tr',
  'web.promats.frontend.geo_seo.locale.en'
)
  AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.home.title', 'PVC Car Mat Manufacturer and Exporter | Promats',
      '$.home.description', 'Promats manufactures durable PVC automotive mat systems for distributors, wholesale buyers and OEM or private-label programs.',
      '$.products.title', 'PVC Automotive Mat Series and Models | Promats',
      '$.products.description', 'Compare Promats PVC automotive mat series by design, surface, fit and production features for wholesale and OEM sourcing.',
      '$.production.title', 'PVC Automotive Mat Manufacturing Process | Promats',
      '$.production.description', 'Review Promats product development, PVC compound preparation, moulding, quality-control and export manufacturing stages.',
      '$.contact.title', 'Contact Promats for Product, Quote and OEM Requests',
      '$.contact.description', 'Contact Promats for PVC automotive mat product information, wholesale quotations, distributor support and OEM manufacturing requests.',
      '$.resources.title', 'PVC Automotive Mat Technical Resources | Promats',
      '$.resources.description', 'Read Promats production notes on PVC material quality, mould accuracy, durability and automotive mat manufacturing.'
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE `key` = 'web.promats.frontend.seo_pages.locale.en'
  AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.home.title', 'PVC Oto Paspas Üreticisi ve İhracatçısı | Promats',
      '$.home.description', 'Promats; distribütörler, toptan alıcılar ve OEM veya private label programları için dayanıklı PVC oto paspas sistemleri üretir.',
      '$.products.title', 'PVC Oto Paspas Serileri ve Modelleri | Promats',
      '$.products.description', 'Promats PVC oto paspas serilerini tasarım, yüzey, kullanım ve üretim özellikleriyle karşılaştırın.',
      '$.production.title', 'PVC Oto Paspas Üretimi ve Kalite Süreci | Promats',
      '$.production.description', 'Promats ürün geliştirme, PVC compound hazırlama, kalıplama, kalite kontrol ve ihracat üretim aşamalarını inceleyin.',
      '$.contact.title', 'Promats İletişim, Teklif ve OEM Üretim Talepleri',
      '$.contact.description', 'PVC oto paspas ürün bilgisi, toptan teklif, distribütörlük desteği ve OEM üretim talepleri için Promats ile iletişime geçin.',
      '$.resources.title', 'PVC Oto Paspas Teknik Kaynakları | Promats',
      '$.resources.description', 'PVC malzeme kalitesi, kalıp hassasiyeti, dayanıklılık ve oto paspas üretimi hakkında Promats teknik notlarını okuyun.'
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE `key` = 'web.promats.frontend.seo_pages.locale.tr'
  AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.meta.title', 'About Promats: PVC Automotive Mat Manufacturer'
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE `key` = 'web.promats.frontend.page_content.hakkimizda.locale.en'
  AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.meta.title', 'Promats Hakkında: PVC Oto Paspas Üreticisi'
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE `key` = 'web.promats.frontend.page_content.hakkimizda.locale.tr'
  AND JSON_VALID(value) = 1;
