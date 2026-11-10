#!/usr/bin/env python3
"""Promats web içerik revizesi — 2026-08-27.

Kaynak: "Promats_Web içerkleri (2).xlsx" (müşteri revizesi) + kullanıcı kararları:
  - İhracat ülke sayısı HER YERDE 35+ (Excel'in bazı satırlarındaki 25+ yerine).
  - Tüm içerikler TR ve EN olarak birlikte güncellenir.

Bu script canlı promats_erp veritabanına uygulanacak SQL'i ÜRETİR (stdout).
Uygulama: python3 scripts/web-icerik-guncelleme-20260827.py > /tmp/web-icerik.sql
          mysql -u app -p... promats_erp --default-character-set=utf8mb4 < /tmp/web-icerik.sql

Dokunduğu yerler:
  web_promats_special_pages  : banner 2-4 (TR 21/23/25, EN 22/24/26), NEDEN PROMATS (TR 4, EN 5),
                               Anasayfa İhracat (TR 9)
  web_promats_static_texts   : TR 27 başlık düzeltmesi + anasayfa "Ürünler" giriş metni (TR/EN, yeni satır)
  web_promats_products       : rozet kısaltmaları (s2_3_text) — "4D KONSEPT", "OEM KALİTE",
                               "FONKSİYONEL TASARIM", "FONKSİYONEL KENAR" (Excel R21-R25)
  site_settings              : page_content.products / page_content.production (TR+EN JSON)
"""

import json

# ---------------------------------------------------------------------------
# yardımcılar
# ---------------------------------------------------------------------------

def q(value: str) -> str:
    """MySQL string literal (backslash + tek tırnak kaçışı)."""
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


STATEMENTS: list[str] = [
    "-- Promats web içerik revizesi 2026-08-27 (Excel + 35+ kararı, TR/EN)",
    "SET NAMES utf8mb4;",
]


def update_special_page(page_id: int, detail: str) -> None:
    STATEMENTS.append(
        f"UPDATE web_promats_special_pages SET detail={q(detail)} WHERE id={page_id};"
    )


# ---------------------------------------------------------------------------
# 1) ANASAYFA — hero slider 2/3/4 (Excel R3-R5; slider 1 değişmiyor)
# ---------------------------------------------------------------------------

BTN_IMG = '<img alt="" class="btn-border" src="/assets/images/bnr-border.png">'


def banner(lines: tuple[str, str], text: str, href: str, cta: str) -> str:
    return (
        f'<h1 class="hero-heading">{lines[0]}</h1>'
        f'<h1 class="hero-heading">{lines[1]}</h1>'
        f'<div class="sub-text"><p>{text}</p>{BTN_IMG}'
        f'<a class="btn btn-yellow" href="{href}">{cta}</a></div>'
    )


update_special_page(21, banner(
    ("MODERN TASARIM,", "GÜNLÜK KONFOR"),
    "Kaymaz yüzey, yükseltilmiş kenarlar ve şık desen seçenekleriyle Promats oto paspasları "
    "aracınızın iç mekanını korurken estetik görünümünü de tamamlar.",
    "/tr/urunler", "Serileri İncele"))

update_special_page(23, banner(
    ("ÜRETİMDEN", "GÜVEN DOĞAR"),
    "Promats ürünleri, deneyimli ekibimiz ve modern üretim altyapımız ile kalite kontrol "
    "süreçlerinden geçirilerek üretilmektedir. Her ürün uzun ömürlü kullanım için tasarlanır.",
    "/tr/uretim", "Üretimimizi Keşfedin"))

update_special_page(25, banner(
    ("ZORLU KOŞULLAR", "İÇİN TASARLANDI"),
    "Çamur, su, kar ve günlük kullanıma karşı dayanıklı yapısıyla Promats PVC oto paspasları "
    "aracınızın zeminini her mevsim korumaya yardımcı olur.",
    "/tr/urunler#ozellikler", "Ürün Özellikleri"))

