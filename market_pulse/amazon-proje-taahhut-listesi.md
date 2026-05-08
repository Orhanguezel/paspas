# Amazon Ticari Karar Motoru — Taahhüt & Teslimat Listesi

**Müşteri:** Bionluk (anonim)  
**Fiyat:** 20.000 TL — tek seferlik  
**Teslim:** 20 gün  
**Tarih:** 8 Mayıs 2026  
**Ödeme:** ÖDENDİ ✓

---

## AJAN SORUMLULUK TABLOSU

| Ajan | Rol | Ne yapar |
|------|-----|----------|
| **Claude Code** | Mimar / Stratejist | DB şema, API kontrat, mimari karar, review, handover notu yazar |
| **Codex** | Implementasyon | Test dosyaları, README, refactor, standalone repo paketleme |
| **Cursor** | UI / Frontend | Admin panel bileşenleri, form, risk skor kartı, sidebar |

Tüm ajanlara ortak kural: bu dosya tek gerçek kaynaktır. Tamamlanan madde hemen `[ ]` → `[x]` yapılır.

---

## AÇIK GÖREVLER

### [Claude Code] Mimari & Handover

- [ ] **Standalone repo sınır haritası** — `amazon/` klasöründen hangi dosyalar bağımsız çalışır, hangi `_shared/` bağımlılıkları kopar; Codex'e handover notu yaz (`docs/standalone-scope.md`)
- [ ] **E2E test senaryoları tasarla** — `runAmazonJob()` → DB full-flow için hangi mock'lar, hangi assert'lar gerekli; Codex'e teknik brief yaz
- [ ] **5 keyword test sonuçlarını değerlendir** — Keepa key gelince çalıştır, çıktıları `docs/test-results/` altına kaydet, müşteriye yorumla
- [ ] **Milestone 3 final kod review** — Codex teslim ettiğinde standalone repo + README + E2E testleri mimari açıdan onayla

---

### [Codex] Implementasyon

- [ ] **E2E integration test** — `backend/src/modules/lead-machine/amazon/__tests__/amazon.job.e2e.test.ts`
  - `runAmazonJob()` → scraper mock → DB kayıt doğrulama (reason kolonları dahil)
  - Başarılı + hata senaryosu ikisi de test edilmeli
  - Claude Code'dan brief bekle (yukarıdaki madde tamamlandıktan sonra)
- [ ] **README.md** — `backend/src/modules/lead-machine/amazon/README.md`
  - Kurulum (bun install, .env variables)
  - Çalıştırma (`runAmazonJob`, test komutu)
  - `scoring.config.ts` nasıl düzenlenir (threshold / ağırlık değişikliği)
  - Keepa entegrasyonu nasıl aktive edilir
- [ ] **Kod temizliği** — kullanılmayan import yok, isimlendirme tutarlı, 60+ satır controller metodları service'e taşı
- [ ] **Standalone repo paketleme**
  - `amazon/` klasörünü yeni repo'ya kopyala
  - `_shared/` bağımlılıklarını kır veya inline et (Claude Code handover notuna göre)
  - `package.json`, `tsconfig.json`, `.env.example` düzenle
  - Müşteri için git repo hazırla (private)

---

### [Cursor] Admin Panel UI

- [ ] **`risk-score-card.tsx`** — `admin_panel/src/app/(main)/admin/(admin)/market/_components/risk-score-card.tsx`
  - 5 boyut (category_risk, sku_chaos, price_war_risk, brand_reliability, operational_risk)
  - Her boyut: skor progress bar + confidence badge + reason tooltip
  - Karar etiketi: GÜVENLİ (yeşil) / DİKKATLİ_OL (sarı) / GİRME (kırmızı)
  - `data_points` badge (sağ üst köşe)
  - MIXED_SIGNAL flag gösterimi
- [ ] **`amazon-lead-search-panel.tsx` güncelleme** — mevcut bileşeni `risk-score-card` ile entegre et
  - Tarama sonucu geldiğinde `risk-score-card` bileşenini render et
  - Keepa trend varsa mini grafik ekle
- [ ] **Admin sidebar** — Amazon Scoring sayfasına nav linki ekle (`sidebar-items.ts`)

---

## TAMAMLANAN MADDELER

