# 04 — Stok Tüketim Tahmini & Otomatik Satın Alma

> **Bağlam (v1.1):** Bu doküman **Faz 4 — Stok & Tedarik Otomasyonu**'nun stok tarafını anlatır. Tedarikçi tarafı: [`03-tedarikci-yonetimi.md`](./03-tedarikci-yonetimi.md). Sipariş tahmin motoru (Faz 2) bu modülü besler — derinlemesine: [`12-tahmin-motoru-derinlemesine.md`](./12-tahmin-motoru-derinlemesine.md).

## Hipotez

> Geçmiş tüketim hızı + bekleyen üretim ihtiyacı + tedarikçi lead time + güvenlik stoğu kullanılarak: "X ürünü Y tarihinde Z adet sipariş et" sinyali otomatik üretilebilir. İnsan onayı zincirde kalır ama hesabı sistem yapar.

## Sorun tanımı

Bugün:
- Stok kritik seviyenin altına düşünce kullanıcı manuel fark ediyor → reaksiyon gecikme
- "Önümüzdeki 15 günde patlayacak ürünler" görünmüyor
- Satın alma kararı eski sezonun manuel hafıza alışkanlığına bağlı
- Stok tutma maliyeti hesaplanmıyor (fazla stok = işletme sermayesi tıkanması)

## Önerilen mimari

### Adım 1 — Tüketim hızı view'ı

```sql
CREATE VIEW v_urun_tuketim_hizi AS
SELECT
  u.id, u.kod, u.ad, u.kategori, u.stok, u.kritik_stok, u.stok_takip_aktif,

  -- Son 30 günün ortalama günlük tüketimi (cikis hareketleri)
  COALESCE(SUM(CASE WHEN h.created_at > NOW() - INTERVAL 30 DAY
                    THEN h.miktar END), 0) / 30 AS gunluk_30g,

  -- Son 90 günün ortalama günlük tüketimi (mevsimsellik için)
  COALESCE(SUM(CASE WHEN h.created_at > NOW() - INTERVAL 90 DAY
                    THEN h.miktar END), 0) / 90 AS gunluk_90g,

  -- Son 365 gün
  COALESCE(SUM(CASE WHEN h.created_at > NOW() - INTERVAL 365 DAY
                    THEN h.miktar END), 0) / 365 AS gunluk_365g

FROM urunler u
LEFT JOIN hareketler h
  ON h.urun_id = u.id
  AND h.hareket_tipi = 'cikis'
  AND h.referans_tipi IN ('uretim','uretim_emri','montaj')
WHERE u.kategori IN ('hammadde','yarimamul','operasyonel_ym')
  AND u.stok_takip_aktif = 1
GROUP BY u.id;
```

### Adım 2 — Tahmin formülü

**Klasik EOQ + güvenlik stoğu (faz A):**
```
gunluk_tuketim = max(gunluk_30g, gunluk_90g * 0.7)   -- son trend ağırlıklı
lead_time_gun = tedarikci.ortalama_lead_time
guvenlik_stogu = gunluk_tuketim * lead_time_gun * 1.5  -- %50 buffer
yeniden_siparis_noktasi = gunluk_tuketim * lead_time_gun + guvenlik_stogu

eger urun.stok <= yeniden_siparis_noktasi:
  onerilen_siparis_tarihi = bugün
else:
  kalan_gun = (urun.stok - yeniden_siparis_noktasi) / gunluk_tuketim
  onerilen_siparis_tarihi = bugün + kalan_gun
  
onerilen_miktar = max(min_alim_miktari, gunluk_tuketim * 30)  -- 30 günlük talep
```

**Mevsimsellik (faz B):**
- Aylık tüketim tablosu çıkar (son 24 ay)
- ARIMA/Prophet ile bir sonraki ay tahmin
- Üst-alt güven aralığı

**LLM destekli (faz C):**
- "Önümüzdeki 6 ay üretim planında şu siparişler bekliyor, şu reçetelerde X hammadde geçiyor, mevsim, tedarikçi lead time, güvenlik stoğu — optimal satın alma takvimi öner"

### Adım 3 — Satın alma takvimi tablosu

