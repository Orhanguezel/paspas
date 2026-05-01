# 03 — Tedarikçi Analizi & Alternatif Tedarikçi Keşfi

> **Bağlam (v1.1):** Bu doküman **Faz 4 — Stok & Tedarik Otomasyonu**'nun tedarikçi tarafını anlatır. Stok tarafı: [`04-stok-tahmin-otomasyonu.md`](./04-stok-tahmin-otomasyonu.md). Güncel resmî yapı: [`proje-teklifi/02-cozum-genel-bakis.md`](../proje-teklifi/02-cozum-genel-bakis.md#faz-4--stok--tedarik-otomasyonu).

## Hipotez

> Mevcut tedarikçilerin performans verisi (lead time, fiyat, kalite, gecikme) sistematik tutulursa: (a) **kötü performans gören tedarikçiler** açıkça görünür, (b) hangi ürün için **alternatif aramak** gerektiği otomatik tespit edilir, (c) AI tabanlı keşif ile yeni tedarikçi adayları çıkarılabilir.

## Sorun tanımı

Bugün:
- `tedarikci` modülü iletişim bilgisinden ibaret. Performans verisi yok.
- Mal kabul tablosu var ama **tedarikçi-ürün-fiyat geçmişi** ayrıştırılmamış.
- Tek tedarikçili ürünler için **risk paneli yok** (X tedarikçi düşerse hangi ürünler kalır?).
- Yeni tedarikçi araması = Google'a girip arama yapmak.

## Önerilen mimari — üç ayak

### Ayak 1 — Tedarikçi performans skorlama

Yeni veriler `mal_kabul_kayitlari` üzerinden hesaplanır (mevcut `kalite_durumu`, `gelen_miktar`, satın alma siparişi termin tarihi):

```sql
CREATE TABLE tedarikci_performans (
  tedarikci_id char(36) PK FK,
  toplam_satin_alma_tutari decimal(14,2),
  toplam_kalem_sayisi int,

  -- Termin uyumu
  zamanindaki_teslim_yuzdesi decimal(5,2),
  ortalama_gecikme_gun decimal(8,2),

  -- Kalite
  kabul_edilen_miktar decimal(14,4),
  reddedilen_miktar decimal(14,4),
  red_orani decimal(5,2),

  -- Lead time
  ortalama_lead_time_gun decimal(8,2),
  lead_time_std_sapma decimal(8,2),

  -- Fiyat trendi
  son_alis_fiyatlari JSON,           -- son 6 alımın {tarih, urun, birim_fiyat}

  -- Skor
  performans_skoru decimal(5,2),     -- 0-100 ağırlıklı
  recalc_at datetime
);
```

Skor formülü (başlangıç):
```
performans = 0.35 * (100 - red_orani)
           + 0.30 * zamanindaki_teslim_yuzdesi
           + 0.20 * lead_time_skoru   (kısa & istikrarlı = yüksek)
           + 0.15 * fiyat_skoru        (rakip ortalamasının altında ise yüksek)
```

Bu rakam `tedarikci` listesinde renkli badge ile gösterilir: yeşil/sarı/kırmızı.

### Ayak 2 — Risk haritası

Her hammadde/ambalaj ürünü için kaç tedarikçiden alındığını çıkar:

```sql
CREATE VIEW v_urun_tedarikci_dagilimi AS
SELECT
  u.id, u.kod, u.ad, u.kategori,
  COUNT(DISTINCT sa.tedarikci_id) AS tedarikci_sayisi,
  SUM(sak.miktar) AS toplam_alim_son_yil,
  GROUP_CONCAT(DISTINCT t.ad SEPARATOR ', ') AS tedarikciler,
  CASE
    WHEN COUNT(DISTINCT sa.tedarikci_id) = 1 THEN 'risk:tek_kaynak'
    WHEN COUNT(DISTINCT sa.tedarikci_id) = 2 THEN 'risk:ikili_kaynak'
    ELSE 'guvenli:cok_kaynak'
  END AS risk_durumu
FROM urunler u
LEFT JOIN satin_alma_kalemleri sak ON sak.urun_id = u.id
LEFT JOIN satin_alma_siparisleri sa ON sa.id = sak.siparis_id
  AND sa.created_at > NOW() - INTERVAL 365 DAY
LEFT JOIN tedarikci t ON t.id = sa.tedarikci_id
WHERE u.kategori IN ('hammadde','yarimamul')
GROUP BY u.id;
```

