# 02 — Müşteri Keşif Otomasyonu (Yurt İçi + Yurt Dışı)

> **Bağlam (v1.1):** Bu doküman **Faz 3 — Müşteri Keşif Motoru**'nun temel hipotez ve yöntemini anlatır. Güncel resmî yapı: [`proje-teklifi/02-cozum-genel-bakis.md`](../proje-teklifi/02-cozum-genel-bakis.md#faz-3--müşteri-keşif-motoru). CRM kararı: [`10-crm-karari.md`](./10-crm-karari.md). SaaS bütçe: [`08-saas-butce-analizi.md`](./08-saas-butce-analizi.md).

## Hipotez

> Mevcut müşteri profili (sektör, bölge, sipariş hacmi, ürün karması) çıkarılırsa; aynı profile uyan yeni firmalar **otomatik aranabilir**, skorlanıp satış ekibinin önüne düşürülebilir. Bu, soğuk arama randımanını ciddi yükseltir.

## Sorun tanımı

Bugün:
- Yeni müşteri = ekip arkadaşının çevresi + fuar + tavsiye. Yani **şanssal**.
- Mevcut müşterilerin profili (sektör/skala/coğrafya) **sistemde tanımlı değil** — sadece `musteriler.ad/adres/telefon`.
- Yurt dışı genişleme **öncelikle dil bariyeri + erişim kanalı yok** olduğu için ele alınmamış.

## Önerilen mimari — üç faz

### Faz 1 — Mevcut müşteriyi profilleme

Yeni alanlar (`musteriler` tablosuna ek + ayrı `musteri_profili` tablosu):

```sql
ALTER TABLE musteriler ADD COLUMN sektor varchar(64);
ALTER TABLE musteriler ADD COLUMN sehir varchar(64);
ALTER TABLE musteriler ADD COLUMN ulke varchar(64) DEFAULT 'TR';
ALTER TABLE musteriler ADD COLUMN olcek ENUM('mikro','kucuk','orta','buyuk');

CREATE TABLE musteri_profili (
  musteri_id char(36) PK FK,
  toplam_siparis_tutari decimal(14,2),
  ortalama_aylik_siparis_tutari decimal(14,2),
  en_cok_alinan_urun_kategorileri JSON,  -- ["urun:STAR", "urun:MAXIMUM"]
  ilk_siparis_tarihi date,
  son_siparis_tarihi date,
  siparis_sıklığı_gun decimal(8,2),       -- aylık ortalama gün
  segment varchar(32),                    -- otomatik segmentasyon: "premium","düzenli","tek_seferlik"
  recalc_at datetime
);
```

`musteri_profili` haftalık cron ile (re)hesaplanır. Bu olmadan keşif arama kriteri yok.

### Faz 2 — Mevcut müşteriden segment çıkarımı

K-means veya basit kuralcı segmentasyon:
- **Premium:** son 12 ay > X TL ciro + sipariş sıklığı yüksek
- **Düzenli:** orta hacim, mevsimsel
- **Tek seferlik:** 1-2 sipariş, sonra sessiz
- **Kayıp:** son 6 ay sıfır sipariş

Her segment için "ideal müşteri profili" (ICP) çıkar: hangi sektör, hangi ölçek, hangi şehir, hangi ürünler.

### Faz 3 — Lead keşif kanalları

Yurt içi:

| Kaynak | Erişim | Veri | Maliyet |
|--------|--------|------|---------|
| **Ticaret Sicili Gazetesi** | API yok, scrape edilebilir (firma açılış ilanları, sektör, ortaklar) | Yarı yapılandırılmış HTML | Düşük (zaman) |
| **TOBB Üye Veritabanı** | Web sorgu | Sektör + il + üye no | Düşük |
| **Sektörel B2B platformlar** (Sanayim.net, EkoB2B) | Scraping | Firma profili + ürün katalogu | Düşük |
| **Google Maps Places API** | Resmi API | Sektör + konum + iletişim | $17 / 1000 req |
| **LinkedIn Sales Navigator** | Resmi API'ı yok, scrape de yasak | Yöneticiler | Yüksek (insan) |

Yurt dışı:

| Kaynak | Erişim | Veri | Maliyet |
|--------|--------|------|---------|
| **Alibaba Trade Show** | RFQ feed scrape | Talep eden firmalar | Düşük |
| **Google Maps Places** | Tüm ülkeler | Konum + sektör | $17 / 1000 |
| **Apollo.io / Lusha / Hunter.io** | API + email enrichment | E-posta + CEO/satın alma yetkili | $50-200/ay |
| **Sektör fuarları (Messe Frankfurt, Heimtextil)** | Katılımcı listesi PDF | Fuar bazında | Manuel |
| **B2B SaaS:** ZoomInfo, Dun & Bradstreet | API | Tam profil + finansal | $$$ |
| **Türkiye İhracatçılar Meclisi (TİM)** | Üye listesi | İhracatçı firmalar | Düşük |

