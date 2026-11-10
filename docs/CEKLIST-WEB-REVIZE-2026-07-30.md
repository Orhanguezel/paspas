# Promats Web Sitesi Revize Çeklisti — 2026-07-30

Kaynak: `Promats REvize1 (1).docx` + canlı `page_feedback` `/promats/*` ve `[Web]` notları.
Web sitesi kodu: **`frontend/`** (Next.js, `[locale]` i18n, `components/promats`).
Canlı: `panel.avrasyaotomotiv.net/promats` — deploy: `scripts/deploy/deploy-promats-web.sh` (git-tabanlı tek çatı).

> **Öncelik (kullanıcı):** Web önce. Teklif/CRM ve web-form backend entegrasyonu (`[Web]` / B grubu) sonraki aşama.

---

## ✅ ÇÖZÜLDÜ (deploy + canlı doğrulandı)

- [x] **R0 — Site geneli Türkçe font** `f585a467` `211168d1` — Gotham aileleri Türkçe **İ ı Ğ ğ Ş ş** gliflerini içermiyordu; Gotham font-family'lerine `unicode-range` ile DIN TR kaynağı bağlandı (glyph-level fallback, `stylesheet.css`). Kullanım yerlerine dokunulmadı, Gotham kimliği korundu.
- [x] **R1 — E-Katalog menüsü** `632017d6` — native `<details>` → controlled dropdown; **dışarı tıklama + Escape ile kapanır**. "Katalog Görüntüle" + "PDF İndir" korundu.
- [x] **R1 — Footer sosyal ikon renkleri** `cbbabc5d` — footer'ın genel `a/span{color:#000}` kuralı marka renklerini eziyordu → footer-scoped marka renkleri eklendi.
- [x] **R1 — Sosyal ikon hover renk kaybı** (tur içi) — footer + offcanvas `a:hover{color:turuncu}` kuralları ikon marka rengini eziyordu → `:not(.promats-social-link)` ile dışlandı; hover'da marka rengi korunur.
- [x] **R2 — "Dört Temel Yetkinlik" → "Temel Yetkinliklerimiz"** `fe0d5cd0` — canlıda zaten yapılmış (special page id=14). Doğrulandı.
- [x] **R2 — Sistematik Süreç altı 4 görsel** `fe0d5cd0` — blok 4 sütun grid render ediliyordu ama görselleri **kırıktı** (`images/uretim/*.jpg` → 404); docx image17-20 (malzeme/tasarım/üretim/kalite, `/uploads`) ile değiştirildi. **TR (id=14) + EN (id=15)** düzeltildi + doğrulandı.
- [x] **R2 — Üst-sağ kurumsal görsel** `65a7453c` — `page.image` = image16 (kompozit afiş). **TR + EN** doğrulandı. (image16 metinli afiş; "şimdilik, sonra değişecek".)
- [x] **R3 — İletişim yerleşimi** `d25090ff` — en başta "BİZE ULAŞIN / DOĞRU ÇÖZÜM İÇİN BURADAYIZ" hero (açıklama + 3 ✔ madde, TR/EN); harita en alta.
- [x] **R3 — İletişim hero header altında kalıyordu** (tur içi) — hero üst padding'i header'ı (fixed 85px) geçmiyordu → PmHero ile aynı ~130px offset.
- [x] **R3 — İlgilenilen ürün grubu çoklu seçim** `a1bf78c3` — native `<select multiple>` → kapalı kutu + checkbox paneli (dışarı-tıkla/Escape kapanır) + seçili ürün etiketleri (× ile kaldır).
- [x] **R4 — OEM istatistik şeridi tek satır** `3fc2bea0` — 6 öğe (2017/35+/OEM/PL/8+/Istanbul) 3×2 iki satır geliyordu; `statsColumns` 6 öğede tek satır (6 sütun), tablet'te 3'e düşer. (docx image27 ile tespit.)
- [x] **R4 — Başlık hiyerarşisi** `8c18cc51` — `.pm-caps__title` 1. satır küçük font + koyu renk (eyebrow), 2. satır büyük marka. Tüm modern sayfa başlıklarına uygulanır.
- [x] **R5 — Ürün detay** `07d1d6fb` — (a) "First Class PVC Material" damgası koyu görsele binince kayboluyordu → z-index + beyaz hale; (b) overview arka planı sağa yaslıydı → `cover`/`center right` ile renk sola devam eder; (c) renk/font → R0 ile.
- [x] **about/hakkımızda başlığı desktop'ta header altında kalıyordu** `28a79c87` — header offset (`padding-top`) sadece mobilde tanımlıydı, desktop'a da 7rem eklendi. ✅ deploy + canlı doğrulandı. (Not: "yazı stili" ince ayarı thread ekindeki görseli bekliyor.)

---

## ⏳ BİLGİ / ASSET / ONAY BEKLENİYOR

Bunlar kod ile çözülemez; grafikçi çıktısı, asset veya kullanıcı girdisi/onayı bekliyor.

### Grafikçi / tasarım bekliyor
- [ ] **R1 — Neden Promats kompozisyonu** `f55e3d4d` — araç içi paspas görseli bir tık büyük; arka plan "Neden Promats?" yazısı netleştir → görsel yargı.
- [ ] **R1 — Ürün vitrini** `01f96b37` — mevcut siteye yaklaştır → ürünler grafikçi revizesine bağlı.
- [ ] **R2 — Kurumsal layout** `65a7453c` — sayfa düzenini artifact `32c583b0`'a benzet. Artifact claude.ai SPA olduğu için koddan render edilemedi; **hedef layout görsel olarak grafikçiden alınmalı.**
- [ ] **Ürünler sayfası** `b782729d` — `/promats/tr/urunler` grafikçi revizesi bekliyor (ana hatlar iyi).

### Yeni feedback notları (bilgi/görsel bekliyor)
- [ ] **`516ea5cb` OEM & Private Label** — "boş alan var, kontrast değil kontrol et" → thread ekindeki görsel gerekli, hangi bölüm/boşluk belirsiz.
- [ ] **`28a79c87` about-us "yazı stili"** — header-altında-kalma kısmı ✅ çözüldü; "yazı stilini düzelt" kısmı thread ekindeki görseli bekliyor.

### Opsiyonel ince ayar (kullanıcı/grafikçi)
- [ ] **R3 — EN hero metinleri** — docx "görseldeki gibi" diyordu, görsel okunamadı; makul çeviri kondu, istenirse düzeltilir.
- [ ] **R5 — Ürün detay piksel-tam görsel onay** — docx "grafikçi çalışıyor, küçük revizeler gelebilir".
- [ ] `95b60548` Genel revize takip — bu çeklistin kendisi (kapatma referansı).

---

## B grubu — Web form/teklif backend entegrasyonu (SONRAKİ AŞAMA)

Teklif/CRM modülüne bağlı; kullanıcı kararıyla bu turda kapsam dışı:
`f37133af` public teklif endpointi, `9296069b` veri modeli, `19fc9585` iletişim/OEM form akışı,
`683a30a9` payload sözleşmesi, `457cf954` iletişim/teklif ayrımı, `b0730b54` ürün detayından teklif,
`303338d6` form UX/spam/analitik, `f29f6917` eski contact geriye uyum.

---

**Kapatma:** Her madde deploy + görsel doğrulama sonrası ilgili feedback thread'i `resolved`.
