# Yazılımcı Notları — 30 Haziran 2026 partisi

Müşterinin `page_feedback` (yazılımcı notu) sisteminden 30 Haziran'da gelen 6 madde.
Sıra: #1 → #4 → #2 → #3 → #5 → #6. Her madde bitince canlıya deploy + thread'e "siz" dilinde çözüm notu + resolved.

Canlı: panel.avrasyaotomotiv.net · DB: promats_erp · deploy: `ssh vps-paspas "/root/bin/deploy-paspas"`

---

## #1 — `/admin/satis-siparisleri` "Sunucu Hatası" 🐞 (öncelik: yüksek)

> "Yeni sipariş kaydederken sunucu hatası alıyorum."

- [ ] Create endpoint akışını incele (controller/repository/validation)
- [ ] Repro: test siparişi oluşturmayı dene (API veya UI)
- [ ] Root cause bul
- [ ] Fix + backend build
- [ ] Test: yeni sipariş kaydı başarılı
- [ ] Deploy + thread resolved + müşteri notu

## #4 — `/admin/uretim-emirleri` "Makine ve Montaj planlama" 🐞

> Planlamada bazılarında ürün, bazılarında yarımamul adı görünüyor → hep **yarımamul** adı olmalı.

- [ ] Makine/montaj planlama render'ında isim kaynağını bul
- [ ] Hep yarımamul adını gösterecek şekilde düzelt
- [ ] tsc/build
- [ ] Test: her satır yarımamul adı gösteriyor
- [ ] Deploy + thread resolved + müşteri notu

## #2 — `/admin/sevkiyat` "Üretimi devam edenler sevk edilebilsin" ✨

> (a) Ürün "üretiliyor" + açık siparişi varsa stok 0/yetersiz olsa da Sevk Bekleyenler'de görünsün.
> (b) Stok yetersizken sevke izin ver; stok eksiye düşerse eksi göster (üretim girilince normale döner).

- [ ] Sevk Bekleyenler sorgusu: üretimde olan açık siparişleri stok filtresinden muaf tut
- [ ] Sevk izni: stok yetersizlik bloğunu kaldır, eksi stoğa izin ver
- [ ] Eksi stok gösterimi (UI)
- [ ] tsc/build
- [ ] Test: stok 0 üründe üretiliyorken satır görünüyor + sevk edilebiliyor + eksi görünüyor
- [ ] Deploy + thread resolved + müşteri notu

## #3 — `/admin/sevkiyat` "Koli + takım miktar girişi" ✨

> Mobil sevk ekranında iki kutu (koli / takım), dönüşüm ürün kartından, stoktan ana birim (takım) olarak düş.

- [ ] Ürün kartında koli↔takım dönüşüm alanı var mı kontrol et (yoksa ekle — seed ile)
- [ ] Mobil sevk formuna koli + takım kutuları
- [ ] Hesap: koli×katsayı + takım = toplam takım; ana birimden düş
- [ ] tsc/build
- [ ] Test: 10 koli → 60 takım; 10 koli+3 takım → 63; sadece takım → aynen
- [ ] Deploy + thread resolved + müşteri notu

## #5 — `/admin/uretim-emirleri` "Üretim emri ilerleme" ✨

> İlerlemede sadece montaj tarafı görünüyor; makine adıyla her iki tarafı (enjeksiyon + montaj) göster.

- [ ] Üretim emri görüntüleme ekranında ilerleme kaynağını bul
- [ ] Her iki operasyon tarafını (makine + montaj) makine adıyla listele
- [ ] tsc/build
- [ ] Test: çift taraflı emirde iki satır ilerleme görünüyor
- [ ] Deploy + thread resolved + müşteri notu

## #6 — `/admin/satis-siparisleri` "Görünmemesi gereken siparişler" ✅/✨

> Aynı SS-2026-0028/0024/…/0017. Zaten kapali/tamamlandi + bugünkü refetch fix ile ekrandan kalkacak.
> Ek istek: "gerektiğinde kapatabiliyor olmamız lazım" → Sipariş İşlemleri sekmesine kapatma butonu.

- [ ] Sipariş İşlemleri sekmesine sipariş kapatma aksiyonu ekle
- [ ] tsc/build
- [ ] Test: açık siparişi bu ekrandan kapat → satır düşüyor
- [ ] Deploy + thread resolved + müşteri notu

---

## Log

- (madde bitince buraya tarih + commit + test sonucu yazılacak)
