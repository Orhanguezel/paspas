# ANTIGRAVITY BRIEF — Promats Web Görsel Parite Doğrulama

> **Senin rolün:** UI/görsel doğrulayıcı. Kod yazmazsın; yeni siteyi orijinaliyle **karşılaştırır, fark raporlarsın.**
> **Hedef:** Yeni Next.js sitesi `https://promats.com.tr/`'den **görsel olarak ayırt edilemez** olmalı.
> **Tek doğruluk kaynağı:** `paspas/PROMATS-WEB-PLAN.md`.

---

## 0. Bağlam

Promats sitesi (Klasik ASP) `sablon_proje` üzerine birebir yeniden yazılıyor. Codex implement ediyor.
Sen her sayfayı **iki kaynakla** karşılaştıracaksın:
1. **Canlı orijinal:** `https://promats.com.tr/`
2. **Lokal ASP kaynağı (referans markup/tasarım):** `paspas/promats-ftp-yedek/httpdocs/`
3. **Yeni site (test edilen):** lokal Next.js (`paspas/promats/frontend`, port `proje.json`'da).

## 1. Doğrulanacak sayfalar

| Sayfa | Yeni route | Orijinal |
|-------|-----------|----------|
| Anasayfa | `/tr` , `/en` | `https://promats.com.tr/` |
| Ürün detay | `/tr/urunler/[etiket]` | her ürün sayfası (16 ürün) |
| Arama | `/tr/arama` | ürün arama sonucu |
| Hakkımızda / özel sayfa | `/tr/[etiket]` | `/hakkimizda.html` |
| İletişim | `/tr/iletisim` | `/iletisim.html` |
| 404 | not-found | `/404.html` |

## 2. Her sayfada kontrol listesi

- [ ] **Layout/grid** birebir (header, footer, section sıralaması, boşluklar)
- [ ] **Tipografi:** Cormorant Garamond + Roboto; başlık/gövde boyut & ağırlıkları aynı
- [ ] **Renkler** (arka plan, metin, buton, hover) aynı
- [ ] **Görseller** doğru yerde, doğru oranda (ürün görselleri, slider, banner)
- [ ] **Header:** sticky davranış, logo, mega-menü (ürün dropdown), TR/EN switcher, sosyal ikonlar
- [ ] **Footer:** logo, menü, adres/tel/eposta, sosyal, copyright
- [ ] **Animasyonlar:** slider (owl→Swiper) otomatik kayma, AOS fade-up scroll efektleri, loader/spinner, fancybox lightbox
- [ ] **Dil:** TR ve EN ayrı ayrı; metinler doğru çevriliyor
- [ ] **Responsive:** mobil (≤768) + tablet + desktop; mobil menü toggle çalışıyor

## 3. Yöntem

1. Her sayfa için orijinal ve yeni siteden **aynı viewport'ta ekran görüntüsü** al (desktop 1440px + mobil 390px).
2. Yan yana karşılaştır; farkları işaretle (konum, renk, font, boşluk, eksik öğe).
3. Her farkı **sayfa + bileşen + beklenen vs gerçek** olarak raporla.

## 4. Rapor formatı

`paspas/promats-briefs/ANTIGRAVITY-RAPOR.md` dosyasına yaz:

```
## <Sayfa adı> — <desktop/mobil>
- [ ] FARK: <bileşen> — beklenen: <orijinal>, gerçek: <yeni>. Önem: yüksek/orta/düşük
- [x] OK: <bileşen> birebir
```

Yüksek önemli farkları **Cursor** (cila) veya **Codex** (eksik implementasyon) için etiketle.

## 5. Çakışma Kuralı

Codex bir sayfada/dosyada **aktif çalışırken doğrulama yapma** — modül "bitti" işaretlenince doğrula.
Sen kod **değiştirmezsin**; sadece rapor üretirsin.
