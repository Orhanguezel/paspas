# 13 — Bayi Scraping & Churn Tahmini: Derinlemesine (Faz 5)

> **Felsefe:** Veriyi rakipten önce gör. Bayi siparişi azalmadan **3 ay önce** sinyali yakala. Bayi hareketlerini sosyal medya ve web sitesinden okuyarak rakibe **kaymadan** önce müdahale et.

---

## 1. Niye scraping?

### 1.1 Soru
> "Bayi X siparişi azaltmadan, hatta hesabı kapamadan, gidişatın bozulduğunu nasıl anlarız?"

Klasik ERP sadece **olduktan sonra** görür: "geçen ay sipariş yoktu". O zaman çoktan rakibe kaymıştır.

**Erken sinyal kaynakları:**
1. Bayi web sitesi: yeni ürün eklenmesi (rakip ürünü mü?), fiyat değişikliği, kampanya
2. Sosyal medya: Instagram/Facebook post sıklığı, etiketlenen markalar
3. Google Maps: yorum sayısı (bayi ne kadar aktif?)
4. E-ticaret: online satış var mı, hangi markalar görünür?
5. KVKK kayıtları, vergi kaydı, çağrı merkezi durumu (kapanmış mı?)
6. Sektör portalları: sanayim.net, bayi.net listelerinde değişiklik

### 1.2 Stratejik kazanım

| Sinyal | Etki |
|--------|------|
| Bayi sitesinde rakip ürün belirdi | Churn riski +30 puan |
| 60 gün post atılmamış | Aktivite düşük, +20 puan |
| Yeni distribütörlük etiketi | Olası başka markaya geçti +50 puan |
| Yorumlarda "kapandı", "yok" | Operasyonel sorun +40 puan |
| Sitenin .com → .com.tr değişimi | Şirket yeniden yapılanma +15 puan |
| Site ssl süresi geçti | Aktiflik düştü +10 puan |

Toplam churn skoru = 0-100 arası → 70+ bayi acil müdahale listesine.

---

## 2. Yasal sınırlar — KVKK, robots.txt, ToS

### 2.1 Yasal çerçeve

| Mevzuat | Kapsam | Bizim durum |
|---------|--------|-------------|
| **KVKK (TR)** | Kişisel veri (isim, telefon, email) | Sadece **firma verisi** topluyoruz, kişisel değil |
| **GDPR (AB)** | Kişisel veri | AB bayileri için aynı kural |
| **TCK 245-A** | Bilgi sistemine yetkisiz erişim | **Sadece public veri**, login arkasına geçmiyoruz |
| **TBK 49** | Haksız fiyat | Bayinin fiyatını kopyalayıp altına satmıyoruz; sadece sinyal |
| **robots.txt** | Yasal değil ama etik | **Saygı gösteriyoruz** — Disallow olan yere bakmıyoruz |
| **Site ToS** | Sözleşme | Public içerikte tipik olarak ToS'a aykırı değil; case-by-case |

### 2.2 Kırmızı çizgiler (asla)

- ❌ Login arkasına geçmek (bayi paneli, e-ticaret panel)
- ❌ Captcha bypass (reCAPTCHA, Cloudflare)
- ❌ Telefon numarası listesi çıkarmak (KVKK kişisel veri)
- ❌ Email harvesting (KVKK)
- ❌ Saniyede 10 isteği geçmek (DDoS algılama riski)
- ❌ User-agent gizleme/sahte (etik dışı)

### 2.3 Etik kurallar (yapılır)

- ✅ User-Agent: `MatPortalBot/1.0 (+https://matportal.com.tr/bot)` — açık kimlik
- ✅ robots.txt'e saygı (`robotparser` zorunlu)
- ✅ Crawl rate: domain başına **maks 1 istek/2 saniye**
- ✅ İçeriği saklarken **kaynak URL + scrape tarihi** birlikte
- ✅ Bayi açıkça "veri toplamasın" derse → silinir + blacklist
- ✅ KVKK aydınlatma metninde "rakip ve müşteri sitelerinden public veri topluyoruz" beyanı

### 2.4 Açıklığımız

Bayi sözleşmesine eklenir:
> "MatPortal hizmetinin geliştirilmesi amacıyla bayinin **public** web ve sosyal medya hesapları izlenir. Toplanan veri sadece dahili kullanım içindir, üçüncü tarafa paylaşılmaz."

---

