# Yazılımcı Notu V4 — Açık İşler Çeklisti (Derin İnceleme + Log Analizi)

> **İnceleme tarihi:** 2026-06-16 — Claude canlı DB + kod + log + ekran görüntüsü seviyesinde inceledi.
> **Açık not sayısı:** 3 (1 yeniden açılan + 2 yeni).
> **Log durumu:** `paspas-backend.err.log`'da yeni hata YOK (bugün düzelttiğim `gecersiz_gecis` `dbd6dc2` ile kapandı, tekrarı yok). Bugün (06-16) hiç 4xx/5xx yok.

---

## 0. Claude'un İnceleme Bulguları

| Bulgu | Detay |
|-------|-------|
| G1 | **`85c46f2a` çift emir aslında ÇİFT DEĞİL.** Ekran görüntüsü (`Cift_Kayit.png`): UE-2026-0057 = `1118 102-R` (Pars Gri **Sağ**), UE-2026-0056 = `1118 102-L` (Pars Gri **Sol**). DB doğrulandı: `1118 102` PARS GRİ çift taraflı ürün, reçetesinde 2 operasyonel YM var (Sağ + Sol). Bu, montaj akışının gereği — her taraf ayrı üretim emri olur. V3-B2 fix'i **gerçek** duplikasyonu (aynı operasyonel YM → 2 özdeş emir) engelliyor; buradaki Sağ/Sol bölünmesi tasarım gereği. Kullanıcı bunu duplikasyon sanıyor → **UI netliği sorunu, gerçek bug değil.** |
| G2 | **`3f284318` "birim takım" kök neden = veri tutarsızlığı.** 161 ürün `birim='takim'` (küçük-ascii) saklıyor; `categories.varsayilan_birim` de `'takim'`. Ama `birimler` tablosundaki kayıt `kod='Takım'` (büyük T, Türkçe ı) — tek normalize edilmemiş kayıt (diğer hepsi küçük-ascii: adet/kg/gram...). Ürün formu Birim select'i option value olarak `birimler.kod` kullanıyor ([urun-form.tsx](admin_panel/src/app/(main)/admin/urunler/_components/urun-form.tsx) satır 163 `birimKodlari = birimler.map(b => b.kod)`). `birim='takim'` ürün açılınca dropdown'da `'Takım'` option'ı ile eşleşmiyor → **dropdown boş görünüyor** (ekran görüntüsündeki durum). `urun_birim_donusumleri`'nde "Takım" referansı yok (sadece "koli") → normalize güvenli. |
| G3 | **`56d703b1` Yükle/Sevket = V3-Y2'nin genişletilmiş hali + yeni otomatik sevk özelliği.** Mevcut sevkiyat ekranında 3 sekme var: "Sevk Bekleyenler", "Sevk Emirleri", "Yükle/Sevket" (`Sevkiyat_Mobil.png`). Kullanıcı: sevkiyatçı şu an admin sekmelerini de görüyor; sadece "Yükle/Sevket" görsün, tam mobil ekran (operatör gibi büyük buton). + büyük yeni istek: üretim bitince otomatik sevk emri oluşturma (tarih/vardiya mantığıyla). |

---

## 1. 🟡 V4-1 — Üretime aktar "çift emir" (KARAR GEREKİYOR — gerçek bug değil)

- **Not:** `85c46f2a` (yeniden açıldı, 2026-06-16) · `/admin/satis-siparisleri`
- **Şikayet:** "Tek bir sipariş için iki ayrı üretim emri aktarıyor." (ekran: `Cift_Kayit.png`)
- **Bulgu G1:** İki emir aslında **Sağ (UE-0057) + Sol (UE-0056)** — çift taraflı ürünün iki operasyonel YM'si. Bu doğru davranış; montaj için her taraf ayrı üretilir.
- **❓ Kullanıcı kararı gerekiyor — 3 seçenek:**
  1. **(Önerilen) UI netliği:** İki emir ayrı kalsın (montaj mantığı bozulmasın) ama Sipariş İşlemleri ve Üretim Emirleri listesinde **Sağ/Sol aynı ürün+sipariş altında görsel olarak gruplansın** veya satıra "Çift taraflı (Sağ/Sol)" rozeti eklensin → kullanıcı duplikasyon sanmasın.
  2. **Tek emir + iki operasyon:** Çift taraflı ürün için tek üretim emri açılıp Sağ/Sol'u o emrin iki operasyonu olarak modellemek — **büyük mimari değişiklik**, montaj/makine atama/ilerleme hesabı baştan elden geçer. Riskli.
  3. **Sadece açıklama:** Kod değişikliği yok; kullanıcıya bunun çift taraflı ürün davranışı olduğu anlatılır.
