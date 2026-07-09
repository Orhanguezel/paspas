# PROMATS WEB — Yeniden Yazım Planı & Orkestrasyon Çeklisti

> **Amaç:** Mevcut `promats.com.tr` sitesini (Klasik ASP + MS Access) `sablon_proje` taslağı üzerine,
> **aynı tasarımı birebir koruyarak** modern stack'e (Next.js + Fastify + Drizzle + MySQL) taşımak.
>
> **Yöntem:** 4 araçlı orkestrasyon — Claude (mimar) → Codex (implementasyon) → Cursor (cila/refactor) → Antigravity (görsel doğrulama).
>
> **Doküman sahibi:** Claude Code (mimar). Bu dosya tek doğruluk kaynağıdır; ilerledikçe güncellenir.
> **Tarih:** 2026-06-20

---

## 0. Mevcut Durum Özeti

### Kaynak site (indirildi → `paspas/promats-ftp-yedek/`)
| Özellik | Değer |
|---------|-------|
| Dil/Runtime | Klasik ASP (VBScript), IIS |
| Veritabanı | MS Access `.mdb` (Jet OLEDB, şifre: `GRburak123`) |
| Tema | **untree.co** premium şablonu (Bootstrap 4 + jQuery) |
| Fontlar | Cormorant Garamond + Roboto |
| Animasyon | owl.carousel, AOS, jarallax, fancybox, ScrollMagic + GSAP |
| Çok dil | TR + EN (`Diller` tablosu, satır bazlı `Dil`/`DilID` filtresi) |
| Admin | Özel `PANEL/` (CKEditor + dosya yöneticisi) |
| İçerik hacmi | 16 ürün, 8 menü, 24 özel sayfa, 65 sabit yazı, 153 ürün özelliği, ~290 görsel (33 MB) |

### Public sayfalar (kaynakta)
`index.asp` (anasayfa) · `urunler.asp` (ürün listesi) · ürün detay (`etiket.html` rewrite) · `urun-arama.asp` (arama) · `hakkimizda.asp` · `iletisim.asp` · `islemler.asp` (mail/form handler) · `DilSec.asp` (dil değiştir).

### Hedef şablon (`/home/orhan/Documents/Projeler/sablon_proje`)
Monorepo: `backend/` (Fastify+Drizzle+MySQL) · `frontend/` (Next.js + next-intl, `[locale]` route) · `admin_panel/` (Next.js) · `packages/` (shared) · `scripts/init-project.sh` (tek komut scaffold) · seed SQL sistemi (`backend/src/db/seed/sql/*.sql`).
**Hazır eşleşen modüller:** `menu_items_schema`, `home_sections_schema`, `site_settings_schema`, `theme_*` — kaynak tablolarla doğal örtüşüyor.

---

## 1. Hedef Mimari Kararları (KARARLAŞTIRILDI)

| # | Karar | Gerekçe |
|---|-------|---------|
| K1 | **Konum:** `paspas/promats/` alt klasörü (✅ onaylandı). Tam `sablon_proje` kopyası. | Promats = Paspas ERP ile aynı müşteri. *Not: monorepo-içinde-monorepo — iç git/`node_modules` izolasyonu için paspas `.gitignore`'a `promats/` eklenecek veya promats kendi git'i ile yönetilecek.* |
| K2 | **Stack:** sablon_proje monorepo aynen — backend Fastify+Drizzle+MySQL, frontend Next.js+next-intl, admin_panel Next.js. | Workspace standardı, DRY. |
| K3 | **DB:** Access → **MySQL**. Şema **seed SQL** dosyalarında `CREATE TABLE` ile tanımlanır. **ALTER YASAK** (CLAUDE.md kuralı). | Fresh deploy tutarlılığı. |
| K4 | **i18n modeli:** Orijinaldeki gibi **satır-bazlı çok dil** (her kayıtta `dil` kolonu). next-intl UI metinleri + DB içeriği `dil` filtresiyle. | Birebir davranış, en az dönüşüm riski. |
| K5 | **Tasarım aktarımı:** `style.css` ve vendor CSS **birebir** taşınır (`frontend/public/assets`). Markup React bileşenlerine port edilir. | "Aynı stil" şartı. |
| K6 | ✅ **jQuery eklentileri:** Statik CSS korunur; davranışlar React'e taşındı — owl.carousel → **Swiper**, AOS → `aos` (React init). ScrollMagic/GSAP yalnızca gerekli efektlerde bırakıldı. | jQuery+Next.js karışımından kaçınma. |
| K7 | **URL yapısı:** Orijinal `.html` rewrite'ları korunur — ürün detay `/[locale]/urunler/[etiket]`, anasayfa, hakkimizda, iletisim. Eski URL'ler için redirect haritası. | SEO sürekliliği. |
| K8 | **Görseller:** `userfiles/` + `assets/images/` → `frontend/public/` (veya CDN/Cloudinary sonradan). Yollar DB'de göreceli tutulur. | Birebir görsel parite. |