**Önerilen başlangıç paketi (yurt içi):** Google Maps Places + TOBB + sektörel B2B scraping.
**Önerilen başlangıç paketi (yurt dışı):** Hunter.io (email) + Apollo.io free tier + LinkedIn manuel.

### Faz 4 — Skorlama ve outreach

Her keşfedilen lead için:
```sql
CREATE TABLE lead_havuzu (
  id char(36) PK,
  kaynak varchar(64),                    -- 'tobb', 'google_places', 'apollo', 'manuel'
  firma_adi varchar(255),
  sektor varchar(64),
  sehir varchar(64),
  ulke varchar(64),
  iletisim JSON,                         -- {email, telefon, web, linkedin}
  benzerlik_skoru decimal(4,2),          -- mevcut müşterilerle vektör/kural benzerliği
  segment_eslestigi varchar(32),         -- "premium" segmentine en yakın
  durum ENUM('yeni','iletildi','red','musteri_oldu','arsiv'),
  notlar text,
  ham_metadata JSON,
  created_at, updated_at
);

CREATE TABLE lead_etkilesim (
  id char(36) PK,
  lead_id char(36) FK,
  tip ENUM('email','telefon','toplanti','sosyal_medya','diger'),
  tarih datetime,
  ozet text,
  cikti varchar(64),                     -- 'cevap_yok','olumlu','olumsuz','toplanti_alindi'
);
```

Skorlama formülü (basit başlangıç):
```
skor = 0.4 * sektor_eslesme + 0.3 * sehir_yakinligi + 0.2 * olcek_uyumu + 0.1 * sosyal_medya_aktif
```

Faz B'de LLM'den geçirilir: "şu mevcut müşteri profili + şu lead profili — uyum skorunu 0-100 arası ver, gerekçe yaz."

## Kullanılacak araçlar (özet)

| Araç | Rolü | Lisans |
|------|------|--------|
| **Crawlee** (Node.js) | Google Maps, Sanayim.net, TOBB scraping | Apache 2.0 |
| **Playwright** | JS-render eden sayfalar (LinkedIn) | Apache 2.0 |
| **Puppeteer-extra + stealth** | Bot algılama bypass | MIT |
| **Hunter.io API** | Email bulma | $49/ay |
| **Apollo.io API** | İletişim enrichment | Free tier 50 lead/ay |
| **Google Places API** | Konum tabanlı keşif | $17/1000 req |
| **PDF parser** (pdf-parse) | Fuar katılımcı PDF'i okuma | MIT |
| **Anthropic Claude** | Lead skoru, outreach metni üretme | Mevcut |

## Açık sorular

1. **Yasal:** Türkiye'de KVKK + GDPR (Avrupa lead'leri için) açısından şirket bilgisi (B2B) toplama nasıl konumlandırılır? Genelde "şirket bilgisi" kişisel veri sayılmaz ama CEO/satın alma yöneticisinin adı/email'i sayılır → opt-out altyapısı şart.
2. **Outreach kanalı:** Otomatik email mi, satış ekibi manuel mi? Otomatikse spam riski + domain reputasyon kaybı.
3. **Yurt dışı dil:** Çıktı promotional metinleri Türkçe + İngilizce + Almanca + Arapça mı? Hangi dilde?
4. **Bütçe:** Hunter.io + Apollo + Google Places aylık ~$100. Bu kabul edilebilir mi?
5. **CRM:** Lead pipeline yönetimi için açık kaynak CRM entegrasyonu (SuiteCRM/EspoCRM) yapılsın mı yoksa Paspas ERP içinde basit modül mü?

## Bağımlılıklar

- ✅ `musteriler` tablosu mevcut
- ⚠️ Müşteri profili çıkarımı için aylık ciro/sipariş sıklığı view'ı yok
- ⚠️ Web crawler altyapısı kurulu değil
- ⚠️ Lead pipeline arayüzü yok

## Tahmini iş büyüklüğü

| Faz | İçerik | Süre |
|-----|--------|------|
| 1 | Müşteri profili tablosu + cron + dashboard | ~3 gün |
| 2 | Segmentasyon kuralları + ICP çıkarımı | ~2 gün |
| 3a | İlk crawler: Google Places + TOBB | ~5-7 gün |
| 3b | Lead havuzu + skorlama + UI | ~5 gün |
| 3c | Crawler genişletme (sektörel B2B, fuar PDF) | ~5-10 gün (kapsama göre) |
| 4 | Outreach (manuel takip arayüzü) | ~3 gün |
| **Toplam başlangıç** | | **~20-30 iş günü** |

Yurt dışı (Apollo/LinkedIn) tarafı ayrı bir faz; başlangıçta yurt içi crawler + scoring + manuel outreach yeterli.
