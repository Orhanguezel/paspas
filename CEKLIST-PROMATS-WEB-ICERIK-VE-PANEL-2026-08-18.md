# Promats Web — İçerik Kaynağı, Çok Dillilik ve Panel İyileştirme Checklist'i

**Tarih:** 18 Ağustos 2026
**Kaynak dosya:** [Promats_Web içerkleri (2).xlsx](Promats_Web%20i%C3%A7erkleri%20(2).xlsx) — bundan sonra **tek doğruluk kaynağı**
**Kapsam:** promats.com.tr web içerikleri + `/admin/web-sayfasi` yönetim ekranı

---

## Özet — Ne Bulundu

| # | Konu | Durum |
|---|---|---|
| A | Excel içeriğinin siteye işlenmesi | 40 içerik satırı hazır, işlenmedi |
| B | "Taslak / İndekslenemez" rozeti | ✅ **çözüldü** — commit `62763ef`, release `20260818T212756Z` |
| C | Çok dilli düzenleme (TR/EN yan yana) | Dil anahtarı var, aynı anda tek dil |
| D | JSON düzenleme formu | **Bileşen zaten repoda var**, bu ekrana bağlı değil |
| E | Formda görünmeyen alanlar | Ürün formu tam; **özellikler ve galeri hiç düzenlenemiyor** |
| F | Ürün görselleri (TeklifRota bulgusu) | ✅ **çözüldü** — commit `1e8b25d` |

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

### ✅ UYGULANDI — 2026-08-28 (commit `1f654cb`)

**Kullanıcı kararları (2026-08-27):** ihracat ülke sayısı **her yerde 35+**; **tüm içerikler TR+EN**.

