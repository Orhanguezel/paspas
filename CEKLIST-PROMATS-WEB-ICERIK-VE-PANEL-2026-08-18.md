# Promats Web — İçerik Kaynağı, Çok Dillilik ve Panel İyileştirme Checklist'i

**Tarih:** 18 Ağustos 2026
**Kaynak dosya:** [Promats_Web içerkleri (2).xlsx](Promats_Web%20i%C3%A7erkleri%20(2).xlsx) — bundan sonra **tek doğruluk kaynağı**
**Kapsam:** promats.com.tr web içerikleri + `/admin/web-sayfasi` yönetim ekranı

---

## Özet — Ne Bulundu

| # | Konu | Durum |
|---|---|---|
| A | Excel içeriğinin siteye işlenmesi | 40 içerik satırı hazır, işlenmedi |
| B | "Taslak / İndekslenemez" rozeti | **Panel doğru, veri ve kod yanlış** — aşağıda |
| C | Çok dilli düzenleme (TR/EN yan yana) | Dil anahtarı var, aynı anda tek dil |
| D | JSON düzenleme formu | **Bileşen zaten repoda var**, bu ekrana bağlı değil |
| E | Formda görünmeyen alanlar | Ürün formu tam; **özellikler ve galeri hiç düzenlenemiyor** |
| F | Ürün görselleri (TeklifRota bulgusu) | 20 görselin 9'u kaynakta yanlış yol |

---

## A. Excel İçeriğinin Siteye İşlenmesi

