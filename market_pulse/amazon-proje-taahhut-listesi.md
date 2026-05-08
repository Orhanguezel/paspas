# Amazon Ticari Karar Motoru — Taahhüt & Teslimat Listesi

**Müşteri:** Bionluk (anonim)  
**Fiyat:** 20.000 TL — Bionluk üzerinden tek seferlik  
**Teslim:** 20 gün  
**Tarih:** 8 Mayıs 2026  

---

## SCORING MOTORU (İlan 1 kapsamı)

- [x] Kategori risk puanı — unique seller yoğunluğu, dominant brand oranı, review dağılımı (`scorers/category-risk.scorer.ts`)
- [x] Marka güvenilirlik puanı — çoklu SKU fiyat tutarlılığı, listing kalitesi (`scorers/brand-reliability.scorer.ts`)
- [x] SKU kaos puanı — fiyat standart sapması (σ), price spread, unique seller / listing oranı (`scorers/sku-chaos.scorer.ts`)
- [x] Fiyat savaşı riski — sayfa 1→3 fiyat trendi, RACE_TO_BOTTOM pattern tespiti (`scorers/price-war.scorer.ts`)
- [x] Operasyonel risk analizi — negatif review pattern, iade/kalite şikayeti tespiti (`scorers/operational-risk.scorer.ts`)
- [x] Karar etiketi üretimi — GÜVENLİ / DİKKATLİ_OL / GİRME (`composite.scorer.ts`)
- [x] Veri filtreleme mantığı — minimum threshold, yetersiz veri eleme (`signal.validator.ts`)
- [x] "Hangi ürün riskli?" odaklı yapı — AI ile ürün bulma değil, risk filtreleme

---

## VERİ ALTYAPISI (İlan 2 kapsamı)

- [x] Keepa API entegrasyonu — fiyat geçmişi, Buy Box trendi, kuyruk + bütçe yönetimi (`keepa.client.ts`)
- [x] Amazon veri çekme sistemi — ürün verileri, fiyat, satıcı sayısı, yorum geçmişi (`amazon.scraper.ts`)
- [x] Scraping altyapısı — Oxylabs adaptörü, filtreler dahil (`amazon.scraper.ts`)
- [x] Veri temizleme ve standartlaştırma katmanı (`category.normalizer.ts`)
- [x] MySQL veritabanı şeması — 8 tablo (`021_amazon_scoring_schema.sql`)
- [x] Job orchestrator — async iş akışı, hata yakalama, retry (`amazon.job.ts`)
- [x] Hata yakalama ve loglama sistemi — `amazon_job_error_logs` tablosu
- [x] Veri akış stabilizasyonu — stabil pipeline, retry_count takibi
- [x] Keepa API kullanım optimizasyonu — günlük token bütçesi + kuyruk sistemi

---

## MİMARİ TAAHHÜTLER (Konuşma boyunca mutabık kalınanlar)

- [x] Confidence katmanı — HIGH / MEDIUM / LOW / INSUFFICIENT_DATA (`confidence.calculator.ts`)
- [x] MIXED_SIGNAL mekanizması — tek sinyal yüksek, diğerleri düşükse zorla karar üretmeme (`signal.validator.ts`)
- [x] Kategori bazlı normalizasyon — percentile tabanlı, sabit eşik değil (`category.normalizer.ts`)
- [ ] **Merkezi config yapısı — ağırlıklar şu an `composite.scorer.ts` içinde hardcode. Harici `scoring.config.ts` YAZILACAK**
- [x] Composite skor — ağırlıklı ortalama (`composite.scorer.ts`)
- [ ] **Standalone repo — mevcut kod MarketPulse içinde, müşteriye ayrı repo olarak çıkarılacak**
- [x] Seller-centric → product/category-centric dönüşüm (`amazon.scoring-engine.ts`)

---

## JSON ÇIKTI FORMATI

- [x] Her keyword için tam risk kartı üretimi — score + confidence + data_points (`amazon.types.ts`)
- [ ] **`reason` alanı üretiliyor ama DB'ye kaydedilmiyor — persist edilecek**
- [x] composite_score (`composite.scorer.ts`)
- [x] decision (GÜVENLİ / DİKKATLİ_OL / GİRME) (`composite.scorer.ts`)
- [x] summary (kısa gerekçe) (`amazon.scoring-engine.ts`)
- [x] mixed_signal flag (`signal.validator.ts`)

---

## TEST ÇALIŞMASI

Test keywordleri (müşteri tarafından belirlendi):
- [ ] thermal labels
- [ ] cable organizer
- [ ] surge protector
- [ ] dash cam
- [ ] webcam lighting

Amaç: farklı seller davranışları, volatilite seviyeleri ve kategori riskleri

---

## MİLESTONE TESLİMAT TAKVİMİ

### Milestone 1 — Gün 7: Scoring Çekirdeği
- [x] 5 scoring modülü yazıldı ve bağımsız test edildi
- [ ] **scoring.config.ts — harici config dosyası YAZILACAK**
- [x] Composite scorer + karar etiketi
- [x] MIXED_SIGNAL ve INSUFFICIENT_DATA mekanizmaları
- [ ] İlk demo çıktısı — 3 keyword üzerinde tam JSON (Keepa key bekleniyor)
- [x] Birim testler — her modül için (12+ test dosyası mevcut)
- [ ] **Milestone 1 sonrası müşteri ile birlikte değerlendirme/revizyon süreci**

### Milestone 2 — Gün 14: Pipeline Entegrasyonu
- [x] Scraper adaptör bağlantı noktaları
- [x] MySQL şema SQL dosyası
- [x] Job orchestrator — async, retry, hata yakalama
- [x] Kategori bazlı normalizasyon — percentile hesaplama
- [x] Veri temizleme ve standartlaştırma
- [x] Confidence hesaplama — data_points bazlı
- [ ] Keepa API key entegrasyonu (key bekleniyor)
- [ ] **E2E entegrasyon testi — `runAmazonJob()` → DB bütünü YAZILACAK**
- [ ] **`reason` alanı DB persist — YAZILACAK**

### Milestone 3 — Gün 20: Final Teslim
- [ ] 5 test keyword üzerinde gerçek çalışma sonuçları (JSON dosyaları)
- [x] SCORING_LOGIC.md — mevcut
- [ ] **README.md — kurulum, çalıştırma, config düzenleme rehberi YAZILACAK**
- [ ] Kod temizliği ve refactor
- [ ] **Standalone repo teslimi — MarketPulse'dan ayrılacak**
- [ ] Tüm haklar alıcıya devredilir

---

## TESLİM SONRASI

- [ ] 20 gün garanti kapsamında destek
  - Hata giderme
  - Config ayarı
  - Entegrasyon soruları
- [ ] Kısa tuning desteği

---

## ÖDEME

- Platform: Bionluk
- Yöntem: Tek seferlik, sipariş açılışında güvenceye alınır
- Tutar: 20.000 TL
- Serbest bırakılma: Teslim onayında
- **Durum: ÖDENDİ ✓ (8 Mayıs 2026)**

---

## MÜŞTERİDEN BEKLENENLER

- [ ] Keepa API anahtarı (keepa.com aboneliği)
- [x] Test keywordleri — belirlendi (thermal labels, cable organizer, surge protector, dash cam, webcam lighting)
- [x] Veritabanı tercihi — MySQL/MariaDB (onaylandı)
- [x] Fiyat mutabakatı — 20.000 TL (onaylandı)
