# Promats Web Sitesi Revize Çeklisti — 2026-07-30

Kaynak: `Promats REvize1 (1).docx` + canlı `page_feedback` `/promats/*` ve `[Web]` notları.
Web sitesi kodu: **`frontend/`** (Next.js, `[locale]` i18n, `components/promats`).

> **Öncelik (kullanıcı, 2026-07-30):** Web önce. Teklif/CRM ve web-form backend entegrasyonu
> (`[Web]` grubu) **sonraki aşama**. Bu çeklist görsel/UX revizeleri (A grubu) kapsar.

> **Not — görsel doğrulama:** Bu revizeler büyük ölçüde tasarım/layout. Kod değişikliği sonrası
> görsel doğrulama (screenshot) mimar (Claude) tarafından kod düzeyinde, son onay kullanıcı/grafikçi
> tarafından yapılır. Ürünler sayfası grafikçi çıktısına bağlı (beklemede).

---

## A grubu — Görsel/UX revizeleri (öncelikli)

### 🔴 R0 — Site geneli Türkçe karakter / font tutarlılığı `f585a467` + `211168d1`
**Kök neden (kanıtlı):** `frontend/public/assets/css/vendor/font/stylesheet.css`'te **Gotham** ailesi
(`gothamblack/bold/book/medium/rounded`) İngilizce font — Türkçe **İ ı Ğ ğ Ş ş** gliflerini içermiyor.
Aynı sayfada DIN TR (`din_trmedium/bold`, Türkçe destekli) ile karışınca "İ'ler farklı görünüyor"
(docx). next/font fontları (Plus Jakarta, Source Serif) zaten `latin-ext` içeriyor — sorun onlarda değil.

**Karar:** Gotham font-family'lerine, Türkçe karakterler için `unicode-range` ile DIN TR kaynağını
aynı isim altında bağla (glyph-level fallback). Kullanım yerlerine dokunmadan merkezi çözüm; Gotham
görsel kimliği korunur, yalnız eksik Türkçe karakterler DIN TR'den gelir.

- [ ] Gotham varyantları için Türkçe `unicode-range` fallback (DIN TR) — `stylesheet.css`
- [ ] `İ ı Ğ ğ Ş ş Ç ç Ö ö Ü ü` kapsandı (U+0130-0131, U+011E-011F, U+015E-015F, U+00C7/E7, U+00D6/F6, U+00DC/FC)
- [ ] Build + görsel kontrol (başlıklarda İ tutarlı)

### 🟠 R1 — Anasayfa `/promats/tr`
- [ ] `f55e3d4d` Neden Promats: kompozisyon düzeni (araç içi paspas görseli bir tık büyük); arka plandaki "Neden Promats?" yazısı bilinçli mi — netleştir → **görsel yargı, grafikçi/kullanıcı girdisi bekliyor**
- [x] `632017d6` E-Katalog menüsü: native `<details>` → controlled dropdown, **dışarı tıklayınca + Escape ile kapanır** (PromatsHeader.tsx). "Katalog Görüntüle" + "PDF İndir" iki seçenek zaten vardı. ✅ deploy + canlı doğrulandı (`promats-header-catalog-toggle`). — Not: ayrı "alttaki eski buton" kodda bulunmadı (header'da tek E-Katalog menüsü); footer'daki `E-Katalog İndir` linki footer'ın meşru öğesi, dokunulmadı — canlıda gereksizse kullanıcı işaret ederse kaldırılır.
- [x] `cbbabc5d` Footer sosyal medya ikonları: footer'ın genel `a/span{color:#000}` kuralı marka renklerini eziyordu → footer-scoped marka renkleri eklendi (promats-legacy-bridge.css). ✅ deploy + canlı CSS doğrulandı.
- [ ] `01f96b37` Ürün vitrini: mevcut siteye yaklaştır; ürün adları altında (Türkçe karakter R0 ile düzelir) → **ürünler grafikçi revizesi bekliyor (R-beklemede ile aynı)**

### 🟠 R2 — Kurumsal / Hakkımızda `/promats/tr/hakkimizda`
- [ ] `65a7453c` Referans tasarıma yaklaştır (artifact: claude.ai/public/artifacts/32c583b0-...); üst blok sağa görsel
- [ ] `fe0d5cd0` "Dört Temel Yetkinlik" → "Temel Yetkinliklerimiz"; "Sistematik Süreç Anlayışı" altına 4 görsel bloğu

### 🟠 R3 — İletişim `/promats/tr/iletisim` ✅
- [x] `d25090ff` Yerleşim: en başta "BİZE ULAŞIN / DOĞRU ÇÖZÜM İÇİN BURADAYIZ" hero kutusu (açıklama + 3 ✔ madde, TR/EN); harita en alta taşındı. ✅ deploy + canlı doğrulandı. — Not: EN metinler docx "görseldeki gibi" diyor ama görsel okunamadı; makul çeviri kondu, kullanıcı/grafikçi ince ayar yapabilir. Metinler page.tsx'te locale-bazlı (ileride static_texts'e taşınabilir).
- [x] `a1bf78c3` İlgilenilen ürün grubu: native `<select multiple>` → kapalı kutu + checkbox paneli (dışarı-tıkla/Escape kapanır) + seçili ürün etiketleri (× ile kaldır). ✅ deploy + canlı doğrulandı.

