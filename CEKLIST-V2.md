# Yazılımcı Notu V2 — Açık İşler Çeklisti (Karar Verilmiş)

> **Hedef:** 29 açık yazılımcı notunu kapatmak.
> **Sorumlu:** Codex (implementasyon) + Claude (review, deploy, schema kontratları).
> **Karar tarihi:** 2026-06-09 — kullanıcı onayı ile.
> **Detay tartışma kaynağı:** [docs/yazilimci-notu-v2-acik-isler.md](docs/yazilimci-notu-v2-acik-isler.md)

---

## 0. Verilmiş Kararlar (Codex bu kararlarla ilerleyecek)

| # | Konu | Karar |
|---|------|-------|
| 1 | Makine kısa süreli kapatma (yeni özellik) | Yeni tablo `makine_kapali_araliklar` — şema **hazır** ([backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql](backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql)). Sadece tarih (gün) bazlı. UI `/admin/tanimlar` altında yeni sekme. Çakışma engellenir (validation hatası). Açıklama opsiyonel. |
| 2 | Operatör'e Üretim Emirleri | **Yol B**: Operatör çalışan iş ve sıradaki iş kartlarına **"Reçete Detayı"** butonu eklenir; mevcut `recete-detay-modal` açılır. Operatör sayfasına Üretim Emirleri listesi eklenmez. |
| 3 | Gece vardiyası ayrımı | **Hibrit**: kayıt saati `07:30-09:30` arası ise otomatik **gece vardiyasına** sayılır; UI'da küçük vardiya badge görünür, tıklayınca değiştirilebilir. Aynı kural Cumartesi sabah girişi sorununu da çözer (#6babfc20). |
| 4 | Android cep telefonu responsive | Operatör çalışan iş + sıradaki iş kartları **mobilde tek kolon + küçültülmüş yazı**. Sıradaki İşler mobilde **kompakt satır görünümü** (her satır: ürün adı + miktar + Başlat). Yatay scroll engellenir. |
| 5 | Stok "Serbest" / Üretim Emri "Eksik" | Mevcut `urunler.rezerve_stok` kolonu = "Rezerve". Stoklar sayfasında **Serbest = Stok − Rezerve** (negatifse boş). Üretim emri Malzeme Tedarik sütun adı **"Rezerve" → "Toplam Rezerve"**, **Eksik = Toplam Rezerve − Stok** (pozitifse göster). Mevcut "yeterlilik" mantığı **korunur** (üretim emri çıkarmaya yetiyor mu sorusu farklı — kalsın). |

---

## 1. 🔴 BUG'lar — Öncelik 1 (Veri/işlem doğruluğu)

### B1 — Makineden çıkar: montaj tarafı kalıyor
- **Notlar:** `8d4d04f4` + `3c531576` (UE-2026-0025)
- **Sayfa:** `/admin/uretim-emirleri`
- **Sorun:** ENJ-01'den (montaj olmayan) çıkarıyor; ENJ-02'den (montaj olan) çıkarmıyor → "hata oluştu" mesajı.
- **Yapılacak:** `repoCikarmaFromMakine` (veya benzeri) içinde montaj_makine_id NOT NULL olan satırın da temizlendiğinden emin ol. UE-2026-0025'i izleyerek doğrula.
- [x] Tamamlandı

### B2 — Sipariş malzeme listesinde eksik ürünler
- **Notlar:** `ef1b0aa2` + `37c79567`
- **Sayfa:** `/admin/satis-siparisleri` (yeni sipariş penceresi)
- **Örnekler:** `1114 101 TUNA SİYAH`, `1110 PROFESYONEL SİYAH` malzeme seçimine gelmiyor. Ürünler listesinde mevcut.
- **Yapılacak:** Sipariş penceresinin malzeme seçim sorgusu kategori/durum filtrelerini gözden geçir; ürün listesi ile farkı bul. `urunler.is_active=1` olan satılan ürünler gelmeli (kategori=`urun`).
- [x] Tamamlandı

