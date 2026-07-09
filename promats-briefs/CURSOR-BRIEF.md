# CURSOR BRIEF — Promats Web Cila / Refactor / CSS

> **Senin rolün:** Cila & ince ayar. Codex'in yazdığı, Antigravity'nin fark raporladığı kodu **düzeltir, parlatırsın.**
> **Kod yazarsın ama yeni özellik/sayfa üretmezsin** — o Codex'in işi. Sen kaliteyi yükseltirsin.
> **Tek doğruluk kaynağı:** `paspas/PROMATS-WEB-PLAN.md` + `paspas/promats-briefs/ANTIGRAVITY-RAPOR.md`.

---

## 0. Bağlam

Promats sitesi `sablon_proje` üzerine birebir yeniden yazılıyor (Codex). Sen şu sorun sınıflarını çözersin:

## 1. Sorumluluk alanların

### A. CSS çakışma & izolasyon
- Orijinal `style.css` + Bootstrap + vendor CSS, taslağın **Tailwind** kurulumuyla çakışabilir.
- Global stillerin sadece public site'a uygulanıp admin'i bozmamasını sağla (scope/izolasyon).
- Bootstrap grid ile Tailwind reset çatışmalarını gider.

### B. jQuery → React davranış ince ayarı
- Codex owl.carousel→Swiper, AOS, fancybox geçişini yapar; sen **orijinaldeki davranışla** birebir eşleştir:
  - Slider hız/otomatik kayma/loop ayarları
  - AOS fade-up timing, scroll trigger noktaları
  - Sticky nav eşik değeri, mobil menü açılış animasyonu
  - Loader/spinner görünme süresi
- jQuery kalıntısı bırakma — hepsi React/Next idiomatik olsun.

### C. Antigravity raporundaki yüksek-önem farkları
- `ANTIGRAVITY-RAPOR.md`'deki `[ ] FARK ... Önem: yüksek` maddelerini çöz (font, boşluk, renk, hizalama).

### D. TypeScript / lint / kod kalitesi
- `any` temizliği, tip hataları, kullanılmayan import.
- paspas/CLAUDE.md kurallarına uyum: DRY, import düzeni, bileşen >200 satır bölme.

### E. Performans
- Lighthouse (lokal): görsel boyutları (next/image), lazy-load, font display, gereksiz JS.
- Core Web Vitals: LCP/CLS/INP.

## 2. Yapmayacakların

- Yeni sayfa/modül/endpoint yazma (Codex).
- Tasarımı **değiştirme** — hedef birebir orijinal. "İyileştirme" adına görünüm değiştirme.
- DB şeması/ALTER (yasak; seed SQL Codex'te).

## 3. Çalışma kuralı

- Bir dosyada Codex/Antigravity **aktifken dokunma**. Sıra: Codex yaz → Antigravity doğrula → **Cursor cila**.
- Her cila turundan sonra build + lint çalıştır, kırma.
- Çözdüğün yüksek-önem farkı için `ANTIGRAVITY-RAPOR.md`'de kutuyu `[x]` yap.

## 4. Tamamlanma Kriteri

- CSS çakışması yok, admin + public ayrı ayrı düzgün.
- Animasyonlar orijinalle aynı hissi veriyor.
- `ANTIGRAVITY-RAPOR.md`'de yüksek-önem fark kalmadı.
- Build + lint temiz; Lighthouse skorları makul.
