# Yazılımcı Notu — V2 Açık İşler Çeklist

> Kaynak: Canlı `promats_erp.page_feedback_threads` — 2026-07-28 durum doğrulaması
> Önceki tur kapanışı: [yazilimci-notu-acik-isler.md](./yazilimci-notu-acik-isler.md) (12 not + #5 veri temizliği)
> Bu turdaki **28 yeni + 1 devam eden = 29 kayıt**, canlı veritabanında `resolved` olduğu doğrulanarak kapatıldı.

---

## 1. Hızlı Özet — Sayfa ve Tip Dağılımı

| Sayfa | Bug | UX/İyileştirme | Yeni Özellik | Toplam |
|-------|-----|----------------|--------------|--------|
| `/admin/operator` | 4 | 3 | 1 | **8** |
| `/admin/uretim-emirleri` | 3 | 3 | 0 | **6** |
| `/admin/satis-siparisleri` | 2 | 2 | 0 | **4** |
| `/admin/dashboard` | 1 | 0 | 1 | **2** |
| `/admin/stoklar` | 1 | 1 | 1 | **3** |
| `/admin/hareketler` | 0 | 2 | 0 | **2** |
| `/admin/satin-alma` | 0 | 2 | 0 | **2** |
| `/admin/urunler` | 1 (operasyon) | 0 | 0 | **1** |
| `/admin/makineler` | 0 | 0 | 1 | **1** |
| `/admin/tanimlar` | 0 | 0 | 1 | **1** |

**Öncelik özeti:** 🔴 12 bug (veri/işlem doğruluğu) · 🟠 13 UX iyileştirme · 🟡 4 yeni özellik
**Tartışılması gereken: 5 madde** (bölüm 4'te).

---

## 2. Net ve Doğrudan Uygulanabilir (Çeklist)

### 🔴 BUG — Veri/işlem doğruluğu (12)

- [x] **Makineden çıkar — montaj tarafı çıkmıyor** · `/admin/uretim-emirleri` · `8d4d04f4` & `3c531576` (UE-2026-0025)
  - ENJ-01'den (montaj olmayan) çıkarıyor; ENJ-02'den (montaj olan) çıkarmıyor → "hata oluştu".
  - Tek kök neden iki notta birleşiyor; aynı fix.
- [x] **Sipariş malzeme listesinde eksik ürünler** · `/admin/satis-siparisleri` · `ef1b0aa2` & `37c79567`
  - "1114 101 TUNA SİYAH", "1110 PROFESYONEL SİYAH" malzeme seçiminde gelmiyor; ürünler listesinde mevcut.
- [x] **Üretim emri ilerleme: sağ+sol toplanıyor** · `/admin/uretim-emirleri` · `ed23aa61`
  - 3000 sağ + 3000 sol = ekranda 6000 görünüyor; ilerlemeye sadece **montaj yapılan makinenin** miktarı yansımalı.
- [x] **Fire miktarı operatör ekranında görünmüyor** · `/admin/operator` · `1e9b1d96`
  - Girilen fire, fire alanına yansımıyor (insert/get-dto uyumsuzluğu olabilir).
- [x] **Mevcut sipariş kapatılamıyor** · `/admin/satis-siparisleri` · `075fa888`
  - `SS-2026-0023` (üretimde olmadığı halde "üretimde" görünüyor) ve `SS-2026-0022` (kısmen sevk edilmiş, kapatılamıyor) — kısmen sevkli sipariş kapatılabilir olmalı.
- [x] **Cumartesi veri girişi bloklanıyor** · `/admin/operator` · `6babfc20`
  - Cuma gece vardiyası **Cumartesi 07:30'da** bitiyor; sistem Cumartesi'yi tatil sayıp girişi kapatıyor. Vardiya bitişine kadar açık olmalı.
- [x] **Otomatik vardiya yanlış saatte başlıyor** · `/admin/operator` · `9145df93`
  - "Otomatik vardiya aktif" kutuları **10:30'da** başlamış görünüyor; sistemde **07:30** tanımlı. Vardiya başlangıç kaynağında uyumsuzluk.
- [x] **Stok hareketleri: çıkışlar yeşil/+ ile gösteriliyor** · `/admin/hareketler` · `50064c2c` & `9f033c08`
  - Sevkiyat doğru (kırmızı/-). Üretim tüketimi (çıkış) yeşil/+ görünüyor — sadece **gösterim** hatası, veri doğru.
  - Beraber yapılır: hareket_tipi = `cikis` → kırmızı/turuncu + `-` işareti.
- [x] **Stok-Serbest formülü yanlış** · `/admin/stoklar` · `149f8066`
  - `Serbest = Stok − Rezerve`. Eğer **negatif** ise alan **boş** gösterilsin.
- [x] **Rezerve-Eksik formülü ve sütun adı** · `/admin/uretim-emirleri/[id]` (Malzeme Tedarik) · `c709c3e2`
  - Sütun adı: "Rezerve" → **"Toplam Rezerve"**.
  - Serbest miktar negatifse boş.
  - Eksik = Toplam Rezerve − Stok Miktarı (sadece pozitifse göster).
- [x] **Eksik kalem kutucuğu 2 kez görünüyor** · `/admin/uretim-emirleri/[id]` · `8554be94`
  - Aynı kutu yan yana iki kez render ediliyor (screenshot ekte); birini kaldır.
- [x] **Ürün görseli (devam eden)** · `/admin/urunler` · `f067136a` · **resolved**
  - Sadece 2 dosya bekliyor (sizin yüklemeniz): `Frankfurt_Fuar_Kapak.jpg` (1115 211), `CARUB_PASIFIK.jpg`.

### 🟠 UX/İyileştirme (13)

- [x] **Stok satırına tıklayınca son hareketler** · `/admin/stoklar` · `f03ac873`
  - Malzeme satırına tıklandığında giriş/çıkış kayıtları (max son 10, yeni üstte). Reçete mantığındaki gibi inline.
- [x] **Satın alma malzeme arama kutusu** · `/admin/satin-alma` · `c80c407b` & `ed62d7f7`
  - Yeni satın alma siparişinde malzeme seçimine arama kutusu eklensin (aynı konu iki notta).
- [x] **Reçete açıklamasını üretim emri reçete-detay modalına getir** · `/admin/uretim-emirleri` · `076a50c3`
  - Ürün resmi+adı altına, malzeme listesinden önce reçetenin genel açıklaması. (Veri kaynağı: `receteler.aciklama`, V1'de eklendi.)
- [x] **Operatör veri giriş penceresi mobilde küçük kalıyor** · `/admin/operator` · `eb9efb4e`
  - Ana ekranı büyüttük; veri giriş modal'ı ve benzeri pencereler de aynı oranda büyütülmeli.
- [x] **Malzeme yeterlilik penceresi: stok takipli filtre** · `/admin/uretim-emirleri/[id]` · `7f499870`
  - "Stok takibi: Hayır" olan ürünler bu pencerede listelenmesin.
- [x] **Sipariş İşlemleri sekmesine stok bilgisi** · `/admin/satis-siparisleri` · `bd05cd65`
  - Ürün stoğu, sekmedeki ürün kartında görünsün.
- [x] **Operatör ekranında Üretim Emirleri liste** · `/admin/operator` · `16a8568e` (+ `37f0e56b` ile tartışılır — bkz. bölüm 4)
  - Operatör listeyi ve reçete detayını **read-only** görebilsin (yeni emir/düzenle/atama YOK).
- [x] **Makine için yes/no görünürlük seçenekleri** · `/admin/makineler` · `1d6141a0`
  - "Operatör ekranında görün" + "Makine İş Yükleri ekranında görün" iki ayrı toggle.

### 🟡 Yeni Özellik (4)

- [x] **Makine bazlı/kısa süreli kapatma (tatil-dışı)** · `/admin/tanimlar` · `ccadafc0` (📌 bkz. bölüm 4 — şema kararı gerek)
  - Belirli makine(ler)i belirli tarih aralığında kapatma. Kapalıyken iş yükü planlanabilir ama operatör başlatamaz.
- [x] **Dashboard makine durumları widget revizyonu** · `/admin/dashboard` · `3f29be58` (📷 ek görsel)
  - Planlama gün sayısına göre renk: ≤2g kırmızı, 3-5g turuncu, 5-10g sarı, >10g yeşil.
  - Makine durumu enum: Çalışıyor / Kalıp Değişimi / Duraklatıldı / Kapalı.
- [x] **Cep telefonu (Android) responsive — sadece Android** · `/admin/operator` · `19a5dd97` (📌 bkz. bölüm 4)
  - Vardiya kutucukları tam ekran sığıyor, çalışan iş ve sıradaki iş kutuları çok büyük. iPhone/tablette sorun yok.
- [x] **Gerçekleşen Üretim — gece vardiyası ayrımı** · `/admin/dashboard` · `74487d14` (📌 bkz. bölüm 4)
  - Şu an her şey "gündüz" görünüyor; "gece" filtresi boş.

---

## 3. Önerilen Yapım Sırası

1. **Önce bug'lar (12 madde)** — operasyonel güveni geri kazanmak. Önerilen sıra:
   1. Makineden çıkar montaj kalmasını (#8d4d04f4 + #3c531576) → tek fix
   2. Sipariş malzeme listesi eksik (#ef1b0aa2 + #37c79567) → tek fix
   3. Mevcut sipariş kapatma (#075fa888)
   4. Otomatik vardiya saati (#9145df93) + Cumartesi giriş (#6babfc20) — vardiya mantığı tek seferde
   5. Fire miktarı (#1e9b1d96)
   6. Üretim emri ilerleme sağ+sol (#ed23aa61) + Rezerve-Eksik (#c709c3e2) — montaj/rezerve mantığı birlikte
   7. Hareket çıkış kırmızı/- (#50064c2c + #9f033c08) → kozmetik tek fix
   8. Stok-Serbest formülü (#149f8066)
   9. Eksik kalem kutusu çift (#8554be94)
2. **Sonra UX (13 madde)** — sayfa bazlı gruplandırılarak
3. **En son yeni özellikler (4 madde)** — şema/tasarım kararı bittiğinde

---

## 4. ❓ Tartışılması Gereken Konular

Aşağıdaki 5 madde net karar/cevap gerektiriyor. Bu turdaki en önemli kısım:

### 4.1 — Tatil-dışı makine kapatma (yeni özellik, şema kararı) — `ccadafc0`

**Mevcut durum:** Tatil günü tanımı tüm işletmeyi kapatıyor (tüm makineler). Belirli makinenin belirli aralıkta kapatılması yok.

**Tasarım soruları:**
- a) Yeni bir tablo mu (`makine_kapali_aralik`: makine_id, baslangic, bitis, neden) — kalıcı durum mu (örn. uzun bakım), düzenli aralık mı (örn. her Cuma)?
- b) Mevcut `durus_kayitlari` ile mi (operatör başlangıç/bitiş — ama bu operatör eylemi, yönetim eylemi değil)?
- c) `makineler.durum` alanına yeni bir değer eklemek yeterli mi (`planli_kapali`)?

**Önerim:** Ayrı tablo `makine_kapali_araliklar` (makine_id, baslangic_tarih, bitis_tarih, aciklama). İş yükü planlamada bilgi amaçlı görünür; operatör "Başlat" disabled.

**Soru: Onaylıyor musun? Tek tarih mi yoksa aralık (başlangıç-bitiş) mi yeterli?**

### 4.2 — Operatör'e Üretim Emirleri'ni gösterme: hangi yaklaşım? — `37f0e56b` + `16a8568e`

İki not aynı şeyi farklı yoldan istiyor:

- **Yol A** (16a8568e): Operatör'e `/admin/uretim-emirleri` sayfasını read-only aç (sidebar'da görünsün, ama tüm yazma butonları gizli).
- **Yol B** (37f0e56b): Operatör ekranına entegre et — reçete detayını operatör kart ekranından aç.

Kullanıcı 37f0e56b'de "bu resimdeki ekrana ulaşmasını sağlayabilirsek üretim emirlerini buraya koymamız gerekmeyebilir" diyor — yani **Yol B'yi tercih ediyor olabilir**.

**Soru:** B yolu tercih edilirse: operatör kart ekranındaki **her kartın üzerine "Reçete Detayı" butonu** koysam (mevcut reçete-detay-modal'ı açar) yeterli mi? Yoksa hem A hem B birden lazım mı?

### 4.3 — Gerçekleşen Üretim'de gece vardiyası kayıtları — `74487d14`

Kullanıcı kendisi soruyu sormuş: *"gece vardiyası 07:30 bitti operatör 08:30'da veri girişi yaptı diyelim, burada yanlış bir veri işleme olur mu?"*

**Seçenekler:**
- a) **Saate göre otomatik:** kayıt zamanı 19:30-07:30 arası → gece, değilse gündüz. (08:30'daki giriş gündüz olur — yanlış.)
- b) **Vardiya işaretleyici:** operatör veri girerken "Bu hangi vardiyaya ait?" seçer (gündüz/gece). Açık ama operatörün her seferinde seçmesi gerekir.
- c) **Hibrit:** Vardiya bitiminden sonra 2 saat içindeki girişler otomatik **önceki vardiyaya** sayılır (Cumartesi sabah 08:30 → Cuma gece vardiyası). Operatör isterse değiştirebilir.

**Önerim:** **(c) Hibrit** — saat 07:30-09:30 arası girişler otomatik "gece"ye sayılır; UI'da küçük bir vardiya badge görünsün, tıklayınca değiştirilebilsin. Bu, Cumartesi #6babfc20 sorununu da otomatik çözer.

**Soru: (c) ile gidelim mi? Tampon süre 2 saat yeterli mi yoksa 4 saat istiyor musun (örn. 11:30'a kadar)?**

### 4.4 — Android cep telefonunda operatör ekranı — `19a5dd97`

**Sorun:** Vardiya kutuları sığıyor; **çalışan iş + sıradaki iş kutuları çok büyük**, ekrana sığmıyor. Sadece **Android**'de; iPhone/tablet sorunsuz.

Bu çok özel — bizden ek bilgi gerek:

- Hangi Android sürümü/cihaz (örn. Samsung A14 / Pixel)?
- Hangi tarayıcı (Chrome, Samsung Internet, Firefox)?
- Ekran çözünürlüğü/yoğunluğu (DPI) ne?

**Tahminim:** Android Chrome'da `viewport-fit` veya CSS `dvh/svh` davranış farkı. Olası fix: operatör layout'unu `@container` query'lerle düzenleyip kart genişliklerini viewport yerine kapsayıcıya bağlamak. Ama önce **hangi cihazda olduğunu** öğrenmem gerek.

**Soru: Test ettiğin Android telefonun marka/model ve tarayıcısını söyler misin? Ekran görüntüsü ekledim diyorsun (ek dosya), onu da inceleyeceğim.**

### 4.5 — Stoklar "Serbest" vs Üretim Emri "Eksik" — formüller tutarlı mı?

İki ayrı not iki farklı yerde benzer ama farklı formüller veriyor:

| Konum | Konsept | Formül | Negatif davranış |
|-------|---------|--------|-----------------|
| `/admin/stoklar` (149f8066) | **Serbest** | Stok − Rezerve | Negatif → **boş** |
| `/admin/uretim-emirleri/[id]` (c709c3e2) | **Eksik** | Toplam Rezerve − Stok Miktarı | Pozitif değilse göstermesin (zımnen) |
| Mevcut `stoklar` DTO | `serbestStok` | stok − açıkUretimİhtiyacı | — |
| Mevcut `stoklar` DTO | `kritikAcik` | max(kritikStok − stok, 0) | — |

**Sorun:** Backend `rowToDto` "açık üretim ihtiyacı"nı kullanıyor; kullanıcı "rezerve_stok" istiyor. İkisi farklı şey. Kullanıcının istediği "rezerve" = `urunler.rezerve_stok` kolonu (zaten var). Mevcut `serbestStok` mantığı (`stok − acikUretimIhtiyaci`) belki tamamen farklı.

**Soru:**
- (a) Stoklar tablosunda **Serbest = Stok − Rezerve** olsun; mevcut "serbestStok"u (açık üretim ihtiyacı bazlı) **kaldıralım** mı, yoksa iki ayrı sütun mu olsun ("Serbest" + "Üretime Açık")?
- (b) Üretim Emri Malzeme Tedarik'teki "Eksik" → senin formülün **Eksik = Toplam Rezerve − Stok**, mevcut backend hesabı (`gerekliMiktarFireli − mevcutStok`) bambaşka. **Mevcut "yeterlilik" mantığı kalsın mı, yoksa senin formülünle değiştirilsin mi?** (Mevcut yeterlilik bir üretim emrindeki "bu emri çıkarmaya yeter mi?" sorusunu cevaplıyor; senin formülün "bu malzemeden ne kadar eksiğim var?" — ikisi farklı soru olabilir.)

Bu en kafa karıştırıcı kısım; net cevap olmadan değiştirirsek başka şikayetler gelebilir.

---

## 5. Görev Dağılımı Önerisi (önceki düzene benzer)

Tartışma kararları verildikten sonra:

| Araç | Önerilen yük |
|------|--------------|
| **Claude** | 4.1/4.5 şema kararı + bug fix'leri yön ver, kritik üretim mantığı fix'leri (vardiya, makineden çıkar, ilerleme hesabı), deploy & review |
| **Codex** | Çoğu bug fix + UX iyileştirmelerin backend kısmı (hareketler renk, stok formülü, satış-stok bilgisi) + yeni özellik #1d6141a0 (makine yes/no) |
| **Cursor** | UX/UI iyileştirmeler (stok inline hareket, satın alma arama, operatör veri giriş modal, eksik kalem çift kutu) |
| **Antigravity** | Görsel doğrulama; özellikle Android responsive (4.4 net kararı sonrası) ve dashboard widget revizyonu |