update_special_page(22, banner(
    ("MODERN DESIGN,", "EVERYDAY COMFORT"),
    "With an anti-slip surface, raised edges and stylish pattern options, Promats car mats "
    "protect your vehicle&#39;s interior while completing its look.",
    "/en/products", "Explore The Series"))

update_special_page(24, banner(
    ("TRUST COMES", "FROM PRODUCTION"),
    "Promats products are manufactured by our experienced team on modern production "
    "infrastructure and pass quality control at every stage. Every product is designed "
    "for long-lasting use.",
    "/en/production", "Discover Our Production"))

update_special_page(26, banner(
    ("DESIGNED FOR", "TOUGH CONDITIONS"),
    "Durable against mud, water, snow and daily use, Promats PVC car mats help protect "
    "your vehicle&#39;s floor in every season.",
    "/en/products#ozellikler", "Product Features"))

# ---------------------------------------------------------------------------
# 2) ANASAYFA — NEDEN PROMATS (R8 kontrast düzeltmesi: <span> yapısı; R10-R12 rozetler; 35+)
# ---------------------------------------------------------------------------

ICON_BAR_TR = (
    '<div class="neden_promat_iconbg">'
    '<div class="icon"><img alt="" src="/assets/images/icon/neden-uretim-2017.svg">'
    "<span>2017'den Beri Üretim</span></div>"
    '<div class="icon"><img alt="" src="/assets/images/icon/neden-uretim-tesis.svg">'
    "<span>Modern Üretim Altyapısı</span></div>"
    '<div class="icon"><img alt="" src="/assets/images/icon/neden-ihracat-dunya.svg">'
    "<span>35+ Ülkeye İhracat</span></div></div>"
)

ICON_BAR_EN = (
    '<div class="neden_promat_iconbg">'
    '<div class="icon"><img alt="" src="/assets/images/icon/neden-uretim-2017.svg">'
    "<span>Manufacturing Since 2017</span></div>"
    '<div class="icon"><img alt="" src="/assets/images/icon/neden-uretim-tesis.svg">'
    "<span>Modern Production Infrastructure</span></div>"
    '<div class="icon"><img alt="" src="/assets/images/icon/neden-ihracat-dunya.svg">'
    "<span>Exporting To 35+ Countries</span></div></div>"
)

update_special_page(4, (
    '<div class="neden_promat"><h2>NEDEN PROMATS?</h2><span>'
    "Promats, 2017 yılından bu yana PVC universal oto paspas üretimi yapan bir Türk "
    "üreticisidir. Modern üretim altyapımız, deneyimli ekibimiz ve kalite odaklı "
    "yaklaşımımız sayesinde hem yurt içi hem de uluslararası pazarlarda güvenilir bir "
    "iş ortağı olarak faaliyet gösteriyoruz.<br><br>"
    "Promats ürünleri bugün Türkiye genelindeki satış ağının yanı sıra 35'ten fazla "
    "ülkeye ulaşıyor. Üretim süreçlerimizi sürdürülebilir kalite anlayışıyla yönetiyor, "
    "uzun vadeli iş ortaklıkları kurmayı hedefliyoruz."
    "</span></div>" + ICON_BAR_TR
))

update_special_page(5, (
    '<div class="neden_promat"><h2>WHY PROMATS?</h2><span>'
    "Promats is a Turkish manufacturer producing universal PVC car mats since 2017. "
    "With our modern production infrastructure, experienced team and quality-focused "
    "approach, we operate as a reliable business partner in both domestic and "
    "international markets.<br><br>"
    "Today, Promats products reach more than 35 countries alongside a nationwide sales "
    "network in Türkiye. We manage our production processes with a sustainable approach "
    "to quality and aim to build long-term partnerships."
    "</span></div>" + ICON_BAR_EN
))

