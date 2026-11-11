-- Promats source-backed resource depth and editorial context (2026-11-11).
SET NAMES utf8mb4;

UPDATE web_promats_articles
SET content = '<p>Promats üretim yaklaşımı, ürün ölçülerinin ve kalıp formunun kontrollü biçimde değerlendirilmesine dayanır. Kalıp hassasiyeti yalnız görünümü değil, paspasın zemine yerleşmesini ve kenar çizgisinin tutarlılığını da etkiler.</p><h2>Ölçü ve kalıp neden birlikte değerlendirilir?</h2><p>Üretim öncesinde hedef formun, kenar geçişlerinin ve yüzey deseninin aynı bütün içinde ele alınması gerekir. Bir ölçünün tek başına doğru olması yeterli değildir; kalıp boyunca oluşan geçişlerin de tekrar edilebilir olması beklenir. Kontrollü kalıp süreci, farklı üretim partilerinde aynı ürün formunun korunmasına yardımcı olur.</p><h2>Üretim kontrolünde nelere bakılır?</h2><p>Görsel bütünlük, kenar formu, yüzeydeki desen devamlılığı ve ürünün tanımlı ölçüleri birlikte incelenir. Bu kontroller, ürünün araç içinde düzenli görünmesini ve kullanım sırasında beklenen formunu korumasını destekler.</p><p>Promats, ürün geliştirme ve kalıplama adımlarını kendi üretim sürecinin parçası olarak yönetir. Ürün serisine ait kesin ölçü ve kullanım bilgileri için ilgili ürün sayfası ile Promats teknik ekibinin güncel verileri esas alınmalıdır.</p>',
    meta_description = 'Araca özel paspas üretiminde ölçü, kenar formu, yüzey deseni ve kontrollü kalıp süreçlerinin ürün uyumuna etkisini inceleyin.'
WHERE language_id = 1 AND slug = 'araca-ozel-paspas-uretiminde-kalip-hassasiyeti';

UPDATE web_promats_articles
SET content = '<p>PVC oto paspaslarda dayanıklılık yalnız malzeme kalınlığıyla açıklanmaz. Yüzey dokusu, kenar formu, üretim tutarlılığı ve temizlenebilirlik birlikte değerlendirilmelidir.</p><h2>Yüzey dokusu ve kullanım</h2><p>Yüzey deseni ürünün görünümünü belirlerken kir ve sıvının yüzeyde nasıl tutulduğunu da etkiler. Desenin düzenli üretilmesi, aynı seride görsel ve işlevsel tutarlılık sağlar. Kullanım koşulları değiştiği için dayanıklılık değerlendirmesi ürünün amaçlanan kullanım alanıyla birlikte yapılmalıdır.</p><h2>Kenar formu ve üretim standardı</h2><p>Kenarların dengeli biçimde oluşması, paspasın formunu korumasına yardımcı olur. Üretim standardı ise farklı partilerde ölçü, yüzey ve renk özelliklerinin tutarlı kalmasını hedefler. Bu nedenle yalnız tek bir özelliğe bakarak ürün ömrü hakkında kesin sonuç çıkarmak doğru değildir.</p><h2>Temizlik ve bakım</h2><p>Düzenli temizlik, yüzeyde biriken malzemenin uzaklaştırılmasını ve ürünün daha kolay kontrol edilmesini sağlar. Temizlik yöntemi için ürün serisine ait güncel bakım bilgileri izlenmelidir. Promats ürün sayfaları seri özelliklerini açıklar; özel teknik veya ticari sorular Promats ekibine iletilebilir.</p>',
    meta_description = 'PVC oto paspaslarda yüzey dokusu, kenar formu, üretim tutarlılığı, temizlik ve bakımın dayanıklılıkla ilişkisini inceleyin.'
WHERE language_id = 1 AND slug = 'pvc-oto-paspasta-dayaniklilik-kriterleri';