| İş | Nereye gitti |
|---|---|
| Slider 2-4 başlık/metin/buton (R3-R5) | `web_promats_special_pages` 21/23/25 (TR), 22/24/26 (EN) + slider artık **slayta özel metin** gösteriyor (önceden ilk banner'ın metni tüm slaytlarda sabitti) |
| Ürünler başlığı altı giriş metni (R7) | `web_promats_static_texts` 2001 (TR) / 2002 (EN) + `PromatsHome` |
| NEDEN PROMATS kontrast (R8) | CSS `.neden_promat p` kuralı + DB içeriği temiz `<span>` yapısına çevrildi (TR 4, EN 5), 25→35 |
| Rozet barı (R10-R12) | NEDEN PROMATS detail içindeki `.neden_promat_iconbg` — 3 yeni SVG ikon (`/assets/images/icon/neden-*.svg`) |
| Ürünler sayfası metinleri (R14-R19, R27-R29) | `site_settings` `page_content.products.locale.tr/en` |
| Seri rozetleri (R21-R25) | `web_promats_products.s2_3_text` kısaltıldı; CSS: rozet sola üstte, görsele taşmaz, 2. satıra kırılır, görsel alanı büyütüldü |
| Üretim sayfası (R39-R85) | `site_settings` `page_content.production.locale.tr/en` + galeri başlık/açıklama alanları (`galleryHeading`, `gallery[].title/text`) |
| Hakkımızda (R87-R91) | `frontend/src/config/pages/hakkimizda-page.json` — hero/kimlik zaten Excel metniyle uyumluydu; değerler gövdeleri güncellendi; SERTİFİKALARIMIZ → tek **ISO 9001:2015** bloğu + rozet SVG |

**Kayıt:** DB script `scripts/web-icerik-guncelleme-20260827.py` (uygulandı), yedek `.yedek/web-icerik-oncesi-20260827.sql` (special_pages + static_texts + products + site_settings, 291K).

**Verilen kararlar (aşağıdaki açık soruların çözümü):** 1→35+ her yerde; 2→R24 "FONKSİYONEL KENAR"; 3→hero'ya R16 2. paragraf, Serilerimiz'e R19; 4→butonlar `/urunler`, `/uretim`, `/urunler#ozellikler`; 5→"Universal / Fit" kutusu, 3D–5D kutusu kaldı; 6→CSS kuralı + içerik temizliği; 7→benzer rozet SVG çizildi; 8→EN aynı script'te güncellendi; 9→"araca özel" kalıntı taraması yapıldı (ürünler/üretim sayfa metinleri temizlendi; ürün detay `detail_*` metinleri ayrı iş); 10→yok sayıldı.

### Açık sorular ve çelişkiler — 2026-08-27 incelemesi (karara bağlandı, yukarıya bakın)

Excel'in 29 gömülü ekran görüntüsü tek tek incelendi, canlı site ile karşılaştırıldı.
İçeriğin ~%90'ı nettir; aşağıdakiler işlemeden önce karara bağlanmalı (önerilen karar yanında):

1. **25+ mi 35+ mı? (müşteriye sorulacak tek gerçek soru)** — Excel kendi içinde çelişiyor:
   R12 "25+ Ülkeye İhracat", R41 üretim sayfası istatistiği **35+ → 25+ düşürülüyor**, R85 sevkiyat
   "25'ten fazla ülke"; **ama R88 Kurumsal Kimliğimiz metni "35'ten fazla ülkeye ürün tedarik eden"**
   diyor. Canlı sitede de şu an iki rakam bir arada. **Öneri:** her yerde **25+** (Excel'in genel yönü bu);
   R88'deki 35 büyük olasılıkla eski metinden kalma. Olgusal, müşteriye dönük iddia → teyit alınmalı.
2. **İki komşu kartta aynı rozet** — R23 ve R24'ün yenisi aynı: "FONKSİYONEL TASARIM" (typo düzeltilmiş
   hâliyle). Ürünler sayfasında yan yana iki kart aynı etiketi taşıyacak. **Öneri:** R24 (kenar tasarımlı
   model) → **"FONKSİYONEL KENAR"**; müşteri bilinçli aynı istiyorsa aynen bırakılır.
3. **R16'da iki paragraf + R19 ile tekrar** — Ürünler sayfası girişi için R16'da iki ayrı paragraf verilmiş
   (ikincisi Maximum/Professional/Icon serilerini sayıyor); R19'daki metin R16'nın ilk paragrafının küçük
   varyasyonu. Aynen işlenirse aynı sayfada üç kez neredeyse aynı tanıtım paragrafı oluşur.
   **Öneri:** hero'ya R16'nın 2. paragrafı (seri adları geçen), "SERİLERİMİZ" bölüm girişine R19; R16'nın
   1. paragrafı atlanır.
4. **Slider buton hedefleri Excel'de yok** — "Serileri İncele" → `/tr/urunler`, "Üretimimizi Keşfedin" →
   `/tr/uretim`, "Ürün Özellikleri" → `/tr/urunler#ortak-ozellikler` varsayılacak. Ekran görüntülerinde
   nokta sayısı 4 ile 5 arasında değişiyor — canlıda kaç slayt var işleme sırasında sayılacak; 5. slayt
   varsa içeriği Excel'de tanımsız (Slider 1 değişmiyor).
5. **"Universal Fit" istatistik kutusu** — R17 ile ürünler sayfası istatistik barındaki "35+ İHRACAT ÜLKESİ"
   kutusu "Universal Fit" oluyor; bar sayı+etiket formatında (8+ · 3D–5D · 3 · 35+), "Universal Fit" sayı
   değil → kutu tasarımı uyarlanacak. Ayrıca barda kalan "3D–5D HAVUZ KONSEPTİ" ile yeni rozetlerdeki
   "4D KONSEPT" söylemi yan yana duracak — müşteri isterse o kutu da güncellenir (Excel'de talep yok).
6. **R8 = "NEDEN PROMATS?" kontrast bozukluğu** — ekran görüntüsünden teşhis edildi: koyu zeminde koyu gri
   paragraflar okunmuyor. İçerik değil **tasarım düzeltmesi** (metin rengi); kapsama dahil edilecek.
   Görüntüdeki mevcut metin zaten yeni söylemle ("universal", "25'ten fazla") güncellenmiş durumda.
7. **ISO 9001:2015 bloğu** — mevcut "SERTİFİKALARIMIZ" bölümü tek belge bloğuna dönüşüyor; Excel'de
   "buna benzer bir ikon" diye örnek rozet görseli var. **Öneri:** benzer bir rozet SVG çizilir; müşterinin
   gerçek sertifika görseli/logosu varsa o tercih edilir (sorulacak).
8. **EN tarafı Excel'de yok** — site TR/EN; yalnız TR işlenirse EN'de eski "car-specific/araca özel" söylem
   kalır ve yeni "universal" konumlandırmayla çelişir. **Öneri:** TR işlendikten sonra aynı script'te EN
   çevirileri de güncellenir.
9. **"Araca özel" söyleminin kapsam dışı kalıntıları** — Excel yalnız 3 sayfayı (anasayfa, ürünler, üretim)
   kapsıyor; ürün detay sayfaları, SEO meta'ları ve footer'da "araca özel kalıp" iddiaları kalabilir.
   İşleme sırasında DB genelinde taranıp liste çıkarılacak (silme kararı müşteriyle).
10. **"Kullanım Notları" sayfası şablon kalıntısı** — "ürün sütunları" diye bahsettiği yapı bu dosyada yok
    (4 sütun var, ürün başına sütun yok). Bu dosya için Ortak/Uyarlanabilir/Seriye Özel ayrımının pratik
    karşılığı yok; yok sayılabilir.

### İşleme yöntemi

- [ ] İçerikler **elle panelden değil**, tercihen bir seed/migration script'i ile işlensin (`backend/src/db/seed/sql/` veya tek seferlik `scripts/`), böylece TR/EN eşleşmesi izlenebilir olur.
- [ ] Her içeriğin hangi tabloya/alana gittiği eşleme tablosu olarak yazılsın (`web_promats_home_sections`, `web_promats_special_pages`, `web_promats_static_texts`, `web_promats_products`).
- [ ] İşlem sonrası ilgili sayfalar tarayıcıda görsel olarak doğrulansın.

---

## B. ✅ ÇÖZÜLDÜ — "Taslak / İndekslenemez" Rozeti

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

## F. ✅ ÇÖZÜLDÜ — Ürün Görselleri (`/userfiles` ön eki)

**18 Ağustos 2026, commit `1e8b25d`.** TeklifRota entegrasyonu 20 ürün görselinin 9'unda 404 alıyordu.

### Kök neden (canlı veriyle doğrulandı)

Eski CMS kayıtları görsel yollarını **`/userfiles` altına göreli** saklıyor. Canlıda iki biçim birden var:

| Biçim | Örnek | Kayıt |
|---|---|---:|
| Göreli (slash yok) | `images/product/orbital-tekli.png` | ürün 16, özellik 114, sayfa 14 |
| Kök-slash | `/images/product/star-gri.png` | ürün 2, özellik 98, sayfa 2, galeri 8 |
| Tam yol | `/userfiles/images/product/catalog-2026/…` | ürün 22, özellik 34 |

`asset()` yalnızca başa `/` koyuyordu → `/images/product/x.png` → **404**.
Doğrusu `/userfiles/images/product/x.png` → **200** (canlıda test edildi).

### Neden site çalışıyordu

Frontend (`PromatsImage` → `resolvePath` → `assetPath`) ve admin panel (`web-sayfasi-client.tsx:178-182`) eksik ön eki **kendi taraflarında tamamlıyordu**. API yanlış adres verdiği hâlde iki tüketici de telafi ediyordu; üçüncü tüketici (TeklifRota) kırıldı.

### Yapılan

- [x] Düzeltme **kaynakta** yapıldı (`asset()`), böylece her tüketici doğru adresi alır.
- [x] `/userfiles`, `/assets`, `/uploads` ve `http` ile başlayan **tam yollara dokunulmuyor**. Bu kritikti: canlı galeride 8 adet `/uploads/page-feedback/...` kaydı var ve ön ek eklenseydi **çalışan görseller bozulacaktı**.
- [x] Çift ön ek riski yok — frontend ve panel `/userfiles` ile başlayan yolu olduğu gibi geçiriyor.
- [x] Regresyon testleri eklendi (göreli, kök-slash, tam yol, boş değer, benzer isimli klasör `/userfilesx`).
- [x] Galeri testindeki eski beklenti (`/g.jpg`) kasıtlı değişiklik gerekçesiyle güncellendi.

### Canlı doğrulama — release `20260818T210840Z-1e8b25d1dfd3`

| Kontrol | Öncesi | Sonrası |
|---|---:|---:|
| TeklifRota sözleşmesindeki ürün görselleri | 11/20 | **20/20** ✓ |
| Sitenin kendi ürün API'si (78 yoldan 30 örnek) | — | **30/30** ✓ |
| Galeri `/uploads/...` kayıtları | çalışıyordu | **çalışıyor** (200) ✓ |
| Çift ön ek (`/userfiles/uploads`) | — | **0** ✓ |
| promats.com.tr · ürün sayfası · panel | — | 308 · 200 · 307 ✓ |

> **Not:** TeklifRota kendi tarafında da dayanıklılık eklemişti (`ee2d678`). Artık iki taraf da doğru; onların telafi kodu zararsız (`/userfiles` gelince olduğu gibi geçiriyor).

## G. Panel düzenleme ekranları teşhisi — 2026-08-28

**Soru:** Müşteri panelden bu içerikleri neden düzeltemiyor?
**Teknik arıza YOK:** admin uçlarının tamamı token'la 200 dönüyor (products/pages/page-content/articles/menu/texts/settings/theme/home-sections), 2 admin hesabı mevcut, PATCH yolu çalışıyor. Sorun yetki değil, **düzenleme modeli**:

1. **Sayfa metinleri = çıplak JSON.** Ürünler/Üretim sayfa içerikleri ("Sayfa İçerikleri" sekmesi) tek parça ham JSON textarea'da düzenleniyor ([web-sayfasi-client.tsx:807](admin_panel/src/app/\(main\)/admin/\(admin\)/web-sayfasi/web-sayfasi-client.tsx#L807)). Anahtarlar İngilizce (`hero.headline`, `stats[].value`); tek tırnak hatasında "JSON biçimi geçersiz" → hiçbir şey kaydedilmiyor. Teknik olmayan kullanıcı için fiilen düzenlenemez.
2. **Slider metinleri kırılgan HTML sözleşmesinin içinde.** Banner başlık/alt metin/buton, `detail` HTML'inde `<h1 class="hero-heading">` + `.sub-text` yapısında; frontend bunu REGEX ile ayrıştırıyor ([PromatsHeroContents.tsx:25](frontend/src/components/promats/PromatsHeroContents.tsx#L25)). Panelin görsel editörü `document.execCommand` tabanlı contentEditable — class'ları koruma garantisi yok; müşteri başlığı değiştirince `hero-heading` class'ı kaybolursa başlık sitede HİÇ görünmez. "Düzeltemiyor" şikayetinin ana sebebi bu.
3. **Word yapıştırma sanitizasyonu yok.** NEDEN PROMATS kazası (R8) tam olarak böyle oldu: müşteri Word'den yapıştırdı, Mso çöpü + `<p>` yapısı geldi, koyu zeminde metin okunmaz oldu. Editörde paste temizliği yok.
4. **Neden Promats rozet barı** aynı HTML blobun içinde (`neden_promat_iconbg`) — üç ikon+etiketi görsel editörde bozmadan değiştirmek pratikte imkânsız.
5. **Hakkımızda sayfası panelden hiç düzenlenemez** — içerik repoda ([hakkimizda-page.json](frontend/src/config/pages/hakkimizda-page.json)); değişiklik deploy istiyor. "Ortak Özellikler" kartları da kodda gömülü (`SHARED_FEATURE_CARDS`).
6. **Ürün özellikleri (297) + sayfa galerisi (8):** backend PATCH `features`/`gallery` children'ı destekliyor ([router.ts:672](backend/src/modules/web_promats/router.ts#L672)) ama panelde UI yok (E maddesi hâlâ açık — backend hazır, yalnız ekran eksik).

### Önerilen çözüm sırası — ✅ TAMAMLANDI (2026-08-28, release `20260828T171112Z-1dca5de`)

- [x] **G1:** Banner ve Neden Promats yapılandırılmış formları — `_components/web-detail-forms.tsx` +
  `_lib/promats-detail-html.ts`. HTML şablondan üretilir; canlı HTML ile round-trip **byte-byte aynı**
  (bun testi + panelden gerçek kaydetme sonrası DB karşılaştırmasıyla kanıtlandı). Entity-encoded eski
  kayıtlar (`&lt;h1...`) da çözülüp ayrıştırılıyor.
- [x] **G2:** Sayfa İçerikleri alan bazlı form — `_components/page-content-editor.tsx` +
  `_lib/page-content-schemas.ts` (products / production / hakkimizda şemaları). Ham JSON "Gelişmiş"
  bölümüne indi; şemasız sayfalar (oem, partner, resources…) JSON'da kalır.
- [x] **G3:** RichContentEditor yapıştırma sanitizasyonu — izinli etiket beyaz listesi, Word/Mso
  class+style temizliği, javascript: href/src engeli.
- [x] **G4:** Hakkımızda içeriği `page_content.hakkimizda.locale.tr/en` anahtarına taşındı
  (seed: `scripts/hakkimizda-page-content-seed-20260828.py`); frontend DB'den okur
  (`getPageContentOptional`), repo JSON'u yedek. Panelde "Sayfa İçerikleri"nde düzenlenebilir.
- [x] **G5:** Ürün formuna "Özellikler" sekmesi (297 kayıt — tip/metin/görsel/sıra + yükleme) ve
  sayfa formuna "Galeri" sekmesi eklendi; backend `replaceProductFeatures`/`replacePageGallery`
  zaten hazırdı. Bu, E maddesinin panel ayağını da kapatır.

**Canlı doğrulama (2026-08-28):** panel girişiyle 4 ekran tarayıcıda test edildi (banner formu,
Neden Promats formu, production içerik formu, ürün Özellikler sekmesi — hepsi canlı veriyle dolu);
BANNER 2 panelden kaydedildi → DB'deki HTML öncekiyle birebir aynı, 297 özellik + 8 galeri kaydı
yerinde, site metinleri sağlam. D maddesindeki "JSON'la çeviri akışı" ihtiyacı için ham JSON
"Gelişmiş" bölümünde durmaya devam ediyor.

## H. ✅ TAMAMLANDI — Müşteri revizesi 2. tur — "Promats web revize yeni.docx" (2026-08-28)

Kaynak: [Promats web revize yeni.docx](Promats%20web%20revize%20yeni.docx) — 12 not, hepsi ekran
görüntüsüne bağlı; tamamı eşlendi. **Tamamı aynı gün canlıya alındı** — release'ler
`20260828T173753Z-30650ca` + `20260828T174552Z-9fea1fc`, commit'ler `30650ca` + `9fea1fc`.

**Canlı doğrulama:** TR sekme "Promats Oto Paspasları" / EN "Promats Car Mats"; slider butonu
"Ürünleri Keşfet → /tr/urunler" tıklanabilir; ürün detay akordiyon sırası [Açıklama, Teknik,
5 Parça Tam Set, Temizlik ve Bakım, Avantajları, Malzeme, Universal, SSS] ve "Bilgi Alın" bloğu
temiz; SSS soruları computed 700 bold (Bootstrap `bolder`ın 300 gövdede 400 vermesi ayrıca
düzeltildi); anasayfa 3 kart aynı standartta; Ortak Özellikler ortalı; iletişim formu hizalı,
adres kartı harita yüksekliğinde. Ekran görüntüleriyle belgelendi.

> Not: H2/H10 içerik düzeltmeleri DB'de (yedek: `.yedek/web-special-pages-oncesi-20260828.sql`);
> H1 başlıklar `seo_pages` + `page_content.home` anahtarlarında; gerisi kod/CSS.

### H eki — ISO rozeti + footer tekliği (2026-08-28 akşam, commit `9d2d5c9`, release `20260828T180307Z`)

- [x] **Gerçek ISO rozeti:** Müşterinin gönderdiği "CERTIFIED ISO 9001:2015" rozeti işlendi
  (beyaz zemin şeffaflaştırıldı, 440px) → `/assets/images/hakkimizda/iso-9001-2015.png`;
  çizim SVG silindi; DB `page_content.hakkimizda` (TR+EN) + repo fallback JSON yeni yola çevrildi.
- [x] **"Farklı footer" şikayeti — teşhis:** Sitede zaten TEK footer var (`PromatsFooter`,
  `[locale]/layout` üzerinden tüm sayfalara girer; 7 sayfada aynı `<footer>` DOM'u doğrulandı).
  Algılanan "ikinci footer", Hakkımızda sonundaki koyu **"Promats'ı Daha Yakından Keşfedin"**
  bandıydı: footer menüsünü tekrarlayan ÜRETİM/ÜRÜNLER/İLETİŞİM nav butonları. Bant kaldırıldı;
  panel şemasından "Kapanış Bandı" grubu çıkarıldı. Canlı doğrulama: bant TR+EN'de yok,
  `<footer>` sayısı 1, footer logo+menü+adres+sosyal eksiksiz, konsol hatasız.
- [ ] Benzer koyu CTA bandı `become-a-partner` sayfasında da var (`PromatsEditorialPages.finalCta`)
  — o nav taklidi değil, satış CTA'sı (İletişim + OEM butonları); bilinçli bırakıldı.
  Müşteri isterse o da kaldırılır.

### Site geneli

- [x] **H1 — Favicon + sekme başlığı:** "P" harfi yerine Promats logosu; başlık
  "Universal Paspaslar | Promats" → **"Promats Oto Paspasları"** (EN: "Promats Car Mats").
  Varsayım: yalnız site geneli varsayılan başlık değişir, sayfa bazlı SEO başlıkları korunur.
- [x] **H2 — Slider 1 "Ürünleri Keşfet" butonu:** tıklanmıyor ve tasarımı diğer slaytlardaki sarı
  düğmeden farklı (sol çizgili düz yazı). Diğerleriyle aynı `btn btn-yellow` formatına getirilecek,
  `/tr/urunler` (EN `/en/products`) linki verilecek — banner1 TR+EN `detail` güncellemesi
  (artık G1 formu/şablonuyla güvenli).

### Ürün detay sayfası (PromatsProductDetail)

- [x] **H3 — "5 Parça Tam Set"** düz başlık duruyor; diğer bölümlerle aynı formata (akordiyon
  başlığı) getirilecek.
- [x] **H4 — "Kullanım Alanları" başlığı kalkacak;** bölüm başlığı içerikteki **"Temizlik ve Bakım"**
  olacak (içerik `detail_usage`'ta; başlık render'da değiştirilir, DB'ye dokunulmaz).
- [x] **H5 — SSS ayrıştırma:** "Sık Sorulan Sorular" şu an Avantajlar akordiyonunun İÇİNDE
  (`detail_advantages` HTML'inde h2). Ayrı başlık olacak, sayfanın en sonuna
  ("Bu ürünle ilgileniyor musunuz"dan hemen önce) taşınacak, **sorular bold** olacak.
  Önerilen yöntem: 20 üründe DB içeriğini elden geçirmek yerine render-time split —
  advantages HTML'i "Sık Sorulan Sorular" h2'sinden ikiye bölünür, ikinci parça SSS bölümü
  olarak sona konur; soru paragrafları (soru işaretiyle bitenler) bold'lanır. TR+EN aynı mantık
  (EN başlık "Frequently Asked Questions").
- [x] **H6 — "X Serisi Hakkında Bilgi Alın" bloğu kaldırılacak** — alttaki ilgi CTA'sıyla mükerrer.

### Üretim + Ürünler sayfaları (PmSectionHeading intro genişliği)

- [x] **H7 — "ÜRETİM TESİSİMİZ" intro metni** dar sütunda; yanlara genişletilecek.
- [x] **H8 — "ÜRÜN SERİLERİMİZ" intro** aynı oranda genişletilecek (aynı bileşen).
- [x] **H9 — "ORTAK ÖZELLİKLER" başlığı ortalanacak** (şu an sola hizalı) + intro aynı şekilde
  genişletilecek.
- [x] **H10 — Ortak özellikler 1. kart görseli** ("1. Sınıf Kalite PVC") diğerleriyle aynı standartta
  değil (çerçevesiz/oran farklı); karta diğerleriyle aynı çerçeve/oran verilecek.

### İletişim

- [x] **H11 — İletişim formu düzeni:** "Konu Başlığı" ve "İlgilenilen Ürün Grubu" select'lerinde
  label/placeholder çakışması ve hiza bozukluğu (müşteri kırmızıyla işaretledi). Alan dizilimi ve
  select görünümü düzenlenecek.
- [x] **H12 — İletişim alt bloğu:** adres kartı + harita + "Yol Tarifi Al" hizaları gözden geçirilecek.

> Uygulama sırası önerisi: H2 (çalışmayan buton — işlevsel hata) → H3-H6 (ürün detay) →
> H7-H10 (CSS) → H1 → H11-H12. Sonrasında canlı görsel doğrulama TR+EN.

## Önerilen Sıra

1. ~~**F — görsel yolu**~~ ✅ **TAMAMLANDI** (18 Ağu, commit `1e8b25d`)
2. ~~**B — status düzeltmesi**~~ ✅ **TAMAMLANDI** (18 Ağu, commit `62763ef`)
3. **D — JSON sekmesi** (çeviri akışını açar; bileşen hazır, bağlanacak)
4. **C — çift dil görünümü** (D'nin üstüne oturur)
5. **A — Excel içeriğinin işlenmesi** (asıl içerik işi; C ve D hazırsa TR/EN birlikte girilir)
6. **E — özellikler ve galeri ekranları** (297 kayıt yönetim dışı; ayrı geliştirme)

> **Bu checklist başka bir oturumda uygulanacak.** B–E maddeleri aşağıda, oturumu açan kişinin
> ek araştırma yapmadan başlayabilmesi için dosya/satır düzeyinde detaylandırıldı.

## Doğrulama Kuralı

Her madde bitince: panelde kontrol → canlı sitede kontrol → gerekiyorsa ilgili yazılımcı notuna çözüm yazılıp `resolved` yapılır.

---

# EK — Uygulama Detayları (başka oturum için)

Bu bölüm B–E maddelerinin her birini **dosya, satır ve komut düzeyinde** açar.
Amaç: yeni oturumun keşif turu yapmadan doğrudan işe başlayabilmesi.

## Ortak bilgiler

**Canlı erişim**
```bash
ssh vps-paspas
mysql -u app -pApp2026paspas promats_erp --default-character-set=utf8mb4
```

**Deploy — sunucuda build ALINMAZ** (bkz. [SERVER.md](SERVER.md), ana checklist S6):
```bash
scripts/deploy/build-release-artifact.sh HEAD          # yerelde
scp /tmp/paspas-release-<ID>.tar.gz vps-paspas:/tmp/
ssh vps-paspas "bash /var/www/paspas/scripts/deploy/activate-release-artifact.sh /tmp/<dosya>"
```

**API testi için token** (yanıt anahtarı `access_token`, camelCase değil):
```bash
curl -s -X POST http://127.0.0.1:8078/api/auth/token -H 'Content-Type: application/json' \
  -d '{"email":"orhanguzell@gmail.com","password":"admin123"}'
```

**Dokunulacak ana dosyalar**

| Dosya | Rol |
|---|---|
| `backend/src/modules/web_promats/router.ts` | public + admin CMS uçları, DTO'lar |
| `admin_panel/src/app/(main)/admin/(admin)/web-sayfasi/web-sayfasi-client.tsx` | tek dosyalık yönetim ekranı (~800 satır) |
| `frontend/src/lib/promats/api.ts` · `components/promats/PromatsImage.tsx` | site tarafı veri/görsel çözümleme |

---

## B — `status` düzeltmesi (detay)

### Mevcut durum sorgusu
```sql
SELECT language_id, status, COUNT(*) FROM web_promats_products GROUP BY language_id, status;
-- TR: status=1 -> 20 kayit (tamami pasif)
-- EN: status=0 -> 8, status=1 -> 12
```

### Adım 1 — ✅ Araştırma tamam (18 Ağu): EN ayrımı kasıtlı DEĞİL

EN'de `status=1` olan 12 kayıt tam olarak **sort_order 9-20**, yani 14 Ağustos'ta
`2323a71 feat(promats): complete English product catalog` ile eklenen yeni katalog ürünleri.
İlk 8 EN ürünü (eski kayıtlar) `status=0`. Yani ayrım bilinçli bir yayın kararı değil,
**yeni satırların varsayılan değeri**.

| sort_order | TR | EN |
|---|---|---|
| 1–8 (eski ürünler) | status=1 | status=0 |
| 9–20 (2026 kataloğu) | status=1 | status=1 |

**Canlı kanıt — ikisi de zaten yayında:**
- `?lang=tr` → 20 ürün · `?lang=en` → 20 ürün
- EN ürün sayfaları açılıyor: `/en/products` ve `/en/products/star-series` → 200
- Yani `status` alanı **hiçbir şeyi engellemiyordu**; panel gerçeği söylüyor, veri yanlış.

**Sonuç:** 40 kaydın tamamı `status=0` yapılmalı. Bu değişiklik **ziyaretçi için hiçbir şeyi
değiştirmez** (filtre zaten yok), yalnız paneli gerçeğe uydurur. Filtre sonradan eklenince de
aynı 20 ürün görünmeye devam eder.

### Adım 2 — Veri düzeltmesi ⏸️ **İZİN BEKLİYOR**

- [x] Yedek alındı: [.yedek/web-products-status-oncesi-20260818.sql](.yedek/web-products-status-oncesi-20260818.sql) (181K, 40 kayıt) — hem sunucuda `/tmp/web-products-status-yedek.sql` hem yerelde.
- [x] **Uygulandı** (18 Ağu) — 32 satır güncellendi (TR 20 + EN 12):

```bash
ssh vps-paspas "mysql -u app -pApp2026paspas promats_erp \
  -e \"UPDATE web_promats_products SET status = 0 WHERE status <> 0;\""
```

Etkilenecek: TR 20 + EN 12 = **32 satır** (EN'deki 8 kayıt zaten 0).

- [x] Sonuç: TR 20 + EN 20 kaydın tamamı `status=0`.
- [x] **Ziyaretçi tarafı değişmedi** (filtre henüz yoktu): TR/EN 20'şer ürün, sayfalar 200.
- [ ] Geri alma gerekirse yedek dosyası aynı tabloya geri yüklenir.

### Adım 3 — Kod düzeltmesi (veri düzeltildikten SONRA)
`backend/src/modules/web_promats/router.ts` — dört sorguya `AND status=0` eklenecek:

| Satır | Uç |
|---|---|
| ~227 | `GET /web/promats/products` |
| ~244 | ürün listesi (ikinci kullanım) |
| ~267 | `GET /web/promats/products/search` |
| ~274 | `GET /web/promats/products/:slug` |

- [x] `teklifrota/v1/products` ucu da filtreyi aldı — sözleşme yayında olmayan ürünü dışa vermiyor.
- [x] `:slug` ucunda pasif ürün 404 dönüyor (aşağıdaki canlı testle kanıtlandı).
- [x] Kodda `status=0 = yayında` ters mantığı ve sıra bağımlılığı yorum olarak yazıldı.

### ✅ Canlı doğrulama — release `20260818T212756Z-62763ef143bd`

| Kontrol | Sonuç |
|---|---|
| Site API TR / EN | **20 / 20 ürün** ✓ |
| TR ürün sayfası · EN ürün sayfası · ürünler listesi | 200 · 200 · 200 ✓ |
| Arama (`?q=orbital`) | çalışıyor ✓ |
| TeklifRota sözleşmesi | 20 ürün, **20/20 görsel** ✓ |

**Filtrenin gerçekten çalıştığı kanıtlandı** — bir ürün geçici olarak pasife alınıp geri döndürüldü:

| Durum | Liste | Slug detayı |
|---|---:|---:|
| `orbital-serisi` → `status=1` | **19 ürün** | **404** |
| `orbital-serisi` → `status=0` (geri) | **20 ürün** | **200** |

> Yani artık panelden bir ürün "Taslak" yapıldığında siteden gerçekten kalkıyor — önceden bu mümkün değildi.

> ⚠️ **Sıra hayati:** kod önce giderse 20 ürünün tamamı siteden kaybolur.
> Doğrulama: `curl -s 'https://promats.com.tr/api/web/promats/products?lang=tr&limit=100' | python3 -c "import sys,json;print(len(json.load(sys.stdin)['data']))"` → 20 dönmeli.

### Adım 4 — ✅ İndekslenebilirlik: ek iş GEREKMİYOR (18 Ağu hesaplandı)

`published && hasSlug && score >= 50` ([web-sayfasi-client.tsx:713](admin_panel/src/app/\(main\)/admin/\(admin\)/web-sayfasi/web-sayfasi-client.tsx#L713))

40 ürünün SEO skoru canlı veriyle hesaplandı: **hepsi 70–85 arasında**, hiçbiri 50'nin altında değil.
Yani `status=0` yapılır yapılmaz **tümü "İndekslenebilir" olur**; ayrıca SEO çalışması gerekmiyor.

| Skor | Ürün |
|---:|---:|
| 85 | 9 ürün |
| 70 | 31 ürün |
| <50 | **0** |

#### 🐞 Yan bulgu — skor ürünlerin gerçek SEO alanlarını okumuyor

`seoScore()` şu alanlara bakıyor: `meta_title ?? name ?? title` ve `meta_description ?? excerpt ?? s1_3_text ?? detail`.
Ürün tablosunda **`meta_title`/`meta_description` kolonu yok**; ürünlerin SEO alanları `seo_title` ve `seo_description`.
Dolayısıyla ürün skorları `name` ve `s1_3_text` üzerinden hesaplanıyor — gerçek SEO metinleri **hiç değerlendirilmiyor**.

- [ ] `seoScore()` ürünler için `seo_title` / `seo_description` alanlarını da okusun (skor bugün yanıltıcı yüksek/düşük olabilir).

---

## C — Çift dil görünümü (detay)

**Mevcut:** `languageId` state ([satır 227](admin_panel/src/app/\(main\)/admin/\(admin\)/web-sayfasi/web-sayfasi-client.tsx#L227)), varsayılan `1` (TR). Liste isteği `?languageId=${languageId}` ile daraltılıyor ([satır 287](admin_panel/src/app/\(main\)/admin/\(admin\)/web-sayfasi/web-sayfasi-client.tsx#L287)). Önizleme iframe'i de dile göre değişiyor (satır 546-547).

**Veri durumu:** TR 20 / EN 20 ürün; ikisinde de `detail_description` ve `seo_title` **boş değil**. Yani çeviri var, eksik olan düzenleme deneyimi.

- [ ] Düzenleme sheet'ine "İki dil" görünümü: her alan için TR (sol) / EN (sağ) kutu.
- [ ] Kaydetme **iki ayrı satırı** günceller (TR ve EN kayıtları farklı `id`'ler) — tek istekte iki kayıt güncelleyen bir uç gerekebilir.
- [ ] "Diğer dilden kopyala" düğmesi (yalnız boş alanları doldurur, doluları ezmez).
- [ ] `source_language_id` alanı tabloda var ama **hep 0**; çeviri kaynağını izlemek için doldurulabilir.
- [ ] EN'de boş kalan alan sayacı ("3 alan çevrilmemiş").

**Eşleştirme uyarısı:** TR ve EN kayıtları hangi alanla eşleşiyor netleştirilmeli — `slug` mu, `sort_order` mı? Yanlış eşleştirme çevirileri karıştırır.
```sql
SELECT id, language_id, sort_order, slug, name FROM web_promats_products ORDER BY sort_order, language_id;
```

---

## D — JSON sekmesi (detay)

**Bileşen hazır:** `admin_panel/src/app/(main)/admin/_components/common/AdminJsonEditor.tsx` (119 satır).
Re-export: `admin_panel/src/components/common/AdminJsonEditor.tsx`. Örnek kullanım: `site-settings/_components/admin-site_settings-detail-client.tsx`.

```ts
type AdminJsonEditorProps = {
  label?: React.ReactNode;
  value: unknown;
  onChange: (next: any) => void;
  onErrorChange?: (err: string | null) => void;
  disabled?: boolean;
  helperText?: React.ReactNode;
  height?: number;   // number, "500px" DEĞİL
};
```

- [ ] Düzenleme sheet'indeki sekmelere (İçerik / Medya / SEO / Yayın) **JSON** eklensin.
- [ ] `value={formData}` — **tüm kayıt**, tek bölüm değil (`admin_panel/CLAUDE.md` "Detail Page Standartı" kuralı).
- [ ] `onChange` → `setFormData(prev => ({ ...prev, ...json }))`
- [ ] `onErrorChange` doluyken **Kaydet devre dışı** olsun.

### Çeviri akışı — asıl istenen
- [ ] TR + EN'i **tek JSON'da** veren görünüm:
```json
{ "tr": { "name": "...", "detail_description": "..." },
  "en": { "name": "...", "detail_description": "..." } }
```
- [ ] Yapıştırma doğrulaması: alan adları değişmiş mi, zorunlu alanlar boşalmış mı, dil anahtarları duruyor mu.
- [ ] `id`, `language_id`, `source_language_id`, `created_at` **salt okunur** (veya JSON'a hiç konulmasın) — değişirse kayıt bozulur.
- [ ] Kaydetmeden önce "şu alanlar değişecek" özeti gösterilsin (yanlış yapıştırmayı yakalar).

---

## E — Özellikler ve galeri ekranları (detay)

| Tablo | Kayıt | Durum |
|---|---:|---|
| `web_promats_product_features` | **297** | panelde ekran YOK, sitede gösteriliyor |
| `web_promats_special_page_gallery` | **8** | panelde ekran YOK |

`features` frontend'e servis ediliyor (`product()` DTO'sunda `features` dizisi: `id, productId, type, sortOrder, image, feature`).

- [ ] Ürün düzenleme sheet'ine "Özellikler" sekmesi: sıralanabilir liste (tip, sıra, görsel, metin), ekle/sil/düzenle.
- [ ] Galeri için `special_page_gallery` ekranı (8 kayıt, `image` + `sort_order`).
- [ ] **Çok dillilik kontrolü:** `web_promats_product_features` tablosunda `language_id` var mı? Yoksa özellikler tek dilde demektir — bu C maddesini de etkiler.
```sql
SHOW COLUMNS FROM web_promats_product_features;
```
- [ ] Backend'de bu tablolar için admin CRUD uçları var mı, yoksa eklenecek mi kontrol edilsin (`editableColumns` sözlüğünde ikisi de tanımlı **değil**).

---

## A — Excel içeriğinin işlenmesi (detay)

**Kaynak:** `Promats_Web içerkleri (2).xlsx` → sayfa "Ürün İçerik Master" (91 satır, **40'ı yeni içerik**).
Sütunlar: `No | Sayfadaki Konumu / İçerik Alanı | Mevcut İçerik | Yeni İçerik`.

Çıkarılmış hâli (bu oturumda üretildi, yeniden okumaya gerek yok):
```python
# openpyxl ile 40 satir cikarilir; bolum dagilimi:
# ÜRÜNLER SAYFASI 22 · 3. görsel 9 · ANASAYFA 7 · 2. görsel 2
```

- [ ] İçerikler hangi tabloya gidecek, satır satır eşlenmeli:
  - Anasayfa slider/rozet → `web_promats_home_sections` (5 kayıt) veya `web_promats_static_texts`
  - Ürünler/Üretim sayfa metinleri → `web_promats_special_pages` (27 kayıt)
  - Ürün seviyesi metinler → `web_promats_products`
- [ ] **Ortak / Uyarlanabilir / Seriye Özel** ayrımı korunsun (Excel "Kullanım Notları" sayfası):
  - *Ortak:* bir kez hazırlanır, her ürün sayfasında görünür → tek yerde tutulmalı, 20 üründe kopyalanmamalı
  - *Uyarlanabilir:* iskelet ortak, seriye göre uyarlanır
  - *Seriye Özel:* her seri için özgün
- [ ] **Yazım hatası:** Excel'de "FOKNSİYONEL TASARIM" (iki satırda) → **"FONKSİYONEL TASARIM"**. Siteye doğrusu yazılsın, kaynak dosyada da düzeltilmesi önerilsin.
- [ ] İçerik elle panelden değil, **tek seferlik script** ile işlensin (`scripts/` altında), TR/EN eşleşmesi izlenebilir olsun.
- [ ] İşlem öncesi ilgili tabloların yedeği alınsın.
- [ ] Sonrasında anasayfa, ürünler ve üretim sayfaları tarayıcıda görsel olarak doğrulansın.

> C ve D maddeleri A'dan önce bitirilirse, Excel içerikleri TR/EN birlikte ve JSON üzerinden çok daha hızlı girilir. Önerilen sıra bu yüzden A'yı sona koyuyor.