Dashboard: "tek tedarikçili kritik 12 ürün" listesi → "alternatif ara" butonu.

### Ayak 3 — Alternatif tedarikçi keşfi

Müşteri keşif modülü ile aynı altyapıyı kullanır (Crawlee + Apollo + Google Places + sektörel B2B). Tedarikçi tarafında ek kaynaklar:

| Kaynak | Yararı |
|--------|--------|
| **TOBB Sanayi Sicili** | Üretici firma listesi, NACE kodu ile filtrelenebilir |
| **Türkiye İhracatçılar Meclisi (TİM)** | İhracatçı tedarikçi (kalite genelde daha yüksek) |
| **Alibaba.com** | Çin/uzakdoğu tedarikçi, MOQ, sertifika bilgisi var |
| **Tradewheel / Made-in-China** | Alibaba alternatifi |
| **Sektörel fuar katılımcı listeleri** | Yıllık etkinliklerden taraflı veri |
| **EU Trade Helpdesk** | AB tedarikçileri (CE belgeli) |
| **Mevcut tedarikçinin müşteri listesi** | "Bu tedarikçi başka kime satıyor" — ortak müşteri sektörel ipucu |

AI destekli outreach:
1. Yeni hammadde fiyat sorgu maili: "Şu ürün için MOQ X, teslim Y gün, fiyat Z TL/USD altında istiyoruz" — Türkçe + İngilizce + Çince.
2. Cevap geldiğinde otomatik karşılaştırma tablosu (mevcut tedarikçi vs aday).

## Lead time bazlı yeniden sipariş tetiklemesi

Bu modül [`04-stok-tahmin-otomasyonu.md`](./04-stok-tahmin-otomasyonu.md) ile sıkı bağlı: tedarikçi `lead_time_gun` bilgisini kullanır → "stok tüketim hızı + güvenlik stoğu + lead time" formülü ile **otomatik satın alma siparişi taslağı** açar.

## Açık sorular

1. **Performans hesaplama sıklığı:** günlük cron mu, her mal kabul sonrası tetikleyici mi?
2. **Kalite verisi:** şu an `kalite_durumu = red` kayıtları detayı yok ("hangi nedenle red?"). Red sebepleri taxonomi'si gerek mi (boyut, yüzey, eksik miktar, gecikme)?
3. **Fiyat karşılaştırma:** rakip tedarikçi fiyatı için pazar verisi yok; manuel girilecek mi yoksa Apollo/sektör API'larından mı?
4. **Outreach dili:** Çin tedarikçilerine Mandarin metni AI ile mi yazdırılsın?
5. **Sertifika gereksinimi:** ISO/CE/FDA sertifikası şart koşulan ürünler var mı? Aday tedarikçi filtresi.

## Bağımlılıklar

- ✅ `tedarikci`, `mal_kabul_kayitlari`, `satin_alma_*` tabloları mevcut
- ⚠️ Termin tarihi mal_kabul üzerinde tracking yok (tahmini terminle gerçek teslim arası fark)
- ⚠️ Fiyat tarihçesi `satin_alma_kalemleri.birim_fiyat`'ta tek seferlik; trendi rapor edecek view yok

## Tahmini iş büyüklüğü

| Faz | İçerik | Süre |
|-----|--------|------|
| 1 | Performans tablosu + cron + UI badge | ~3-4 gün |
| 2 | Risk haritası view + alternatif arama butonu | ~2 gün |
| 3 | Tedarikçi keşif crawler (müşteri keşfi ile ortak altyapı) | Müşteri keşfi tarafına dahil; +3 gün özelleşme |
| 4 | Otomatik satın alma siparişi taslağı (stok modülü ile) | Stok dokümanına bakın; +2 gün entegrasyon |
| **Toplam** | | **~10-15 iş günü** (müşteri keşif altyapısı varsa daha kısa) |
