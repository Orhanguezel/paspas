# Promats Görsel Parite Raporu (Antigravity)

## Anasayfa (`/` ve Header/Footer) — Desktop & Mobil
- [x] **OK:** Header Menü İçi Sosyal İkonlar — `PromatsSocialLinks` mobil + desktop menüde İLETİŞİM'den sonra (`gt_facebook`/`gt_instagram` settings + fallback). Cursor doğrulama 2026-06-20: `http://localhost:3177/tr` HTML'de `social-media` + `icon-facebook` mevcut.
- [x] **OK:** Layout/Grid ve Genel Bileşenler — Header, Hero Slider, Ürün Vitrin, Footer ana yapıları (`untree_co--site-nav`, `section2_bg`, `section4_bg` vs.) başarıyla korunmuş ve birebir taşınmış.
- [x] **OK:** Footer — Bileşen orijinal `alt-taraf.asp` ile 1:1 uyumlu; copyright, e-katalog, iletişim bilgileri ve sosyal medya ikonları doğru yerleştirilmiş.
- [x] **OK:** Arama Bloğu — Gizli `menu_search` yapısı ve state toggle'ı başarıyla React'e (`PromatsHeader.tsx`) aktarılmış.

## Ürün Listesi ve Detay
- [x] ~~**FARK:** Animasyonlar ve Scroll Davranışları~~ — **MİMAR HÜKMÜ (Claude, 2026-06-20): YANLIŞ POZİTİF.** AOS zaten doğru init ediliyor: `src/components/common/AOSInit.tsx` (`AOS.init()` + `AOS.refresh()`, `initDelayMs` ile), `src/app/ClientLayout.tsx`'e mount edilmiş. Rapor statik HTML okumasına dayandığı için (gerçek tarayıcı scroll'u yok) init'i göremedi. → **Aksiyon gerekmez.**
  - [x] **OK:** App Router route değişiminde `AOS.refresh()` — `AOSInit.tsx` pathname effect (Cursor tur 4, 2026-06-20).
- [x] **OK:** Ürün Şov Vitrini — `PromatsHome.tsx` içerisindeki ürün gösterimi orijinal ile aynı hiyerarşiyi (resim solda, metin sağda) paylaşıyor.

*Not: Public görsel parite anasayfa/header/footer için tamamlandı. Kalan işler: ürün detay s1..s5 section'ları (@Codex), piksel düzeyinde Antigravity desktop/mobil screenshot karşılaştırması.*

---

## Codex Gerçek Tarayıcı Parite Turu — 2026-06-25

Karşılaştırma yöntemi: Playwright/Chromium ile canlı orijinal `https://promats.com.tr` ve lokal yeni site `http://localhost:3177` desktop 1440x900 + mobil 390x844 viewportlarında tarandı. Screenshot çıktıları ve JSON metrik raporu: `promats/_parity_screenshots/`.

### Anasayfa — Desktop & Mobil
- [x] **OK:** Route/status — canlı `/` ve lokal `/tr` 200.
- [x] **OK:** Desktop genel akış yakın — yükseklik farkı %2.4, ana başlıklar `PREMIUM / OTO PASPASLAR`.
- [x] **OK:** Mobil genel akış yakın — yükseklik farkı %6.5, yatay overflow yok.
- [x] **FIX:** Mobil hero/carousel piksel farkı — Swiper wrapper/slide yüksekliği mobilde canlı legacy CSS ile eşitlendi (`60vh`, `min-height:500px`); böylece 100vh bridge override'ı kaldırıldı. Codex 2026-06-25.

### Ürün Detayları — Desktop & Mobil
- [x] **OK:** TR ürün detay route'ları 200: `maximum-serisi`, `star-plus-serisi`, `icon-serisi`, `pars-serisi`, `orbital-serisi`, `basak-plus-serisi`, `profesyonel-serisi`, `tuna-serisi`.
- [x] **OK:** Desktop yapısal akış yakın — ürün detaylarında yükseklik farkı çoğunlukla %7 civarı, yatay overflow yok.
- [x] **FIX:** Piksel/görsel sayısı farkı — ürün carousel preset'i canlı `main.js` ile eşitlendi: 1/3/5 görünür ürün, 5000ms autoplay, 1000ms geçiş, startPosition 0; SSR/fallback satırı da 5 ürün basacak şekilde düzeltildi. Codex 2026-06-25.
- [x] **FIX:** Mobil ürün detay yüksekliği — product detail section'ları page-type class'larla ayrıldı; mobilde overview/colors/set/related boşlukları legacy ritme yaklaştırıldı. Codex 2026-06-25.

### Hakkımızda / Özel Sayfa
- [x] **FIX:** `/tr/hakkimizda` önce şablondan kalan `next.config.js` rewrite yüzünden anasayfaya düşüyordu (`/:locale/hakkimizda -> /:locale?section=promises`). Rewrite kaldırıldı, özel sayfa artık `HAKKIMIZDA` içeriğini döndürüyor.
- [x] **OK:** Route/status — canlı `/hakkimizda.html` ve lokal `/tr/hakkimizda` 200.
- [x] **FIX:** Hakkımızda sayfa yüksekliği — statik sayfa içeriği `promats-static-content` ile ürün detay CSS'inden ayrıldı; mobilde genel `.section4_bg` legacy margin'i statik sayfalarda bastırıldı. Codex 2026-06-25.

### İletişim
- [x] **OK:** Route/status — canlı `/iletisim.html` ve lokal `/tr/iletisim` 200.
- [x] **OK:** Görsel/yapısal yakınlık — desktop heightΔ ~0.05, mobil heightΔ ~0.03, image delta 0, yatay overflow yok.

### Arama
- [x] **OK:** Route/status — canlı `urun-arama.asp?kelime=star` ve lokal `/tr/arama?q=star` 200.
- [x] **FIX:** Başlık/metin sunumu — sorgu varken lokal arama sayfası canlıdaki gibi `ARANAN: <kelime>` / `SEARCHED: <query>` başlığıyla açılıyor. Codex 2026-06-25.

### Ürün Liste
- [x] **NOT:** Canlı `https://promats.com.tr/urunler.asp` 301 ile `/404.html#hata` yönleniyor; bu nedenle yeni `/tr/urunler` için birebir canlı kaynak sayfa yok. Lokal route 200 ve ürün listesi çalışıyor.

### 404
- [x] **NOT:** Canlı `/404.html` HTTP 200 ile 404 içeriği sunuyor; lokal bilinmeyen route doğal olarak HTTP 404 dönüyor. Görsel karşılaştırmada status farkı bilinçli davranış farkı olarak not edildi.

---

## Mimar (Claude) doğrulama özeti — 2026-06-20 (güncellendi)
1. ~~🔴 Header social-media bloğu eksik~~ — **GİDERİLDİ.** `PromatsHeader.tsx` + `PromatsSocialLinks.tsx` (mobil `site-nav-ul` + desktop `js-clone-nav` içinde). Canlı HTML doğrulandı.
2. 🟡 **AOS init — YANLIŞ POZİTİF** (Antigravity statik HTML okuması). `AOSInit` promats shell'de mount; route-change `refresh` eklendi.