### B3 — Üretim emri ilerleme: sağ+sol toplanıyor
- **Not:** `ed23aa61`
- **Sayfa:** `/admin/uretim-emirleri`
- **Sorun:** 3000 sağ + 3000 sol → ekranda 6000 adet görünüyor. İlerleme **sadece montaj yapılan tarafın** üretim miktarını göstermeli.
- **Yapılacak:** Üretim emri ilerleme hesabı `uretim_emri_operasyonlari` üzerinde `montaj=1` olan satırın `uretilen_miktar`'ını esas alır; diğer taraflar toplanmaz.
- [x] Tamamlandı

### B4 — Fire miktarı operatör ekranında görünmüyor
- **Not:** `1e9b1d96`
- **Sayfa:** `/admin/operator`
- **Sorun:** Operatör fire girdiğinde fire alanı 0 kalıyor.
- **Yapılacak:** Operatör daily kayıt insert ↔ get-dto akışını izle; `fire_miktari` kolonu yazılıyor ama UI'a yansıtılmıyor mu, yoksa hiç yazılmıyor mu? Repository ve mutation invalidation kontrol et.
- [x] Tamamlandı

### B5 — Mevcut sipariş kapatılamıyor
- **Not:** `075fa888`
- **Sayfa:** `/admin/satis-siparisleri`
- **Örnekler:**
  - `SS-2026-0023` (2026-05-20) — üretimde olmadığı halde "üretimde" görünüyor.
  - `SS-2026-0022` (2026-05-12) — kısmen sevk edilmiş, kapatılamıyor.
- **Yapılacak:** Sipariş "kapatılabilir mi?" kuralını gözden geçir: kısmen sevk edilmiş sipariş kapatılabilir olmalı (kalan kalemler iptal sayılır). Üretim durumu "üretimde" görünmesi → durum hesabı `uretim_emirleri.durum` üzerinden değil, aktif emir varlığına göre olsun.
- [x] Tamamlandı

### B6 — Cumartesi veri girişi bloklanıyor
- **Not:** `6babfc20`
- **Sayfa:** `/admin/operator`
- **Sorun:** Cuma gece vardiyası Cumartesi 07:30'da bitiyor; sistem Cumartesi'yi tatil sayıp veri girişine izin vermiyor.
- **Yapılacak:** Karar **3** (hibrit vardiya) kapsamında çözülür. Vardiya bitiminden sonraki **2 saatlik tampon** içinde girişler kabul edilir ve önceki vardiyaya işlenir. Tatil/iş günü kontrolü bu tampona izin verecek şekilde gevşetilir.
- [x] Tamamlandı

### B7 — Otomatik vardiya yanlış saatte başlıyor
- **Not:** `9145df93`
- **Sayfa:** `/admin/operator`
- **Sorun:** "Otomatik vardiya aktif" kutuları **10:30** gösteriyor; sistemde **07:30** tanımlı.
- **Yapılacak:** Operatör ekranı vardiya başlangıç saatini hangi kaynaktan okuyor? Muhtemelen kullanıcı `last_logon` veya benzeri yanlış kaynağa bakılıyor. `vardiyalar` tablosundaki tanımı kullan. Karar **3**'ün hibrit mantığı uygulanırken bu kaynak temizlensin.
- [x] Tamamlandı

### B8 — Stok hareketleri: çıkışlar yeşil/+ ile görünüyor
- **Notlar:** `50064c2c` + `9f033c08`
- **Sayfa:** `/admin/hareketler`
- **Sorun:** Sevkiyat doğru kırmızı/-; üretimde tüketilen malzemeler yeşil/+ görünüyor. Veri doğru, sadece **gösterim** hatası.
- **Yapılacak:** Liste satır renderı `hareket_tipi` üzerinden renk/işaret kararı verir:
  - `cikis` → kırmızı + `-` öneki
  - `giris` → yeşil + `+` öneki
  - `duzeltme` → nötr (mavi/gri), işaret işaretine göre
  - Doğrulama: `hareket_tipi=cikis` olan kayıtlar stoku gerçekten azaltıyor mu? Bir kontrol logu.
- [x] Tamamlandı

