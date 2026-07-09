# CURSOR ACİL FIX — Legacy CSS yüklenmiyor (tüm site stilsiz)

> ✅ **ÇÖZÜLDÜ (Claude, 2026-06-20).** globals.css'ten `@import url('/assets/...')` kaldırıldı;
> legacy CSS root `layout.tsx` `<head>`'ine `<link rel="stylesheet">` ile eklendi (Tailwind'den sonra,
> doğru cascade). Hero `position:static` uyarısı da çözüldü (style.css yüklenince
> `.untree_co--site-hero.overlay{position:relative}` uygulanıyor). `bun run build` temiz, tüm CSS 200.
> Aşağısı orijinal teşhis (referans).

> **Mimar (Claude) teşhisi — 2026-06-20.** Performans turundan gelen **kritik regresyon**: `/tr` dahil tüm sayfalar **stilsiz** render oluyor (mobil menü hep açık, layout yok). Önceki turlarda stilliydi.

---

## Kök neden (kesin, doğrulandı)

`src/app/globals.css`:
```css
@import 'tailwindcss';                          /* satır 1 — build'de yüzlerce kurala genişler */
@import url('/assets/css/vendor/.../...css');    /* ← artık "başta" değil */
@import url('/assets/css/style.css');            /* ← CSS spec: @import tüm kurallardan ÖNCE olmalı */
...
```

- CSS spesifikasyonu: `@import` kuralları `@charset`/`@layer` dışındaki **tüm kurallardan önce** gelmeli.
- `@import 'tailwindcss'` Tailwind v4 PostCSS plugin'i tarafından **inline genişletiliyor** → ardından gelen `@import url('/assets/...')` artık geçerli konumda değil → **düşürülüyor.**
- **Kanıt:** `/assets/css/style.css` → HTTP 200 (dosya var) **AMA** Next CSS bundle'ında (`/_next/static/css/app/layout.css`) `untree_co--site-nav` / `untree_co--overlayer` kuralları **YOK**. Yani legacy CSS tarayıcıya hiç ulaşmıyor.

## Çözüm (öneri: en güvenilir = `<link>`)

Legacy public CSS'i `@import url()` ile değil, **`<link rel="stylesheet">` ile** yükle (orijinal `css.asp` da böyle yapıyordu — birebir):

1. `globals.css`'ten `@import url('/assets/css/...')` satırlarını **kaldır** (tailwindcss import'u + kendi `@theme`/bridge'in kalsın).
2. Promats public layout'un `<head>`'ine (veya `PromatsPublicLayout`/`[locale]/layout`) legacy stylesheet `<link>`'lerini ekle — `src/lib/promats/legacy-styles.ts` sırasıyla:
   ```
   font/stylesheet.css · icomoon/style.css · aos.css · bootstrap.css · 22menu.css · style.css
   ```
   (owl.carousel/fancybox/animate kaldırıldıysa listede olmasın — tutarlı tut.)
3. FOUC olmaması için `<link>`'ler `<head>`'de, Tailwind'den **sonra** precedence ile (Tailwind reset legacy'yi ezmesin — gerekirse `@layer` veya link sırası).

> Alternatif (daha kırılgan): `next.config` PostCSS'te legacy CSS'i ayrı işlemek / `@layer` ile sarmak. `<link>` yöntemi en az riskli ve birebir orijinal davranış.

## İkincil (aynı turda) — hero `fill` uyarısı
Console: `Image ... has "fill" and parent element with invalid "position" ... "static"`.
`PromatsHeroBg` (next/image `fill`) → **parent elemana `position: relative`** ver (fill için zorunlu). Banner görselleri (`sldier1icon-kopya.jpg`, `bnr2/3/4.jpg`) bundan etkileniyor.

## Doğrulama
- `/tr` **stilli** geliyor (header sticky, hero, footer düzgün); mobil menü kapalı başlıyor.
- Next CSS bundle'ında legacy kurallar mevcut **veya** `<link>` ile `/assets/css/style.css` yükleniyor.
- Console'da `position static` uyarısı yok.
- `bun run build` + LHCI tekrar (regresyon perf'i de etkilemiş olabilir).
- **Görünüm birebir** (Antigravity sonrasında bakacak).

## Not (mimar)
Bu, performans turunun yan etkisi. CSS yükleme yöntemi değiştirilirken stil çıktısı gerçek tarayıcıda doğrulanmamış — bundan sonra CSS/asset yükleme değişikliklerinde **render'ı gerçek tarayıcıda teyit et** (curl 200 yeterli değil; @import düşse de dosya 200 döner).
