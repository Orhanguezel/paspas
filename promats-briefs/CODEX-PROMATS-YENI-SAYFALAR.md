# CODEX GÖREV — Promats: 3 Yeni Sayfa (Üretim · Become A Partner · Kaynaklar)

> **Mimar (Claude) görev paketi — 2026-06-25.** Kaynak: `paspas/PROMATS WEB SİTESİ.docx`.
> **Hedef:** `paspas/promats/frontend` (+ gerekli backend). Mevcut **anasayfa/Ürünler/Kurumsal/İletişim AYNEN kalır** — sadece sayfa ekliyoruz.
> **Birebir kuralı:** Yeni sayfalar da **mevcut promats teması** (untree.co) ile aynı görünüm dilinde olacak. Yeni tasarım dili icat etme.
> **Akış:** Codex implement → **Claude review + deploy** (push etme). Build kontrolleri zorunlu.

---

## Karar özeti (onaylandı)
1. **Kaynaklar** = **tam DB modülü + admin** (articles tablosu + API + admin CRUD + Article JSON-LD + sitemap).
2. **Üretim + Become A Partner** = **önce iskelet** (yapı + bölümler placeholder; gerçek metin/görsel sonra gelecek).
3. Template artığı sayfalara (faqs, login, blog-template vb.) **dokunma**.

## Çok dil modeli (mevcut konvansiyon)
- Promats locale: **tr + en**. DB satır-bazlı çok dil: `language_id` (1=TR, 2=EN), `source_language_id`.
- next-intl `[locale]` routing zaten var. Header `localeHref(locale, path)` + `t(settings, key)` kullanıyor.

---

## 1) Kaynaklar (blog/makale) — DB modülü