## 3. Teknik altyapı

### 3.1 Stack

| Katman | Araç | Neden |
|--------|------|-------|
| Crawler framework | **Crawlee** (TypeScript) | Paspas backend ile uyumlu, queue/retry built-in |
| Browser automation | **Playwright** | JS-rendered siteler için |
| HTML parser | **Cheerio** | Static HTML için hızlı |
| Headless detection bypass | **playwright-extra** + stealth plugin | Sadece publicly erişilebilir siteler için |
| Proxy | **Bright Data** veya **Apify proxy** | IP banlanmamak için |
| Queue | **BullMQ** (Redis) | Iş kuyruğu, retry, scheduling |
| Storage | MySQL (`web_kazima_kayitlari`) + S3 (HTML snapshot) | Tutarlılık + audit |

### 3.2 Mimari

```
┌─────────────────────────────────────────────────┐
│  /admin/web-kazima — yönetici UI                │
│  - hedef listesi yönet                          │
│  - manual çalıştır                              │
│  - sonuç incele                                 │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Scheduler (BullMQ + cron)                      │
│  - haftalık tarama: tüm bayi siteleri           │
│  - günlük: yüksek öncelik bayilerin sosyal      │
│  - tetikli: yeni bayi eklendiğinde ilk tarama   │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Crawler workers (Crawlee)                      │
│  - robots.txt kontrolü                          │
│  - rate limit (1 req / 2 sec / domain)         │
│  - retry (max 3, exponential backoff)          │
│  - HTML snapshot S3'e                           │
│  - Parse → structured data                      │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Sinyal Çıkarıcı (LLM destekli)                 │
│  - HTML → "bu sayfada hangi markalar var?"      │
│  - Önceki snapshot ile diff                     │
│  - Sinyal listesi → DB                          │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Churn Tahmin Motoru                            │
│  - Sinyal × ağırlık → churn skoru               │
│  - Eşik üstü → uyarı + dashboard                │
└─────────────────────────────────────────────────┘
```

### 3.3 Crawl edilebilir kaynaklar

| Kaynak | Tip | Sıklık | Yasal |
|--------|-----|--------|-------|
| Bayi web sitesi | Direkt URL | Haftalık | ✅ public |
| Instagram (public) | Profil sayfası | Günlük | ⚠️ ToS dikkat |
| Facebook page | Public sayfa | Haftalık | ⚠️ ToS dikkat |
| Google Maps | Place Details API | Haftalık | ✅ resmi API |
| Sahibinden.com bayi listesi | Public liste | Aylık | ⚠️ ToS dikkat |
| sanayim.net | Public liste | Aylık | ✅ public |
| TOBB üye listesi | Public | Aylık | ✅ public |
| LinkedIn | Profil sayfası | — | ❌ ToS izin vermiyor |

**LinkedIn:** Yasal risk yüksek — kullanmıyoruz. Hunter.io / Apollo.io aracılığıyla zaten erişim var.

---

## 4. Sinyal türleri ve ağırlıklar

### 4.1 Tablo