UPDATE web_promats_articles
SET content = '<p>Promats organises product measurement and mould-form checks as connected parts of its manufacturing process. Mould accuracy affects not only appearance, but also how consistently the mat shape and edge line can be reproduced.</p><h2>Why measurement and mould form belong together</h2><p>A target dimension alone does not define a finished mat. Edge transitions, surface pattern and the overall mould geometry must be reviewed as one system. A controlled mould process helps preserve the intended product form across production batches.</p><h2>What is checked during production?</h2><p>Visual consistency, edge shape, surface-pattern continuity and the defined product dimensions are considered together. These checks support an orderly in-car appearance and help the finished product retain the form intended for its series.</p><p>Promats manages product development and moulding within its manufacturing workflow. Exact dimensions, fit statements and application limits must always be taken from the current product record or confirmed with the Promats technical team; a general production article does not replace series-specific data.</p>',
    meta_description = 'Learn how measurement, edge form, surface pattern and controlled mould processes support consistent automotive mat production.'
WHERE language_id = 2 AND slug = 'mold-accuracy-tailor-made-automotive-mats';

UPDATE web_promats_articles
SET content = '<p>Durability in PVC automotive mats cannot be judged from material thickness alone. Surface texture, edge form, manufacturing consistency and ease of cleaning should be considered together.</p><h2>Surface texture in daily use</h2><p>The surface pattern shapes the product appearance and influences how dirt or liquid is retained on the mat. Consistent pattern production supports a uniform result within the same series. Because operating conditions differ, durability should be evaluated in relation to the intended use.</p><h2>Edge form and manufacturing consistency</h2><p>Balanced edge formation helps the mat retain its intended shape. A controlled production standard also aims to keep dimensions, surface and colour characteristics consistent between batches. No single feature should therefore be used as a complete prediction of service life.</p><h2>Cleaning and maintenance</h2><p>Regular cleaning removes accumulated material and makes the surface easier to inspect. Follow the current care information for the relevant series. Promats product pages describe series features, while technical or commercial questions can be confirmed directly with the Promats team.</p>',
    meta_description = 'Review how surface texture, edge form, manufacturing consistency, cleaning and maintenance relate to PVC car mat durability.'
WHERE language_id = 2 AND slug = 'durability-criteria-pvc-car-mats';

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.guide.heading', 'Teknik içerikleri nasıl hazırlıyoruz?',
      '$.guide.paragraphs', JSON_ARRAY(
        'Promats Kaynaklar bölümü; PVC malzeme, kalıp, yüzey, bakım ve üretim süreci gibi konuları ürün sayfalarından daha ayrıntılı açıklamak için hazırlanır. İçerikler genel teknik çerçeve sunar; seri bazındaki kesin özelliklerin yerine geçmez.',
        'Bir ürünün ölçüsü, kullanım alanı veya ticari uygunluğu hakkında karar verirken güncel ürün kaydı ve Promats ekibinin teyidi esas alınmalıdır. Kaynak yazılarında doğrulanmamış sertifika, garanti, uyumluluk veya performans iddiası kullanılmaz.'
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE `key` = 'web.promats.frontend.page_content.resources.locale.tr' AND JSON_VALID(value) = 1;

UPDATE site_settings
SET value = JSON_SET(
      CAST(value AS JSON),
      '$.guide.heading', 'How we prepare technical resources',
      '$.guide.paragraphs', JSON_ARRAY(
        'The Promats Resources section explains PVC material, moulding, surface, maintenance and manufacturing topics in more detail than a product listing. The articles provide a general technical framework and do not replace series-specific specifications.',
        'When deciding on dimensions, application or commercial suitability, use the current product record and confirmation from the Promats team. The resource articles do not add unverified certification, warranty, compatibility or performance claims.'
      )
    ),
    updated_at = CURRENT_TIMESTAMP(3)
WHERE `key` = 'web.promats.frontend.page_content.resources.locale.en' AND JSON_VALID(value) = 1;