- **Claude önerisi:** Seçenek 1 (UI rozeti/gruplama) — hem yanlış algıyı giderir hem montaj mantığını korur. Düşük risk.
- **Kapanış notu (V7 ile):**
  - Sipariş İşlemleri ve Üretim Emirleri listesinde aynı `siparis_kalem_id`'den türeyen Sağ/Sol emirleri görsel olarak grupla (alt alta, ortak başlık) veya her satıra "Çift taraflı — Sağ/Sol" rozeti ekle.
  - Operasyonel YM adındaki `-R`/`-L` veya "Sağ"/"Sol" ifadesinden taraf tespit edilebilir; ya da `uretim_emri_operasyonlari.montaj` + reçete yapısından.
- [x] V7 ile kapandı / superseded — çift taraflı ürünler üretim listesinde mamul bazında tek satır gösteriliyor; Sağ/Sol detayları Makine ve Montaj Planlama bloğunda ayrışıyor. Böylece kullanıcı iki operasyonel YM'yi duplikasyon sanmıyor.

---

## 2. 🟢 V4-2 — "birim takım" dropdown'da eşleşmiyor (VERİ DÜZELTMESİ — hazır)

- **Not:** `3f284318` (2026-06-16) · `/admin/urunler`
- **Şikayet:** Ürün düzenlemede Birim alanı "takım" ürünlerde boş görünüyor (ekran: `birim_takim.png`).
- **Bulgu G2:** `birimler.kod='Takım'` (tek normalize edilmemiş kayıt) ↔ ürünler `birim='takim'` → eşleşme yok.
- **Çözüm (veri düzeltmesi — Claude uygular, kod değişikliği YOK):**
  ```sql
  UPDATE birimler SET kod = 'takim' WHERE kod = 'Takım';
  -- ad='Takım' (görünen ad) korunur; sadece kod normalize edilir.
  ```
  Bu, 161 ürünün `birim='takim'` değeriyle + `categories.varsayilan_birim='takim'` ile hizalar. Dropdown artık doğru seçili gelir.
