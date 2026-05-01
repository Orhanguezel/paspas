# Paspas ERP — Büyüme & AI Otomasyon Tartışma Klasörü

Bu klasör, mevcut Paspas Üretim ERP'sinin üzerine inşa edilecek bir sonraki kuşak modüller için **kod yazmadan önce strateji ve teknoloji tartışması** yapılan dokümanları içerir. Her dosya bir hipotez/teklif niteliğindedir; karar verildikten sonra ana plan dosyalarına taşınır.

> **v1.1 — 2026-05-01:** Tüm tartışma dokümanları (00-11) **11 fazlı resmi yapıya** bağlandı. Her dokümanın başında ilgili **proje teklifi** ve **derinlemesine tartışma** dokümanlarına link bulunur. Resmi proje teklifi: [`docs/proje-teklifi/`](../proje-teklifi/) (12 alt doküman).

## Tartışma Dokümanları

| Dosya | Konu |
|-------|------|
| [`00-vizyon.md`](./00-vizyon.md) | Genel vizyon: 6 modülün birbirine nasıl bağlandığı, veri ve geri besleme döngüleri |
| [`01-talep-tahmin-motoru.md`](./01-talep-tahmin-motoru.md) | Müşteri talebi → üretim tahmini → gerçekleşen ile öğrenen sistem |
| [`02-musteri-kesif.md`](./02-musteri-kesif.md) | Yurt içi/yurt dışı müşteri keşfi; mevcut müşteri profili → benzer leadler |
| [`03-tedarikci-yonetimi.md`](./03-tedarikci-yonetimi.md) | Mevcut tedarikçi analizi + alternatif tedarikçi keşfi |
| [`04-stok-tahmin-otomasyonu.md`](./04-stok-tahmin-otomasyonu.md) | Tüketim hızına göre "ne zaman, hangi ürün, ne kadar al" tahmini |
| [`05-veri-toplama-altyapisi.md`](./05-veri-toplama-altyapisi.md) | Web crawler, API entegrasyonları, kullanılacak open-source araçlar |
| [`06-yol-haritasi.md`](./06-yol-haritasi.md) | 6 modülün önceliklendirilmiş, faz-faz yol haritası |
| [`07-konversasyonel-katman.md`](./07-konversasyonel-katman.md) | Müşteri + yönetici yazışarak iş yapsın; her aksiyon onaylı, geri dönüşlü. OpenClaw'den ilham. |
| [`08-saas-butce-analizi.md`](./08-saas-butce-analizi.md) | Hunter/Apollo/Google Places + alternatifler; 3 senaryo (free/orta/yüksek) |
| [`09-otomasyon-esikleri.md`](./09-otomasyon-esikleri.md) | AI'nın hangi koşulda otomatik aksiyon, hangi koşulda onay; risk skoru + tutar limiti + güven eşiği |
| [`10-crm-karari.md`](./10-crm-karari.md) | Paspas içi vs EspoCRM vs Apollo vs hibrit — karşılaştırma matrisi |
| [`11-b2b-bayi-portali.md`](./11-b2b-bayi-portali.md) | **Strateji değişimi:** önce mevcut müşteri portalı, sonra yeni keşif. Paspas stack'ine uyarlanmış (MySQL/Fastify/UUID) |
| [`12-tahmin-motoru-derinlemesine.md`](./12-tahmin-motoru-derinlemesine.md) | **Faz 2 deep-dive:** algoritma seçimi (naive→Prophet→XGBoost→LSTM), eğitim verisi, mevsimsellik, Excel girdi, MAPE hedefleri |
| [`13-bayi-scraping-churn.md`](./13-bayi-scraping-churn.md) | **Faz 5 deep-dive:** yasal sınırlar (KVKK, robots.txt, ToS), Crawlee+Playwright stack, sinyal türleri, churn tahmin modeli |
| [`14-egitilebilir-modeller-mlops.md`](./14-egitilebilir-modeller-mlops.md) | **Faz 7 deep-dive:** Bun+Python hibrit MLOps, model versiyonlama, A/B test, Excel upload UX, multivariate, active learning, açıklanabilirlik |
| [`15-genisletme-sinyalleri.md`](./15-genisletme-sinyalleri.md) | **Faz 8+ vizyonu:** 10 ek sinyal/modül — rakip istihbaratı, müşteri churn, fiyat optimizasyonu, AI belge işleme, lojistik, mobil, dış veri, API, saha CRM, sürdürülebilirlik |

## Süreç

1. Her doküman bir **hipotez** ile başlar; problem tanımı + iş hedefi.
2. Teknik yaklaşımlar **alternatifler halinde** sunulur (1 değil 2-3 seçenek).
3. **Açık sorular** bölümü kullanıcı kararı bekleyen noktaları toplar.
4. Karar verildikten sonra ilgili madde ana plan dosyalarına taşınır, kod başlar.

## Üst Tema

> Paspas ERP zaten üretimi yönetiyor. Sıradaki adım: **piyasayı dinleyen, tahmin yapan, kendi kendini düzelten bir ekosistem** — talep tarafında müşteri keşfi/talep toplama, üretim tarafında tahmin/planlama, tedarik tarafında otomatik sipariş zamanlaması, hepsi geri besleme ile öğrenen.

## "openclaw" — Açık Soru

Kullanıcı "openclaw kurulumu da dahil" dedi. Bu kelimenin tam karşılığı belirsiz — olası adaylar:

- **Open source CRM:** SuiteCRM, EspoCRM, VTiger, CiviCRM, Odoo CRM (en güçlü adaylar müşteri keşfi için)
- **Web crawler/scraper:** Crawlee (Node.js), Apache Nutch, Crawl4AI, Firecrawl
- **OpenWebUI:** lokal LLM front-end
- Yazım hatası: "Open Claude", "OpenLLaMA", veya başka bir AI tool

→ [`05-veri-toplama-altyapisi.md`](./05-veri-toplama-altyapisi.md) bu seçenekleri detaylı tartışıyor; karar netleştiğinde modüler kurulum başlar.
