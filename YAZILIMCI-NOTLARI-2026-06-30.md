# Yazılımcı Notları — 30 Haziran 2026 partisi

Müşterinin `page_feedback` (yazılımcı notu) sisteminden 30 Haziran'da gelen 6 madde.
Sıra: #1 → #4 → #2 → #3 → #5 → #6. Her madde bitince canlıya deploy + thread'e "siz" dilinde çözüm notu + resolved.

Canlı: panel.avrasyaotomotiv.net · DB: promats_erp · deploy: `ssh vps-paspas "/root/bin/deploy-paspas"`

---

## #1 — `/admin/satis-siparisleri` "Sunucu Hatası" 🐞 (öncelik: yüksek)

> "Yeni sipariş kaydederken sunucu hatası alıyorum."

- [x] Create endpoint akışını incele (controller/repository/validation)
- [x] Repro: büyük miktar (999.999.999) → 500 sunucu_hatasi (miktar decimal(12,4))
- [x] Root cause: DB out-of-range, yakalanmayan 500
- [x] Fix: Zod max sınırı + controller ER_WARN_DATA_OUT_OF_RANGE→400 + frontend inline
- [x] Test (canlı): büyük miktar→400 anlaşılır uyarı, normal→201 ✓
- [x] Deploy (commit a40edc0) + thread resolved + müşteri notu

## #4 — `/admin/uretim-emirleri` "Makine ve Montaj planlama" 🐞

> Planlamada bazılarında ürün, bazılarında yarımamul adı görünüyor → hep **yarımamul** adı olmalı.

- [x] operasyon_adi her zaman yarımamul adını içeriyor (90/90 doğrulandı)
- [x] Parça sütununda operasyonAdi primary, emir ürünü muted bağlam
- [x] tsc temiz
- [x] Test: veri doğrulandı (operasyon_adi = aramamul)
- [x] Deploy (8cd270f) + thread resolved + müşteri notu

## #2 — `/admin/sevkiyat` "Üretimi devam edenler sevk edilebilsin" ✨

> (a) Ürün "üretiliyor" + açık siparişi varsa stok 0/yetersiz olsa da Sevk Bekleyenler'de görünsün.
> (b) Stok yetersizken sevke izin ver; stok eksiye düşerse eksi göster (üretim girilince normale döner).

- [x] "stoklu" filtresi: stok>0 VEYA uretim_durumu!=beklemede (üretim hattı)
- [x] Sevk izni: stok_yetersiz bloğu kaldırıldı; GREATEST(0) → düz çıkarma (signed decimal)
- [x] Eksi stok gösterimi: frontend zaten stokMiktar'ı olduğu gibi gösteriyor + uyarı metni bilgilendirici
- [x] Ek: sevk_edildi geçişi transaction ile atomik (latent bug fix)
- [x] tsc/build temiz
- [x] Test (canlı): stok0+üretimde satır görünür ✓; sevk 200+stok -50+sevkiyat/hareket ✓; temizlendi
- [x] Deploy (2298df0, e1d7a0a) + thread resolved + müşteri notu

## #3 — `/admin/sevkiyat` "Koli + takım miktar girişi" ✨

> Mobil sevk ekranında iki kutu (koli / takım), dönüşüm ürün kartından, stoktan ana birim (takım) olarak düş.

- [x] urun_birim_donusumleri (hedef_birim=koli, carpan) zaten var — 55 üründe tanımlı
- [x] SevkEmriDto'ya urunBirim + koliCarpan eklendi (backend query subquery)
- [x] Mobil PhysicalShipDialog: koli + takım iki kutu, toplam=koli*carpan+takım
- [x] tsc/build temiz
- [x] Test (canlı): API koliCarpan=6/urunBirim=takım dönüyor (30/47 emirde dolu)
- [x] Ek: mobil "stok yetersiz" bloklaması kaldırıldı (#2b mobil tamamlandı)
- [x] Deploy (627fdae) + thread resolved + müşteri notu

## #5 — `/admin/uretim-emirleri` "Üretim emri ilerleme" ✨

> İlerlemede sadece montaj tarafı görünüyor; makine adıyla her iki tarafı (enjeksiyon + montaj) göster.

- [x] UretimEmriDto'ya operasyonlar özeti (makineAd, montaj, uretilen/planlanan, durum)
- [x] Görüntüle satırında 2+ operasyonlu mamulde her taraf: makine + Montaj etiketi + ilerleme/Başlamadı
- [x] tsc/build temiz
- [x] Test (canlı): UE-2026-0079 → 900 T (ÖN) 430/3000, 900 T (ARKA) 0/3000 (Başlamadı) ✓
- [x] Deploy (fb87727) + thread resolved + müşteri notu

## #6 — `/admin/satis-siparisleri` "Görünmemesi gereken siparişler" ✅/✨

> Aynı SS-2026-0028/0024/…/0017. Zaten kapali/tamamlandi + bugünkü refetch fix ile ekrandan kalkacak.
> Ek istek: "gerektiğinde kapatabiliyor olmamız lazım" → Sipariş İşlemleri sekmesine kapatma butonu.

- [x] Sipariş İşlemleri sekmesine Kapat (kilit) butonu + onay dialog
- [x] update mutation ISLEMLER tag'ini invalidate ediyor (anında tazelenir)
- [x] tsc temiz
- [x] Test (canlı): kapat→200/kapali, islemler'den düştü ✓; temizlendi
- [x] Deploy (b0abf61) + thread resolved + müşteri notu

---

## Log

- 2026-07-01 — Tüm 6 madde tamamlandı, canlıda test edildi, thread'ler resolved.
  - #1 a40edc0 · #4 8cd270f · #2 2298df0+e1d7a0a · #3 627fdae · #6 b0abf61 · #5 fb87727
  - Tüm test siparişleri/verileri temizlendi, ürün stokları geri alındı.
  - Ek kazançlar: #2b mobil blok kaldırıldı, sevk_edildi atomik transaction (latent bug), islemler refetch/invalidation.
