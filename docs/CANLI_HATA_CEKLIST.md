# Canlı Uygulama — Yazılımcıya Notlar Çeklistesi

> Kaynak: `promats_erp.page_feedback_threads` + `page_feedback_comments` + `paspas-panel` PM2 logları
> Son güncelleme: 2026-05-07
> Durum: 8 kullanıcı notu + 2 log hatası

---

## 1. Stok Hareketi Zamanlama Hatası
**Sayfa:** `/admin/hareketler` · **Tarih:** 2026-05-04

- [ ] Malzeme stokları **üretim emri oluşturulduğunda veya makineye atandığında** düşüyor — bu yanlış. Stok ancak **gerçekleşen üretim miktarı girildiğinde** düşmeli.
  - Örnek: 1000 adetlik üretim emri var, 600 adet gündüz girildi → 600 adete karşılık gelen malzeme çıkışı olmalı.
- [ ] Makine kuyruğundan çıkarılan üretim makineye atanınca stoğu geri iade ediyor (makineye atandığı anda düşürmüş). Stokta 5000 koli varken henüz üretilmemiş bir üretim emri açınca stok 0 gözüküyor — bu üretim/depo yönetimini imkansız kılıyor.

---

## 2. Üretime Aktar — Çift Kayıt Hatası
**Sayfa:** `/admin/satis-siparisleri` · **Tarih:** 2026-05-04

- [ ] Sipariş işlemleri ekranında bir siparişi seçip **"Üretime Aktar"** denildiğinde aynı siparişten **2 adet üretim emri** oluşturuluyor.
- [ ] Bu hata özellikle **"malzeme bazlı" listeden aktarım** yapıldığında tetikleniyor; diğer aktarım yöntemlerinde farklı davranıyor — kök neden ikisinde ayrı işleniyor olabilir.

---

## 3. Malzeme Eksik Hesaplama Hataları
**Sayfa:** `/admin/uretim-emirleri/{id}` · **Tarih:** 2026-05-04

- [ ] **Operasyonel YM kategorisindeki malzemeler** eksik malzeme listesinde görünmemeli — bu kategorinin stok takibinin dışında tutulması gerekiyor.
- [ ] **Rezervasyon hesabı yanlış:** Stokta 5000 adet var, 3500 rezerve edildi, 1500 serbest — sistem 2000 eksik gösteriyor (olmamalı).
- [ ] **Sıfır stoklu malzeme hesabı yanlış:** Stok 0 ise rezerve de 0 olmalı; eksik miktar `üretim ihtiyacı` kadar olmalı (3500), sistem 7000 eksik gösteriyor.

---

## 4. Reçete Ekranı — Operasyonel YM Görünmüyor
**Sayfa:** `/admin/urunler` · **Tarih:** 2026-05-04 ve 2026-05-06

- [ ] Ürün → Düzenle → Reçete → **"Malzeme Seç"** açıldığında kategorisi `Operasyonel YM` olan malzemeler listede **gelmiyor** — seçilebilmeli.
- [ ] Üretim emirleri reçete görüntüleme panelinde ilk satırlarda `Operasyonel YM` kalemleri çıkıyor — bu panelde **Operasyonel YM satırları gösterilmemeli** (sadece gerçek malzemeler).
- [ ] Reçete görüntüleme penceresi küçük, büyütülmeli; açıklama alanı düzgün okunmuyor — görsel iyileştirme gerekli.

---

## 5. Ürün Görseli Yükleme Hatası
**Sayfa:** `/admin/urunler` · **Tarih:** 2026-05-04

- [ ] Ürün görseli ya **yüklenemiyor** ya da yüklenen resim **doğru gösterilmiyor** — sorun devam ediyor.

---

## 6. Makineler Arası Sürükle-Bırak Aktif (Olmamalı)
**Sayfa:** `/admin/is-yukler` · **Tarih:** 2026-05-04

- [ ] Üretim bir makineden diğerine **sürükle-bırakla transfer edilebiliyor** — bu özellik **kapatılmış olması gerekiyordu**. Kullanıcı akışı: makineden çıkar → istediği makineye yeniden ata.

---

---

## 7. 404 Sayfası Çöküyor — `useLocaleContext` Hatası
**Kaynak:** `paspas-panel` PM2 error log · **Dosya:** `src/app/not-found.tsx`

- [ ] Root `not-found.tsx` dosyası `"use client"` + `useLocaleContext()` kullanıyor. Next.js bu sayfayı bazen `LocaleProvider` dışında render ediyor (özellikle SSR sırasında ilk 404 istek gelince). Sonuç: tüm 404 sayfaları `Error: useLocaleContext must be used within LocaleProvider` ile çöküyor.
  - **Düzeltme:** `not-found.tsx` içindeki `t()` çağrıları sabit stringe çevrilmeli veya bileşen kendi `LocaleProvider`'ıyla sarılmalı.
  - Log kanıtı: `digest: '3074377644'` — her 404'te tekrarlanıyor.

---

## 8. Stale Server Action — Panel Rebuild Gerekiyor
**Kaynak:** `paspas-panel` PM2 stdout log · **Tüm sayfaları etkiliyor**

- [ ] Panel logunda sürekli `Error: Failed to find Server Action "x"` hatası tekrarlanıyor. Tarayıcı eski JS bundle'ı cache'lemiş (1 Mayıs öncesi build); sunucu yeni build'ı çalıştırıyor — action ID'leri eşleşmiyor.
  - **Düzeltme:** `cd admin_panel && bun run build` çalıştırıp `pm2 restart paspas-panel` yapılmalı. Kullanıcıların sayfayı hard-refresh yapması gerekiyor.
  - **Uzun vadeli:** Deploy pipeline'a `bun run build` adımı eklenmiş mi kontrol edilmeli.

---

## Özet

| # | Sayfa | Konu | Durum |
|---|-------|------|-------|
| 1 | `/admin/hareketler` | Stok hareketi zamanlama (2 alt madde) | Açık |
| 2 | `/admin/satis-siparisleri` | Çift kayıt / üretime aktar | Açık |
| 3 | `/admin/uretim-emirleri/{id}` | Malzeme eksik hesaplama (3 alt madde) | Açık |
| 4 | `/admin/urunler` + `/admin/uretim-emirleri` | Reçete / Operasyonel YM (3 alt madde) | Açık |
| 5 | `/admin/urunler` | Ürün görseli yükleme | Açık |
| 6 | `/admin/is-yukler` | Makineler arası transfer kaldırılmamış | Açık |
| 7 | `not-found.tsx` (global) | 404 sayfası LocaleProvider dışında çöküyor | Açık |
| 8 | Tüm sayfalar | Stale Server Action — panel rebuild gerekiyor | Açık |