```sql
CREATE TABLE satin_alma_onerileri (
  id char(36) PK,
  urun_id char(36) FK,
  onerilen_siparis_tarihi date,
  onerilen_miktar decimal(12,4),
  onerilen_tedarikci_id char(36) NULL,    -- mevcut performansı en yüksek
  alternatif_tedarikciler JSON,            -- 2-3 alternatif
  hesaplama_metodu ENUM('basit_eoq','mevsimsellik','llm'),
  hesaplama_detay JSON,                    -- {gunluk_tuketim, lead_time, guvenlik...}
  durum ENUM('oneriden','onaylandi','reddedildi','siparise_donustu'),
  siparis_id char(36) NULL,
  uyari_seviyesi ENUM('bilgi','uyari','kritik'),
  generated_at datetime,
  reviewed_at datetime,
  reviewed_by_user_id char(36)
);
```

### Adım 4 — Üretim ihtiyacı entegrasyonu

`uretim_emirleri` + reçete kalemleri'nden **bekleyen hammadde tüketimi**:
```sql
SELECT
  rk.urun_id AS hammadde_id,
  SUM(rk.miktar * ue.planlanan_miktar / r.hedef_miktar) AS bekleyen_ihtiyac,
  MIN(ue.termin_tarihi) AS en_yakin_termin
FROM uretim_emirleri ue
JOIN receteler r ON r.id = ue.recete_id
JOIN recete_kalemleri rk ON rk.recete_id = r.id
WHERE ue.durum IN ('atanmamis','planlandi','uretimde')
  AND ue.is_active = 1
GROUP BY rk.urun_id;
```

Bu satır tüketim hızının üzerine **üst sınır olarak** eklenir: "30 günde ortalama 100 kg hammadde tüketiyoruz ama bekleyen üretim için 250 kg gerekiyor → siparişi öne çek".

### Adım 5 — Cron + bildirimler

Günlük cron 06:00:
1. Tüm aktif takipli ürünler için yeniden sipariş hesabını yap
2. Yeni öneri varsa `satin_alma_onerileri` tablosuna yaz
3. `uyari_seviyesi=kritik` ise `notifications` modülünden admin'e push

## Dashboard görünümleri

| Pencere | İçerik |
|---------|--------|
| **Bugün sipariş edilmesi gereken** | Yeniden sipariş noktasını geçmiş ürünler |
| **Önümüzdeki 7 gün** | Yakın zamanda kritik olacak ürünler |
| **Stok fazlası uyarısı** | Tüketim hızına göre 90+ günlük stok = bağlı sermaye |
| **Trend değişim alarmı** | Son 30 gün tüketimi 90 gün ortalamasından %50+ sapmış ürünler |

## Açık sorular

1. **Lead time kaynağı:** tedarikçi-ürün bazında mı saklanacak (`tedarikci_urun_lead_time` ek tablo) yoksa tedarikçi seviyesinde ortalama mı yeter?
2. **MOQ (minimum sipariş miktarı):** tedarikçi bazlı mı, ürün bazlı mı? Şu an sistemde yok.
3. **Otomatik satın alma siparişi açma:** `onerilen → siparise_donustu` adımı tek tık mı, çoklu onay mı? Hangi tutarın altı otomatik?
4. **Mevsimsellik:** plastik enjeksiyon sektörü için mevsimsel desen var mı? (paspas → otomotiv hat planlaması, otelcilik?)
5. **Para birimi/kur:** ithal hammadde için kur risk yönetimi sistemce yapılsın mı?
6. **Stok tutma maliyeti hesabı:** %2/ay gibi bir varsayım mı, gerçek WACC mi?

## Bağımlılıklar

- ✅ `urunler`, `hareketler`, `uretim_emirleri`, `receteler`, `recete_kalemleri` mevcut
- ✅ `stok_takip_aktif` filtresi var
- ⚠️ Tedarikçi lead time verisi şu an yok — tedarikçi yönetim modülünden gelmeli (bkz. [03-tedarikci-yonetimi.md](./03-tedarikci-yonetimi.md))
- ⚠️ MOQ/güvenlik stoğu `urunler` üzerinde yok; ek alan gerek

## Tahmini iş büyüklüğü

| Faz | İçerik | Süre |
|-----|--------|------|
| A1 | View'lar + faz A formülü + cron | ~3 gün |
| A2 | `satin_alma_onerileri` tablosu + dashboard | ~3 gün |
| A3 | Üretim ihtiyacı entegrasyonu (reçete tüketim toplamı) | ~2 gün |
| A4 | Otomatik taslak satın alma siparişi (insan onaylı) | ~2 gün |
| B1 | Mevsimsellik (Prophet/ARIMA Python servisi) | ~5-7 gün |
| C1 | LLM destekli takvim önerisi | ~3-5 gün |
| **Toplam Faz A** | İlk değer üreten sürüm | **~10-12 iş günü** |