### Onaylanan kararlar (2026-06-20)
- **A1 — Konum:** ✅ `paspas/promats/` alt klasör.
- **A2 — Deploy:** ✅ **Sadece lokal** — deploy şimdilik kapsam dışı. Faz 6 deploy maddeleri ertelendi. Mail için SMTP gerçek bilgisi gerekmez; lokal test (Mailtrap/console transport) yeterli.
- **A3 — Admin kapsamı:** ✅ **Tam CRUD (birebir)** — ürün + özel sayfa/banner + menü + sabit yazı.

---

## 2. Veri Modeli Eşleme (Access → MySQL/Drizzle)

| Access tablosu | Hedef tablo (MySQL) | Modül | Not |
|----------------|---------------------|-------|-----|
| `Diller` | `languages` (veya sadece next-intl config) | i18n | 2 satır (tr/en); statik tutulabilir |
| `menuler` | `menu_items` *(şablonda var)* | menu | konum (üst/alt), target, dil |
| `urunler` | `products` | products | **section-bazlı alanlar** (s1_1_text … s5_5_text), `etiket` = slug |
| `urun_ozellik` | `product_features` | products | `ur_id` FK, `tip` (1/2), resim+metin |
| `ozel_sayfalar` | `special_pages` / `banners` | content | `konum` (slider/banner/sayfa), galeri ilişkisi |
| `ozel_sayfalar_galeri` | `special_page_gallery` | content | `sa_id` FK |
| `sabit_yazi` | `static_texts` → `site_settings` eşle *(şablonda var)* | settings | 65 anahtar (telefon, adres, footer, sosyal vb.) |