# ANASAYFA — İhracat bandı (TR 9): "iHRACAT" yazımı + ABD düzeltmesi (35 zaten doğru)
update_special_page(9, (
    "<h4>35'TEN FAZLA ÜLKEYE İHRACAT</h4>"
    "<span><em>Rusya</em> <em>Almanya</em> <em>ABD</em> <em>Irak</em> <em>Mısır</em> "
    "<em>Belarus</em> <em>Bolivya</em> <em>Bulgaristan</em></span>"
))

# ---------------------------------------------------------------------------
# 3) static_texts — TR 27 başlık düzeltmesi + "Ürünler" giriş metni (R7)
# ---------------------------------------------------------------------------

STATEMENTS.append(
    "UPDATE web_promats_static_texts SET title="
    + q("35'TEN FAZLA ÜLKEYE İHRACAT")
    + " WHERE id=27 AND language_id=1;"
)

URUNLER_INTRO_TR = (
    "Promats, farklı kullanım ihtiyaçlarına uygun PVC oto paspas serileri geliştirmektedir. "
    "Her seri; tasarım, yüzey yapısı ve kullanım özellikleri açısından farklı beklentilere "
    "hitap edecek şekilde tasarlanmıştır."
)
URUNLER_INTRO_EN = (
    "Promats develops universal PVC car mat series for different usage needs. Each series "
    "is designed to meet different expectations in terms of design, surface structure and "
    "usage characteristics."
)

# Anahtar = TR metin (frontend t() sözleşmesi). Aynı anahtar iki dilde de original_text olur.
for text_id, lang, title in ((2001, 1, URUNLER_INTRO_TR), (2002, 2, URUNLER_INTRO_EN)):
    STATEMENTS.append(
        "INSERT INTO web_promats_static_texts "
        "(id, language_id, source_language_id, original_text, title, status, created_at) VALUES "
        f"({text_id}, {lang}, 0, {q(URUNLER_INTRO_TR)}, {q(title)}, 0, NOW()) "
        f"ON DUPLICATE KEY UPDATE original_text={q(URUNLER_INTRO_TR)}, title={q(title)};"
    )

# ---------------------------------------------------------------------------
# 4) Ürün rozetleri (R21-R25): kısa etiketler; R24 "FONKSİYONEL KENAR" (bitişik iki kart
#    aynı rozeti taşımasın diye — Excel'de ikisi de "FONKSİYONEL TASARIM" yazılmıştı)
# ---------------------------------------------------------------------------

BADGE_MAP = [
    (1, "3D Konsept Derin Havuz", "3D Konsept"),
    (1, "4D Konsept Derin Havuz", "4D Konsept"),
    (1, "OEM Kalite ve Universal Uyum", "OEM Kalite"),
    (1, "Universal Uyum ve Fonksiyonel Tasarım", "Fonksiyonel Tasarım"),
    (1, "Fonksiyonel Kenar Tasarımı", "Fonksiyonel Kenar"),
    (2, "UNIVERSAL FIT AND FUNCTIONAL DESIGN", "FUNCTIONAL DESIGN"),
    (2, "FUNCTIONAL EDGE DESIGN", "FUNCTIONAL EDGE"),
]
for lang, old, new in BADGE_MAP:
    STATEMENTS.append(
        f"UPDATE web_promats_products SET s2_3_text={q(new)} "
        f"WHERE language_id={lang} AND s2_3_text={q(old)};"
    )

# ---------------------------------------------------------------------------
# 5) site_settings — Ürünler sayfası JSON (R14-R29)
# ---------------------------------------------------------------------------

