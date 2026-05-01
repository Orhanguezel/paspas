# 12 — Tahmin Motoru: Derinlemesine Teknik Tasarım (Faz 2)

> **Felsefe:** Önce istatistik, sonra AI. Sayılarla açıklanabilir bir model olmadan, "Claude öneriyor" diye karar vermek itibar zedeler. AI, modelin **yanına** gelir; **yerine** geçmez.

---

## 1. Sipariş Tahmin Motoru ne çözüyor?

### 1.1 Soru
> "Bayi X, önümüzdeki 30 gün içinde Y ürününden ne kadar sipariş verecek?"

Çıktı şu kararlara temel olur:
- **Üretim planlaması** — gelmemiş ama gelmesi muhtemel siparişe stok hazırla
- **Hammadde satınalma** — kalıp hazırlık + reçete üzerinden ham madde miktarı
- **Bayi mesaj zamanlaması** — "siparişiniz vermeniz gereken döneme yaklaşıyorsunuz" hatırlatması
- **Stok tahsis** — kıt ürünlerde önceliklendirme

### 1.2 Çıktı yapısı

```ts
type TahminCiktisi = {
  bayi_id: string;
  urun_id: string;
  donem: { baslangic: Date; bitis: Date };  // ör. 2026-05-01 → 2026-05-30
  tahmini_adet: number;                      // beklenen değer
  guven_araligi: { alt: number; ust: number; ihtimal: 0.80 | 0.95 };  // 80% veya 95%
  guven_skoru: number;                       // 0.0 - 1.0 (modelin kendine güveni)
  metod: 'naive' | 'mevsimsel_ortalama' | 'lineer_regresyon' | 'arima' | 'prophet' | 'xgboost' | 'lstm';
  sinyaller: {
    tarihsel_ortalama: number;
    ay_ici_artis: number;       // bu ay diğer aylara göre +%
    yil_onceki_ay: number;
    son_3_ay_trend: 'azalan' | 'sabit' | 'artan';
    benzer_bayi_ortalamasi?: number;
    drf?: number;                // demand-residual factor (model dışı sapma)
  };
  uyari_bayraklari: string[];   // ör. "yeterli veri yok", "outlier tespit edildi"
};
```

---

## 2. Algoritma Seçimi — kademeli model paketi

Tek algoritma yok. **Veri yeterliliğine göre artan karmaşıklık.** Her bayi/ürün için en basit yeterli olanı kullan.

### 2.1 Karar matrisi

| Veri yaşı | Kayıt sayısı | Önerilen metod | Neden |
|-----------|--------------|----------------|-------|
| < 3 ay | < 10 sipariş | **Naive** (son ay × 1) + manuel onay | Veri yetersiz, AI bile güvenilmez |
| 3-6 ay | 10-30 sipariş | **Mevsimsel ortalama** (aynı dönem geçen yılın son 3 ayı) | Trend yok ama dönemsellik tahmin edilir |
| 6-12 ay | 30-100 sipariş | **Lineer regresyon** (zaman + dönem) | Doğrusal trend yakalanır, açıklanabilir |
| 12-24 ay | 100-500 sipariş | **Prophet** (Facebook) veya **ARIMA** | Mevsimsellik + trend + tatil etkisi |
| > 24 ay | > 500 sipariş | **XGBoost** (gradient boosting) | Çok değişkenli (fiyat, kampanya, hava, kur) |
| > 36 ay | > 2000 sipariş | **LSTM** veya **Transformer** | Karmaşık desen, dönem dışı sinyal |

### 2.2 Her algoritmanın görevi

#### **Naive (taban model)**
```
tahmin = son_ay_sipariş_adedi
```
- Fallback. Hiçbir model çalışmazsa bu çalışır.
- Tüm modellerin doğruluğunu ölçmek için **baseline** olarak kullanılır.

#### **Mevsimsel ortalama**
```
tahmin = (geçen_yıl_aynı_ay + 2 yıl önce aynı ay) / 2
```
- Mevsimselliği basitçe yakalar. Kategori: tekstil/inşaat gibi mevsimsel sektörler.

#### **Lineer regresyon (statsmodels veya scikit-learn)**
```python
features = [
  'gun_sayisi_baslangictan',  # zaman trend
  'ay_no',                     # 1-12 (one-hot)
  'haftaici_haftasonu',
  'tatil_mi',
  'son_30_gun_ortalama',
]
target = 'siparis_adet'
```
- Açıklanabilir. Hangi faktörün etkili olduğunu söyleyebilir.
- Doğrusal olmayan ilişkiler için yetersiz.