### 🟡 R4 — OEM & Manufacturing `/promats/en/oem-manufacturing`
- [ ] `3fc2bea0` Bilgi bloğu 2 satır → tek satır (sığmazsa "OEM & PRIVATE LABEL" tek kare) → **hangi blok kastedildiği docx görseline bağlı, belirsiz; kullanıcı görsel onayında netleştirecek**
- [x] `8c18cc51` Başlık hiyerarşisi: `.pm-caps__title` 1. satır (eyebrow) küçük font + koyu renk, 2. satır büyük marka rengi (önceden ikisi de büyük/turuncuydu). Tüm modern sayfa başlıklarına uygulanır. ✅ deploy + canlı doğrulandı.

> **Ek düzeltme (kullanıcı, tur içi):** İletişim hero'su header'ın (fixed 85px) altında kalıyordu → hero üst padding'i PmHero ile aynı ~130px offset'e çekildi. ✅ deploy + canlı doğrulandı.

### 🟡 R5 — Ürün detay `/promats/tr/urunler/maximum-serisi` ✅ (görsel onay bekliyor)
- [x] `07d1d6fb` (a) "First Class PVC Material" damgası hero'nun koyu paspas görseline binince sağ yarısı kayboluyordu → z-index + beyaz hale ile ayrıştı, tamamı görünür. (b) Overview arka planı sağa yaslıydı (solda beyaz keskin kenar) → `cover`/`center right` ile renk sola devam eder (docx image22 "mevcut sayfa" gibi). (c) Renk farkı/font → R0 ile çözüldü. ✅ deploy + canlı doğrulandı. — Not: piksel-tam eşleşme için son görsel onay kullanıcı/grafikçide; docx "bu sayfa için grafikçi çalışıyor, küçük revizeler gelebilir" diyordu.

### ⏸️ Beklemede
- [ ] `b782729d` Ürünler sayfası `/promats/tr/urunler` — **grafikçi revizesi bekliyor**, ana hatlar iyi
- [ ] `95b60548` Genel revize dokümanı ve takip — bu çeklistin kendisi (kapatma referansı)

---

## B grubu — Web form/teklif backend entegrasyonu (SONRAKİ AŞAMA)

Teklif/CRM modülüne bağlı; kullanıcı kararıyla bu turda kapsam dışı:
`f37133af` public teklif endpointi, `9296069b` veri modeli, `19fc9585` iletişim/OEM form akışı,
`683a30a9` payload sözleşmesi, `457cf954` iletişim/teklif ayrımı, `b0730b54` ürün detayından teklif,
`303338d6` form UX/spam/analitik, `f29f6917` eski contact geriye uyum.

---

## Sıralama

1. **R0** (font/Türkçe) — site geneli, teknik, tek düzeltme çok yeri etkiler → **önce bu**
2. R1 (anasayfa) — en çok görülen sayfa; footer icon + E-katalog menü kapanma net/kolay
3. R3 (iletişim) — form işlevsel değişiklik
4. R2 (kurumsal), R4 (OEM), R5 (ürün detay) — layout/tasarım
5. Ürünler (R-beklemede) — grafikçi

**Kapatma:** Her madde deploy + görsel doğrulama sonrası ilgili feedback thread'i `resolved`.