PRODUCTS_TR = {
    "meta": {
        "title": "Ürünler",
        "description": "Promats universal PVC oto paspas serileri: farklı tasarım, derinlik "
                       "ve yüzey desenleri, OEM kalite yüzey ve üç renk seçeneği.",
    },
    "hero": {
        "eyebrow": "Promats Ürün Serileri",
        "headline": ["Universal PVC", "Oto Paspas Serileri"],
        "text": "Promats ürün ailesi; farklı tasarım, derinlik ve yüzey desenlerine sahip "
                "universal PVC oto paspas serilerinden oluşur. Maximum, Professional ve Icon "
                "gibi farklı seriler, estetik görünüm, dayanıklılık ve kullanım ihtiyaçlarına "
                "göre geliştirilmiştir.",
    },
    "stats": [
        {"value": "8+", "label": "Ürün Serisi"},
        {"value": "3D–5D", "label": "Havuz Konsepti"},
        {"value": "3", "label": "Renk Seçeneği"},
        {"value": "Universal", "label": "Fit"},
    ],
    "list": {
        "titleLine1": "Ürün",
        "titleLine2": "Serilerimiz",
        "intro": "Promats ürün serileri; farklı tasarım, derinlik ve yüzey desenlerine sahip "
                 "üniversal PVC oto paspas çözümlerinden oluşur. Her seri farklı kullanım "
                 "beklentilerine hitap ederken aynı kalite anlayışıyla üretilmektedir.",
        "cta": "İncele",
        "colorsLabel": "Renkler",
    },
    "features": {
        "titleLine1": "Serilerde",
        "titleLine2": "Ortak Özellikler",
        "intro": "Promats universal PVC oto paspas serilerinin tamamı; dayanıklılık, kullanım "
                 "kolaylığı ve uzun ömürlü performans sağlayan ortak kalite standartlarına göre "
                 "üretilmektedir. Seriler arasında tasarım farklılıkları bulunsa da aşağıdaki "
                 "özellikler tüm ürün ailesinde ortak olarak sunulur.",
    },
    "contact": {
        "title": "Ürünlerimiz Hakkında Bilgi Alın",
        "text": "Promats ürün serileri hakkında detaylı bilgi almak, size uygun ürünü belirlemek "
                "veya fiyat teklifi talep etmek için bizimle iletişime geçebilirsiniz. Ekibimiz "
                "en kısa sürede size dönüş sağlayacaktır.",
        "name": "İsim, Soyisim",
        "email": "E-Mail",
        "phone": "Telefon",
        "message": "Hangi seri ve araç modeli ile ilgileniyorsunuz?",
        "submit": "Gönder",
        "success": "Mesajınız alındı, en kısa sürede size dönüş yapacağız.",
        "error": "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
    },
}

PRODUCTS_EN = {
    "meta": {
        "title": "Products",
        "description": "Promats universal PVC car mat series: different designs, tray depths "
                       "and surface patterns with OEM-quality surfaces and three colour options.",
    },
    "hero": {
        "eyebrow": "Promats Product Series",
        "headline": ["Universal PVC", "Car Mat Series"],
        "text": "The Promats product family consists of universal PVC car mat series with "
                "different designs, depths and surface patterns. Series such as Maximum, "
                "Professional and Icon are developed for aesthetics, durability and different "
                "usage needs.",
    },
    "stats": [
        {"value": "8+", "label": "Product Series"},
        {"value": "3D–5D", "label": "Tray Concept"},
        {"value": "3", "label": "Colour Options"},
        {"value": "Universal", "label": "Fit"},
    ],
    "list": {
        "titleLine1": "Our Product",
        "titleLine2": "Series",
        "intro": "Promats product series consist of universal PVC car mat solutions with "
                 "different designs, depths and surface patterns. Each series addresses "
                 "different usage expectations while being produced with the same "
                 "understanding of quality.",
        "cta": "View",
        "colorsLabel": "Colours",
    },
    "features": {
        "titleLine1": "Shared Across",
        "titleLine2": "The Range",
        "intro": "All Promats universal PVC car mat series are produced to shared quality "
                 "standards that ensure durability, ease of use and long-lasting performance. "
                 "While designs differ between series, the features below are common to the "
                 "entire product family.",
    },
    "contact": {
        "title": "Learn More About Our Products",
        "text": "To get detailed information about Promats product series, find the right "
                "product for your needs or request a quote, please contact us. Our team will "
                "get back to you as soon as possible.",
        "name": "Full Name",
        "email": "E-Mail",
        "phone": "Phone",
        "message": "Which series and vehicle model are you interested in?",
        "submit": "Send",
        "success": "We have received your message and will get back to you shortly.",
        "error": "Your message could not be sent. Please try again later.",
    },
}

