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

> **Not:** TeklifRota kendi tarafında da dayanıklılık eklemişti (`ee2d678`). Artık iki taraf da doğru; onların telafi kodu zararsız (`/userfiles` gelince olduğu gibi geçiriyor).

## Önerilen Sıra

1. ~~**F — görsel yolu**~~ ✅ **TAMAMLANDI** (18 Ağu, commit `1e8b25d`)
2. **B — status düzeltmesi** (veri → kod sırasıyla; rozetler ve gerçek yayın durumu düzelir)
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

### Adım 1 — Müşteriye sorulacak (koddan önce)
- [ ] EN tarafındaki 8/12 ayrımı **kasıtlı mı**? Bazı ürünler bilinçli olarak İngilizce yayında olmayabilir.
- [ ] Cevap gelmeden EN verisine dokunulmasın; TR'de 20/20 yayında olmalı (site zaten hepsini gösteriyor).

### Adım 2 — Veri düzeltmesi
```sql
-- ÖNCE yedek
-- mysqldump ... web_promats_products --where="language_id=1" > yedek.sql
UPDATE web_promats_products SET status=0 WHERE language_id=1;
```
- [ ] Yedek alınmadan çalıştırılmasın.
- [ ] Sonrasında panelde rozetlerin "Yayında" olduğu görülsün.

### Adım 3 — Kod düzeltmesi (veri düzeltildikten SONRA)
`backend/src/modules/web_promats/router.ts` — dört sorguya `AND status=0` eklenecek:

| Satır | Uç |
|---|---|
| ~227 | `GET /web/promats/products` |
| ~244 | ürün listesi (ikinci kullanım) |
| ~267 | `GET /web/promats/products/search` |
| ~274 | `GET /web/promats/products/:slug` |

- [ ] `teklifrota/v1/products` ucu da aynı filtreyi almalı — sözleşme yayında olmayan ürünü dışa vermemeli.
- [ ] `:slug` ucunda pasif ürün artık 404 dönecek; frontend'in bu durumu düzgün karşıladığı kontrol edilsin.

> ⚠️ **Sıra hayati:** kod önce giderse 20 ürünün tamamı siteden kaybolur.
> Doğrulama: `curl -s 'https://promats.com.tr/api/web/promats/products?lang=tr&limit=100' | python3 -c "import sys,json;print(len(json.load(sys.stdin)['data']))"` → 20 dönmeli.

### Adım 4 — İndekslenebilirlik
`published && hasSlug && score >= 50` ([web-sayfasi-client.tsx:713](admin_panel/src/app/\(main\)/admin/\(admin\)/web-sayfasi/web-sayfasi-client.tsx#L713))
- [ ] `status` düzeldikten sonra hâlâ "İndekslenemez" kalan ürünler listelensin — bunlarda sorun SEO skoru (<50), ayrı iş.

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