### Scoring Motoru
- [x] Kategori risk puanı — seller yoğunluğu, dominant brand, review dağılımı (`scorers/category-risk.scorer.ts`)
- [x] Marka güvenilirlik puanı — fiyat tutarlılığı, listing kalitesi (`scorers/brand-reliability.scorer.ts`)
- [x] SKU kaos puanı — fiyat σ, price spread, seller/listing oranı (`scorers/sku-chaos.scorer.ts`)
- [x] Fiyat savaşı riski — sayfa 1→3 fiyat trendi, RACE_TO_BOTTOM tespiti (`scorers/price-war.scorer.ts`)
- [x] Operasyonel risk — negatif review pattern, iade/kalite şikayeti (`scorers/operational-risk.scorer.ts`)
- [x] Karar etiketi üretimi — GÜVENLİ / DİKKATLİ_OL / GİRME (`composite.scorer.ts`)
- [x] MIXED_SIGNAL mekanizması — tek sinyal yüksek, diğerleri düşük (`signal.validator.ts`)
- [x] Veri filtreleme — minimum threshold, yetersiz veri eleme (`signal.validator.ts`)
- [x] Merkezi config — ağırlıklar ve eşikler `scoring.config.ts`'te toplandı

### Veri Altyapısı
- [x] Keepa API entegrasyonu — fiyat geçmişi, Buy Box trendi, kuyruk + bütçe (`keepa.client.ts`)
- [x] Amazon veri çekme — Oxylabs adaptörü, ürün/fiyat/satıcı/yorum (`amazon.scraper.ts`)
- [x] Veri temizleme ve normalizasyon — percentile bazlı (`category.normalizer.ts`)
- [x] MySQL şema — 8 tablo, reason kolonları dahil (`021_amazon_scoring_schema.sql`)
- [x] Job orchestrator — async, retry, error log (`amazon.job.ts`)
- [x] `amazon_job_error_logs` tablosu

### JSON Çıktı Formatı
- [x] Her keyword için tam risk kartı — score + confidence + reason + data_points (`amazon.types.ts`)
- [x] `reason` alanı DB'ye persist ediliyor — 5 boyut için ayrı kolon (`amazon_risk_scores`)
- [x] composite_score, decision, summary (`composite.scorer.ts`, `amazon.scoring-engine.ts`)
- [x] mixed_signal flag (`signal.validator.ts`)

### Test
- [x] 163 birim testi — 26 dosya, 0 hata (bun test)
- [x] Her scorer için bağımsız test dosyası

### Mimari
- [x] Confidence katmanı — HIGH / MEDIUM / LOW / INSUFFICIENT_DATA (`confidence.calculator.ts`)
- [x] Kategori bazlı normalizasyon — percentile tabanlı (`category.normalizer.ts`)
- [x] Seller-centric → product/category-centric dönüşüm
- [x] SCORING_LOGIC.md — teknik belgeleme mevcut

### Müşteriden Alınanlar
- [x] Test keyword listesi — thermal labels, cable organizer, surge protector, dash cam, webcam lighting
- [x] Veritabanı tercihi — MySQL/MariaDB
- [x] Fiyat mutabakatı — 20.000 TL

---

## BLOKE MADDELER (Müşteri Bekleniyor)

| Madde | Beklenen | Durum |
|-------|----------|-------|
| 5 keyword gerçek çalışma sonuçları | Keepa API anahtarı | Müşteri henüz iletmedi |
| Keepa entegrasyonu tam aktif | Keepa API anahtarı | Müşteri henüz iletmedi |

---

## MİLESTONE TAKVİMİ

| Milestone | Gün | Durum |
|-----------|-----|-------|
| M1 — Scoring çekirdeği + birim testler | Gün 7 | ✅ Tamamlandı |
| M2 — Pipeline entegrasyonu + DB + confidence | Gün 14 | ✅ Tamamlandı |
| M3 — E2E test + README + standalone repo + UI | Gün 20 | 🔄 Devam ediyor |

### M3 Alt Görevler
- [ ] [Codex] E2E integration test
- [ ] [Codex] README.md
- [ ] [Codex] Standalone repo paketleme
- [ ] [Cursor] risk-score-card.tsx
- [ ] [Cursor] amazon-lead-search-panel güncelleme
- [ ] [Claude Code] Standalone sınır haritası → Codex'e handover
- [ ] [Claude Code] Final mimari review
- [ ] 5 keyword gerçek çalışma sonuçları *(Keepa key bekleniyor)*
- [ ] Tüm haklar alıcıya devredilir

---

## TESLİM SONRASI (20 gün garanti)

- [ ] Hata giderme
- [ ] Config ayarı
- [ ] Entegrasyon soruları
- [ ] Kısa tuning desteği