# ---------------------------------------------------------------------------
# 6) site_settings — Üretim sayfası JSON (R39-R85; hero başlık "Formülden Nihai Ürüne" kalır)
# ---------------------------------------------------------------------------

PRODUCTION_TR = {
    "meta": {
        "title": "Üretim",
        "description": "Promats üretim süreci: ürün ve malzeme geliştirmeden enjeksiyon "
                       "üretimine, kalıp mühendisliğinden kalite kontrole ve güvenli sevkiyata "
                       "kadar sistematik üretim zinciri.",
    },
    "hero": {
        "eyebrow": "Promats Üretim",
        "headline": ["Formülden", "Nihai Ürüne"],
        "text": "Promats, PVC compound geliştirmeden enjeksiyon üretimine, kalite kontrolden "
                "paketlemeye kadar tüm üretim süreçlerini planlı ve kontrollü bir yaklaşımla "
                "yönetmektedir. Modern üretim altyapımız, deneyimli ekibimiz ve kalite odaklı "
                "yaklaşımımız sayesinde her ürün, yüksek kalite standartlarına uygun olarak "
                "üretilmektedir.",
    },
    "stats": [
        {"value": "2017", "label": "Kuruluş Yılı"},
        {"value": "35+", "label": "İhracat Ülkesi"},
        {"value": "8+", "label": "Ürün Serisi"},
        {"value": "Modern", "label": "Üretim Altyapısı"},
    ],
    "galleryHeading": {
        "titleLine1": "Üretim",
        "titleLine2": "Tesisimiz",
        "intro": "Promats, ürün geliştirme, enjeksiyon üretimi, kalite kontrol ve paketleme "
                 "süreçlerini aynı çatı altında yönetmektedir. Üretim tesisimiz, sürdürülebilir "
                 "kalite anlayışını destekleyen modern ekipmanlar ve deneyimli ekibimizle "
                 "faaliyet göstermektedir.",
    },
    "gallery": [
        {
            "image": "/assets/images/uretim/tesis.jpg",
            "alt": "Promats enjeksiyon üretim hattı",
            "title": "Modern Üretim",
            "text": "PVC oto paspaslarımız, modern enjeksiyon makinelerinde kontrollü üretim "
                    "süreçlerinden geçirilerek üretilmektedir.",
        },
        {
            "image": "/assets/images/uretim/sunum.jpg",
            "alt": "Ürün geliştirme sunumu",
            "title": "Ürün Geliştirme",
            "text": "Yeni ürün tasarımları ve kalıp geliştirme çalışmaları, üretim öncesinde "
                    "dijital planlama ve mühendislik süreçleriyle desteklenmektedir.",
        },
        {
            "image": "/assets/images/uretim/bina.jpg",
            "alt": "Promats üretim tesisi",
            "title": "Üretim Tesisi",
            "text": "İstanbul'daki üretim tesisimizde ürün geliştirme, üretim, kalite kontrol "
                    "ve sevkiyat süreçleri entegre bir yapıda yürütülmektedir.",
        },
    ],
    "capabilities": {
        "titleLine1": "Üretim",
        "titleLine2": "Yetkinliklerimiz",
        "intro": "Promats, ürün geliştirmeden kalite kontrole kadar üretimin tüm aşamalarını "
                 "kendi bünyesinde yönetir. Aşağıdaki dört yetkinlik, üretim yaklaşımımızın "
                 "temelini oluşturur.",
        "items": [
            {"icon": "product", "label": ["Ürün", "Geliştirme"]},
            {"icon": "material", "label": ["Malzeme", "Geliştirme"]},
            {"icon": "injection", "label": ["Enjeksiyon", "Üretimi"]},
            {"icon": "quality", "label": ["Kalite", "Kontrol"]},
        ],
    },
    "sections": [
        {
            "title": ["Ürün", "Geliştirme"],
            "image": "/assets/images/uretim/urun-gelistirme.jpg",
            "alt": "Araç tabanı 3D tarama çalışması",
            "paragraphs": [
                "Her yeni ürün, araç içi ölçülerin analiz edilmesi ve kullanım ihtiyaçlarının "
                "değerlendirilmesiyle geliştirilir. Araç tabanı, pedal alanı ve iç hacim "
                "detaylı olarak incelenir; elde edilen veriler dijital tasarım süreçlerine "
                "aktarılır.",
                "Ürün geliştirme sürecimiz, estetik görünümün yanı sıra kullanım kolaylığı, "
                "dayanıklılık ve universal uyumluluk hedefleri doğrultusunda sürekli "
                "iyileştirilmektedir.",
            ],
            "items": [
                "Araç ölçüm ve analiz çalışmaları",
                "Dijital tasarım ve CAD modelleme",
                "Universal uyumluluk geliştirme",
                "Prototip testleri ve sürekli iyileştirme",
            ],
        },
        {
            "title": ["Malzeme", "Geliştirme"],
            "image": "/assets/images/uretim/malzeme-gelistirme.jpg",
            "alt": "PVC compound numuneleri ve granülleri",
            "paragraphs": [
                "PVC compound formülasyonu, ürünlerimizin performansını belirleyen temel "
                "unsurlardan biridir. Esneklik, dayanıklılık, yüzey kalitesi ve kullanım "
                "konforu gibi kriterler doğrultusunda malzeme yapısı sürekli değerlendirilir "
                "ve geliştirilir.",
                "Üretimde kullanılan hammaddeler belirlenen kalite standartlarına göre seçilir "
                "ve üretim sürecine dahil edilmeden önce kontrol edilir. Bu yaklaşım, ürün "
                "serileri arasında kalite ve performans sürekliliğini destekler.",
            ],
            "items": [
                "Esneklik ve form kararlılığı",
                "Dayanıklılık ve aşınma direnci",
                "Düşük kokulu PVC compound",
                "Sürekli kalite kontrolü",
            ],
        },
        {
            "title": ["Ürün Tasarımı ve", "Kalıp Mühendisliği"],
            "image": "/assets/images/uretim/kalip-muhendisligi.jpg",
            "alt": "CAD ortamında kalıp tasarımı",
            "paragraphs": [
                "Her ürün, dijital tasarım çalışmalarıyla başlar ve üretime uygun hale gelene "
                "kadar mühendislik süreçlerinden geçirilir. Araç ölçüleri, kullanım ihtiyaçları "
                "ve üretim kriterleri birlikte değerlendirilerek ürün tasarımı oluşturulur.",
                "Üretim öncesinde tasarım ve kalıp doğrulamaları gerçekleştirilir. Bu süreç, "
                "ürünün ölçüsel doğruluğunu, universal uyumluluğunu ve üretim sürekliliğini "
                "destekleyen önemli bir aşamadır.",
            ],
            "items": [],
        },
    ],
    "quality": {
        "title": "Kalite Kontrol",
        "image": "/assets/images/uretim/kalite-kontrol.jpg",
        "alt": "Kalite kontrol istasyonunda ürün incelemesi",
        "items": ["Çapak kontrolü", "Renk kontrolü", "Esneklik testi", "Koku kontrolü"],
        "text": "Üretim sürecinin farklı aşamalarında gerçekleştirilen kalite kontrolleri "
                "sayesinde ürünler görünüm, ölçü, yüzey kalitesi ve genel performans "
                "kriterleri açısından değerlendirilir. Uygunluk kontrollerini geçen ürünler "
                "paketleme ve sevkiyat sürecine alınır.",
    },
    "shipping": {
        "title": ["Güvenli", "Sevkiyat"],
        "image": "/assets/images/uretim/sevkiyat.jpg",
        "alt": "İhracat sevkiyatı için tır yüklemesi",
        "paragraphs": [
            "Promats ürünleri, kalite kontrolleri tamamlandıktan sonra uluslararası sevkiyat "
            "standartlarına uygun şekilde paketlenir ve yüklemeye hazırlanır.",
            "Bugün 35'ten fazla ülkeye gerçekleştirdiğimiz ihracat operasyonlarında güvenilir "
            "teslimat ve sürdürülebilir iş ortaklığı anlayışıyla çalışıyoruz.",
        ],
        "cta": "Teklif Al",
    },
    "contact": {
        "title": "Bize Ulaşın",
        "name": "İsim, Soyisim",
        "email": "E-Mail",
        "phone": "Telefon",
        "message": "Mesajınız...",
        "submit": "Gönder",
        "success": "Mesajınız alındı, en kısa sürede size dönüş yapacağız.",
        "error": "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
    },
}

