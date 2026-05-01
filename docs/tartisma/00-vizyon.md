# 00 — Genel Vizyon: Tahminleyen ve Öğrenen ERP

> **Bağlam (v1.1 — 2026-05-01):** Bu doküman ilk taslakta 5 motorlu vizyondu. Sonradan **11 fazlı tam dijital dönüşüm** olarak genişletildi. Güncel resmî yapı: [`proje-teklifi/02-cozum-genel-bakis.md`](../proje-teklifi/02-cozum-genel-bakis.md). Bu doküman **temel motorların felsefesini** anlatır; faz haritası ve teslim sırası proje teklifi dokümanındadır.

## Mevcut durum

Paspas ERP şu an **operasyonel** bir sistemdir: sipariş gelir → üretim emri açılır → makineye atanır → sevk edilir. İnsan kararları zincirin her adımında merkez. Sistem "olanı kaydeder", **olmayanı önermez**.

## Hedef tablo

Sıradaki kuşak ERP **dört ek motor** içermeli; her biri bir öğrenme döngüsüne bağlı:

```
                 ┌──────────────────────────────────┐
                 │         PAZAR DİNLEMESİ          │
                 │  (Talep + Müşteri + Tedarikçi)   │
                 └──────────┬───────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     ┌─────────────────┐         ┌──────────────────┐
     │ TALEP MOTORU    │         │ KEŞIF MOTORU     │
     │ - Form/email/   │         │ - Yeni müşteri   │
     │   API'den talep │         │ - Yeni tedarikçi │
     │ - AI ile özet   │         │ - Profil eşleşme │
     └────────┬────────┘         └────────┬─────────┘
              │                           │
              ▼                           ▼
     ┌─────────────────────────────────────────┐
     │        TAHMİN VE PLANLAMA MOTORU        │
     │  - Bekleyen + tahmini taleple üretim    │
     │    önceliklendirme                      │
     │  - Stok tüketim hızı + güvenlik stoğu   │
     │    → ne zaman/ne al sinyali             │
     └─────────────────────┬───────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   GERÇEKLEŞEN ÜRETİM    │  (mevcut ERP)
              │  + sevkiyat + stok      │
              └─────────┬───────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │    GERİ BESLEME         │
              │  Tahmin vs. gerçek →    │
              │  modeli/kuralı düzelt   │
              └─────────────────────────┘
```

## Beş motor

### 1. Talep Motoru ([detay](./01-talep-tahmin-motoru.md))
Birden fazla kanaldan (form, email, telefon notu, B2B portal) gelen ham talepleri toplar, AI ile yapılandırır (ürün, miktar, termin, müşteri segmentı), sipariş havuzuna atar.

### 2. Keşif Motoru ([müşteri](./02-musteri-kesif.md), [tedarikçi](./03-tedarikci-yonetimi.md))
Mevcut müşteri profillerini analiz edip benzer yeni müşterileri arar — yurt içi (sektör rehberleri, B2B platformlar) ve yurt dışı (LinkedIn, Alibaba, sektörel fuarlar). Aynı yöntemi tedarikçi tarafına uygular.