#### **Prophet (Facebook)**
- Otomatik mevsimsellik (haftalık + yıllık)
- Türk tatil takvimi (Ramazan, Kurban, milli bayramlar) elle eklenir
- Out-of-the-box çalışır, az tuning ister
- Python: `prophet` paketi
- **Bu motorun varsayılanı.** İlk tam ürünü ile çıkarken Prophet kullanılacak.

#### **ARIMA (AutoRegressive Integrated Moving Average)**
- Geleneksel zaman serisi modeli
- Stationarity gerektirir (ön işleme)
- Prophet ile karşılaştırma için tutulur, varsayılan değil

#### **XGBoost**
- Tabular veri kralı
- Feature engineering ağır: kur, kampanya, hava, geçen ay siparişi vs.
- Doğruluk en yüksek ama açıklanması zor (SHAP gerek)

#### **LSTM / Transformer**
- Çok bayili + çok ürünlü ortamda **tek model** ile ortak desen öğrenir
- Faz 7 hedefi. Faz 2'de **gerek yok**.

### 2.3 Algoritma seçim mantığı (kod sahte kodu)

```ts
function tahminMetoduSec(bayi: Bayi, urun: Urun): Metod {
  const veri = veriOzeti(bayi.id, urun.id);

  if (veri.toplamSiparis < 10) return 'naive';
  if (veri.aySayisi < 6) return 'mevsimsel_ortalama';
  if (veri.aySayisi < 12) return 'lineer_regresyon';
  if (veri.aySayisi < 24) return 'prophet';
  if (veri.aySayisi >= 24 && veri.feature_count >= 10) return 'xgboost';
  return 'prophet';  // güvenli varsayılan
}
```

---

## 3. Eğitim Verisi — minimum gereksinimler

### 3.1 Tablo bazlı

| Veri kalemi | Kaynak | Minimum | İdeal |
|-------------|--------|---------|-------|
| Geçmiş siparişler | `satis_siparisleri` + `siparis_kalemleri` | 6 ay | 2 yıl |
| Bayi metadata | `musteriler` (sektör, bölge, çalışan sayısı) | 1 satır | Tam doldurulmuş |
| Ürün metadata | `urunler` (kategori, fiyat, sezonluk_mu) | 1 satır | Tam doldurulmuş |
| Tatil takvimi | Sabit JSON | TR resmi tatiller | + dini tatiller |
| Kur kuru | TCMB API | 6 ay | Günlük 5 yıl |
| Kampanya geçmişi | `kampanyalar` (yeni tablo) | Yok da olur | Olgunlaşınca |
| Hava durumu | OpenWeather geçmiş API | Sezonsal sektörler için | Tüm bayiler |

### 3.2 Veri yetersizliği davranışı

| Durum | Aksiyon |
|-------|---------|
| Bayi 0-3 ay yeni | Tahmin yapma. UI'da "yeterli veri yok" göster, manuel öneri kabul et. |
| 3-6 ay | Sektör ortalamasını öneri olarak göster, "bayi-spesifik tahmin için 6 ay gerekiyor" uyarısı |
| 6-12 ay | Tahmin yap ama güven aralığını **geniş** tut (95% interval > %50 fark) |
| > 12 ay | Tam tahmin |

### 3.3 Verinin **kalite** kontrolü (eğitim öncesi)

```ts
const kaliteKontroller = [
  { ad: 'eksik_donem', kural: 'aylık veri en fazla 1 ay boş olabilir' },
  { ad: 'outlier', kural: 'IQR × 3 üstü değerler işaretlenir, modele girmez' },
  { ad: 'tek_seferlik', kural: 'tek seferlik 10× büyük sipariş ayrı işaretlenir' },
  { ad: 'duplicate', kural: 'aynı gün/aynı tutar siparişler birleştirilir' },
  { ad: 'iade', kural: 'iade edilen siparişler net hesabı düşürür' },
];
```

**Bayrak:** Eğitim verisinin %20'si bu kontrollerden geçemiyorsa, model eğitimi durur ve yöneticiye uyarı gider.

---

## 4. Bayi-spesifik mi, genel model mi?

### 4.1 Üç katmanlı strateji

```
                    ┌─────────────────────┐
                    │   GENEL MODEL       │  ← tüm bayilerden öğrenen
                    │   (LSTM / XGBoost)  │
                    └──────────┬──────────┘
                               ↓ tabanlık eder
                    ┌──────────┴──────────┐
                    │  SEGMENT MODELİ     │  ← bayi grubu (sektör, ölçek)
                    │  (Prophet)          │
                    └──────────┬──────────┘
                               ↓ ince ayar
                    ┌──────────┴──────────┐
                    │  BAYİ-ÜRÜN MODELİ   │  ← spesifik bayi + spesifik ürün
                    │  (Prophet)          │
                    └─────────────────────┘
```