PRODUCTION_EN = {
    "meta": {
        "title": "Production",
        "description": "The Promats production process: a systematic manufacturing chain from "
                       "product and material development to injection moulding, mould "
                       "engineering, quality control and secure shipping.",
    },
    "hero": {
        "eyebrow": "Promats Manufacturing",
        "headline": ["From Formula", "To Final Product."],
        "text": "From PVC compound development to injection moulding, from quality control to "
                "packaging, Promats manages all production processes with a planned and "
                "controlled approach. Thanks to our modern production infrastructure, "
                "experienced team and quality-focused mindset, every product is manufactured "
                "to high quality standards.",
    },
    "stats": [
        {"value": "2017", "label": "Founded"},
        {"value": "35+", "label": "Export Countries"},
        {"value": "8+", "label": "Product Series"},
        {"value": "Modern", "label": "Production Infrastructure"},
    ],
    "galleryHeading": {
        "titleLine1": "Our Production",
        "titleLine2": "Facility",
        "intro": "Promats manages product development, injection moulding, quality control and "
                 "packaging under one roof. Our production facility operates with modern "
                 "equipment and an experienced team supporting a sustainable approach to "
                 "quality.",
    },
    "gallery": [
        {
            "image": "/assets/images/uretim/tesis.jpg",
            "alt": "Promats injection moulding line",
            "title": "Modern Production",
            "text": "Our PVC car mats are manufactured on modern injection moulding machines "
                    "through controlled production processes.",
        },
        {
            "image": "/assets/images/uretim/sunum.jpg",
            "alt": "Product development review",
            "title": "Product Development",
            "text": "New product designs and mould development are supported by digital "
                    "planning and engineering processes ahead of production.",
        },
        {
            "image": "/assets/images/uretim/bina.jpg",
            "alt": "Promats production facility",
            "title": "Production Facility",
            "text": "At our facility in Istanbul, product development, production, quality "
                    "control and shipping processes run in an integrated structure.",
        },
    ],
    "capabilities": {
        "titleLine1": "Our Manufacturing",
        "titleLine2": "Capabilities",
        "intro": "Promats manages every stage of production in-house, from product development "
                 "through to quality control. The four capabilities below form the foundation "
                 "of our manufacturing approach.",
        "items": [
            {"icon": "product", "label": ["Product", "Development"]},
            {"icon": "material", "label": ["Material", "Development"]},
            {"icon": "injection", "label": ["Injection", "Moulding"]},
            {"icon": "quality", "label": ["Quality", "Control"]},
        ],
    },
    "sections": [
        {
            "title": ["Product", "Development"],
            "image": "/assets/images/uretim/urun-gelistirme.jpg",
            "alt": "3D scanning of a vehicle floor",
            "paragraphs": [
                "Every new product is developed by analysing in-vehicle measurements and "
                "evaluating usage needs. The vehicle floor, pedal area and interior volume "
                "are examined in detail, and the resulting data is transferred into our "
                "digital design process.",
                "Beyond aesthetics, our product development process is continuously improved "
                "towards ease of use, durability and universal fit.",
            ],
            "items": [
                "Vehicle measurement and analysis studies",
                "Digital design and CAD modelling",
                "Universal fit development",
                "Prototype testing and continuous improvement",
            ],
        },
        {
            "title": ["Material", "Development"],
            "image": "/assets/images/uretim/malzeme-gelistirme.jpg",
            "alt": "PVC compound samples and granules",
            "paragraphs": [
                "The PVC compound formulation is one of the key factors defining the "
                "performance of our products. The material structure is continuously "
                "evaluated and improved against criteria such as flexibility, durability, "
                "surface quality and comfort of use.",
                "Raw materials used in production are selected to defined quality standards "
                "and checked before entering the production process. This approach supports "
                "consistent quality and performance across product series.",
            ],
            "items": [
                "Flexibility and shape stability",
                "Durability and abrasion resistance",
                "Low-odour PVC compound",
                "Continuous quality control",
            ],
        },
        {
            "title": ["Product Design &", "Mould Engineering"],
            "image": "/assets/images/uretim/kalip-muhendisligi.jpg",
            "alt": "Mould design in CAD",
            "paragraphs": [
                "Every product starts with digital design work and goes through engineering "
                "processes until it is ready for production. Vehicle dimensions, usage needs "
                "and production criteria are evaluated together to form the product design.",
                "Design and mould validations are carried out before production. This stage "
                "supports dimensional accuracy, universal fit and production continuity.",
            ],
            "items": [],
        },
    ],
    "quality": {
        "title": "Quality Control",
        "image": "/assets/images/uretim/kalite-kontrol.jpg",
        "alt": "Product inspection at the quality control station",
        "items": ["Flash inspection", "Colour check", "Flexibility test", "Odour check"],
        "text": "Quality checks carried out at different stages of production evaluate each "
                "product for appearance, dimensions, surface quality and overall performance. "
                "Products that pass these checks move on to packaging and shipping.",
    },
    "shipping": {
        "title": ["Secure", "Shipping"],
        "image": "/assets/images/uretim/sevkiyat.jpg",
        "alt": "Truck loading for export shipment",
        "paragraphs": [
            "Once quality checks are complete, Promats products are packed to international "
            "shipping standards and prepared for loading.",
            "In our export operations to more than 35 countries, we work with an understanding "
            "of dependable delivery and sustainable partnership.",
        ],
        "cta": "Request a Quote",
    },
    "contact": {
        "title": "Get In Touch",
        "name": "Full Name",
        "email": "E-Mail",
        "phone": "Phone",
        "message": "Your message...",
        "submit": "Send",
        "success": "We have received your message and will get back to you shortly.",
        "error": "Your message could not be sent. Please try again later.",
    },
}

PAGE_CONTENT = {
    "web.promats.frontend.page_content.products.locale.tr": PRODUCTS_TR,
    "web.promats.frontend.page_content.products.locale.en": PRODUCTS_EN,
    "web.promats.frontend.page_content.production.locale.tr": PRODUCTION_TR,
    "web.promats.frontend.page_content.production.locale.en": PRODUCTION_EN,
}

for key, payload in PAGE_CONTENT.items():
    STATEMENTS.append(
        "UPDATE site_settings SET value="
        + q(json.dumps(payload, ensure_ascii=False))
        + f" WHERE `key`={q(key)};"
    )

print("\n".join(STATEMENTS))
