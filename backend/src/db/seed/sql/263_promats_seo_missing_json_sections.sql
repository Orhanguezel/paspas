-- Promats SEO sayfa kayitlarinda bulunmayan JSON bolumlerini olusturur (2026-11-11).
-- JSON_SET ic ice yolun ebeveyni yoksa yeni nesneyi olusturmadigi icin 261/262 tamamlayicisidir.
SET NAMES utf8mb4;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.contact', JSON_OBJECT(
        'title', 'Contact Promats for Product, Quote and OEM Requests',
        'description', 'Contact Promats for PVC automotive mat product information, wholesale quotations, distributor support and OEM manufacturing requests.',
        'no_index', false,
        'og_image', ''
      ),
      '$.resources', JSON_OBJECT(
        'title', 'PVC Automotive Mat Technical Resources | Promats',
        'description', 'Read Promats production notes on PVC material quality, mould accuracy, durability and automotive mat manufacturing.',
        'no_index', false,
        'og_image', ''
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE site_settings.key = 'web.promats.frontend.seo_pages.locale.en'
  AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.contact', JSON_OBJECT(
        'title', 'Promats İletişim, Teklif ve OEM Üretim Talepleri',
        'description', 'PVC oto paspas ürün bilgisi, toptan teklif, distribütörlük desteği ve OEM üretim talepleri için Promats ile iletişime geçin.',
        'no_index', false,
        'og_image', ''
      ),
      '$.resources', JSON_OBJECT(
        'title', 'PVC Oto Paspas Teknik Kaynakları | Promats',
        'description', 'PVC malzeme kalitesi, kalıp hassasiyeti, dayanıklılık ve oto paspas üretimi hakkında Promats teknik notlarını okuyun.',
        'no_index', false,
        'og_image', ''
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE site_settings.key = 'web.promats.frontend.seo_pages.locale.tr'
  AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.guide', JSON_OBJECT(
        'heading', 'How we prepare technical resources',
        'paragraphs', JSON_ARRAY(
          'Promats Resources explains PVC material, moulding, surface design, maintenance and manufacturing topics in more detail than a product listing. These articles provide a general technical framework and do not replace series-specific specifications.',
          'Use the current product record and confirmation from the Promats team when deciding on dimensions, application or commercial suitability. The resources do not introduce unverified certification, warranty, compatibility or performance claims.'
        )
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE site_settings.key = 'web.promats.frontend.page_content.resources.locale.en'
  AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.guide', JSON_OBJECT(
        'heading', 'Teknik içerikleri nasıl hazırlıyoruz?',
        'paragraphs', JSON_ARRAY(
          'Promats Kaynaklar bölümü; PVC malzeme, kalıp, yüzey, bakım ve üretim süreci gibi konuları ürün sayfalarından daha ayrıntılı açıklamak için hazırlanır. İçerikler genel teknik çerçeve sunar; seri bazındaki kesin özelliklerin yerine geçmez.',
          'Bir ürünün ölçüsü, kullanım alanı veya ticari uygunluğu hakkında karar verirken güncel ürün kaydı ve Promats ekibinin teyidi esas alınmalıdır. Kaynak yazılarında doğrulanmamış sertifika, garanti, uyumluluk veya performans iddiası kullanılmaz.'
        )
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE site_settings.key = 'web.promats.frontend.page_content.resources.locale.tr'
  AND JSON_VALID(value) = 1;