**Önemli:** `urunler` tablosu "bölüm bazlı landing" yapısında (her ürünün 5 görsel section'ı: text+resim çiftleri). React'te `ProductSection` bileşeni ile render edilecek. Şemada bu alanlar ya birebir kolon ya da `sections JSON` olarak tutulacak — **Codex'e bırakılan implementasyon kararı** (öneri: birebir kolon, parite için).

---

## 3. Tasarım / Stil Aktarım Stratejisi (K5–K6 detay)

**Hedef: piksel düzeyinde aynı görünüm.**

1. **Asset taşıma (Codex):** `httpdocs/assets/{css,js,images,fonts}` + `userfiles/` → `frontend/public/assets/` ve `frontend/public/userfiles/`.
2. **Global CSS:** `style.css` + vendor CSS'ler `app/layout` veya global import ile yüklenir (Tailwind ile çakışmayı önlemek için scope/izolasyon kontrolü — **Cursor cila adımı**).
3. **Layout bileşenleri:** `ust-taraf.asp` → `<Header/>`, `alt-taraf.asp` → `<Footer/>`. Sticky nav, mega-menü (ürün dropdown), dil switcher TR/EN, sosyal medya.
4. **Animasyonlar:** AOS init `app` client component'te; owl-carousel → Swiper; loader/spinner korunur.
5. **Görsel doğrulama (Antigravity):** Her sayfa için kaynak ASP çıktısı ile yeni Next.js çıktısı **yan yana ekran görüntüsü** karşılaştırması. Fark varsa Cursor/Codex'e geri besleme.

---

## 4. Orkestrasyon — Hangi Araç Ne Yapar

| Araç | Rol | Bu projede sorumluluğu |
|------|-----|------------------------|
| **Claude** (mimar) | Tasarım, plan, şema, API kontratı, review | Bu doküman; DB şema tasarımı; API kontratları; her faz sonu kod review; tutarlılık |
| **Codex** (implementer) | Toplu kod yazımı | Scaffold sonrası backend modülleri, seed SQL, frontend bileşenleri, admin CRUD |
| **Cursor** | Cila, refactor, lokal düzeltme | CSS izolasyon/çakışma, tip hataları, küçük refactor, jQuery→React geçiş ince ayarı |
| **Antigravity** | Görsel/UI doğrulama | Sayfa-sayfa görsel parite (kaynak vs yeni), responsive kontrol |

**Çakışma önleme (CLAUDE.md kuralı):** Aynı dosyada aynı anda iki araç çalışmaz. Akış: **Claude tasarla → Codex yaz → Antigravity doğrula → Cursor cila.** Codex bir modülde çalışırken Antigravity aynı branch'e yönlendirilmez.

---

## 5. ÇEKLİST (fazlı)

> Her madde sahibi etiketli: **[C]**=Claude, **[X]**=Codex, **[U]**=Cursor, **[A]**=Antigravity.
> Faz tamamlanmadan sonrakine geçilmez. Onay kutuları işaretlenerek ilerlenir.

### FAZ 0 — Hazırlık & Veri Çıkarma
- [x] **[C]** Açık kararları (A1–A3) kullanıcıyla netleştir ✅
- [x] **[C]** `.mdb` → 7 tablo CSV export → `promats/_migration/` ✅ (Codex yaptı)
- [x] **[X]** `userfiles/` + `assets/` görsellerini hedef public klasörüne kopyala ✅
- [x] **[C]** Eski URL → yeni URL redirect haritası ✅ (→ `promats-briefs/API-CONTRACT.md`)

### FAZ 1 — Proje Scaffold
- [x] **[C/X]** `sablon_proje` → `paspas/promats/` ✅
- [x] **[X]** `init-project.sh` (promats, portlar: be 8186 / fe 3177 / admin 3196) ✅
- [x] **[X]** Root workspaces + `bun install` ✅
- [x] **[X]** `proje.json` ✅ / `project.portfolio.json` ✅
- [x] **[C]** Üç servis ayağa kalkıyor mu doğrula (backend/frontend/admin dev) ✅ (Codex lokal doğruladı)

### FAZ 2 — Veri Katmanı (Drizzle + Seed)
- [x] **[C]** 7 tablo final şema tasarımı ✅ → **`promats-briefs/SCHEMA-CONTRACT.md`** (tam DDL)
- [x] **[X]** Seed SQL (`020_promats_schema.sql`) — CREATE TABLE, ALTER yok ✅
- [x] **[X]** Access verisini seed INSERT'e dönüştür (`021_promats_data.sql`) ✅
- [x] **[X]** `bun run build && bun run db:seed:fresh` ✅
- [x] **[C]** Veri bütünlüğü kontrolü (products 16, features 153, pages 24, static 65, menu 8) ✅

### FAZ 3 — Backend API
- [x] **[C]** API kontratları ✅ → **`promats-briefs/API-CONTRACT.md`** (endpoint + Zod + redirect)
- [x] **[X]** `products` modülü (liste, detay-by-etiket, arama) ✅
- [x] **[X]** `content` modülü (özel sayfalar/banner/galeri) ✅
- [x] **[X]** `menu` + `settings` (sabit yazı) modülleri ✅
- [x] **[X]** `contact` modülü — Nodemailer mail gönderme (`islemler.asp` karşılığı) ✅ (lokal log transport)
- [x] **[C]** Backend review (try/catch, tip, DRY) ✅ (Codex review + build temiz)

### FAZ 4 — Frontend (Public) + Stil Aktarımı
- [x] **[X]** Global CSS + vendor asset entegrasyonu ✅
- [x] **[X]** `<Header/>` + `<Footer/>` (sticky nav, mega-menü, dil switcher, sosyal) ✅
- [x] **[X]** Anasayfa (slider + ürün vitrin section'ları) ✅
- [x] **[X]** Ürün listesi + ürün detay (`[etiket]`, section-bazlı render) ✅
- [x] **[X]** Arama sayfası ✅
- [x] **[X]** Hakkımızda + İletişim (form → contact API) ✅
- [x] **[X]** i18n (TR/EN) + dil değiştirme (DilSec karşılığı) ✅
- [x] **[A]** Sayfa-sayfa görsel parite doğrulama (kaynak vs yeni) ✅ (Codex Playwright turu + `ANTIGRAVITY-RAPOR.md`; kalan farklar raporda)
- [x] **[U]** CSS çakışma/responsive cila + animasyon ince ayar ✅ (Codex Playwright smoke: mobil/desktop 6 kritik route 200, overflow yok)

### FAZ 5 — Admin Panel
- [x] **[C]** Admin kapsamı netleştir (A3) ✅
- [x] **[X]** Ürün CRUD (section alanları düzenleme + temel ekle/sil/aktif-pasif) ✅
- [x] **[X]** Özel sayfa / banner CRUD (özel sayfa temel ekle/sil/düzenle; banner içerikleri public veriden geliyor) ✅
- [x] **[X]** Menü + sabit yazı yönetimi ✅
- [x] **[C]** Yetkilendirme/auth kontrolü (şablonun auth'u; admin API authsuz 401 dönüyor) ✅
- [x] **[A]** Admin akış doğrulama (`/admin/promats`, `/admin/promats/products/1`) ✅
- [x] **[U]** Görsel yükleme, ürün özellikleri ve özel sayfa galeri düzenleme için gelişmiş admin cila ✅ (storage upload/önizleme + ürün özellikleri + sayfa galerisi editörü)

### FAZ 6 — Kalite & SEO (deploy ertelendi — A2: sadece lokal)
- [x] **[U]** Lighthouse + Core Web Vitals (lokal) ✅ (SEO 1.00, A11y 0.94–0.96; performans cila açık)
- [x] **[C]** SEO: metatag (orijinal `MetatagBul` karşılığı), sitemap, redirect'ler ✅
- [x] **[C]** `project.portfolio.json` final güncelleme + doğrulama ✅
- [x] **[U]** Performans cila turu 1 ✅ (next/image, dynamic Swiper/AOS, CSS temizliği): /tr 0.52→0.74, ürün 0.66→0.75, arama 0.66→0.73, hakkimizda 0.80. LCP 0.7-0.9s, CLS 0.
- [x] **[C/X]** **0.85 push** ✅ (Codex 2026-06-25: Promats vitrin route'ları SSG/ISR; DevNote panel lazy-load; template ThemeProvider public kabuktan çıkarıldı; LHCI desktop `/promats/tr`, ürün, hakkımızda, iletişim, arama = 0.99–1.00)
- [x] ~~Staging/canlı deploy~~ ✅ (Codex 2026-06-25: `promats-api` + `promats-frontend` redeploy; `/promats/tr` smoke 200)

### FAZ 7 — Yeni Sayfalar + Demo DevNote Sistemi
- [x] **[C]** 3 yeni sayfa görev brief'i hazırlandı ✅ → `promats-briefs/CODEX-PROMATS-YENI-SAYFALAR.md`
- [x] **[C]** DevNote / yazılımcı notu sistemi görev brief'i hazırlandı ✅ → `promats-briefs/CODEX-DEVNOTE-SISTEMI.md`
- [x] **[X]** 3 yeni sayfa implementasyonu: `/[locale]/uretim`, `/en/become-a-partner`, `/[locale]/kaynaklar` + articles modülü ✅
- [x] **[X]** DevNote sistemi implementasyonu: public feedback backend + `src/components/devnote/` + section marker yerleşimleri ✅
- [x] **[C]** Articles ve page_feedback seed'lerini canlı `promats_site` DB'ye uygulama ✅ (`022,023,024` no-drop; articles=4; feedback tabloları hazır)
- [x] **[C]** Review + redeploy + demo doğrulama ✅ (route/API smoke 200; DevNote marker canlıda görünüyor)

---

## 6. Güncel Durum (2026-06-25 — Claude doğrulaması, güncellendi)

**Proje fonksiyonel + görsel olarak çalışır halde.** Canlı doğrulandı: tüm public route 200 (TR+EN), admin 200, backend 200, sitemap 200. Build/lint/typecheck temiz. Console temiz (hydration/AOS/script-tag hatası yok). Legacy jQuery kalmadı (K6 ✅).

**Çözülen kritik blocker'lar:** beyaz ekran (overlayer), hydration mismatch + AOS undefined + script-tag (K6 carousel portu), tek kırık görsel (derin-havuzlubos). Hepsi kapandı.

**Performans:** Tur 1 tamam (next/image + dynamic import + temizlik) → 0.73-0.80. Codex 2026-06-25 turu ile Promats vitrin route'ları SSG/ISR'a alındı; LHCI desktop skoru `/promats/tr`, ürün, hakkımızda, iletişim, arama için 0.99–1.00.

### Mimar Kararı — 0.85 ertelemesi (2026-06-20, 2026-06-25'te kapandı)
0.85'in önündeki kalan darboğaz = **template-miras bundle** (K1 sonucu: promats `sablon_proje` içinde → template layout sağlayıcıları promats'ta da yükleniyor). Brief kapsamı (görsel/JS) tükendi.
**Sonuç:** Codex deploy öncesi performans turunda ① SSG/ISR yolunu uyguladı, ② public kabuktaki template-only ThemeProvider'ı ayıkladı, ③ DevNote ağır panelini lazy-load etti. Lokal production build + LHCI doğrulandı.

**Kalan açık iş:** Yok. Canlı demo route/API smoke doğrulandı; görsel parite raporundaki düşük/orta fark notları referans olarak duruyor.

**✅ Kapanan mimar borçları:** API-CONTRACT gerçek DTO'ya hizalandı; bozuk-adlı duplicate görseller silindi (Cursor, 23 dosya).

---

## 7. Yeni Sayfalar — OEM Manufacturing + Üretim (2026-07-01, Claude implement + deploy)

Kaynak: `paspas/YENİ EKLENECEK SAYFALAR.docx`. Müşteri kararları: artifact'ların koyu renk paleti UYGULANMADI (mevcut açık tema korundu), slug `/oem-manufacturing`, TR erişilebilir ama TR menüde gizli, içerik component+config JSON (DB yok).

### 7a. OEM Manufacturing — `/[locale]/oem-manufacturing` ✅ CANLI
- B2B ihracat landing (13 bölüm): hero · rakamlar · neden Promats (8 kart) · üretici-vs-ticaret-şirketi · ihracat/global · 7 adım süreç · OEM & Private Label · kabiliyetler · ihracat bilgileri · ürün serileri (canlı ürün slug eşleme, TR/EN ayrı sluglar + rastgele son ek toleranslı) · SSS · final CTA · zengin B2B form.
- İçerik: `frontend/src/config/pages/oem-page.json` (TR+EN, `remixed-68f00765-content*.md`'den birebir).
- Bileşenler: `PromatsOemPage.tsx` + `PromatsOemContactForm.tsx` (form mevcut `/contact` kontratına paketlenir — firma/ülke/web/ilgi/adet mesaj gövdesine; backend DEĞİŞMEDİ, telefon zorunlu kuralı için forma Telefon/WhatsApp alanı eklendi).
- SEO/GEO: FAQPage + Organization JSON-LD, canonical + hreflang (tr/en/x-default), sitemap'te.
- Nav: EN menü+footer'da link; TR menüde YOK (docx kararı) ama `/tr/oem-manufacturing` 200 (indexlenebilir).

### 7b. Üretim — `/[locale]/uretim` gerçek içerik ✅ CANLI
- Placeholder (`PromatsProductionPage`) kaldırıldı → `PromatsUretimPage.tsx` + `config/pages/uretim-page.json`.
- 6 bölüm: hero · ürün-malzeme geliştirme · üretim süreçleri · kalite kontrol · paketleme/ihracat · CTA (İletişim + OEM köprüsü). TR+EN paralel; kurumsal süreç-anlatımı tonu (OEM=neden biz, Üretim=nasıl üretiyoruz ayrımı).
- Bölüm görselleri tema stok görselleri (`section2/5/6/7.jpg`) — **müşteriden gerçek fabrika fotoğrafları gelince sadece JSON `image` alanları güncellenecek.**

### 7c. Doğrulama + düzeltmeler
- Stiller `promats-legacy-bridge.css`'e eklendi (`oem-*` sınıfları; mevcut palet `#ffa001` + `.black_bg`, yeni tema yok).
- Title çiftlenmesi düzeltildi (root layout `| Promats` template'i → config title'ları marka eksiz).
- Sitemap: `/oem-manufacturing` STATIC_PAGES'e eklendi (tr+en+x-default alternates).
- Canlı teyit (2026-07-01): 4 sayfa 200, JSON-LD valid, hreflang doğru, EN menüde link var / TR'de yok, robots.txt AI botlarına açık.

### Kalan açık iş (yeni sayfalar)
- [ ] Müşteri gerçek üretim/fabrika görselleri → `oem-page.json` + `uretim-page.json` görsel alanları (yapı hazır)
- [ ] Görsel QA (Antigravity) — sayfa ritmi/mobil kırılımlar