### B9 — Stok-Serbest formülü
- **Not:** `149f8066`
- **Sayfa:** `/admin/stoklar`
- **Karar 5 uygulaması:**
  - `Serbest = Stok − Rezerve` (Rezerve = `urunler.rezerve_stok`)
  - Negatif ise (Rezerve > Stok) → Serbest alanı **boş** gösterilir (em-dash veya null).
  - Mevcut `serbestStok` (`stok − açıkUretimİhtiyacı`) hesabı ayrı bir alan olarak DTO'da kalsın **isim değişerek** "Üretime Açık" veya kaldırılsın — UI'da yalnızca yeni Serbest görünür. (Tercih: UI'dan kaldır, DTO alanını dokunmadan bırak — başka çağıran varsa kırılmasın.)
- [x] Tamamlandı

### B10 — Rezerve-Eksik (Üretim Emri Malzeme Tedarik)
- **Not:** `c709c3e2`
- **Sayfa:** `/admin/uretim-emirleri/[id]` Malzeme Tedarik sekmesi
- **Karar 5 uygulaması:**
  - Sütun adı: `Rezerve` → **`Toplam Rezerve`**.
  - Serbest miktar negatifse boş.
  - **Eksik = Toplam Rezerve − Stok** (yalnızca pozitif değerde göster).
  - Mevcut "yeterlilik" hesabı korunur (üretim emri çıkarmaya yetiyor mu farklı soru).
- [x] Tamamlandı

### B11 — Eksik kalem kutucuğu 2 kez gösteriliyor
- **Not:** `8554be94` (ekran görüntülü)
- **Sayfa:** `/admin/uretim-emirleri/[id]`
- **Yapılacak:** İlgili sayfa/componentte aynı kutucuğun iki render noktasını bul, birini kaldır.
- [x] Tamamlandı

### B12 — Ürün görseli (sadece kullanıcı eylemi bekliyor)
- **Not:** `f067136a` · `needs_info`
- Codex eylemine gerek **YOK**. Kullanıcı 2 dosyayı yeniden yükleyince kapanır.
- [ ] (Kullanıcı tarafında)

---

## 2. 🟠 UX / İyileştirmeler — Öncelik 2

### U1 — Stok satırına tıklayınca son hareketler (inline)
- **Not:** `f03ac873` · `/admin/stoklar`
- **İstek:** Stok satırına tıklayınca son **10 hareket** (yeni üstte) inline açılır.
- [x] Tamamlandı

### U2 — Satın alma malzeme arama kutusu
- **Notlar:** `c80c407b` + `ed62d7f7` · `/admin/satin-alma`
- **İstek:** Yeni satın alma siparişinde malzeme seçimine arama kutusu.
- [x] Tamamlandı

### U3 — Reçete açıklamasını üretim emri reçete-detay modalına getir
- **Not:** `076a50c3` · `/admin/uretim-emirleri`
- **İstek:** Reçete detay modalında ürün resmi+adı altına, malzeme listesinden önce `receteler.aciklama` görünsün.
- **Not:** V1'de eklenmişti; üretim emri reçete-detay modalında da göster.
- [x] Tamamlandı

### U4 — Operatör veri giriş penceresi mobilde büyütülmeli
- **Not:** `eb9efb4e` · `/admin/operator`
- **İstek:** Veri giriş modal + benzer pencereler, operatör ana ekranı kadar büyük olsun.
- **Karar 4 kapsamında** uyumlu yapılır (mobil ölçeklendirme).
- [x] Tamamlandı

### U5 — Malzeme yeterlilik penceresi: stok takipli filtre
- **Not:** `7f499870` · `/admin/uretim-emirleri/[id]`
- **İstek:** "Stok takibi: Hayır" olan ürünler bu pencerede listelenmesin.
- **Yapılacak:** `repoCheckYeterlilik` veya UI filter `stok_takip_aktif=1` koşulu ekle.
- [x] Tamamlandı

### U6 — Sipariş İşlemleri sekmesine stok bilgisi
- **Not:** `bd05cd65` · `/admin/satis-siparisleri`
- **İstek:** Sipariş işlemleri sekmesindeki ürün kartında stok bilgisi.
- [x] Tamamlandı

### U7 — Operatör'e Reçete Detayı erişimi (Karar 2 — Yol B)
- **Notlar:** `16a8568e` + `37f0e56b` · `/admin/operator`
- **Yapılacak:** Operatör çalışan iş + sıradaki iş kartlarına **"Reçete Detayı"** butonu. Tıklanınca mevcut `recete-detay-modal` aynı içerikle açılır. Yazma butonları yok (read-only).
- [x] Tamamlandı

### U8 — Makine için yes/no görünürlük seçenekleri
- **Not:** `1d6141a0` · `/admin/makineler`
- **İstek:** Makine kayıtlarına iki toggle:
  - "Operatör ekranında görün" (`operator_de_goster: tinyint(1) default 1`)
  - "Makine İş Yükleri ekranında görün" (`is_yuklerinde_goster: tinyint(1) default 1`)
- **Şema değişikliği:** `makineler` tablosuna 2 kolon eklenmesi gerek → **yeni seed dosyası** (Codex ekleyebilir, ALTER kullanma — `0XX_makineler_gorunurluk.sql` idempotent migration formatında — bkz. [190_v1_recete_kalemleri_aciklama.sql](backend/src/db/seed/sql/190_v1_recete_kalemleri_aciklama.sql) örnek).
- [x] Tamamlandı

---

## 3. 🟡 Yeni Özellikler — Öncelik 3

### Y1 — Makine kısa süreli kapatma (Karar 1)
- **Not:** `ccadafc0` · `/admin/tanimlar`
- **Şema hazır:** [backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql](backend/src/db/seed/sql/199_makine_kapali_araliklar_schema.sql)
- **Backend yapılacaklar:**
  - `backend/src/modules/makine_kapali_araliklar/` modülü (router/controller/repository/validation/schema)
  - Endpoint: `GET/POST/PATCH/DELETE /admin/makine-kapali-araliklar`
  - Validation: `baslangic_tarih <= bitis_tarih`; aynı makineye **çakışan** aralık 400 döner.
  - Operatör "Başlat" endpoint'i: bugün aktif aralık varsa 409 döner: `{ error: { message: 'makine_planli_kapali', detail: 'Yıllık bakım — 18.06.2026 tarihine kadar' } }`.
- **Frontend yapılacaklar:**
  - `/admin/tanimlar` altında "Makine Kapama Planı" sekmesi — CRUD tablo görünümü.
  - Operatör ekranında: aktif aralık varsa Başlat disabled, üzerinde **rozet** ("Makine planlı kapalı: {aciklama} — {bitis_tarih} tarihine kadar").
- [x] Tamamlandı

### Y2 — Dashboard makine durumları widget revizyonu
- **Not:** `3f29be58` (ekran görüntülü)
- **Sayfa:** `/admin/dashboard`
- **İstek:**
  - Renkler planlama gün sayısına göre:
    - ≤ 2 gün → kırmızı
    - 3–5 gün → turuncu
    - 5–10 gün → sarı
    - 10 gün < → yeşil
  - Makine durumu enum: `Çalışıyor`, `Kalıp Değişimi`, `Duraklatıldı`, `Kapalı` (Karar 1 ile uyumlu — `Kapalı` planlı aralık aktifken).
- [x] Tamamlandı

### Y3 — Android cep telefonu responsive (Karar 4)
- **Not:** `19a5dd97` (ekran görüntülü)
- **Sayfa:** `/admin/operator`
- **Yapılacak:**
  - **Çalışan iş kartı:** yazı boyutu `text-5xl` → `text-2xl sm:text-3xl md:text-5xl`. Metrik kartları (PLANLANAN/ÜRETİLEN/FİRE) `grid-cols-1 sm:grid-cols-3`.
  - **Sıradaki İşler:** mobilde (`< sm`) **kompakt satır görünümü** — her satırda: ürün adı (truncate), miktar, Başlat butonu. `sm:` ve üstünde mevcut grid wrap kart görünümü kalır.
  - **Veri giriş modal:** mobilde tam ekran (`max-w-full h-full sm:max-w-2xl sm:h-auto`).
  - Yatay scroll'a izin verme: kapsayıcı `overflow-x-hidden` + her bölge `min-w-0`.
- [x] Tamamlandı

### Y4 — Gerçekleşen Üretim gece vardiyası ayrımı (Karar 3 — hibrit)
- **Not:** `74487d14` · `/admin/dashboard`
- **Yapılacak (backend):**
  - Bir kayıt için vardiya hesaplaması: kayıt saati `H:M`:
    - `07:30 ≤ H:M < 09:30` → **gece** (bir önceki vardiyaya say)
    - `09:30 ≤ H:M < 19:30` → **gündüz**
    - `19:30 ≤ H:M < 07:30 (sonraki gün)` → **gece**
  - Vardiya alanı opsiyonel olarak kayıtta saklanır (`hareketler` veya operatör daily kayıt tablolarına `vardiya enum('gunduz','gece','manuel')` eklenmesi gerekebilir — bu kararı Claude verir, gerekirse yeni seed). Şu anda **alanı ekleme**, hesaplamayı runtime'da yap; ileride kalıcılık gerekirse Claude ek seed yazar.
- **Yapılacak (frontend):**
  - Operatör veri giriş modalında küçük **Vardiya badge** (default hesaplanan); tıklayınca aç-değiştir (Gündüz / Gece).
  - Dashboard Gerçekleşen Üretim widget filtresi bu hibrit kuralla çalışır → gece üretimleri artık doğru görünür.
- [x] Tamamlandı

---

## 4. Genel Görev Akışı (Codex için)

1. **Sırayla** ilerle: B1 → B2 → … → U1 → … → Y1 → Y4.
2. **Her madde için ayrı commit** (kısa Türkçe başlık + bir cümle açıklama).
3. Şema değişikliği gerektiren herkes (Y1, U8, Y4 ek alanı) için: **yalnızca yeni seed dosyaları**, ALTER **yasak** (CLAUDE.md kuralı). Mevcut seed'lere `CREATE TABLE`'a kolon ekleyerek değiştirme — yeni idempotent migration dosyası ekle (bkz. örnek: `190_v1_recete_kalemleri_aciklama.sql`).
4. Her madde sonunda **build doğrulaması** çalıştır (backend + admin panel).
5. Tüm liste bittiğinde Claude'a haber ver — ben review + canlıya deploy + thread'leri `resolved` yaparım.

## 5. Tutarlılık Kontrolleri

- **Karar 3** (vardiya hibrit) → B6, B7, Y4 üçü de aynı kurala uymalı.
- **Karar 5** (rezerve formülü) → B9, B10 aynı `rezerve_stok` kolonunu kullanmalı; "yeterlilik" mantığına dokunma.
- **Karar 4** (responsive) → Y3 ve U4 birlikte uygulanır.
- **Karar 1** (makine kapatma) → Y1 + Y2'deki "Kapalı" durumu aynı kaynaktan (`makine_kapali_araliklar`) okumalı.

## 6. Tamamlama Tablosu

| Sayfa | Madde sayısı | Status |
|-------|--------------|--------|
| /admin/uretim-emirleri | 6 (B1, B3, B10, B11, U3, U5) | ☐ |
| /admin/operator | 7 (B4, B6, B7, U4, U7, Y3, Y4-FE) | ☐ |
| /admin/satis-siparisleri | 4 (B2, B5, U6) | ☐ |
| /admin/stoklar | 2 (B9, U1) | ☐ |
| /admin/hareketler | 1 (B8) | ☐ |
| /admin/satin-alma | 1 (U2) | ☐ |
| /admin/makineler | 1 (U8) | ☐ |
| /admin/tanimlar | 1 (Y1) | ☐ |
| /admin/dashboard | 2 (Y2, Y4-BE) | ☐ |
| /admin/urunler | 1 (B12 — kullanıcı eylemi) | ☐ |