### 4.2 Hangi durumda hangisi?

| Durum | Kullanılan model |
|-------|-----------------|
| Bayi yeni (< 6 ay) | **Genel model** + sektör segment modeli |
| Bayi olgun (> 12 ay) + ürün popüler | **Bayi-ürün modeli** |
| Bayi olgun + ürün nadir | **Bayi modeli** (ürün bazında değil, kategori bazında) |
| Tüm bayilerde yeni ürün lansmanı | **Genel model** + benzer ürün analojisi |

### 4.3 Model sayısı tahmini

```
Ortalama: 50 bayi × 200 ürün = 10.000 olası model
Pratik: ~500 bayi-ürün modeli + 20 segment modeli + 1 genel model
```

10.000 ayrı model **eğitilmez**. Sadece **aktif** olanlar (son 90 günde sipariş gelen) eğitilir. Diğerleri segment/genel modele düşer.

### 4.4 Model storage

```sql
CREATE TABLE tahmin_modelleri (
  id char(36) PK,
  scope ENUM('genel','segment','bayi','bayi_urun'),
  scope_value varchar(255),         -- 'bayi:abc-123:urun:xyz-456' veya 'segment:tekstil-orta'
  algoritma varchar(64),            -- 'prophet', 'xgboost' vs.
  egitim_tarihi datetime,
  egitim_verisi_baslangic date,
  egitim_verisi_bitis date,
  egitim_kayit_sayisi int,
  dogruluk_metrikleri JSON,         -- { mape: 0.18, rmse: 12.4, mae: 8.2 }
  hyperparametreler JSON,
  model_dosyasi_yolu text,          -- s3:// veya disk yolu
  aktif tinyint,
  notlar text
);
```

---

## 5. Mevsimsellik — hangi desenler yakalanır?

### 5.1 4 katman mevsimsellik

| Katman | Periyot | Örnek |
|--------|---------|-------|
| Haftalık | 7 gün | Pazartesi yüksek, Cumartesi düşük |
| Aylık | 30 gün | Ay başı/sonu sipariş yığılması (maaş, fatura döngüsü) |
| Mevsimsel | 3 ay | Yaz tekstil, kış inşaat |
| Yıllık | 365 gün | Bayram öncesi yığılma, vergi dönemi |

### 5.2 Tatil etkisi (Türk takvimi)

```python
turk_tatilleri = {
  'ramazan_bayrami': {'tarih': '2026-03-20', 'oncesi_etkisi_gun': 14, 'etki': 1.4},
  'kurban_bayrami': {'tarih': '2026-05-27', 'oncesi_etkisi_gun': 10, 'etki': 1.3},
  'cumhuriyet': {'tarih': '2026-10-29', 'oncesi_etkisi_gun': 3, 'etki': 0.7},
  'yilbasi': {'tarih': '2026-12-31', 'oncesi_etkisi_gun': 7, 'etki': 1.2},
}
```

**Etki**: tatilden N gün önce siparişlerin normal değerine **çarpan** uygulanır.

### 5.3 Sektör-spesifik özel günler

Bayinin sektörüne göre ek özel günler:
- **Tarım:** ekim/hasat dönemi
- **İnşaat:** ilkbahar açılış (Mart), kış kapanış (Kasım)
- **Tekstil:** sezon değişimi (Mart, Eylül)
- **Otomotiv:** model yılı geçişi (Ekim-Kasım)

---

## 6. Excel Girdi Formatı — kullanıcı veri yüklemesi

### 6.1 İki giriş yolu

1. **DB üzerinden** (Paspas içi siparişlerden otomatik) — varsayılan
2. **Excel/CSV upload** (geçmiş veriler, başka sistemden ihraç) — opsiyonel

### 6.2 Excel şablonu — `siparis_gecmisi_v1.xlsx`

