# 01 — Talep Toplama & Üretim Tahmin Motoru

> **Bağlam (v1.1):** Bu doküman ilk taslakta talep + tahmini birleşik anlattı. Sonradan ikiye ayrıldı:
> - **Talep havuzu** = Faz 1 ([`proje-teklifi/02-cozum-genel-bakis.md`](../proje-teklifi/02-cozum-genel-bakis.md))
> - **Sipariş tahmin motoru** = Faz 2 — derinlemesine teknik tasarım: [`12-tahmin-motoru-derinlemesine.md`](./12-tahmin-motoru-derinlemesine.md) (kademeli algoritma paketi, MAPE hedefleri, Excel girdi, mevsimsellik)
>
> Bu dokümandaki kavramsal yaklaşım hâlâ geçerli; teknik detay derinlemesine doc'ta.

## Hipotez

> Birden fazla kanaldan gelen ham talepleri yapılandıran, bekleyen + tahmini taleplere göre üretim önerisi sunan, gerçekleşenle modeli kalibre eden bir döngü kurulursa: (a) talep cevap süresi düşer, (b) makine boş kalmaz, (c) acil sipariş üretim planını darbelemez.

## Sorun tanımı

Bugün:
- Talep formal sipariş haline gelmeden önce **WhatsApp, email, telefon notu, ziyaret defteri**'nde dağılmış.
- Üretim emri sadece **onaylı** sipariş geldikten sonra açılır → makine kapasitesi geç planlanır.
- Sezonsal/tekrarlayan paternler (örn. her Mart ayı X müşterisi 5000 adet alır) **insan hafızasında** kalır.

## Önerilen mimari

### Adım 1 — Talep girişleri