### 1a. Şema — yeni seed `022_promats_articles_schema.sql` (ALTER YOK, CREATE TABLE)
Mevcut `special_pages` konvansiyonuyla birebir uyumlu:
```sql
CREATE TABLE IF NOT EXISTS `articles` (
  id                 INT UNSIGNED NOT NULL PRIMARY KEY,
  language_id        INT NOT NULL DEFAULT 1,          -- 1=TR, 2=EN
  source_language_id INT NOT NULL DEFAULT 0,
  sort_order         INT NOT NULL DEFAULT 0,
  title              VARCHAR(255) NOT NULL,
  slug               VARCHAR(255) NOT NULL,
  excerpt            TEXT,                            -- özet (liste + meta fallback)
  content            MEDIUMTEXT,                      -- HTML gövde
  image              VARCHAR(500),                    -- kapak görseli
  meta_title         VARCHAR(255),
  meta_description   VARCHAR(500),
  hit                INT NOT NULL DEFAULT 0,
  status             TINYINT NOT NULL DEFAULT 0,      -- 0=yayında
  published_at       DATETIME NULL,
  created_at         DATETIME NULL,
  KEY idx_articles_lang_status (language_id, status),
  KEY idx_articles_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
- `023_promats_articles_seed.sql`: 2-3 örnek makale (TR+EN), paspas üretim/ihracat temalı (placeholder, SEO örneği). Claude prod DB'ye uygular.
- Drizzle: `backend/src/modules/promats/schema.ts`'e `articles` tablosu ekle (special_pages pattern'i).

### 1b. API (public) — promats router
- `GET /api/v1/articles?lang=tr` → liste: `{ id, languageId, title, slug, excerpt, image, publishedAt }` (status=0, `ORDER BY published_at DESC, sort_order ASC, id DESC`).
- `GET /api/v1/articles/:slug?lang=tr` → detay: yukarısı + `content, metaTitle, metaDescription`. **Route sırası:** spesifik yollar `:slug`'dan önce (products pattern'i gibi).
- Admin CRUD: mevcut generic admin (`/api/v1/admin/promats/:table`, table=`articles`) destekliyorsa ona ekle; değilse dedicated CRUD. DTO camelCase (mevcut konvansiyon: `languageId`, `sortOrder`, `publishedAt`...).

### 1c. Frontend — liste + detay
- `/[locale]/kaynaklar` → makale **kart listesi** (mevcut tema kart stili; başlık + özet + kapak + tarih). Template `blog` bileşenlerini referans al ama **promats temasıyla** ve promats API'sinden besle (template blog'u olduğu gibi kullanma).
- `/[locale]/kaynaklar/[slug]` → makale detay: başlık, kapak, `content` (HTML, sanitize), tarih.
- **SEO/GEO:** her detayda **Article JSON-LD** (`@type:Article`, headline, image, datePublished, author/publisher=Promats), `<title>`/meta description (metaTitle/metaDescription ?? excerpt). Liste sayfasına uygun meta.
- **Sitemap:** `sitemap.xml`'e yayındaki makale sluglarını ekle (mevcut sitemap route'una articles fetch'i — products/pages gibi, API kapalıysa fallback).

---

## 2) Üretim sayfası — `/[locale]/uretim` (TR + EN, FARKLI yapı)
- **Locale-bazlı ayrı yapı:** aynı route, içerik locale'e göre dallanır — TR ve EN **birebir çeviri DEĞİL**, her biri bağımsız bölüm düzeni.
  - Öneri: `PromatsUretim` bileşeni `locale==='en' ? <UretimEn/> : <UretimTr/>` veya bölüm dizisini locale'e göre seç.
- **Şimdilik iskelet:** mevcut tema bölüm desenleriyle (hero/section/`section2_bg` vb.) **placeholder bölümler** kur (başlık + açıklama + görsel alanı). Gerçek metin/görsel sonra doldurulacak — yapıyı net, doldurması kolay bırak.
- Header/Footer nav'a **Üretim** linki (her iki dil).

## 3) Become A Partner — `/[locale]/become-a-partner` (SADECE EN)
- **EN-gated:** `locale !== 'en'` → `notFound()` (Türkçede sayfa yok).
- Nav linki **yalnızca `locale==='en'`** görünür (TR menüde hiç çıkmaz).
- **Şimdilik iskelet:** partner başvuru sayfası düzeni (hero + avantajlar bölümleri + başvuru formu placeholder) — promats temasıyla. Form backend bağlama sonra (şimdilik UI).

---

## 4) Navigasyon (PromatsHeader + Footer)
[PromatsHeader.tsx](../promats/frontend/src/components/promats/PromatsHeader.tsx) — hem mobil (`site-nav-wrap`) hem desktop (`js-clone-nav`) listelerine:
- **Üretim** → `localeHref(locale, '/uretim')` (her iki dil). `t(settings, 'ÜRETİM')`.
- **Kaynaklar** → `localeHref(locale, '/kaynaklar')` (her iki dil). `t(settings, 'KAYNAKLAR')`.
- **Become A Partner** → `localeHref(locale, '/become-a-partner')` **yalnızca `locale==='en'`** koşullu render.
- Sıra/yer mevcut menü mantığına uygun (ANASAYFA · ÜRÜNLER · ÜRETİM · KAYNAKLAR · KURUMSAL · İLETİŞİM · [EN: Become A Partner]).
- `sabit_yazi`/settings'e yeni anahtarlar (ÜRETİM, KAYNAKLAR) gerekiyorsa ekle (yoksa `t` fallback key'in kendisini döndürür).

---

## Kısıtlar
- **Mevcut sayfalar (anasayfa/Ürünler/Kurumsal/İletişim) DEĞİŞMEZ.**
- **Yeni şema yalnızca `articles`; ALTER YASAK** (CREATE TABLE seed). Başka tablo gerekiyorsa DUR, Claude'a sor.
- Tema **birebir** (untree.co sınıfları/stili). Tailwind preflight çakışmalarına dikkat (bridge pattern'i).
- TS strict, `any` yasak. Backend `bun run build`; frontend `bun run build` (subpath: `PROMATS_BASE_PATH=/promats` ile de kırılmamalı — ama lokal dev kök '/').
- next/image subpath'te unoptimized (mevcut next.config). Yeni görselleri de `/assets` veya `/userfiles` kökünden ver.
- Her madde ayrı commit. **Push etme** — Claude review + deploy (frontend `redeploy-frontend.sh`, backend + `articles` seed'i Claude prod `promats_site`'a uygular).

## Tamamlama / Doğrulama (Claude)
- `/[locale]/uretim` TR ve EN farklı yapıda render (placeholder).
- `/en/become-a-partner` açılıyor; `/tr/become-a-partner` → 404; TR menüde link yok.
- `/[locale]/kaynaklar` liste + `/[locale]/kaynaklar/[slug]` detay; Article JSON-LD + sitemap'te makaleler.
- Admin'den makale CRUD çalışıyor.
- Mevcut sayfalar bozulmamış. Build temiz.

## Referans
- Şema/konvansiyon: `backend/src/modules/promats/schema.ts`, `promats-briefs/SCHEMA-CONTRACT.md`, `API-CONTRACT.md`
- Router: `backend/src/modules/promats/router.ts`
- Frontend pages: `frontend/src/app/[locale]/{[etiket],urunler,iletisim}`, blog referans: `frontend/src/components/containers/blog/*`
- Nav: `frontend/src/components/promats/PromatsHeader.tsx`, `PromatsFooter.tsx`
- Deploy: `promats/redeploy-frontend.sh` (frontend), backend kaynak + seed (Claude).