| Kolon | Tip | Zorunlu | Açıklama | Örnek |
|-------|-----|---------|----------|-------|
| `tarih` | date | ✅ | Sipariş tarihi (YYYY-MM-DD) | 2025-08-15 |
| `bayi_kod` | string | ✅ | Bayi kodu (Paspas'ta tanımlı olmalı) | BAY-042 |
| `urun_kod` | string | ✅ | Ürün kodu (Paspas'ta tanımlı olmalı) | URN-STAR-SIYAH-100 |
| `adet` | int | ✅ | Sipariş adedi | 250 |
| `birim_fiyat` | decimal | ⚠️ | TL cinsinden | 18.50 |
| `iskonto_yuzde` | decimal | — | %5 = 5.00 (Paspas formatı) | 5.00 |
| `kampanya_kodu` | string | — | Kampanya varsa | YAZ2025 |
| `iade_mi` | bool | — | İade siparişi mi? | false |
| `notlar` | text | — | Serbest not | "yıllık çerçeve sözleşme" |

### 6.3 Yükleme akışı

```
1. Kullanıcı Excel yükler → /admin/tahmin-motoru/yukle
2. Backend doğrulama:
   - kolon kontrolü
   - bayi_kod / urun_kod Paspas'ta var mı?
   - tarih formatı?
   - adet > 0?
3. UI'da preview:
   "150 satır okundu. 142 geçerli, 8 hata. İlk 5 hata: ..."
4. Kullanıcı onayla → DB'ye yaz (siparis_gecmisi_yuklenen tablosuna)
5. "Modeli yeniden eğit" butonu aktif olur
6. Eğitim arka planda — 30 dakika sonra tamamlanma e-postası
```

### 6.4 Hata düzeltme

Hatalı satırlar **inline editor** ile düzeltilebilir:
- "Bayi kodu BAY-XYZ bulunamadı" → dropdown'dan seç veya yeni bayi oluştur
- "Tarih formatı geçersiz" → tarih seçici göster

---

## 7. Doğruluk hedefleri ve metrikler

### 7.1 Metrikler

| Metrik | Açıklama | Hedef |
|--------|----------|-------|
| **MAPE** (Mean Absolute Percentage Error) | Ortalama yüzde sapma | < %20 (olgun), < %35 (başlangıç) |
| **RMSE** (Root Mean Squared Error) | Büyük sapmaları cezalandırır | Bayi-ürün özel hedef |
| **MAE** (Mean Absolute Error) | Mutlak ortalama sapma | Yorumlaması kolay |
| **Bias** | Sistematik aşma/eksilme | Sıfıra yakın olmalı (±%5) |
| **Coverage** | %95 güven aralığı içine düşen gerçek değer oranı | > %90 |

### 7.2 Hedef aşamalı

| Dönem | MAPE hedefi | Açıklama |
|-------|-------------|----------|
| İlk 3 ay (canlıda) | < %50 | Naive üzerinde olsun yeter |
| 6 ay | < %35 | Prophet baseline |
| 12 ay | < %25 | Bayi-ürün modeller olgun |
| 24 ay | < %20 | XGBoost + multivariate |
| 36 ay | < %15 | "İyi" sektör seviyesi (Forecasting Pro Society) |

### 7.3 Karşılaştırma — naive baseline

Her tahmin için **mutlaka** naive baseline ile karşılaştırma yapılır.

```
iyilik_orani = (naive_mape - model_mape) / naive_mape

Eğer iyilik_orani < 0.10 (model naive'den %10 daha iyi değil)
→ Model değerli değil, naive kullan, eğitim israfını engelle
```

### 7.4 Otomatik model seçimi (champion/challenger)

- Her hafta 5 model paralel eğitilir: naive, mevsimsel, lineer, prophet, xgboost
- Test setinde MAPE en düşük olan **champion** olur
- Kullanılan model değişirse yöneticiye email
- Champion 2 hafta üst üste yenilenmedi → "değişiklik gerek yok, sistem stabil"

---

## 8. Model güncelleme — ne sıklıkla?

| Olay | Tetikleyici | Sıklık |
|------|-------------|--------|
| **Inkremental** | Yeni sipariş geldi | Anlık (model state'i günceller, tam re-train değil) |
| **Haftalık** | Cron pazartesi 03:00 | Tüm aktif bayi-ürün modelleri yeniden eğitilir |
| **Aylık** | Ayın 1'i | Hyperparameter optimization (Optuna) |
| **Tetikli** | MAPE eşik üstü | Anında re-train |
| **Manuel** | "Yeniden eğit" butonu | UI'dan yönetici tetikler |

---

## 9. Açıklanabilirlik — "neden bu tahmin?"

### 9.1 Kullanıcı sorduğunda

```
KULLANICI: "BAY-042 için 250 adet diyor, neden?"

SİSTEM:
  Tahmin: 250 adet (güven aralığı: 220-285, %95)
  Yöntem: Prophet
  Etki sıralı sinyaller:
    1. Geçen yıl aynı ay: 240 adet (+10 etki)
    2. Son 3 ay trend: artış (+15 etki)
    3. Mayıs ay-içi yüksek (sektör ortalaması): +5 etki
    4. Bayi 30 gün siparişsiz (-10 etki)

  Uyarılar:
    ⚠ Geçen ay outlier (kampanya); modelden çıkarıldı
    ⚠ Bayi son 3 ayda %20 azalma — ileri trend kırılma riski
```

### 9.2 SHAP (XGBoost için)

XGBoost modeli kullanılınca her tahmin için SHAP değerleri saklanır → "hangi özellik tahmini ne kadar etkiledi" görselleştirilir.

---

## 10. Tablolar — DB şeması

```sql
CREATE TABLE tahmin_calistirma (
  id char(36) PK,
  bayi_id char(36),
  urun_id char(36),
  donem_baslangic date,
  donem_bitis date,
  tahmini_adet decimal(12,2),
  guven_alt decimal(12,2),
  guven_ust decimal(12,2),
  guven_yuzdesi decimal(4,2),     -- 0.80, 0.95
  guven_skoru decimal(4,2),
  metod varchar(64),
  model_id char(36),                -- tahmin_modelleri.id
  sinyaller JSON,
  uyari_bayraklari JSON,
  calistirma_zamani datetime,
  INDEX (bayi_id, urun_id, donem_baslangic)
);

CREATE TABLE tahmin_dogruluk (
  id char(36) PK,
  tahmin_id char(36),               -- tahmin_calistirma.id
  gercek_adet decimal(12,2),        -- gerçekleşen sipariş
  mape decimal(8,4),
  rmse decimal(12,4),
  bias decimal(8,4),
  hesaplandi_at datetime,
  INDEX (tahmin_id)
);

CREATE TABLE siparis_gecmisi_yuklenen (
  id char(36) PK,
  yukleyen_user_id char(36),
  dosya_adi varchar(255),
  satir_sayisi int,
  basarili int,
  hata int,
  durum ENUM('yuklendi','isleniyor','tamamlandi','hatali'),
  hata_log JSON,
  yuklendi_at datetime
);
```

---

## 11. UI — `/admin/tahmin-motoru`

### 11.1 Ana sayfa
- Aktif bayiler tablosu: bayi adı, son 30 gün ciro, sonraki 30 gün tahmini
- Heatmap: bayi × ay → tahmini sipariş hacmi
- Top 5 yükselen, Top 5 düşen bayi

### 11.2 Bayi-detay
- Bayi sipariş geçmişi grafiği
- Tahmin grafiği (tarihsel + 30 gün ileri)
- "Hangi ürün, ne kadar, ne zaman" tablosu
- Açıklayıcı sinyal listesi

### 11.3 Model laboratuvarı (admin only)
- Eğitim çalıştır / durdur
- Algoritma karşılaştırma: 5 model yan yana metrikler
- Hyperparameter tuning (Optuna)
- Model versiyonu rollback

### 11.4 Excel yükleme
- Drag-drop alanı
- Şablon indir butonu (`siparis_gecmisi_v1.xlsx`)
- Preview tablosu (validasyon sonucu)
- Hata düzeltme inline

---

## 12. Açık karar noktaları (Faz 2)

1. **Varsayılan algoritma:** Prophet mu, ARIMA mı? (Önerim: Prophet)
2. **Tatil takvimi:** sabit JSON mu, kullanıcı yönetebilsin mi?
3. **Excel upload:** zorunlu mu, opsiyonel mi? (Önerim: opsiyonel — DB içi veriden başla)
4. **Model storage:** disk mi, S3 mü? (Önerim: ilk faz disk; ölçek olunca S3)
5. **MAPE açıklama UI:** SHAP plot mu, basit liste mi? (Önerim: basit liste; SHAP advanced mode)
6. **Re-train sıklığı:** haftalık mı, günlük mü?
7. **Naive baseline aşama:** sadece test set mi, üretimde de paralel koşsun mu?

---

## 13. Faz 2 çıktı listesi (kabul kriterleri)

✅ DB tabloları oluşturuldu
✅ `siparis_gecmisi_yuklenen` Excel upload UI çalışıyor
✅ Naive + Mevsimsel + Lineer Regresyon + Prophet 4 algoritma implement edildi
✅ Champion/challenger seçimi otomatik
✅ Tahmin sonucu UI'da gösteriliyor (bayi-ürün heatmap)
✅ Açıklanabilirlik (sinyal listesi) çalışıyor
✅ MAPE % 35 altı en az 10 bayide
✅ Yönetici "manuel re-train" yapabiliyor
✅ Audit log: her tahmin saklanır, gerçekleşen ile karşılaştırılır