### 3. Tahmin/Planlama Motoru ([üretim talep](./01-talep-tahmin-motoru.md), [stok](./04-stok-tahmin-otomasyonu.md))
- **Üretim:** Onaylanmış sipariş + tahmini sipariş (AI'nin önümüzdeki 30 günde gelmesini öngördüğü) → makine kapasitesi/önceliklendirme.
- **Stok:** Geçmiş tüketim hızı + bekleyen üretim ihtiyacı + tedarikçi lead time → "X ürünü Y tarihinde Z adet al" sinyali.

### 4. Geri Besleme
Her tahmin (talep, üretim, stok) bir gerçekleşme ile karşılaştırılır. Sapma metrikleri DB'de saklanır. Model/kural haftalık/aylık otomatik kalibre edilir. Bu olmadan motor "tahmin etmiş gibi yapan" ama hiç öğrenmeyen bir sistem olur.

### 5. Konversasyonel Katman ([detay](./07-konversasyonel-katman.md))
Hem müşteri (B2B portal) hem yönetici (admin panel) ERP ile **yazışarak** iş yapar. Her aksiyon önce taslak olarak özetlenir, kullanıcı onaylar, sonra gerçekleşir, ardından sonuç geri raporlanır. Üç persona: müşteri asistanı (sınırlı), yönetici asistanı (geniş), saha asistanı (operatör — opsiyonel). Diğer 4 motor görünmez bir altyapı; konuşma katmanı görünür arayüz. OpenClaw'den ilham alındı — kopya değil, pattern.

## Veri akışı: tek doğruluk kaynağı

| Modül | Üretiyor | Tüketiyor |
|-------|----------|-----------|
| Talep Motoru | ham talep + AI özet | müşteri segmenti, ürün katalogu |
| Müşteri Keşif | lead listesi (skorlu) | mevcut müşteri profili, talep paterni |
| Tedarikçi Keşif | tedarikçi listesi (skorlu) | mevcut tedarikçi performansı, ürün ihtiyaç hızı |
| Üretim Tahmin | önümüzdeki N günün üretim planı | onaylı + tahmini siparişler, makine kapasitesi |
| Stok Tahmin | satın alma takvimi | tüketim hızı, lead time, güvenlik stoğu |
| Geri Besleme | sapma metrikleri | tüm tahminlerin gerçekleşmiş sonuçları |

## "Yapılan vs öğrenen" çizgisi

Önce statik kurallar (heuristik), sonra ML/LLM destekli iyileştirme. Adım adım:

1. **Faz A — kuralcı:** son 90 günün ortalaması, basit lineer regresyon, manuel eşikler. AI sadece talep özetinde (form text → yapılandırılmış kayıt).
2. **Faz B — istatistiksel:** mevsimsellik (haftalık/aylık desen), ARIMA/Prophet zaman serisi modeli, anomali tespiti.
3. **Faz C — LLM destekli:** "şu sipariş geldi, mevsim, müşteri geçmişi, üretim kapasitesi şu — önümüzdeki 4 hafta için planı öner". Çıktı yapılandırılmış JSON, bizim tahmin modelinin yanında ek görüş.

Faz A önce gelmeli. Faz C olmadan da değer üretir; LLM olmadan da çalışan bir tahmin motoru hedef.

## Açık tasarım soruları

1. **Sahiplik:** her motor ayrı modül mü (`/admin/talep-motoru`, `/admin/musteri-kesif`...) yoksa tek bir "Pazar Zekası" başlığı altında tab'lar mı?
2. **Öğrenme periyodu:** geri besleme günlük, haftalık, aylık hangi sıklıkta çalışmalı? Maliyet vs. tazelik dengesi.
3. **Manuel onay zinciri:** AI'nın önerdiği üretim emri/stok siparişi otomatik mi açılsın, yoksa "önerilen" durumda kalıp insan onayı bekleyişin mi?
4. **Veri saklama:** keşfedilen lead/tedarikçi adayları ne kadar süre saklanır, kişisel veri (KVKK/GDPR) açısından dikkat edilecek noktalar?

→ Yanıtlar netleştikçe ilgili modül dokümanlarına işlenir.

## 11-Fazlı Yapıyla Eşleşme

| Bu doc'taki motor | 11-fazlı yapıdaki yer |
|-------------------|------------------------|
| Talep Motoru | Faz 1 — [`proje-teklifi/02-cozum-genel-bakis.md`](../proje-teklifi/02-cozum-genel-bakis.md#faz-1--talep-toplama-altyapisi) |
| Müşteri Keşif | Faz 3 |
| Tedarikçi Keşif | Faz 4 |
| Üretim Tahmin | Faz 2 — [`12-tahmin-motoru-derinlemesine.md`](./12-tahmin-motoru-derinlemesine.md) |
| Stok Tahmin | Faz 4 |
| Geri Besleme | Faz 7 — [`14-egitilebilir-modeller-mlops.md`](./14-egitilebilir-modeller-mlops.md) |
| Konversasyonel Katman | Faz 8 |
| (yeni) Bayi Scraping & Churn | Faz 5 — [`13-bayi-scraping-churn.md`](./13-bayi-scraping-churn.md) |
| (yeni) B2B Bayi Portalı | Faz 6 — [`11-b2b-bayi-portali.md`](./11-b2b-bayi-portali.md) |
| (yeni) Mobil & Saha CRM | Faz 9 |
| (yeni) Genişleme (10 ek sinyal) | Faz 10+ — [`15-genisletme-sinyalleri.md`](./15-genisletme-sinyalleri.md) |
