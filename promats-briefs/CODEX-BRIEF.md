# CODEX BRIEF — Promats Web Birebir Replica (Implementasyon)

> **Senin rolün:** Implementer. Bu sitenin kodunu sen yazacaksın.
> **Mimar (Claude) talimatı:** Aşağıdaki görev paketini sırayla, fazları atlamadan uygula.
> **Tek doğruluk kaynağı plan:** `paspas/PROMATS-WEB-PLAN.md` (önce onu oku).
>
> **🆕 Mimar kontratları (FAZ 2-3 için bağlayıcı — uy, sapma yapma):**
> - DB şeması: [`SCHEMA-CONTRACT.md`](./SCHEMA-CONTRACT.md) — 7 tablo tam DDL + seed dosya planı + doğrulama sayıları
> - API: [`API-CONTRACT.md`](./API-CONTRACT.md) — endpoint listesi + Zod + redirect haritası
> - Scaffold (FAZ 0/1) **tamamlandı**; veri `promats/_migration/*.csv` hazır. Sıra: **FAZ 2 (seed) → FAZ 3 (API) → FAZ 4 (frontend) → FAZ 5 (admin)**.

---

## 0. Görev (tek cümle)

`https://promats.com.tr/` sitesini **birebir** (piksel ve davranış düzeyinde aynı) olacak şekilde,
`sablon_proje` taslağı üzerine modern stack ile yeniden yaz. Tasarımı **değiştirme** — birebir kopya.
İçerik ve kod kaynağı zaten lokalde: `paspas/promats-ftp-yedek/httpdocs/`.

## 1. Kaynaklar (oku, referans al)

| Ne | Yol |
|----|-----|
| Orijinal site kodu (ASP) | `paspas/promats-ftp-yedek/httpdocs/` |
| Orijinal veritabanı | `paspas/promats-ftp-yedek/httpdocs/db/promats.mdb` (Jet OLEDB, şifre `GRburak123`) |
| Tema CSS/JS/font/görsel | `httpdocs/assets/` ve `httpdocs/userfiles/` |
| Proje taslağı | `/home/orhan/Documents/Projeler/sablon_proje/` |
| Canlı referans | `https://promats.com.tr/` (görsel doğrulama için) |

**Veri okuma:** `mdbtools` kurulu. `mdb-tables promats.mdb`, `mdb-export promats.mdb <tablo>` ile CSV çıkar.

## 2. Hedef Konum & Stack