- **Doğrulama:** Düzeltme sonrası bir "takım" birimli ürün aç → Birim dropdown'ında "Takım" seçili görünmeli.
- **Not:** Kalıcı olması için seed dosyasında da (`170_birimler_schema.sql` veya birimler seed'i) `Takım`→`takim` düzeltilmeli ki fresh kurulumda tekrar bozulmasın. (Codex: ilgili seed satırını `kod='takim', ad='Takım'` yap.)
- [x] Seed düzeltmesi doğrulandı — [170_birimler_schema.sql](backend/src/db/seed/sql/170_birimler_schema.sql) `kod='takim', ad='Takım'` kullanıyor. Canlı veri düzeltmesi Claude/deploy adımıdır.

---

## 3. 🔵 V4-3 — Yükle/Sevket: Sevkiyatçıya özel mobil ekran + otomatik sevk emri (BÜYÜK — KARAR + ŞEMA GEREKİYOR)

- **Not:** `56d703b1` (2026-06-16, 4 yorum) · `/admin/sevkiyat`
- **Bulgu G3:** V3-Y2'de nakliyeci kısıtlı görünüm + fiziksel sevk + stok kontrolü eklenmişti. Bu not onu **genişletiyor** ve **yeni bir otomatik sevk emri özelliği** istiyor.

### 3a — Sevkiyatçıya tamamen özel mobil ekran (V3-Y2 genişletme)
- **İstek:** Sevkiyatçı (`nakliyeci` rolü) şu an "Sevk Bekleyenler" + "Sevk Emirleri" admin sekmelerini de görüyor. Sadece **"Yükle/Sevket"** ekranını görsün.
- **Kapanış notu:**
  - `nakliyeci` rolüyle girişte sevkiyat sayfası **yalnızca Yükle/Sevket** sekmesini render etsin (diğer 2 sekme gizli — UI + backend 403).
  - Ekran tamamen mobil: operatör ekranı gibi **büyük kartlar, büyük butonlar**.
  - Sevkiyatçı **hem "bekliyor" hem "onaylı"** sevk emirlerini görür, **ama yalnızca "onaylı" olanları sevk edebilir** (bekliyor olanlar görünür ama işlem yapılamaz — buton disabled + "Onay bekliyor" etiketi).
  - "Fiziksel Sevket" → miktar girişi (planlanan default, değiştirilebilir, stok üstü engellenir — V3-Y2'deki kural korunur) → kaydet → stoktan düş.
- [x] Tamamlandı — detaylı kapanış [CEKLIST-V4-3.md](CEKLIST-V4-3.md) içinde; bu turda nakliyeci görünümü tek Yükle/Sevket mobil kabuğuna indirildi.

### 3b — Otomatik sevk emri oluşturma (YENİ ÖZELLİK — ❓ karar + olası şema)
- **İstek (yorumlardan birleştirilmiş):**
  - Sistem, başlatılmış üretimlerin **bitiş tarihine** bakar, üretimin bittiği tarihe **otomatik sevk emri** oluşturur.
  - **Vardiya/tarih mantığı:** Gece vardiyasında **24:00'a kadar** biten üretimler → ertesi gün sevkiyata planlanır. Gece **24:00'tan sonra** bitenler → o günün sevkiyat listesine eklenir.
  - Otomatik sevk emri **kime/hangi siparişe** sevk edileceğine, siparişin müşterisine bakarak karar verir.
  - **Manuel üretimlerde** (siparişe bağlı olmayan) otomatik sevk emri **oluşturulmaz**.
  - Sevk miktarı = üretimden **stoğa giriş yapılan miktar** kadar (yani **montajın yapıldığı makineden** çıkan, stoğa giren miktar).
  - Admin onayladığı anda sevk emri sevkiyatçının "Yükle/Sevket" mobil ekranına düşer → fiziksel sevk.
- **❓ Tartışılması gereken kararlar (Claude → kullanıcı):**
  1. **Tetikleme:** Otomatik sevk emri ne zaman üretilsin? (a) Üretim bitir anında senkron, (b) zamanlanmış job (cron) ile gün sonu, (c) admin "otomatik oluştur" butonuna bastığında? Vardiya/tarih mantığı (24:00 eşiği) cron veya üretim-bitir-hook'unda uygulanabilir.
  2. **Mevcut sevk emri varsa:** Aynı sipariş kalemine zaten manuel sevk emri açılmışsa otomatik olan çakışır mı? (V3-B4'teki "sevk emri var" mantığıyla entegre — çift sevk emri engellenmeli.)
  3. **Müşteri tespiti:** Sevk emri `sipariş → müşteri` zincirinden adresi/müşteriyi alır. Manuel üretim (siparişsiz) → atla. Bu ayrım `uretim_emirleri`'nin siparişe bağlı olup olmadığından okunur (`uretim_emri_siparis_kalemleri` eşleşmesi var mı?).
  4. **Şema:** Otomatik oluşturulan sevk emrini işaretlemek için `sevk_emirleri`'ne `otomatik_olusturuldu tinyint` + belki `kaynak_uretim_emri_id` gerekebilir mi? (Claude şema kontratı yazar.)
  5. **Onay akışı:** Otomatik emir hangi durumda doğar — `bekliyor` mı, direkt `onaylandi` mı? (Yorumlara göre admin onaylar → sonra sevkiyatçıya düşer, yani `bekliyor` doğmalı.)
- **Kapanış notu:** Kararlar [CEKLIST-V4-3.md](CEKLIST-V4-3.md) içinde D1-D7 olarak netleştirildi ve uygulandı.
- [x] Tamamlandı — kararlar [CEKLIST-V4-3.md](CEKLIST-V4-3.md) D1-D7 olarak verildi; otomatik sevk emri akışı ve Drizzle alanları uygulanmış durumda.

---

## 4. Özet & Öncelik

| # | Konu | Tip | Durum |
|---|------|-----|-------|
| V4-1 | Üretime aktar "çift emir" (Sağ/Sol) | UI netliği / karar | ✅ V7 ile kapandı |
| V4-2 | birim "takım" dropdown eşleşmesi | Veri + seed düzeltme | ✅ Seed doğrulandı |
| V4-3a | Sevkiyatçı özel mobil ekran | Feature (V3-Y2 genişletme) | ✅ Tamamlandı |
| V4-3b | Otomatik sevk emri | Büyük feature + şema | ✅ Tamamlandı |

**Güncel durum:** Aktif Codex işi kalmadı; V4-2 canlı veri düzeltmesi deploy/veri adımı olarak Claude tarafındadır.

---

## 5. Log Analizi Özeti (sağlık durumu)

- ✅ `paspas-backend.err.log`: Son hata 2026-06-15 05:50 (`gecersiz_gecis`) — bugün `dbd6dc2` ile düzeltildi, **sonrasında tekrarı yok**.
- ✅ Bugün (06-16) hiç HTTP 4xx/5xx yok.
- ✅ 06-10'daki `ECONNREFUSED` tek seferlik MySQL planlı restart (ayrı olay, kod bug'ı değil).
- Sonuç: **Sistem sağlıklı, aktif hata yok.** 3 açık not yukarıda; biri veri düzeltmesi, ikisi karar/feature.
