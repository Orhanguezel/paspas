-- Promats kaynak sayfalari icin 200+ kelimelik, kaynak-guvenli tamamlayici metin (2026-11-11).
SET NAMES utf8mb4;

UPDATE web_promats_articles
SET content = CONCAT(content, '<h2>Doğrulama ve seri bazlı bilgi</h2><p>Genel üretim ilkeleri, farklı ürün serilerinin tüm ayrıntılarını tek başına açıklamaz. Ürün adı, yüzey formu, set içeriği ve güncel kullanım bilgisi ilgili seri kaydı üzerinden birlikte kontrol edilmelidir. Ticari teklif, araç uyumu veya özel üretim değerlendirmesinde ise güncel talep koşulları Promats ekibiyle ayrıca teyit edilir. Böylece genel teknik içerik ile ürüne özgü karar birbirine karıştırılmaz.</p>')
WHERE language_id = 1
  AND slug IN ('araca-ozel-paspas-uretiminde-kalip-hassasiyeti', 'pvc-oto-paspasta-dayaniklilik-kriterleri')
  AND content NOT LIKE '%Doğrulama ve seri bazlı bilgi%';

UPDATE web_promats_articles
SET content = CONCAT(content, '<h2>Verification and series-specific information</h2><p>General manufacturing principles do not replace the details of an individual product series. Product name, surface form, set contents and current application information should be checked together in the relevant series record. Quotations, vehicle-fit discussions and custom-manufacturing assessments are confirmed separately with the Promats team under the current request conditions. This keeps general technical guidance distinct from a product-specific decision.</p>')
WHERE language_id = 2
  AND slug IN ('mold-accuracy-tailor-made-automotive-mats', 'durability-criteria-pvc-car-mats')
  AND content NOT LIKE '%Verification and series-specific information%';

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.guide.paragraphs', JSON_ARRAY_APPEND(
        JSON_EXTRACT(CAST(value AS JSON), '$.guide.paragraphs'),
        '$',
        'Kaynak yazıları, ürün seçimi veya teklif sürecinde kullanılabilecek soruları netleştirmeyi amaçlar. Malzeme, yüzey, set içeriği ve bakım bilgileri ilgili seri kaydıyla birlikte okunur; kesin ürün kapsamı ve ticari koşullar güncel talep üzerinden ayrıca doğrulanır.'
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE site_settings.key = 'web.promats.frontend.page_content.resources.locale.tr'
  AND JSON_TYPE(JSON_EXTRACT(CAST(value AS JSON), '$.guide.paragraphs')) = 'ARRAY'
  AND JSON_SEARCH(CAST(value AS JSON), 'one', 'Kaynak yazıları, ürün seçimi veya teklif sürecinde kullanılabilecek soruları netleştirmeyi amaçlar.%') IS NULL;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.guide.paragraphs', JSON_ARRAY_APPEND(
        JSON_EXTRACT(CAST(value AS JSON), '$.guide.paragraphs'),
        '$',
        'The resource articles are designed to clarify the questions used during product selection or quotation review. Material, surface, set contents and care information should be read with the current series record; exact product scope and commercial conditions are confirmed separately for the active request.'
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE site_settings.key = 'web.promats.frontend.page_content.resources.locale.en'
  AND JSON_TYPE(JSON_EXTRACT(CAST(value AS JSON), '$.guide.paragraphs')) = 'ARRAY'
  AND JSON_SEARCH(CAST(value AS JSON), 'one', 'The resource articles are designed to clarify the questions used during product selection or quotation review.%') IS NULL;