| Sinyal | Kaynak | Tespit yöntemi | Churn etkisi (puan) | Doğrulama gerek |
|--------|--------|---------------|---------------------|-----------------|
| Yeni rakip ürün listesinde | Bayi sitesi | Önceki vs şu anki HTML diff | +30 | Yöneticiyle teyit |
| 60+ gün post yok | Instagram/Facebook | Son post tarihi | +20 | Mevsim mi normal mi? |
| Stok azalan kategorilerde "stokta yok" | Bayi e-ticaret | Ürün sayfası HTML | +25 | Doğrulama yok |
| Müşteri yorum sayısı düşüşü | Google Maps | Aylık review count | +15 | Mevsimsel kontrol |
| Negatif yorum oranı arttı | Google Maps | Sentiment analizi (LLM) | +20 | LLM güven < 0.8 ise atla |
| Site SSL geçmiş | SSL kontrol | TLS handshake | +10 | Otomatik |
| Domain expired | DNS | WHOIS | +50 | Doğrulama yok |
| Çağrı merkezi otomatik mesaj | Telefon (manuel) | İnsan girişi | +40 | İnsan onayı |
| Yeni distribütörlük markası | Sitedeki "markalarımız" sayfası | Diff | +50 | Yöneticiyle teyit |
| Çalışan azalması (LinkedIn'siz) | İş ilanları portallarında bayi adı yok | Aylık tarama | +15 | Doğrulama yok |
| Vergi mükellefi sorgu — kapalı | GIB API | Aylık | +60 | Otomatik (kritik) |

### 4.2 Skor toplama

```ts
function churnSkoruHesapla(sinyaller: Sinyal[]): {skor: number; risk: 'düşük'|'orta'|'yüksek'|'kritik'} {
  const ham = sinyaller.reduce((acc, s) => acc + s.puan * s.guven, 0);
  const skor = Math.min(100, ham);

  if (skor >= 70) return {skor, risk: 'kritik'};
  if (skor >= 50) return {skor, risk: 'yüksek'};
  if (skor >= 30) return {skor, risk: 'orta'};
  return {skor, risk: 'düşük'};
}
```

`guven`: 0.0-1.0. LLM'in sinyalden ne kadar emin olduğu. Düşük güven → puan azaltılır.

### 4.3 Aksiyon eşikleri

| Risk | Aksiyon |
|------|---------|
| Düşük (0-29) | Sessiz, dashboard'da yeşil |
| Orta (30-49) | Yöneticinin haftalık raporunda görünür |
| Yüksek (50-69) | Anlık email + dashboard sarı |
| Kritik (70+) | Anlık email + telefon araması listesi + dashboard kırmızı + AI öneri: "ne yapılmalı?" |

---

## 5. HTML diff — değişiklik yakalama

### 5.1 Strateji

Her crawl sonunda HTML S3'e kaydedilir + structured parse DB'ye. Önceki versiyon ile karşılaştırılır.

### 5.2 Parse hedefleri (bayi sitesi)

| Bölüm | Selector örneği | Çıkarılan veri |
|-------|------------------|----------------|
| Markalarımız | `.brands a, .markalar img` | Marka isimleri listesi |
| Ürün kategorileri | `.product-category, nav.menu li` | Kategori adları |
| Kampanya bandı | `.banner-promo, .campaign-text` | Kampanya başlığı |
| İletişim | `[itemtype*="ContactPoint"], .contact-info` | Adres, telefon (KVKK için saklamaz) |
| Sosyal medya linkleri | `a[href*="instagram"], a[href*="facebook"]` | Hesap username'leri |
| Footer "powered by" | `footer .powered, .copyright` | Yazılım sağlayıcı (Shopify, WooCommerce vs.) |

### 5.3 LLM destekli sinyal çıkarımı

HTML > 50KB için doğrudan LLM'e atılmaz, önce structured parse yapılır. Sonra:

```
PROMPT: "Aşağıda bir bayi web sitesinin önceki ve şu anki versiyonu var.
         Önemli değişiklikleri (yeni markalar, kampanyalar, kapanış uyarıları,
         operasyonel sorun belirtileri) JSON listesi olarak döndür."

GİRİŞ:  { onceki_markalar: [...], simdi_markalar: [...], kampanya_bandi: '...' }

ÇIKTI:
[
  {
    "tip": "yeni_marka",
    "deger": "RakipMarkaA",
    "guven": 0.95,
    "kanit": "markalar bölümünde önceden yoktu, şimdi var"
  },
  {
    "tip": "kampanya",
    "deger": "Yaz indirimi %30",
    "guven": 0.90
  }
]
```

LLM provider: **Groq (llama-3.1-70b)** — ucuz ve hızlı, structured output.

### 5.4 False positive kontrolü

- LLM güven < 0.8 → manuel onay kuyruğuna
- Aynı sinyal 2 hafta üst üste tekrarlanıyor → "doğrulanmış"
- Tek seferlik anomali → "şüpheli, gözle"
- Yöneticinin manuel "yanlış pozitif" işareti → modelden öğren

---

## 6. Sosyal medya — özel durum

### 6.1 Instagram (public)

**Yasal:** Public profil görüntülemek serbest. Login gerek olmadan görülebilen veri.

**Teknik:**
- Doğrudan scraping zor (Instagram aktif olarak engelliyor)
- Resmi Graph API: bayi izin vermek zorunda → düşük olasılık
- **Pratik:** Apify "Instagram Scraper" actor → $0.50/1000 profil, ToS uyumlu

**Toplanan:**
- Son post tarihi (60+ gün → aktivite düşük)
- Takipçi sayısı trendi (3 ay düşüyor → aktiflik azaldı)
- Etiketlenen markalar (rakip marka etiketi → kayma sinyali)
- Hashtag kullanımı (#rakipmarka)

### 6.2 Facebook (public page)

**Aynı yaklaşım:** Apify Facebook Page Scraper.

### 6.3 Limit

- Bayi başına ayda **5 dakika scraping**
- Toplam 100 bayi × 5dk = 500dk/ay = 8 saat/ay (Apify ücreti ~$10/ay)

---

## 7. Çağrı merkezi & insan girişi

Otomatik scraping'in göremediği sinyaller için **manuel form**:

```
/admin/bayi/{id}/manuel-sinyal
- "Bayiyi aradım: kapalı / cevap yok / yeni numara"  → puan +40
- "Bayi şubeleştiğini söyledi"  → +30 puan (negatif olmayan ama dikkat)
- "Bayi rakibe geçtiğini söyledi"  → +100 (kritik, bağlantıyı sonlandır)
```

Saha ekibi mobil uygulamadan giriş yapar. Herhangi bir formal sinyal LLM'in göremediği bilgiyi yakalar.

---

## 8. Churn tahmin modelinin kendisi

### 8.1 Yaklaşım iki katmanlı

| Katman | Yöntem | Çıktı |
|--------|--------|-------|
| **Kural bazlı** | Sinyal × ağırlık toplamı | Anlık churn skoru |
| **ML bazlı** | Lojistik regresyon → XGBoost | "30/60/90 gün içinde sipariş kesilme olasılığı" |

### 8.2 ML modeli

**Hedef değişken:** "60 gün içinde sipariş gelmeyecek mi?" (binary)

**Özellikler:**
- Son 90 gün sipariş sayısı
- Son 90 gün ciro
- Sipariş aralığı standart sapması (düzensizleşiyor mu?)
- Web kazıma sinyalleri (one-hot)
- Sektör, bölge, ölçek (bayi metadata)
- Son fatura yaşı
- Ödeme gecikme sayısı

**Algoritma:** XGBoost classifier (binary)

**Çıktı:**
```ts
{
  bayi_id: 'BAY-042',
  churn_olasilik_30gun: 0.72,
  churn_olasilik_60gun: 0.85,
  churn_olasilik_90gun: 0.91,
  en_etkili_3_sinyal: ['site_yeni_marka', 'instagram_post_yok', 'odeme_gecikti'],
  oneri: 'Bu hafta içinde telefon araması + indirim teklifi'
}
```

### 8.3 Validasyon

- 6 ay sonra "gerçekten churn etti mi?" check
- Confusion matrix: precision, recall, F1
- Hedef: precision > 0.7 (yanlış alarm az)
- Recall < 0.5 olabilir (kaçırdıklarımız manuel sinyalle yakalanır)

---

## 9. UI — `/admin/bayi-radari`

### 9.1 Ana ekran

**Heatmap matrisi:**
- Y ekseni: tüm bayiler
- X ekseni: son 12 hafta
- Hücre rengi: churn skoru

**Top liste:**
1. **Acil müdahale gereken** (kritik): bayi adı + sebep + öneri
2. **Riskli** (yüksek): yöneticinin haftalık takibi
3. **Stabil**: yeşil

### 9.2 Bayi detay (`/admin/bayi/{id}/radar`)

- Sinyal timeline (son 12 hafta)
- HTML snapshot karşılaştırma (öncesi / sonrası)
- Sosyal medya post timeline
- Önerilen aksiyonlar
- Aksiyon log: "20 Mart: arandı, kampanya teklif edildi → siparişler %20 arttı"

### 9.3 Aksiyon önerisi (LLM)

```
PROMPT: "Bayi BAY-042 için churn skoru 78. Sinyaller: rakip marka eklendi,
         60 gün post yok. Son 6 ayın sipariş geçmişi: ... Öneri ver:
         3 alternatif aksiyon, her biri için tahmini etkisi."

ÇIKTI:
[
  { aksiyon: 'Telefon araması + %5 ek iskonto', tahmini_etki: 'churn riski %78 → %50', maliyet: '5 dk + 8K TL/ay' },
  { aksiyon: 'Saha ziyareti + ürün eğitimi', tahmini_etki: 'churn riski %78 → %35', maliyet: 'tam gün + ulaşım' },
  { aksiyon: 'Bayi-spesifik kampanya', tahmini_etki: 'churn riski %78 → %60', maliyet: '15K TL kampanya bütçesi' }
]
```

---

## 10. DB şeması

```sql
CREATE TABLE web_kazima_hedefleri (
  id char(36) PK,
  bayi_id char(36),
  url varchar(500),
  tip ENUM('site','instagram','facebook','google_maps','linkedin'),
  oncelik ENUM('düşük','orta','yüksek','kritik'),
  sıklık ENUM('günlük','haftalık','aylık'),
  son_kazima datetime,
  sonraki_kazima datetime,
  aktif tinyint,
  notlar text
);

CREATE TABLE web_kazima_kayitlari (
  id char(36) PK,
  hedef_id char(36),
  baslangic datetime,
  bitis datetime,
  http_durum int,
  yanit_boyutu int,
  s3_yol text,                 -- HTML snapshot S3 yolu
  parse_basarili tinyint,
  hata text,
  parsed_data JSON
);

CREATE TABLE bayi_sinyalleri (
  id char(36) PK,
  bayi_id char(36),
  tip varchar(64),               -- 'yeni_marka', 'instagram_pasif' vb.
  deger varchar(500),
  kanit text,
  guven decimal(4,2),
  puan int,
  kaynak ENUM('web','sosyal','manuel','vergi','ml_model'),
  kaynak_kayit_id char(36),
  tespit_tarihi datetime,
  durum ENUM('yeni','dogrulandi','red','gozardi'),
  manuel_yorum text
);

CREATE TABLE churn_skor_gecmisi (
  id char(36) PK,
  bayi_id char(36),
  tarih date,
  skor decimal(5,2),
  risk ENUM('düşük','orta','yüksek','kritik'),
  aktif_sinyaller JSON,
  ml_olasilik_30 decimal(4,2),
  ml_olasilik_60 decimal(4,2),
  ml_olasilik_90 decimal(4,2),
  INDEX (bayi_id, tarih)
);

CREATE TABLE churn_aksiyon_log (
  id char(36) PK,
  bayi_id char(36),
  user_id char(36),
  aksiyon_tipi varchar(64),
  detay text,
  oncesi_skor decimal(5,2),
  sonrasi_skor decimal(5,2),
  yapildi_at datetime
);
```

---

## 11. Performans & maliyet

### 11.1 Ölçek

100 bayi × 5 hedef (site + 2 sosyal + Google Maps + e-ticaret) = 500 hedef
Haftalık tarama × 4 hafta = 2000 kazıma/ay

### 11.2 Maliyet

| Kalem | Aylık |
|-------|-------|
| Apify (Instagram + Facebook) | $10-20 |
| Bright Data proxy | $15 |
| S3 storage (1GB HTML snapshot) | $0.50 |
| LLM (sinyal çıkarımı, Groq) | $5-10 |
| **Toplam** | **~$30-45/ay** |

### 11.3 Ölçeklendirme

- 500 bayi → 2500 hedef → ~$100/ay
- 1000 bayi → 5000 hedef → ~$200/ay

---

## 12. Açık karar noktaları (Faz 5)

1. **LinkedIn:** ToS yüzünden sıfır mı, Hunter.io üzerinden dolaylı mı? (Önerim: dolaylı)
2. **Instagram:** Apify $20/ay olur mu, manuel mi? (Önerim: Apify)
3. **Bayi ToS:** Sözleşmeye scraping maddesi koymak şart mı? (Önerim: koy)
4. **Churn ML eşiği:** 0.5 mi, 0.7 mi? (Önerim: 0.6 ortayolu)
5. **Sosyal medya kapsam:** sadece bayi mi, müşteri de mi? (Önerim: ilk faz bayi)
6. **HTML snapshot saklama süresi:** 90 gün mü, 1 yıl mı? (Önerim: 90 gün; sonra metadata sadece)

---

## 13. Faz 5 çıktı listesi

✅ Crawlee + Playwright kurulu, robots.txt + rate limit aktif
✅ DB tabloları
✅ `/admin/web-kazima` UI: hedef yönetimi
✅ Haftalık cron ile tüm bayi siteleri taranır
✅ HTML diff → sinyal çıkarımı (LLM)
✅ Sinyal × ağırlık → churn skoru (kural bazlı)
✅ ML modeli (XGBoost) eğitilmiş, validasyon raporu
✅ `/admin/bayi-radari` heatmap + top liste
✅ Saha aksiyon log: önce/sonra ölçümleme
✅ Aydınlatma metni + bayi sözleşme maddesi yazılı
