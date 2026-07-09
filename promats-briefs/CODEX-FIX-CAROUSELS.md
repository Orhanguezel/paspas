# CODEX GÖREV — K6 Tamamlama: Legacy jQuery → React (carousel + script temizliği)

> **Mimar (Claude) görev paketi — 2026-06-20.** Kritik blocker: anasayfa + ürün sayfalarında 3 runtime hatası.
> **Bağlam:** `paspas/PROMATS-WEB-PLAN.md` (K6) · proje çalışıyor (FE 3177 / BE 8186 / admin 3196).
> **Birebir kuralı:** Görünüm/tasarım **değişmeyecek** — sadece jQuery davranışları React'e taşınacak.

---

## Sorun (kök neden)

`src/components/promats/PromatsPublicLayout.tsx` (satır ~27-40) **14 legacy jQuery vendor script'i + `main.js`'i** ham `<script defer>` JSX tag'leriyle yüklüyor. Bu üç hatayı üretiyor:

1. **Hydration mismatch** → `main.js` içindeki `siteMenuClone()`:
   `$('.js-clone-nav').clone().attr('class','site-nav-wrap').appendTo('.site-mobile-inner')` SSR sonrası DOM'a `<ul class="site-nav-wrap">` enjekte ediyor → React hydration kırılıyor (trace'te bu eleman görünüyor).
2. **`AOS is not defined` (main.js:3)** → `main.js` `AOS.init()` çağırıyor ama `aos.js` vendor script'i yüklenmiyor (AOS React'e taşındı). 
3. **"Script tag in React component"** uyarısı → ham `<script>` JSX (React bunları execute etmez / SSR'de execute eder, ikisi de yanlış).

## Temel mesele: K6 portu yarım

Plan K6 (owl→Swiper) **uygulanmamış**. Durum:
- ✅ `swiper@9`, `embla-carousel-react@8`, `aos@2` **package.json'da kurulu** (kullanıma hazır).
- ✅ React tarafı kısmen hazır: `src/components/common/AOSInit.tsx` (AOS init+refresh), `src/lib/promats/swiper-presets.ts`, `src/lib/promats/animation-config.ts` (PROMATS_HERO_CAROUSEL / PROMATS_PRODUCT_CAROUSEL / PROMATS_GALLERY_CAROUSEL config'leri).
- ❌ Ama 4 bileşen hâlâ **owl-carousel markup** + jQuery owl ile init oluyor:
  - `src/components/promats/PromatsHeroSlider.tsx` (`owl-hero`)
  - `src/components/promats/PromatsProductCarousel.tsx` (`small_product`)
  - `src/components/promats/PromatsProductDetail.tsx` (`owl-carousel`)
  - `src/app/[locale]/arama/page.tsx` (`small_product`)

## Yapılacaklar

### 1. Legacy script'leri kaldır ✅
`PromatsPublicLayout.tsx`'teki 14 `<script>` bloğunu **tamamen sil** (`Script` importu da kullanılmıyorsa kaldır). Bu blok, hataların kaynağı ve davranışları React'e taşınınca gereksiz.

### 2. Carousel'leri React'e bağla (Swiper veya Embla — ikisi de kurulu) ✅
Her owl-carousel'i kurulu React kütüphanesine bağla, **CSS sınıflarını/görünümü koruyarak**:
- **Hero slider** (`PromatsHeroSlider`): `PROMATS_HERO_CAROUSEL` config (loop, autoplay, fade, dots, nav).
- **Ürün vitrin** (`PromatsProductCarousel`, arama): `PROMATS_PRODUCT_CAROUSEL` (responsive 1/2/4 items, autoplay, margin).
- **Ürün detay galeri** (`PromatsProductDetail`): `PROMATS_GALLERY_CAROUSEL` (loop, 1 item, nav, dots).
- Swiper/Embla CSS'i import et; owl-carousel görsel sonucu (ok/nokta konumları, geçiş) orijinalle eşleşsin.

### 3. `main.js`'in diğer işlerini React karşılığıyla kapat ✅
`main.js`'i kaldırınca kaybolan davranışlar — gerekenleri React'e taşı:
| main.js işi | React karşılığı |
|-------------|-----------------|
| `AOS.init()` | ✅ Zaten `AOSInit.tsx`'te — ek iş yok |
| `.loader`/overlayer fadeOut | ✅ `SplashScreen` + overlayer `display:none` (çözüldü) |
| `siteMenuClone()` (mobil menü klonu) | React'te Header **zaten iki menü render ediyor** → klona gerek yok; `.js-clone-nav` jQuery klonunu kaldır |
| `sticky nav` (`js-sticky-nav`) | Küçük React effect (scroll → class toggle), `PROMATS_STICKY_NAV.scrollThresholdPx` |
| `lettering` (hero-heading harf böl) | Opsiyonel/kozmetik — görsel fark yaratmıyorsa **atla** (K6: sadece gerekli efektler) |
| `ScrollMagic`/GSAP sahneleri | Opsiyonel — kritik değilse **atla**; gerekiyorsa React'e taşı |

### 4. Doğrula ✅
- `bun run build` temiz.
- Tarayıcı console'da: **hydration hatası yok, `AOS is not defined` yok, script-tag uyarısı yok.**
- `/tr` ve `/tr/urunler/maximum-serisi` ve `/tr/arama`: slider'lar **çalışıyor ve görünüm orijinalle birebir.**
- Mobil menü açılıp kapanıyor (sosyal ikonlar dahil).

## Codex Sonuç — 2026-06-20
- ✅ `PromatsPublicLayout.tsx` içindeki legacy jQuery/vendor/main.js script blokları kaldırıldı; AOS init Promats layout'a React bileşeni olarak bağlandı.
- ✅ Hero, ürün vitrin, ürün detay ilişkili ürünler ve ürünlü arama sonuçları Swiper ile çalışıyor; mevcut tema sınıfları korundu.
- ✅ Sticky nav scroll davranışı React effect'e taşındı; mobil menü klonlama ihtiyacı kaldırılmış React menüyle kapalı.
- ✅ `bun run build` geçti.
- ✅ Chrome smoke: `/tr`, `/tr/urunler/maximum-serisi`, `/tr/arama?q=maximum` 200; hydration, `AOS is not defined`, script-tag uyarısı yok; mobil menü aç/kapat ve sosyal ikonlar doğrulandı.

## Kısıtlar
- **Tasarım birebir** — owl→Swiper geçişinde görsel sonuç (boşluk, ok/nokta, geçiş hızı) değişmemeli.
- jQuery (`$`) kalıntısı bırakma — hedef sıfır jQuery.
- TS strict, `any` yasak (paspas/CLAUDE.md).
- Bitince bu dosyada ilgili maddeleri işaretle + `PROMATS-WEB-PLAN.md` K6'yı ✅ yap.

## Sonraki (bu görevden sonra)
Antigravity **gerçek tarayıcıyla** (scroll dahil) görsel parite turunu çalıştırır → Cursor performans cilası (`CURSOR-PERF-BRIEF.md`).
