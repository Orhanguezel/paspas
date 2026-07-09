# CURSOR BRIEF — Promats Performans Cilası

> **Mimar (Claude) görev paketi.** Tek kalan kritik iş: Lighthouse performans skorunu yükseltmek.
> **Birebir kuralı geçerli:** Görünümü **değiştirme** — sadece nasıl yüklendiğini optimize et.
> **Bağlam:** `paspas/PROMATS-WEB-PLAN.md` · proje çalışır durumda (FE 3177 / admin 3196 / BE 8186).

---

## Mevcut LHCI (lokal)
| Sayfa | Performans | Hedef |
|-------|-----------|-------|
| Ana sayfa | **0.52** | ≥ 0.85 |
| Ürün / Arama | **0.66** | ≥ 0.85 |
| SEO | 1.00 ✅ | korunsun |
| Accessibility | 0.94–0.96 ✅ | korunsun |
| Best Practices | 0.96–1.00 ✅ | korunsun |

## Mimar teşhisi (kök nedenler)

1. **`next/image` HİÇ kullanılmıyor** — 19 ham `<img>` etiketi, 0 `next/image`. → otomatik resize/webp/lazy-load yok. **En büyük LCP/TBT sebebi.**  
   **Codex kontrolü 2026-06-25:** Bu teşhis artık güncel değil; Promats public görselleri `PromatsImage` üzerinden `next/image` kullanıyor. Kalan ham `<img>` kullanımları logo SVG gibi optimize edilmemesi gereken veya admin/editor HTML üretimi olan alanlar.
2. **Optimize edilmemiş görseller** — ürün PNG'leri ~0.7MB. Hero/slider görselleri LCP'yi şişiriyor.
3. **Yinelenen görsel dosyaları** — UTF-8 düzeltmesi sonrası hem `varlık-1.png` hem bozuk adlı `varl�k-1.png` (her biri 0.7MB) public'te. Kullanılmayan bozuk kopyaları temizle.

## Yapılacaklar (öncelik sırası)

### 1. `<img>` → `next/image` (en yüksek etki)
- `src/components/promats/*` ve `src/app/[locale]/*` içindeki 19 `<img>`'i `next/image`'e çevir.
- Slider/hero ilk görseline `priority`; geri kalanına `loading="lazy"`.
- `width/height` veya `fill`+`sizes` ver (CLS'i 0 tut — A11y/BP skorunu bozma).
- `next.config` → uzak görsel yoksa gerek yok; hepsi `public/` altında (yerel optimize edilir).
- [x] **Codex kontrolü:** Promats bileşenlerinde `PromatsImage`/`next/image` aktif; hero `fill + priority`, ürünler `sizes + lazy` kullanıyor.

### 2. Görsel optimizasyonu
- 0.7MB PNG'leri webp/optimize boyuta indir (next/image çoğunu halleder; çok büyük kaynakları ayrıca sıkıştır).
- Hero/slider için uygun `sizes` ile responsive varyant.
- [x] **Codex kontrolü:** `next.config` `formats: ['image/avif', 'image/webp']`, `deviceSizes`, `imageSizes`, uzun cache TTL içeriyor; bileşenlerde responsive `sizes` mevcut.

### 3. Render-blocking & JS azaltma
- AOS/Swiper/fancybox client-side; ihtiyaç olmayan sayfalarda yükleme (dynamic import / `next/dynamic`, `ssr:false` uygun yerlerde).
- Legacy vendor CSS'i sadece public site layout'una scope'la (admin'e sızmasın — zaten LegacyStyles var, teyit et).
- Kullanılmayan font ağırlıklarını ele.
- [x] **Codex kontrolü:** Legacy jQuery scriptleri kaldırılmış; hero Swiper inner dinamik import ediliyor; AOS React bileşeni olarak public layout'ta mount ediliyor.

### 4. Temizlik
- `public/userfiles/.../*` altındaki bozuk-adlı (`�`) yinelenen görselleri sil (hiçbir yerde referans edilmiyorsa).
- **Bekletildi:** Bozuk görünen dosya adları gerçek `�` karakteri değil, eski encoding byte'ları; kaynak kodda doğrudan referans yok ama içerik canlı DB'den gelebileceği için silme canlı referans kontrolünden sonra yapılmalı.

## Kısıtlar
- **Tasarımı/görünümü değiştirme** — birebir parite korunmalı (Antigravity tekrar bakacak).
- SEO 1.00 ve A11y ≥0.94 **düşmemeli** (img alt'ları, aria-label'lar korunmalı; CLS'e dikkat).
- Her turdan sonra `bun run build` + LHCI çalıştır, skoru ölç.

## Tamamlanma kriteri
- Ana sayfa + ürün + arama performans **≥ 0.85**.
- SEO/A11y/BP skorları korunmuş.
- Build temiz, görünüm birebir (Antigravity onayı).