| Kanal | Yöntem | Veri |
|-------|--------|------|
| Web form (B2B portal) | Direkt API | Yapılandırılmış (ürün, miktar, termin, not) |
| Email | IMAP polling (`/modules/mail`'in genişletilmesi) → AI özet | Yarı yapılandırılmış |
| Telefon notu | Manuel girilen serbest metin → AI özet | Serbest metin |
| Whatsapp | Whatsapp Business API → webhook → AI özet | Serbest metin + ek dosya |
| Mevcut müşteri "tahmini" | İstatistiksel (geçmiş paterne dayalı otomatik öneri) | Sistemce üretilen |

Her giriş tek bir tabloda toplanır:

```sql
CREATE TABLE talep_havuzu (
  id char(36) PK,
  kaynak ENUM('form','email','telefon','whatsapp','tahmin'),
  ham_metin TEXT,
  ham_eklenti JSON,         -- email attach, dosya url
  durum ENUM('yeni','islendi','siparise_donustu','reddedildi','arsiv'),
  ai_yapilandirma JSON,     -- {urun_id?, miktar?, termin?, musteri_id?, guven_skoru}
  musteri_id char(36) NULL,  -- otomatik eşleştirme yapılırsa
  siparis_id char(36) NULL,  -- siparişe dönüştüyse
  created_at, updated_at
);
```

### Adım 2 — AI ile yapılandırma

Mevcut `test_center/ai_provider.ts` altyapısını yeniden kullan. Yeni provider modülü gerekmiyor.

Prompt stratejisi (örnek):
```
SİSTEM: Aşağıdaki ham müşteri talebini incele. Ürün katalogu ve mevcut müşteri
listesi referans olarak verilmiştir. Ürün/miktar/termin/müşteri eşleşmelerini JSON
olarak döndür. Eminliğin %75'in altında olan alanları null bırak ve guven_skoru
0.0-1.0 arası ver.

ÜRÜN_KATALOGU: [...]   (ilk N güvenilir eşleşme için kod+ad)
MUSTERI_OZET: [...]    (sadece text yakınlığı için)
HAM_METIN: "Merhaba, geçen ay aldığımız STAR SİYAH 4 parçadan 200 takım daha
            isteyeceğiz, ay sonuna kadar yetişmesi lazım. — Ahmet, Mavi Tekstil"

YANIT:
{
  "urun_kodu": "1101 104",
  "urun_adi": "STAR SİYAH -4 PARÇA-",
  "miktar": 200,
  "birim": "takım",
  "termin": "2026-04-30",
  "musteri_ipucu": "Mavi Tekstil",
  "guven_skoru": 0.85,
  "notlar": "Ahmet imzalı; geçen ay tekrar siparişi"
}
```

### Adım 3 — Üretim tahmini

Modeller (basitten karmaşığa):

**Faz A — istatistiksel:**
- Onaylı sipariş kalemlerinin termin/miktar dağılımını çıkar
- `talep_havuzu` üzerinden henüz onaylanmayan (durum=yeni/işlendi) talepleri "olası gelir" listesine al
- Her ürün için son 90/180 günün haftalık ortalaması (mevsimsellik için aylık ortalamayı da al)
- Olasılık ağırlıklı toplam: `tahmin_uretim = onayli_siparis + olasi_talep × guven_skoru + dönemlik_baseline`

**Faz B — zaman serisi:**
- `prophet` (Facebook) veya `statsforecast` Python kütüphaneleri — Bun/Fastify dışında ayrı bir Python servisi
- Haftalık tahmin + güven aralığı
- Tatil/fuar takvimi external regressor olarak

**Faz C — LLM kararsal asistan:**
- "Şu son 30 günün siparişleri var, şu makinelerde X kapasite var, şu olası talepler bekliyor — önümüzdeki 4 hafta için optimal üretim planı öner" promptu
- Çıktı yapılandırılmış: hangi gün hangi makinede ne üretmeli
- İnsan onayı zorunlu

Faz A yeterli zaman çoğunlukla — Faz B/C üzerinde durmadan önce A iyice oturmalı.

### Adım 4 — Geri besleme

```sql
CREATE TABLE talep_tahmin_sonuclari (
  id char(36) PK,
  tahmin_tarihi date,           -- hangi günün tahmini
  tahmin_pencere ENUM('1g','7g','30g'),
  tahmini_miktar decimal(12,4),
  gerceklesen_miktar decimal(12,4),
  sapma_yuzde decimal(5,2),
  urun_id char(36),
  hesaplandi_at datetime
);
```

Haftada bir cron: bir önceki haftanın tahminlerini gerçekleşenle karşılaştır → sapmayı hesapla → modelin parametrelerini güncelle (Faz A için baseline ağırlıkları, Faz B için model retraining).

## Riskler

| Risk | Etki | Önlem |
|------|------|-------|
| AI yanlış müşteri/ürün eşleşmesi | Yetkisiz iletişim, üretim hatası | Düşük guven_skorlu eşleşmeler "manuel onay" durumunda kalsın; hiç bir aksiyon AI ile otomatik tetiklenmesin |
| Email phishing/spam'e cevap üretmek | Boş üretim emri açma | Whitelist domain veya manuel onay zinciri |
| Model overfit (geçmiş paterni geleceğe yansıtma) | Yanlış stok/üretim | Geri besleme + sapma alarmı |
| KVKK uyumsuzluğu | Yasal risk | Müşteri verileri saklama süresi tanımlı; e-mail içeriği AI'a gönderiliyorsa açık onay |

## Açık sorular

1. **Email kaynak:** Hangi email hesabı(ları) IMAP ile dinlenecek? Genel `info@` mı, satış ekibi kişiselleri mi?
2. **Whatsapp Business API:** kurulu mu, yoksa şimdilik manuel kopyala-yapıştır arayüzü mü?
3. **Onay sınırı:** AI'nın önerdiği `talep_havuzu → siparis` dönüşümü hangi `guven_skoru`nun üzerinde otomatik gerçekleşsin? `0.95` mi (çok muhafazakar), `0.80` mi?
4. **Tahmin pencere:** üretim planlama 7 gün ileri mi 30 gün ileri mi yapılsın? Her ikisi mi?
5. **Manuel "tahmini sipariş" girişi:** satış ekibi "bu müşteriden Şubat'ta sipariş geleceği kesin" diye manuel ekleyebilsin mi?

## Bağımlılıklar

- ✅ `test_center/ai_provider.ts` — provider abstraction zaten hazır
- ⚠️ Mail modülü IMAP polling — şu an yok
- ⚠️ B2B portal/web form — şu an yok (basit bir public form sayfası ile başlanabilir)
- ⚠️ Whatsapp Business API — opsiyonel, faz 2

## Tahmini iş büyüklüğü

| Faz | İçerik | Süre |
|-----|--------|------|
| A1 | Talep havuzu DB + manuel giriş UI + ürün/müşteri eşleşme | ~3-5 gün |
| A2 | Email IMAP + AI özetleme | ~3 gün |
| A3 | Faz A istatistiksel tahmin + dashboard | ~3-4 gün |
| Geri besleme | Cron + sapma raporu | ~1-2 gün |
| **Toplam Faz A** | İlk değer üreten sürüm | **~10-15 iş günü** |
