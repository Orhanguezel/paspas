# SCHEMA CONTRACT — Promats (Access → MySQL)

> **Mimar (Claude) teslimatı.** Codex bu DDL'i **birebir** seed SQL'e koyar, INSERT'leri `_migration/*.csv`'den üretir, Drizzle şemasını buna göre yazar.
> **KURAL:** Şema yalnızca `backend/src/db/seed/sql/0XX_*.sql` içinde `CREATE TABLE` ile. **ALTER YASAK.** Değişiklik → CREATE TABLE'ı düzenle + `db:seed:fresh`.

---

## Genel konvansiyonlar

- **Charset:** `utf8mb4` / `utf8mb4_unicode_ci` (Türkçe karakter).
- **Çok dil (birebir):** Her tabloda `dil TINYINT` (1=TR, 2=EN) + `dil_grup INT` (orijinal `Dilid` — TR satırının id'sine işaret eder, çeviri eşi gruplama). Sapma yok.
- **`durum TINYINT DEFAULT 0`** = 0 aktif/görünür (orijinal mantık: `where durum=0`).
- **`*_resim`** = göreceli görsel yolu (`images/...` veya `userfiles/...`), `VARCHAR(500)`.
- **`*_text`** = `TEXT` (uzun olabilir, biri 1077 karakter), kısa olanlar bile TEXT (güvenli, DRY).
- **Tarih alanları** orijinalde `MM/DD/YY HH:MM:SS` string → `DATETIME NULL` (seed sırasında parse). Parse riskliyse `VARCHAR(32)` fallback — ama tercih DATETIME.
- **id** orijinal değerleriyle korunur (`INT PRIMARY KEY`, AUTO_INCREMENT seed sonrası set). Parite için orijinal id'ler birebir aktarılır.
- Seed dosya numaraları template 018'de bitiyor → promats tabloları **020+**.

---

## Seed dosya planı

| Dosya | İçerik |
|-------|--------|
| `020_promats_schema.sql` | 7 promats CREATE TABLE (aşağıdaki DDL) |
| `021_promats_data.sql` | INSERT'ler (`_migration/*.csv`'den üretilir) — FK sırasına dikkat: products→features, special_pages→gallery |

> Template'in kendi `menu_items`/`site_settings`/`home_sections` tabloları promats içerik modüllerinde **kullanılmaz**; karışıklığı önlemek için promats kendi tablolarını kullanır (birebir davranış garantisi). Template tabloları auth/theme/notifications için yerinde kalır.

---

## DDL

