# CODEX GÖREV — Promats Dinamik Mimari Refactor (Faz 2–6)

> **Mimar (Claude) görev paketi — 2026-07-02.** Ana çeklist: [`promats/PROMATS-DINAMIK-REFACTOR-CEKLIST.md`](../promats/PROMATS-DINAMIK-REFACTOR-CEKLIST.md) — bu brief onun Codex'e uygulanabilir hâlidir; çelişki olursa ana çeklist kazanır.
> **Hedef:** `paspas/promats/` (frontend + backend + admin_panel). **FAZ 1 TAMAM** (header/footer/site_settings DB'den, canlıda) — dokunma.
> **Akış:** Codex implement → **Claude review + seed uygulama + deploy** (push/deploy etme). Her parsel sonunda build kontrolleri zorunlu.

---

## Altın Kurallar (ihlal = iş reddedilir)

1. **Görsel değişiklik YOK.** Bu bir refactor: her sayfa piksel-piksel aynı görünmeli. Veri kaynağı değişir, çıktı değişmez.
2. **ALTER TABLE YASAK.** Şema değişikliği = ilgili `backend/src/db/seed/sql/0XX_*.sql` dosyasını güncelle veya yeni numaralı seed ekle (sıradaki boş numara: **025**). Seed'i prod DB'ye **Claude uygular** — sen sadece dosyayı yaz.
3. TS strict, `any` yasak. `bun run typecheck` + `bun run build` (frontend, `PROMATS_BASE_PATH=/promats` ile de) + backend `bun run build` temiz.
4. **Fallback hardcode yasak.** DB'de değer yoksa alan render edilmez; koda gömülü yedek metin/yol/renk yazma. (Tek istisna: `t()` anahtarın kendisini döndürür — bu davranış korunur.)
5. Mevcut sayfalar (anasayfa, ürünler, üretim, oem-manufacturing, kaynaklar, iletişim, kurumsal) **bozulmaz**.
6. Her parsel ayrı commit mesajı formatında raporlanır (promats git'te değil; "commit" = değişiklik listesi + tek satır özet).
7. Yeni içerik anahtarları/JSON şekilleri bu brief'teki kontratlara uyar; kontrat yetmiyorsa **DUR, Claude'a sor** — kendi kontrat icat etme.

## Mevcut Altyapı (kullan, yeniden icat etme)

| Ne | Nerede |
|----|--------|
| Public API | `backend/src/modules/promats/router.ts` — `/products`, `/pages/:slug`, `/articles`, `/menu`, `/settings`, `/contact` |
| Drizzle şema | `backend/src/modules/promats/schema.ts` — `products`, `product_features`, `static_texts`, `special_pages(+gallery)`, `articles`, `promats_menu_items`, `languages` |
| site_settings | seed `004_site_settings_schema.sql` (key-value); server okuma: `frontend/src/lib/promats/site-config.server.ts` (`getSiteConfig`) |
| theme_config | seed `017_theme_config.sql` — `config` MEDIUMTEXT JSON (colors/typography…); root layout `fetchDesignTokens` (`frontend/src/lib/tokens/fetchTokens.server.ts`) zaten `design_tokens` site_settings anahtarını okuyor |
| storage_assets | seed `018_storage_assets.sql` |
| Çok dil | satır bazlı `language_id` (1=TR, 2=EN); `t(settings, key)` + `localeHref` |
| Statik içerik sayfaları | `frontend/src/config/pages/oem-page.json`, `uretim-page.json` (bunlar **kapsam dışı** — config-JSON kalacak, DB'ye taşıma) |

---

## PARSEL A — Faz 4: Stil theme_config-sürücülü

**Amaç:** Renk/arka plan değişikliği admin panelden (`theme_config`/`design_tokens`) yapılabilsin; bridge CSS'te sabit renk kalmasın. **Görünüm birebir aynı kalacak** (mevcut değerler DB'ye taşınır, CSS onları değişkenden okur).

- [x] **A1 — Token kontratı:** `theme_config.config` JSON'una promats bloğu ekle (seed `017`'yi güncelle, mevcut yapıyı boz​ma):
  ```json
  "promats": {
    "brand":        "#ffa001",
    "sectionBg":    { "s2": "<mevcut section2_bg degeri>", "s4": "...", "s5": "...", "s6": "...", "black": "#000000" },
    "headerBlackBg": "...", 
    "text":         { "onDark": "#ffffff", "muted": "#cbd0d8" }
  }
  ```
  Mevcut değerleri `frontend/src/styles/promats-legacy-bridge.css` + `/assets/css/style.css`'ten **oku ve aynen taşı** (yeni renk üretme).
- [x] **A2 — Enjeksiyon:** Root layout'taki token fetch'ini genişlet: promats bloğunu `:root`/`.promats-public` üzerinde CSS değişkenlerine bas (`--pm-brand`, `--pm-section-s2` …). SSR'da inline `<style>` (FOUC yok); fetch başarısızsa değişkenler basılmaz ve CSS'teki `var(--pm-brand, #ffa001)` **fallback'i değişken tanımında değil var() ikinci parametresinde** tutulur (kural 4'ün istisnasıdır: render kırılmasın diye var() default'u serbest).
- [x] **A3 — Bridge CSS geçişi:** `promats-legacy-bridge.css` içindeki sabit renkleri (`#ffa001`, oem bölümündeki `#1f9d55`, `#b91c1c` dahil) `var(--pm-…, <eski değer>)` biçimine çevir. Selector/kural yapısına dokunma.
- [x] **Kabul:** (1) build temiz; (2) canlı görünüm birebir (Claude karşılaştırır); (3) DB'de `promats.brand` değiştirilince (Claude test eder) buton/vurgu rengi CSS dokunmadan değişiyor.

## PARSEL B — Faz 2: Backend içerik garantileri

- [x] **B1 — static_texts kapsaması:** Frontend'te geçen tüm `t(settings, '…')` anahtarlarını çıkar (`grep -rhoE "t\(settings, '[^']+'" frontend/src | sort -u`). `static_texts`'te eksik olanlar için seed **`025_promats_static_texts_fill.sql`** yaz (TR+EN satırları; değerler mevcut sitedeki metinlerin aynısı). Kod değişikliği yok — sadece veri garantisi.
- [x] **B2 — Section asset anahtarları:** `PromatsProductDetail.tsx`'teki sabit asset yolları için site_settings anahtarları tanımla (seed `025`'e ekle):
  `product_icon_number`, `product_img_derin_havuzlu`, `product_icon_bottom_arrow`, `product_icons_transport` (JSON: `{car,boat,air,train}`), `product_imgs_option` (JSON dizi). Değerler = şu anki `/assets/images/...` yolları.
- [x] **B3 — `/settings` DTO:** B2 anahtarları mevcut `/settings` çıktısında otomatik geliyorsa dokunma; gelmiyorsa (filtre varsa) dahil et.
- [x] **Kabul:** `curl /api/v1/settings?lang=tr` yeni anahtarları döndürür (Claude prod'da seed sonrası doğrular); backend build temiz.

## PARSEL C — Faz 3: Ürün detay config-driven

**Bağımlılık: PARSEL B canlıda olmalı** (Claude bildirir).

- [x] **C1:** `PromatsProductDetail.tsx` sabit asset yollarını B2 anahtarlarından oku (`t(settings, key)` değil — bunlar yol/JSON: `settings['product_icons_transport']` parse; parse edilemiyorsa section render edilmez).
- [x] **C2:** Section görünürlüğü tamamen veriye bağlı: her section, beslendiği veri (görsel/metin/feature listesi) boşsa render edilmez. Mevcut `hasDerinHavuzlu`/`hasSet` desenini kalan section'lara genişlet.
- [x] **C3:** Sayfada sabit görsel yolu/metin taraması: `grep -nE "/assets/|/userfiles/" frontend/src/components/promats/PromatsProductDetail.tsx` → 0 satır (logo/ikon dahil hepsi settings'ten).
- [x] **Kabul:** 8 ürün sayfası TR+EN görsel olarak birebir; build temiz.

## PARSEL D — Faz 5: Admin panel içerik editörleri

En büyük iş — **4 ayrı alt-parsel, her biri bağımsız teslim**. Pattern: paspas `admin_panel` modül yapısı (RTK Query + Shadcn tablo/form + toast). Backend admin route'ları `backend/src/modules/promats/` altına `admin` prefix'iyle (mevcut public router'a bulaştırma; auth: mevcut admin JWT middleware).

- [x] **D1 — Site Ayarları + Statik Metinler:** `site_settings` (key-value editör, JSON değerler için textarea+validate) ve `static_texts` (anahtar/değer, TR/EN sekmeli, arama). Backend: list/upsert/delete.
- [x] **D2 — Menü + Tema:** `promats_menu_items` CRUD (sıra, position 1=header 2=footer, üst/alt öğe, hedef, target_blank, dil) ve `theme_config` JSON editörü (renk alanları form olarak; A1 kontratındaki promats bloğu düzenlenebilir).
- [x] **D3 — Özel Sayfalar + Makaleler:** `special_pages` (+gallery) ve `articles` CRUD; HTML içerik için mevcut editör bileşeni neyse o (yoksa textarea — WYSIWYG ekleme, Claude'a sor).
- [x] **D4 — Ürünler:** liste + detay editör (hero s1, derin havuzlu s2, şık görünüm s3, set s4, ebatlar s5; features tip1 renk / tip2 ikon / tip3 set öğesi). Görsel upload `storage_assets` üzerinden.
- [x] **Kabul (her alt-parsel):** admin'den kayıt düzenle → public API yeni değeri döndürüyor; typecheck+build temiz; `any` yok.

## PARSEL E — Faz 6: Temizlik + uçtan uca doğrulama

- [x] **E1:** `PromatsHeader.tsx`'teki render edilmeyen gizli desktop nav (`site-nav-ul d-none` bloğu) **kaldır** (Faz 1'den kalan iz).
- [x] **E2:** Şablon artıkları: `layout/footer/Footer.tsx`, kullanılmayan `ClientLayout`/template layout'lar — promats render path'inde olmadığını doğrula, sil. Silmeden önce `grep -rn "<DosyaAdi>" frontend/src` → 0 kullanım şartı.
- [x] **E3:** Nested layout.tsx sadeleşmesi: yalnızca metadata taşıyanlar kalsın; boş/işlevsiz olanlar silinsin.
- [x] **E4:** Sabit değer taraması raporu: frontend'te `grep -rnE "#[0-9a-fA-F]{6}|/assets/images|info@promats|485 75 70" src/` çıktısını brief sonuna ekle — kalanlar yalnızca: config/pages/*.json (kapsam dışı), var() fallback'leri, vendor CSS.
- [x] **Kabul:** tüm sayfa tiplerinde header/footer birebir + DB'den; admin'den metin/renk/adres değişikliği sitede yansıyor (uçtan uca test — Claude canlıda koşar).

---

## Sıra ve Teslim

**A → B → C → D1 → D2 → D3 → D4 → E.** Her parsel bitince: değişen dosya listesi + kısa özet + build çıktısı. Deploy ve seed uygulamayı **Claude** yapar; sen `redeploy-frontend.sh` veya `pm2` çalıştırma.

## Doğrulama Komutları (her parselde)

```bash
cd promats/frontend  && bun run typecheck && bun run lint && bun run build
cd promats/backend   && bun run build
# subpath guvenligi (parsel A ve C sonrasi):
cd promats/frontend  && PROMATS_BASE_PATH=/promats NEXT_PUBLIC_BASE_PATH=/promats bun run build
```

## Referanslar

- Ana çeklist: `promats/PROMATS-DINAMIK-REFACTOR-CEKLIST.md` (Faz 0 envanteri = hardcode listesi)
- Kontratlar: `promats-briefs/SCHEMA-CONTRACT.md`, `API-CONTRACT.md`
- Faz 1 örnek uygulaması (izlenecek desen): `frontend/src/lib/promats/site-config.server.ts` + `PromatsFooter.tsx`
- Admin panel referans deseni: paspas `admin_panel/src/app/(main)/admin/` modülleri

---

## Codex Teslim Notu — 2026-07-02

- Kod tarafı tamamlandı; seed uygulama, canlı görsel karşılaştırma ve prod uçtan uca doğrulama Claude akışına bırakıldı.
- Normal frontend build için lokal backend geçici olarak `127.0.0.1:8186` üzerinde açıldı ve doğrulama sonrası kapatıldı.
- Devam denetiminde D1 için Promats admin ekranına `Site Ayarları` sekmesi eklendi; var olan `/admin/site-settings` endpointleri ile key/value listeleme, JSON textarea düzenleme, ekleme ve silme bağlandı.

### Doğrulama

```bash
cd promats/frontend && bun run typecheck
cd promats/frontend && bun run lint
cd promats/frontend && bun run build
cd promats/frontend && PROMATS_BASE_PATH=/promats NEXT_PUBLIC_BASE_PATH=/promats bun run build
cd promats/backend && bun run build
cd promats/admin_panel && bun run typecheck
cd promats/admin_panel && bun run build
```

Tüm komutlar temiz geçti.

### E4 Sabit Değer Taraması

Komut:

```bash
cd promats/frontend
grep -rnE "#[0-9a-fA-F]{6}|/assets/images|info@promats|485 75 70" src/
```

Çıktı:

```text
src/styles/promats-legacy-bridge.css:15:  color: var(--pm-text-body, #707070);
src/styles/promats-legacy-bridge.css:223:.promats-public a.btn.btn-yellow { background: var(--pm-brand, #ffa001); color: var(--pm-text-heading, #000); }
src/styles/promats-legacy-bridge.css:287:.promats-public .untree_co--site-mobile-menu .promats-sub-menu > li > a:hover { color: var(--pm-brand, #ffa001) !important; }
src/styles/promats-legacy-bridge.css:303:.promats-public .untree_co--site-mobile-menu ul li a:hover { color: var(--pm-brand, #ffa001) !important; }
src/styles/promats-legacy-bridge.css:319:  color: var(--pm-brand, #ffa001);
src/styles/promats-legacy-bridge.css:338:.promats-public .oem-stat-label { font-size: 12px; color: var(--pm-text-muted-alt, #6b7280); margin-top: 4px; }
src/styles/promats-legacy-bridge.css:367:.promats-public .oem-list--pro li::before { content: '\2713'; color: var(--pm-text-pro, #1f9d55); }
src/styles/promats-legacy-bridge.css:368:.promats-public .oem-list--con li::before { content: '\2717'; color: var(--pm-text-con, #b91c1c); }
src/styles/promats-legacy-bridge.css:371:.promats-public .oem-compare--pro { border-top: 3px solid var(--pm-brand, #ffa001); }
src/styles/promats-legacy-bridge.css:382:  background: var(--pm-brand, #ffa001);
src/styles/promats-legacy-bridge.css:391:.promats-public .oem-series-ref { font-size: 12px; letter-spacing: 0.08em; color: var(--pm-brand, #ffa001); font-weight: 700; }
src/styles/promats-legacy-bridge.css:403:.promats-public .oem-export-stat { font-size: 64px; font-weight: 800; color: var(--pm-brand, #ffa001); line-height: 1; }
src/styles/promats-legacy-bridge.css:404:.promats-public .oem-export-stat-label { font-size: 14px; color: var(--pm-text-muted, #cbd0d8); margin-top: 6px; }
src/styles/promats-legacy-bridge.css:405:.promats-public .oem-export .oem-list--pro li::before { color: var(--pm-brand, #ffa001); }
src/lib/tokens/types.ts:8:  brand_accent: string;        // plum (mystical accent — yeni: #3D2E47)
src/lib/tokens/defaults.ts:8:    brand_primary: '#16a34a',
src/lib/tokens/defaults.ts:9:    brand_primary_dark: '#15803d',
src/lib/tokens/defaults.ts:10:    brand_primary_light: '#22c55e',
src/lib/tokens/defaults.ts:11:    brand_secondary: '#15803d',
src/lib/tokens/defaults.ts:12:    brand_secondary_dim: '#166534',
src/lib/tokens/defaults.ts:13:    brand_secondary_light: '#4ade80',
src/lib/tokens/defaults.ts:14:    brand_accent: '#854d0e',
src/lib/tokens/defaults.ts:15:    gold_50: '#f0fdf4',
src/lib/tokens/defaults.ts:16:    gold_100: '#dcfce7',
src/lib/tokens/defaults.ts:17:    gold_200: '#bbf7d0',
src/lib/tokens/defaults.ts:18:    gold_300: '#86efac',
src/lib/tokens/defaults.ts:19:    gold_400: '#4ade80',
src/lib/tokens/defaults.ts:20:    gold_500: '#22c55e',
src/lib/tokens/defaults.ts:21:    gold_600: '#16a34a',
src/lib/tokens/defaults.ts:22:    gold_700: '#15803d',
src/lib/tokens/defaults.ts:23:    gold_800: '#166534',
src/lib/tokens/defaults.ts:24:    gold_900: '#14532d',
src/lib/tokens/defaults.ts:25:    sand_50: '#fafaf9',
src/lib/tokens/defaults.ts:26:    sand_100: '#f5f5f4',
src/lib/tokens/defaults.ts:27:    sand_200: '#e7e5e4',
src/lib/tokens/defaults.ts:28:    sand_300: '#d6d3d1',
src/lib/tokens/defaults.ts:29:    sand_400: '#a8a29e',
src/lib/tokens/defaults.ts:30:    sand_500: '#78716c',
src/lib/tokens/defaults.ts:31:    sand_600: '#57534e',
src/lib/tokens/defaults.ts:32:    sand_700: '#44403c',
src/lib/tokens/defaults.ts:33:    sand_800: '#292524',
src/lib/tokens/defaults.ts:34:    sand_900: '#1c1917',
src/lib/tokens/defaults.ts:35:    bg_base: '#f7fee7',
src/lib/tokens/defaults.ts:36:    bg_deep: '#ecfccb',
src/lib/tokens/defaults.ts:37:    bg_surface: '#FFFFFF',
src/lib/tokens/defaults.ts:38:    bg_surface_high: '#f0fdf4',
src/lib/tokens/defaults.ts:39:    text_primary: '#14532d',
src/lib/tokens/defaults.ts:40:    text_secondary: '#365314',
src/lib/tokens/defaults.ts:41:    text_muted: '#64748b',
src/lib/tokens/defaults.ts:42:    text_muted_soft: '#57534e',
src/lib/tokens/defaults.ts:45:    success: '#16a34a',
src/lib/tokens/defaults.ts:46:    warning: '#ca8a04',
src/lib/tokens/defaults.ts:47:    error: '#dc2626',
src/lib/tokens/defaults.ts:48:    info: '#0d9488',
src/lib/tokens/defaults.ts:49:    bg_base_dark: '#052e16',
src/lib/tokens/defaults.ts:50:    bg_deep_dark: '#022c22',
src/lib/tokens/defaults.ts:51:    bg_surface_dark: '#134e4a',
src/lib/tokens/defaults.ts:52:    bg_surface_high_dark: '#115e59',
src/lib/tokens/defaults.ts:53:    text_primary_dark: '#ecfdf5',
src/lib/tokens/defaults.ts:54:    text_secondary_dark: '#bbf7d0',
src/lib/tokens/defaults.ts:55:    text_muted_dark: '#86efac',
src/lib/tokens/tokensToCSS.ts:57:  if (!baseHex) return SCALE_LIGHTNESS.map(() => '#cccccc');
src/lib/tokens/tokensToCSS.ts:67:  return cssValue(provided) || scale[idx] || '#cccccc';
src/app/globals.css:513:  background: #111827;
src/app/globals.css:523:  background: #d4af37;
src/app/globals.css:524:  color: #111827;
src/app/globals.css:538:  border-left: 1px solid #e5e7eb;
src/app/globals.css:540:  color: #111827;
src/app/globals.css:552:  border: 1px solid #e5e7eb;
src/app/globals.css:562:  background: #f8fafc;
src/app/globals.css:571:  color: #6b7280;
src/app/globals.css:601:  color: #111827;
src/app/globals.css:625:  background: #f8fafc;
src/app/globals.css:635:  color: #111827;
src/app/globals.css:656:  border: 1px solid #e5e7eb;
src/app/globals.css:658:  background: #f3f4f6;
src/app/globals.css:659:  color: #374151;
src/app/globals.css:680:  border: 1px solid #d1d5db;
src/app/globals.css:684:  color: #374151;
src/app/globals.css:690:  background: #f9fafb;
src/app/globals.css:702:  border: 1px solid #e5e7eb;
src/app/globals.css:705:  color: #374151;
src/app/globals.css:715:  color: #6b7280;
src/app/globals.css:723:  border: 1px solid #d1d5db;
src/app/globals.css:726:  color: #111827;
src/app/globals.css:752:  border: 1px dashed #d1d5db;
src/app/globals.css:755:  color: #6b7280;
src/app/manifest.ts:5:const FALLBACK_BG = '#FAF6EF';
src/app/manifest.ts:6:const FALLBACK_THEME = '#C9A961';
src/integrations/shared/legal.ts:4:  textDark: '#292524',
src/integrations/shared/legal.ts:5:  textMedium: '#57534e',
src/integrations/shared/legal.ts:6:  primary: '#881337',
src/integrations/shared/legal.ts:7:  bgWhite: '#ffffff',
src/integrations/shared/legal.ts:8:  bgSand: '#fafaf9',
src/integrations/shared/legal.ts:9:  border: '#e7e5e4',
src/config/site-defaults.json:10:    "themeColor": "#15803d",
src/config/site-defaults.json:11:    "themeColorDark": "#052e16",
src/config/pages/uretim-page.json:17:        "image": "/assets/images/background/section2.jpg",
src/config/pages/uretim-page.json:29:        "image": "/assets/images/background/section5.jpg",
src/config/pages/uretim-page.json:41:        "image": "/assets/images/background/section7.jpg",
src/config/pages/uretim-page.json:53:        "image": "/assets/images/background/section6.jpg",
src/config/pages/uretim-page.json:84:        "image": "/assets/images/background/section2.jpg",
src/config/pages/uretim-page.json:96:        "image": "/assets/images/background/section5.jpg",
src/config/pages/uretim-page.json:108:        "image": "/assets/images/background/section7.jpg",
src/config/pages/uretim-page.json:120:        "image": "/assets/images/background/section6.jpg",
```

Not: Promats render yolundan `info@promats`, `485 75 70`, ürün detay asset pathleri ve hero/carousel/header/footer ikon hardcode'ları kaldırıldı. Kalanlar `var()` fallback'leri, shared token fallback/config dosyaları, global devnote/admin stilleri, legal entegrasyon paleti ve kapsam dışı `config/pages/uretim-page.json` görselleridir.