- **Konum:** `paspas/promats/` (sablon_proje'nin tam kopyası).
- **Stack:** backend Fastify + Drizzle + MySQL · frontend Next.js + next-intl (`[locale]`) · admin_panel Next.js. Bun runtime.

## 3. Kaynak Site Haritası (birebir taşınacak)

### Public sayfalar (`httpdocs/*.asp`)
| Kaynak | Yeni route | İçerik |
|--------|-----------|--------|
| `index.asp` | `/[locale]` | Slider (ozel_sayfalar konum=1) + rastgele ürün vitrini + section'lar |
| `urunler.asp` | `/[locale]/urunler/[etiket]` | Ürün detay (section-bazlı: s1..s5 text/resim) |
| `urun-arama.asp` | `/[locale]/arama` | `urun like %kelime%` arama |
| `hakkimizda.asp` | `/[locale]/[etiket]` (ozel_sayfa) | `ozel_sayfalar` içerik sayfası |
| `iletisim.asp` | `/[locale]/iletisim` | İletişim formu + harita |
| `islemler.asp` | API: `POST /api/v1/contact` | Form/mail handler |
| `DilSec.asp` | next-intl locale switch | TR(1)/EN(2) |
| `404.asp` | `not-found` | 404 |

### Layout (`include/`)
- `ust-taraf.asp` → `<Header/>`: sticky nav, logo (`/assets/images/promats.png`), mega-menü (ürün dropdown DB'den), dil switcher TR/EN, sosyal medya.
- `alt-taraf.asp` → `<Footer/>`: logo (`promats-black.png`), footer menü, adres/tel/eposta (`gt_*`), sosyal, copyright.
- `css.asp` / `js.asp` → asset import listesi (aşağıda).
- `genel-fonksiyonlar.asp` → yardımcılar: `MetatagBul` (SEO meta), `SabitYaziFunc` (sabit_yazi anahtarı çevir), `gt_adres/gt_tel_no/gt_eposta/gt_facebook/gt_instagram` global metinler.

### Tema bağımlılıkları (css.asp / js.asp) — **birebir taşı**
CSS: icomoon, owl.carousel, aos, animate.min, bootstrap, custom font, jquery.fancybox, **style.css**.
Fontlar: Cormorant Garamond + Roboto (Google Fonts).
JS davranışları (React'e port et): owl.carousel → **Swiper/Embla**, AOS → `aos` paketi, fancybox → React lightbox, sticky nav, mobil menü toggle. ScrollMagic/GSAP yalnızca gerçekten kullanılan efektler için.

## 4. Veri Modeli (Access → MySQL) — seed SQL

> **KESİN KURAL (CLAUDE.md):** Şema değişikliği **ALTER ile değil**, `backend/src/db/seed/sql/0XX_*_schema.sql` içinde `CREATE TABLE`'a kolon ekleyerek yapılır. Sonra `bun run build && bun run db:seed:fresh`.

| Access tablo | MySQL tablo | Not |
|--------------|-------------|-----|
| `Diller` | `languages` (veya next-intl statik) | tr/en |
| `menuler` | `menu_items` *(şablonda var, uyarlа)* | konum, dil, target |
| `urunler` | `products` | section alanları (s1_1_text…s5_5_text), `etiket`=slug, `dil` |
| `urun_ozellik` | `product_features` | `ur_id` FK, `tip`(1/2), resim+metin |
| `ozel_sayfalar` | `special_pages` | `konum`(slider/banner/sayfa), `etiket`, `dil` |
| `ozel_sayfalar_galeri` | `special_page_gallery` | `sa_id` FK |
| `sabit_yazi` | `site_settings`/`static_texts` *(şablonda var)* | 65 anahtar |

**Çok dil modeli:** Orijinaldeki gibi **satır-bazlı** (`dil` kolonu). Sapma yapma.
**Ürün section alanları:** Parite için **birebir kolon** olarak tut (JSON'a çevirme).

## 5. İş Sırası (fazlar — PLAN.md FAZ 0–5 ile birebir)

1. **Scaffold:** `sablon_proje` → `paspas/promats/`; `init-project.sh --name "Promats" --slug "promats" --db "promats_db"` (portları boş olanlardan seç); root workspaces + `bun install`; `project.portfolio.json` doldur.
2. **Veri:** `.mdb` → 7 tablo seed SQL (CREATE TABLE + INSERT). `db:seed:fresh`. Kayıt sayıları kaynakla eşleşmeli (16 ürün, 65 sabit yazı, 24 özel sayfa, 153 özellik).
3. **Görseller:** `httpdocs/assets/` + `httpdocs/userfiles/` → `frontend/public/assets/` + `frontend/public/userfiles/`.
4. **Backend API** (`/api/v1/...`): `products` (liste, detay-by-etiket, arama), `content` (özel sayfa/banner/galeri), `menu`, `settings` (sabit yazı), `contact` (Nodemailer — lokal/console transport yeter).
5. **Frontend public:** Header/Footer → anasayfa → ürün detay → arama → özel sayfa → iletişim. CSS birebir, i18n TR/EN.
6. **Admin panel (TAM CRUD):** ürün (section + özellik + görsel yükleme), özel sayfa/banner + galeri, menü, sabit yazı.

## 6. Zorunlu Kod Kuralları (paspas/CLAUDE.md)

- **DRY**, deterministik, tek sorumluluk. React bileşeni >200 satır → böl; controller >60 satır → service'e taşı.
- **TS strict**, `any` yasak. Her param/return tipli. Zod şemaları backend+frontend ortak.
- Import düzeni: built-in → framework → 3rd party → `@/` → göreceli. Wildcard import yok.
- Hata yönetimi: async handler'lar try/catch; frontend `.unwrap()` + `toast.error()`. Hata mesajları **Türkçe**.
- Kod İngilizce, **UI metinleri Türkçe** (locale anahtarları).
- **ALTER TABLE YASAK** — seed SQL ile.

## 7. Tamamlanma Kriteri (Definition of Done)

- 3 servis (backend/frontend/admin) lokalde ayağa kalkıyor.
- Her public sayfa orijinalle **görsel olarak ayırt edilemez** (Antigravity doğrulayacak).
- TR/EN çalışıyor; ürün/sayfa/menü/sabit yazı DB'den geliyor.
- Admin'den içerik CRUD çalışıyor.
- `bun run build` (backend) + frontend/admin build hatasız. Lint temiz.
- `project.portfolio.json` mevcut ve standarda uygun.

## 8. Çakışma Kuralı

Aynı dosyada Antigravity/Cursor ile **aynı anda çalışma**. Sıra: Codex yaz → Antigravity doğrula → Cursor cila.
Bir modülü bitirince PLAN.md çeklistinde ilgili `[X]` maddesini işaretle.

## 9. Belirsizlikte

Mimari karar gerektiren bir belirsizlik çıkarsa **uydurma** — `paspas/PROMATS-WEB-PLAN.md`'ye not düş ve Claude'a (mimar) sor. Küçük implementasyon detaylarında orijinal ASP davranışını taban al.