### 1. `products` (← `urunler`)
```sql
CREATE TABLE products (
  id           INT UNSIGNED NOT NULL PRIMARY KEY,
  dil          TINYINT NOT NULL DEFAULT 1,          -- 1=TR, 2=EN
  dil_grup     INT UNSIGNED NOT NULL DEFAULT 0,     -- orijinal Dilid
  sira         INT NOT NULL DEFAULT 0,
  urun         VARCHAR(255) NOT NULL,
  etiket       VARCHAR(255) NOT NULL,               -- slug (URL)
  -- section 1
  s1_1_text    TEXT, s1_2_text TEXT, s1_3_text TEXT, s1_4_resim VARCHAR(500),
  -- section 2
  s2_1_resim   VARCHAR(500), s2_2_text TEXT, s2_3_text TEXT, s2_4_text TEXT, s2_5_text TEXT,
  -- section 3
  s3_1_resim   VARCHAR(500), s3_2_resim VARCHAR(500),
  -- section 4
  s4_1_resim   VARCHAR(500),
  -- section 5
  s5_1_text    TEXT, s5_2_text TEXT, s5_3_text TEXT, s5_4_text TEXT, s5_5_text TEXT,
  durum        TINYINT NOT NULL DEFAULT 0,
  tarih        DATETIME NULL,
  KEY idx_products_dil_durum (dil, durum),
  KEY idx_products_etiket (etiket),
  KEY idx_products_grup (dil_grup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> Detay sayfası: `etiket` + `dil` ile çekilir. Liste/dropdown: `durum=0 AND dil=? ORDER BY sira ASC, id DESC`.

### 2. `product_features` (← `urun_ozellik`)
```sql
CREATE TABLE product_features (
  id       INT UNSIGNED NOT NULL PRIMARY KEY,
  ur_id    INT UNSIGNED NOT NULL,                   -- FK products.id
  tip      TINYINT NOT NULL,                        -- 1=renk/varyant ("Ad|Kod"), 2=ozellik ikonu
  sira     INT NOT NULL DEFAULT 0,
  resim    VARCHAR(500),
  ozellik  VARCHAR(255),
  durum    TINYINT NOT NULL DEFAULT 0,
  tarih    DATETIME NULL,
  KEY idx_features_ur (ur_id, tip, durum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> `tip=1` renk: `ozellik` = `"Beige|1116 203"` (ad|kod, `|` ile ayrılır). `tip=2`: ikon + metin.

### 3. `special_pages` (← `ozel_sayfalar`)
```sql
CREATE TABLE special_pages (
  id        INT UNSIGNED NOT NULL PRIMARY KEY,
  dil       TINYINT NOT NULL DEFAULT 1,
  dil_grup  INT UNSIGNED NOT NULL DEFAULT 0,
  sira      INT NOT NULL DEFAULT 0,
  konum     INT NOT NULL DEFAULT 0,                 -- 0=içerik sayfa, 1=slider/banner, ... (orijinal konum)
  orjinal   VARCHAR(255),
  resim     VARCHAR(500),
  sayfa     VARCHAR(255),                           -- başlık
  detay     LONGTEXT,                               -- HTML-encoded içerik
  url       VARCHAR(500),
  etiket    VARCHAR(255),                           -- slug
  hit       INT NOT NULL DEFAULT 0,
  durum     TINYINT NOT NULL DEFAULT 0,
  tarih     DATETIME NULL,
  KEY idx_pages_dil_durum (dil, durum),
  KEY idx_pages_konum (konum),
  KEY idx_pages_etiket (etiket)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> Anasayfa slider: `konum=1 AND durum=0 AND dil=? ORDER BY sira ASC, id DESC`. İçerik sayfa (hakkimizda vb.): `etiket=? AND dil=?`.

### 4. `special_page_gallery` (← `ozel_sayfalar_galeri`)
```sql
CREATE TABLE special_page_gallery (
  id        INT UNSIGNED NOT NULL PRIMARY KEY,
  dil       TINYINT NOT NULL DEFAULT 1,
  dil_grup  INT UNSIGNED NOT NULL DEFAULT 0,
  sa_id     INT UNSIGNED NOT NULL,                  -- FK special_pages.id
  sira      INT NOT NULL DEFAULT 0,
  resim     VARCHAR(500),
  durum     TINYINT NOT NULL DEFAULT 0,
  tarih     DATETIME NULL,
  KEY idx_gallery_sa (sa_id, durum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. `static_texts` (← `sabit_yazi`)
```sql
CREATE TABLE static_texts (
  id            INT UNSIGNED NOT NULL PRIMARY KEY,
  dil           TINYINT NOT NULL DEFAULT 1,
  dil_grup      INT UNSIGNED NOT NULL DEFAULT 0,
  anahtar       VARCHAR(500) NOT NULL,              -- orijinal "orjinal" = lookup key
  deger         TEXT,                               -- orijinal "baslik" = gösterilen değer
  durum         TINYINT NOT NULL DEFAULT 0,
  duzenle_tarih DATETIME NULL,
  tarih         DATETIME NULL,
  KEY idx_static_dil_key (dil, anahtar(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> `SabitYaziFunc(key)` ≡ `SELECT deger FROM static_texts WHERE anahtar=key AND dil=? AND durum=0`. Bulunamazsa key'in kendisini döndür (orijinal fallback davranışı).

### 6. `menu` (← `menuler`)
```sql
CREATE TABLE menu (
  id            INT UNSIGNED NOT NULL PRIMARY KEY,
  dil           TINYINT NOT NULL DEFAULT 1,
  dil_grup      INT UNSIGNED NOT NULL DEFAULT 0,
  sira          INT NOT NULL DEFAULT 0,
  konum         INT NOT NULL DEFAULT 0,             -- üst/alt menü grubu (orijinal konum)
  orjinal       VARCHAR(255),
  menu          VARCHAR(255),                       -- görünen etiket
  url           VARCHAR(500),
  target        TINYINT NOT NULL DEFAULT 0,
  durum         TINYINT NOT NULL DEFAULT 0,
  duzenle_tarih DATETIME NULL,
  tarih         DATETIME NULL,
  KEY idx_menu_dil_durum (dil, durum, konum)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 7. `languages` (← `Diller`) — opsiyonel
```sql
CREATE TABLE languages (
  id           INT UNSIGNED NOT NULL PRIMARY KEY,   -- DilID (1=TR,2=EN)
  sira         INT NOT NULL DEFAULT 0,
  tanim        VARCHAR(64) NOT NULL,
  resim        VARCHAR(255),
  kultur_kod   VARCHAR(16),                         -- tr-TR / en-EN
  durum        TINYINT NOT NULL DEFAULT 0,
  kayit_tarihi DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
> next-intl locale config (`tr`,`en`) ile eşleşir; UI dil listesi DB yerine statik de tutulabilir, ancak parite için tablo seed edilir.

---

## Drizzle notları

- `backend/src/db/schema/` altında her tablo bir dosya (`products.ts`, `productFeatures.ts`, `specialPages.ts`, `specialPageGallery.ts`, `staticTexts.ts`, `menu.ts`, `languages.ts`), `index.ts` barrel ile dışa aç.
- `mysqlTable`, `int`, `tinyint`, `varchar`, `text`, `longtext`, `datetime` kullan. Tipler DDL ile birebir.
- `dil` için TS union `1 | 2`; helper `langToDil(locale: 'tr'|'en'): 1|2`.
- FK'ler uygulama seviyesinde (Drizzle relation) tanımlanır; gerekirse gerçek FK constraint eklenebilir (seed sırası: products→features, special_pages→gallery).

## Doğrulama (seed sonrası)
Kayıt sayıları kaynakla eşleşmeli: products **16**, product_features **153**, special_pages **24**, special_page_gallery **2**, static_texts **65**, menu **8**, languages **2**.