Excel iki sayfadan oluşuyor: **Ürün İçerik Master** (91 satır, 40'ı yeni içerik) ve **Kullanım Notları**.

### Kullanım Notları — içerik sınıfları (Excel'den)

| Sınıf | Anlamı |
|---|---|
| **Ortak** | Bir kez hazırlanır; her ürün sayfasında ayrı ayrı görünür |
| **Uyarlanabilir** | İskelet ortaktır; ürün serisine göre gerekli bölümler uyarlanır |
| **Seriye Özel** | Her ürün serisi için özgün olarak hazırlanır |

> Excel notu: *"Ortak İçerik sütunu master metni tutar; ürün sütunları seriye özel/uyarlanmış metinler için kullanılır."*
> Bu ayrım işleme sırasında korunmalı — ortak metin 20 üründe tekrar tekrar elle yazılmamalı.

### İşlenecek bölümler

- [ ] **ANASAYFA (7 içerik)**
  - [ ] Slider 2 – Tasarım: başlık "Modern Tasarım, Günlük Konfor" + alt metin
  - [ ] Slider 3 – Üretim: "Üretimden Güven Doğar" + alt metin
  - [ ] Slider 4 – Dayanıklılık: "Zorlu Koşullar İçin Tasarlandı" + alt metin
  - [ ] Ürünler başlığı altına giriş metni
  - [ ] "2017'den Beri Üretim" rozeti
  - [ ] "Modern Üretim Altyapısı"
  - [ ] "25+ Ülkeye İhracat"
- [ ] **ÜRÜNLER SAYFASI (22 içerik)**
  - [ ] Sayfa üst başlığı: "UNIVERSAL PVC OTO PASPAS SERİLERİ"
  - [ ] "Promats Ürün Serileri" + tanıtım metni
  - [ ] "Universal Fit" bölümü
  - [ ] Rozetler: 4D KONSEPT · OEM KALİTE · **FONKSİYONEL TASARIM**
  - [ ] Kapanış metni + "Ürünlerimiz Hakkında Bilgi Alın" CTA
  - [ ] **ÜRETİM SAYFASI** alt bölümü: "Promats Üretim", üretim süreci metni, "25+ İhracat Ülkesi", "ÜRETİM TESİSİMİZ", "Modern Üretim", "Ürün Geliştirme"
- [ ] **Görsel bölümleri (11 içerik)**
  - [ ] 2. görsel: "Üretim Tesisi" + İstanbul tesisi açıklaması
  - [ ] 3. görsel: Ürün Geliştirme · Malzeme Geliştirme · Ürün Tasarımı ve Kalıp Mühendisliği · Kalite Kontrol · Güvenli Sevkiyat
  - [ ] Kurumsal: Avrasya Paspas Otomotiv tanıtımı, 2017 İkitelli OSB kuruluşu
  - [ ] "Çalışma Anlayışımızın Temelleri" (Kalite / …)
  - [ ] ISO 9001:2015 – Kalite Yönetim Sistemi bloğu

### ⚠️ Excel'de düzeltilmesi gereken yazım hatası

- [ ] Excel'de **"FOKNSİYONEL TASARIM"** iki satırda birden yanlış yazılmış → doğrusu **"FONKSİYONEL TASARIM"**. Siteye işlerken düzeltilecek; kaynak dosyada da düzeltilmesi önerilir.

### İşleme yöntemi

- [ ] İçerikler **elle panelden değil**, tercihen bir seed/migration script'i ile işlensin (`backend/src/db/seed/sql/` veya tek seferlik `scripts/`), böylece TR/EN eşleşmesi izlenebilir olur.
- [ ] Her içeriğin hangi tabloya/alana gittiği eşleme tablosu olarak yazılsın (`web_promats_home_sections`, `web_promats_special_pages`, `web_promats_static_texts`, `web_promats_products`).
- [ ] İşlem sonrası ilgili sayfalar tarayıcıda görsel olarak doğrulansın.

---

## B. 🔴 "Taslak / İndekslenemez" Rozeti — Kök Neden Bulundu

Ekranda **20 ürünün tamamı** "Taslak" ve "İndekslenemez" görünüyor.

### İlk bakışta panel hatası sanılabilir — değil

`web-sayfasi-client.tsx:710`:

```ts
const published = Number(row.status ?? 0) === 0;
```

Bu satır `status = 0` → yayında kabul ediyor. Bu CMS'te **doğru olan da bu**:

- `web_promats_articles` public sorgusu: `WHERE ... AND status=0` ([router.ts:347](backend/src/modules/web_promats/router.ts#L347))
- `web_promats_languages`: `is_active: Number(item.status) === 0` ([router.ts:198](backend/src/modules/web_promats/router.ts#L198))

Yani **`status=0` = yayında, `status=1` = pasif/taslak.**

### Gerçek sorun ikili

**1. Veri:** Canlıda TR ürünlerin **tamamı `status=1`** (pasif). Panel bunu doğru raporluyor.

| Dil | status=0 (yayında) | status=1 (taslak) |
|---|---:|---:|
| TR | 0 | **20** |
| EN | 8 | 12 |

**2. Kod:** Ürün public sorguları `status`'ü **hiç dikkate almıyor** — [router.ts:227](backend/src/modules/web_promats/router.ts#L227), [244](backend/src/modules/web_promats/router.ts#L244), [267](backend/src/modules/web_promats/router.ts#L267), [274](backend/src/modules/web_promats/router.ts#L274). Bu yüzden pasif işaretli ürünler sitede yine de görünüyor. Makaleler filtreliyor, ürünler filtrelemiyor — tutarsızlık.

### ⚠️ Sıralama kritik — yanlış sırada yapılırsa site boşalır

- [ ] **ÖNCE veri:** TR 20 ürün + EN 12 ürün `status=0` yapılsın (gerçekten yayında olanlar).
- [ ] **SONRA kod:** ürün sorgularına `AND status=0` eklensin.
- [ ] Ters sırada yapılırsa **20 ürünün tamamı siteden kaybolur.** Aynı şekilde veri düzeltilip kod eklenmezse rozet düzelir ama pasif ürün gizlenmemeye devam eder.
- [ ] EN tarafında 8/12 ayrımının kasıtlı olup olmadığı müşteriye sorulsun — bazı ürünler bilinçli olarak İngilizce yayında olmayabilir.
- [ ] Düzeltme sonrası hem panel rozeti hem canlı site kontrol edilsin.

### İndekslenebilirlik

`indexable = published && hasSlug && score >= 50` ([satır 713](admin_panel/src/app/\(main\)/admin/\(admin\)/web-sayfasi/web-sayfasi-client.tsx#L713)) — yani `status` düzelince bu da kendiliğinden düzelir, ayrıca SEO skoru 50+ olmalı.

- [ ] `status` düzeltmesi sonrası hangi ürünlerin hâlâ "İndekslenemez" kaldığı listelensin (SEO skoru düşük olanlar).

---

## C. Çok Dilli Düzenleme (TR / EN)

**Mevcut durum:** Panelde dil anahtarı **var** (`languageId`, varsayılan TR); ekranın üstündeki Türkçe/English düğmeleri listeyi ve önizlemeyi değiştiriyor. Ancak **aynı anda tek dil** düzenlenebiliyor; iki dili karşılaştırmak için sekme değiştirmek gerekiyor.

**Veri durumu iyi:** TR 20, EN 20 ürün mevcut; ikisinde de `detail_description` ve `seo_title` alanları **boş değil**. Yani İngilizce içerik zaten var, yalnız düzenleme deneyimi zayıf.

- [ ] Düzenleme panelinde **iki dili yan yana** gösteren bir görünüm (TR solda, EN sağda) — alan alan karşılaştırma.
- [ ] Alternatif/ek olarak: "Diğer dilden kopyala" düğmesi (boş alanları kaynak dilden doldurur).
- [ ] `source_language_id` alanı hâlihazırda tabloda var; çeviri kaynağını izlemek için kullanılabilir (şu an 0).
- [ ] EN tarafında eksik/çeviri bekleyen alanları raporlayan basit bir sayaç (ör. "3 alan çevrilmemiş").

---

## D. JSON Düzenleme Formu

**Bulgu:** `AdminJsonEditor` bileşeni **bu repoda zaten mevcut** — clanaquascaping'den kopyalamaya gerek yok:

- `admin_panel/src/app/(main)/admin/_components/common/AdminJsonEditor.tsx` (119 satır)
- `admin_panel/src/components/common/AdminJsonEditor.tsx` (re-export)
- Hâlihazırda `site-settings` ekranında kullanılıyor
- **`web-sayfasi` ekranında hiç kullanılmıyor** (0 referans)

Props sözleşmesi:

```ts
{ label?, value: unknown, onChange: (next) => void,
  onErrorChange?: (err: string | null) => void,
  disabled?: boolean, helperText?, height?: number }
```

> Not: `admin_panel/CLAUDE.md` "Detail Page Standartı" bölümü zaten **locale içeren her modülde JSON sekmesini zorunlu** kılıyor. Web içerik ekranı bu standarda uymuyor — yani bu bir yeni özellik değil, **eksik kalmış standart uygulaması**.

- [ ] Düzenleme sheet'ine mevcut sekmelerin (İçerik / Medya / SEO / Yayın) yanına **JSON** sekmesi eklensin.
- [ ] JSON sekmesi `value={formData}` ile **tüm kaydı** göstersin (yalnız bir bölümü değil) — standarttaki kural bu.
- [ ] `onChange` → `setFormData(prev => ({ ...prev, ...json }))`; `onErrorChange` ile geçersiz JSON'da kaydetme engellensin.
- [ ] **Çeviri akışı için asıl istenen:** TR ve EN kaydı **tek JSON** içinde birlikte veren bir görünüm (ör. `{ "tr": {...}, "en": {...} }`), böylece iki dil yapay zekâya birlikte kopyalanıp birebir yapıda çevrilmiş hâli geri yapıştırılabilsin.
- [ ] Geri yapıştırmada: alan adları değişmemiş mi, zorunlu alanlar boşalmamış mı — kaydetmeden önce doğrulama.
- [ ] `id`, `language_id`, `created_at` gibi teknik alanlar JSON'da **salt okunur** olsun veya hiç gösterilmesin; yanlışlıkla değiştirilmesi kaydı bozar.

---

## E. Formda Görünmeyen Alanlar

### Ürün formu — tam ✓

Ürün tablosunun **30 içerik alanının tamamı** formda tanımlı (teknik alanlar `id`, `language_id`, `source_language_id`, `created_at` hariç). Eksik alan yok.

### 🔴 Hiç düzenlenemeyen iki tablo

| Tablo | Kayıt | Panelde |
|---|---:|---|
| `web_promats_product_features` | **297** | ❌ ekran yok |
| `web_promats_special_page_gallery` | **8** | ❌ ekran yok |

Ürün özellikleri (`features`) frontend'e **servis ediliyor** ve ürün sayfalarında gösteriliyor ([router.ts `product()`](backend/src/modules/web_promats/router.ts) → `features` dizisi), ancak panelden **hiçbir şekilde düzenlenemiyor**. 297 kayıt yönetim dışı.

- [ ] `product_features` için düzenleme ekranı (ürün detayının altında liste: tip, sıra, görsel, metin).
- [ ] `special_page_gallery` için düzenleme ekranı (8 kayıt).
- [ ] Bu iki tablo da çok dilli mi kontrol edilsin — `features` tablosunda dil alanı var mı?

### Frontend'in kullandığı alanlar

`product()` DTO'su şu blokları üretiyor: `hero` (4 alan), `sections` (8 alan + 5 ölçü), `seo` (2), `detailContent` (7), `features` (dizi). Frontend bileşenleri `detailContent`, `advantages`, `technical`, `usage`, `material`, `universal` alanlarını kullanıyor.

- [ ] Frontend'de gösterilen her alanın panelde bir karşılığı olduğu **alan alan** doğrulansın (özellikle `s5_1..s5_5` ölçü alanları ve `detail_*` blokları).

---

## F. 🔴 Ürün Görselleri — TeklifRota'dan Gelen Bulgu

TeklifRota tarafı, Paspas'ın yayınladığı `teklifrota.products.v1` endpoint'ini kullanmaya geçerken bir hata bildirdi (kaynak: `fuar-teklif/CLAUDE.md`):

| Ürünler | Sözleşmenin verdiği görsel yolu | Sonuç |
|---|---|---|
| PROMATS-001…025 (9 adet) | `https://promats.com.tr/images/product/X.png` | **404** |
| PROMATS-026…036 (11 adet) | `https://promats.com.tr/userfiles/images/product/…` | 200 |

Doğrusu ilk gruba `/userfiles` ön eki eklenmesi. TeklifRota kendi tarafında dayanıklılık ekledi (20/20 görsel çalışıyor), **ancak asıl hata kaynakta** — bizim `absolutePromatsAsset()` fonksiyonumuz eski ürünler için ön eki eklemiyor.

- [ ] `backend/src/modules/web_promats/router.ts` → `absolutePromatsAsset()` eski yol biçimini de doğru mutlak adrese çevirsin.
- [ ] Aynı sorun **web sitesinin kendisinde** de var mı kontrol edilsin — 9 ürünün görseli sitede de kırık olabilir.
- [ ] Düzeltme sonrası 20 görselin 20'sinin de 200 döndüğü doğrulansın.

> Bu sözleşme "mutlak ve doğru adres" vaat ediyor; başka bir tüketici aynı tuzağa düşer.

---

## Önerilen Sıra

1. **F — görsel yolu** (küçük, canlıda kırık görsel var, TeklifRota bekliyor)
2. **B — status düzeltmesi** (veri → kod sırasıyla; rozetler ve gerçek yayın durumu düzelir)
3. **D — JSON sekmesi** (çeviri akışını açar; bileşen hazır, bağlanacak)
4. **C — çift dil görünümü** (D'nin üstüne oturur)
5. **A — Excel içeriğinin işlenmesi** (asıl içerik işi; C ve D hazırsa TR/EN birlikte girilir)
6. **E — özellikler ve galeri ekranları** (297 kayıt yönetim dışı; ayrı geliştirme)

## Doğrulama Kuralı

Her madde bitince: panelde kontrol → canlı sitede kontrol → gerekiyorsa ilgili yazılımcı notuna çözüm yazılıp `resolved` yapılır.
