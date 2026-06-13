# Yazılımcı Notu V3 — Açık İşler Çeklisti (Derin İnceleme + Karar Verilmiş)

> **Hedef:** 14 açık yazılımcı notunu kapatmak (13 yeni + 1 yeniden açılan).
> **Sorumlu:** Codex (implementasyon) + Claude (review, deploy, şema kontratları, thread kapatma).
> **İnceleme tarihi:** 2026-06-13 — Claude her notu canlı DB + kod seviyesinde inceledi.
> **Not kaynağı:** Canlı `page_feedback_threads` (2026-06-11 batch).

---

## 0. Claude'un İnceleme Bulguları (Codex bunları veri kabul etsin)

| Bulgu | Detay |
|-------|-------|
| F1 | **Reçete açıklaması zinciri uçtan uca ÇALIŞIYOR** (form → `PUT /admin/urunler/:id/recete` `body:{aciklama,items}` → `mapRecetePatch` → DB → `GET /admin/receteler/:id` → modal satır 94-98). Kök neden: canlıdaki **hiçbir reçetede açıklama verisi yoktu** — alan V2 ile geldi, kullanıcı fark etmedi. Claude kanıt için `RCT-XLS-1112 101` (MAXIMUM SİYAH) reçetesine örnek açıklama yazdı. **Tek gerçek kod eksiği:** yeni ürün oluşturma akışındaki draft reçete kaydı ([urun-form.tsx](admin_panel/src/app/(main)/admin/urunler/_components/urun-form.tsx) satır ~481 `saveDraftRecete({ urunId: created.id, items: validRows })`) `aciklama` göndermiyor. |
| F2 | **Operatör "veri giriş hatası + çift kayıt" deseni:** [operator/repository.ts](backend/src/modules/operator/repository.ts) `uretimBitir` akışında ana kayıt transaction içinde commit ediliyor, ama **transaction-SONRASI** adımlar korumasız: `recalcMakineKuyrukTarihleri` (~1128), `transitionMultipleKalemDurum` (~1179), `tryMontajForUretimEmri`/`tryPendingMontajlarAfterStokArtis` (~1214-1217), `createAdminNotification` (~1231). Bunlardan biri throw ederse kayıt VAR ama 500 dönüyor → kullanıcı tekrar basıyor → çift kayıt. Ayrıca 2026-06-10 06:27'de MySQL planlı restart sırasında `ECONNREFUSED` yaşandı (tek seferlik, ayrı olay). |
| F3 | **Grup mimarisi:** `categories` (urun/yarimamul/...) → `sub_categories` (kullanıcının "ürün grubu" dediği: Paspas, Çanta, Zincir, Kartela...) → `urunler.urun_grubu` **ad-tabanlı varchar** (FK yok). Kategori yönetimi UI: [tanimlar/_components/kategoriler-tab.tsx](admin_panel/src/app/(main)/admin/tanimlar/_components/kategoriler-tab.tsx), backend: `backend/src/modules/subCategories/`. |
| F4 | SS-2026-0021/0022/0023 canlıda `durum='tamamlandi', is_active=1` — Sipariş İşlemleri sekmesi tamamlananları da listelediği için "ekrandan kaldırılamıyor" şikayeti geliyor. |
| F5 | Satış siparişi durum enum'u: `taslak, planlandi, onaylandi, uretimde, kismen_sevk, tamamlandi, kapali, iptal` ([satis_siparisleri/validation.ts](backend/src/modules/satis_siparisleri/validation.ts) satır 5). |
| F6 | "Sevk emri var" butonu: [sevkiyat-client.tsx](admin_panel/src/app/(main)/admin/sevkiyat/_components/sevkiyat-client.tsx) satır ~315 ve ~365 — `row.acikSevkEmriMiktar > 0` durumunda da buton aynı `olustur` aksiyonunu tetikliyor. |
| F7 | `satin_alma_kalemleri` kolonları: `id, siparis_id, urun_id, miktar, birim_fiyat, sira, created_at, updated_at` — satır bazlı termin YOK. Sipariş başlığında `termin_tarihi date` var. |
| F8 | Mevcut roller: `admin, operator, satin_almaci, nakliyeci` ([navigation/permissions.ts](admin_panel/src/navigation/permissions.ts) + backend permission guard). Sevkiyat mobil görünümü için **yeni rol açılmayacak — `nakliyeci` kullanılacak**. |

## 0b. Hazır Şema Kontratları (Claude yazdı — Codex bunları kullanır, değiştirmez)

| Seed | İçerik |
|------|--------|
| [201_sub_categories_parent.sql](backend/src/db/seed/sql/201_sub_categories_parent.sql) | `sub_categories.parent_id char(36) NULL` + index — grup hiyerarşisi (Paspas → Maximum/Profesyonel/Başak). `parent_id NULL` = kök grup, mevcut davranış değişmez. |
| [202_urunler_alt_grup.sql](backend/src/db/seed/sql/202_urunler_alt_grup.sql) | `urunler.alt_grup varchar(128) NULL` + index — `urun_grubu` ile aynı ad-tabanlı kalıp. |
| [203_satin_alma_kalem_termin.sql](backend/src/db/seed/sql/203_satin_alma_kalem_termin.sql) | `satin_alma_kalemleri.termin_tarihi date NULL` — satır bazlı termin; boşsa sipariş geneli geçerli (fallback uygulama katmanında). |

> Not: Bu seed'leri canlıya **Claude uygular** (deploy script seed çalıştırmıyor). Codex yalnızca Drizzle şema dosyalarını + kodu bu kolonlara göre günceller.

---

## 1. 🔴 BUG'lar — Öncelik 1

### V3-B1 — Operatör veri giriş hatası + çift kayıt (EN KRİTİK — olası V2 regresyonu)
- **Not:** `c8df50d6` · `/admin/operator`
- **Şikayet:** "Üretimi bitir" veya günlük üretim girişinde "kaydederken hata oluştu"; ikinci denemede çift kayıt.
- **Kök neden (F2):** Kayıt commit edildikten sonra çalışan korumasız adımlar (recalc/transition/montaj/notification) hata fırlatınca 500 dönüyor; kullanıcı tekrar basınca ikinci kayıt oluşuyor.
- **Yapılacak (3 bacak):**
  1. **Backend dayanıklılık:** `uretimBitir` ve `gunlukUretimGir` akışlarında transaction-sonrası yan adımları (`recalcMakineKuyrukTarihleri`, `transitionMultipleKalemDurum`, `tryMontaj*`, `createAdminNotification`) tek tek `try/catch` ile sarmala — yan adım hatası **loglanır ama 200 döner** (ana kayıt başarılı). V1'deki `notifyAdmins` kalıbı örnek ([page_feedback/controller.ts](backend/src/modules/page_feedback/controller.ts) `// Feedback kaydini bildirim hatasi yuzunden bozma.`).
  2. **İdempotency:** `uretimBitir` — kuyruk satırı zaten `tamamlandi` ise ikinci isteği hata yerine **mevcut sonuçla 200** dön (veya 409 `zaten_tamamlandi` + frontend bunu "zaten kaydedildi" toast'ına çevirir). `gunlukUretimGir` — aynı `makineKuyrukId` için son 30 sn içinde aynı `uretilenMiktar+fireMiktar` ile kayıt varsa yenisini ekleme, mevcut kaydı dön.
  3. **Frontend çift tıklama koruması:** İlgili mutation'lar `isLoading` iken buton disabled (operator-client'taki kaydet butonları kontrol et, eksikse ekle).
- **Kabul kriteri:** Yan adım hatası simüle edildiğinde (örn. bildirim servisini bozarak) kayıt başarılı + tek; UI hata göstermiyor.
- [x] Tamamlandı

### V3-B2 — Siparişte üretime aktarırken çift üretim emri
- **Not:** `85c46f2a` · `/admin/satis-siparisleri`
- **Şikayet:** Sipariş satırı seçip "üretime aktar" → aynı siparişten 2 üretim emri açılıyor.
- **Kod:** `POST /admin/satis-siparisleri/islemler/uretime-aktar` ([router.ts](backend/src/modules/satis_siparisleri/router.ts) satır 22) — endpoint zaten `atlananSayisi` dönüyor, yani "zaten aktarılmış kalemleri atla" mantığı var ama çalışmıyor veya frontend çift istek atıyor.
- **Yapılacak:**
  1. Backend: aktarım öncesi kalem bazında **aktif üretim emri var mı** kontrolünü doğrula (kalem id'ye bağlı `uretim_emirleri` `is_active=1` ve durum iptal değilse → atla). `birlestir` parametresinin etkisini de incele.
  2. Frontend: "Üretime Aktar" butonu mutation `isLoading` iken disabled; başarı sonrası seçim temizlenir.
  3. V3-B1'deki desen burada da olabilir (aktarım sonrası yan adım hatası → retry) — aynı sarmalama uygulansın.
- **Kabul kriteri:** Aynı kaleme art arda iki kez "üretime aktar" → ikincisi `atlananSayisi=1` döner, yeni emir açılmaz.
- [x] Tamamlandı

### V3-B3 — Reçete açıklaması: draft akışı + görünürlük (yeniden açılan)
- **Notlar:** `076a50c3` (reopen: "Bu kosım hallolmamış gözüküyor") + `ff383df7` (aynı talep) · `/admin/uretim-emirleri`
- **Bulgu F1:** Zincir çalışıyor; sorun veri yokluğu + keşfedilebilirlik. Konum isteği (ürün resminin altı, malzeme listesinin üstü) **zaten doğru** ([recete-detay-modal.tsx](admin_panel/src/app/(main)/admin/uretim-emirleri/_components/recete-detay-modal.tsx) satır 94-98).
- **Yapılacak:**
  1. **Draft akışı fix (gerçek eksik):** `urun-form.tsx` satır ~481 — `saveDraftRecete({ urunId: created.id, items: validRows })` çağrısına draft reçete açıklaması da eklensin. `DraftReceteSection`'a (ReceteSection'daki gibi) "Reçete Açıklaması" textarea ekle; yeni ürün oluştururken girilen açıklama kaydedilsin.
  2. **Modal görünürlük:** Açıklama bloğuna başlık ekle ("Reçete Açıklaması" etiketi + mevcut stil korunur). Açıklama **yoksa** muted küçük bir satır göster: "Bu reçeteye henüz açıklama girilmemiş. Ürünler → Ürün Detayı → Reçete sekmesinden ekleyebilirsiniz." — kullanıcı nereden gireceğini öğrenir, "hallolmamış" algısı biter.
  3. MAXIMUM SİYAH reçetesinde örnek açıklama var (Claude yazdı) — testte kullan.
- **Kabul kriteri:** Açıklamalı reçetede modal başlıklı blok gösterir; açıklamasız reçetede yönlendirme satırı görünür; yeni ürün oluştururken girilen açıklama DB'ye yazılır.
- [x] Tamamlandı

### V3-B4 — "Sevk emri var" butonu yeni sevk emri açıyor
- **Not:** `4cc96950` · `/admin/sevkiyat`
- **Kod (F6):** [sevkiyat-client.tsx](admin_panel/src/app/(main)/admin/sevkiyat/_components/sevkiyat-client.tsx) satır ~315 ve ~365 — `acikSevkEmriMiktar > 0` iken etiket "Sevk emri var" ama onClick hâlâ oluşturma penceresi açıyor.
- **Yapılacak (kullanıcının önerdiği tasarım):**
  - `acikSevkEmriMiktar > 0` → **tıklanamaz bilgi rozeti** "Sevk emri var" (Badge, buton değil) + **ayrı küçük buton** "Yeni Sevk Emri Oluştur" (bilinçli ikinci sevk için).
  - `acikSevkEmriMiktar == 0` → mevcut "Oluştur" butonu aynen kalır.
  - Her iki render noktasına da (315 + 365) uygula.
- **Kabul kriteri:** Rozet tıklanınca hiçbir şey olmaz; yeni sevk yalnızca açık adlı butonla açılır.
- [x] Tamamlandı

### V3-B5 — Ekrandan kaldırılamayan siparişler (SS-2026-0021/0022)
- **Not:** `4cb164a1` · `/admin/satis-siparisleri`
- **Bulgu F4:** İkisi de `durum='tamamlandi'` — İşlemler sekmesi tamamlananları listeliyor.
- **Yapılacak:** V3-U1 (sipariş durum yönetimi) ile **birlikte** çözülür: İşlemler sekmesi default'ta `tamamlandi/kapali/iptal` durumlarını **listelemez**. Ayrıca tam silme istenmişse: tamamlanmış siparişe "arşivle/gizle" yerine V3-U1'deki default filtre yeterli — **kalıcı silme ekleme** (muhasebe izi kalmalı; kullanıcı "tamamen silebiliriz" dese de yumuşak gizleme tercih edilir, görünmedikten sonra fark etmez).
- **Kabul kriteri:** SS-2026-0021/0022 İşlemler sekmesinde görünmez; "Tümünü göster" açılınca görünür.
- [x] Tamamlandı

---

## 2. 🟠 UX / Davranış Düzeltmeleri — Öncelik 2

### V3-U1 — Sipariş durumu yönetimi (geri alma + default filtre + otomatik kapanış)
- **Not:** `2cc4ec29` · `/admin/satis-siparisleri`
- **Durum enum (F5):** `taslak, planlandi, onaylandi, uretimde, kismen_sevk, tamamlandi, kapali, iptal`.
- **Yapılacak (3 parça):**
  1. **Geri alma:** Sipariş düzenlemede `kapali`/`iptal` durumundaki sipariş `onaylandi` (veya `planlandi`) durumuna geri alınabilsin. Backend PATCH validation'da bu geçişe izin ver; UI'da "Geri Aç" eylemi.
  2. **Default filtre:** Sipariş listesi + İşlemler sekmesi ilk açılışta yalnızca **aktif** durumları gösterir (`taslak, planlandi, onaylandi, uretimde, kismen_sevk`). "Tümünü göster" toggle'ı ile `tamamlandi/kapali/iptal` da listelenir.
  3. **Otomatik kapanış:** Bir siparişin **tüm kalemleri sevk edildiğinde** sipariş otomatik `kapali` durumuna geçer (sevkiyat tamamlama akışına hook — [sevkiyat/repository.ts](backend/src/modules/sevkiyat/repository.ts) fiziksel sevk sonrası kontrol). Mevcut `tamamlandi` durumu davranışı korunur; `tamamlandi` da default listede gizlenir (V3-B5).
- **Kabul kriteri:** Yanlış kapatılan sipariş geri açılabiliyor; tam sevk edilen sipariş listeden otomatik düşüyor; "Tümünü göster" ile erişilebiliyor.
- [x] Tamamlandı

### V3-U2 — Sevk emirleri default filtre "Bekliyor"
- **Not:** `e9681203` · `/admin/sevkiyat`
- **Yapılacak:** Sevk Emirleri ekranı ilk açılışta durum filtresi `bekliyor` seçili gelsin (kullanıcı değiştirebilir). Tek satırlık default state değişikliği + Select sentinel kuralına dikkat (boş string yasak — `admin_panel/CLAUDE.md`).
- [x] Tamamlandı

### V3-U3 — Satın alma: satır bazlı termin
- **Not:** `211ccb7d` · `/admin/satin-alma`
- **Şema hazır (F7 + 0b):** [203_satin_alma_kalem_termin.sql](backend/src/db/seed/sql/203_satin_alma_kalem_termin.sql)
- **Yapılacak:**
  1. Drizzle şema: `satin_alma_kalemleri`'ne `termin_tarihi` ekle ([satin_alma/schema.ts](backend/src/modules/satin_alma/schema.ts)) + DTO + validation (`terminTarihi` optional date).
  2. Davranış: kalem termini **boşsa sipariş geneli termin geçerli** (DTO'da `etkinTermin = kalem.termin ?? siparis.termin` olarak hesapla, UI bunu gösterir).
  3. UI: satın alma formu satırlarına opsiyonel termin tarihi alanı; listede kalem termini sipariş termininden farklıysa göster.
- **Kabul kriteri:** Sipariş geneline termin girilince tüm satırlar onu gösterir; bir satıra farklı termin girilince yalnızca o satır farklı gösterir.
- [x] Tamamlandı

---

## 3. 🟡 Yeni Özellikler — Öncelik 3

### V3-Y1 — Ürün alt grubu (3 not tek mimari: KÜME A)
- **Notlar:** `87e3b9c8` (ürün formuna alan) + `bc912203` (kategori yönetiminden tanımlama) + `707e63c6` (sipariş işlemlerinde filtre)
- **Mimari (F3 + 0b):** `sub_categories.parent_id` hiyerarşi (seed 201) + `urunler.alt_grup` ad-tabanlı kolon (seed 202). `urun_grubu` kalıbının birebir devamı.
- **Yapılacak:**
  1. **Backend subCategories modülü:** `parent_id` desteği — schema + validation + create/update + list response'a `parentId`. Liste hiyerarşik dönebilir (kök gruplar + altları) veya flat + parentId (frontend gruplar). Alt grup yalnızca kök gruba bağlanabilir (2 seviye sınırı — alt grubun altına alt grup yok, validation).
  2. **Kategoriler-tab UI** ([kategoriler-tab.tsx](admin_panel/src/app/(main)/admin/tanimlar/_components/kategoriler-tab.tsx)): grup satırında "Alt grup ekle" eylemi; alt gruplar girintili/rozetli gösterilir; düzenle/sil mevcut kalıpla.
  3. **Ürün formu** ([urun-form.tsx](admin_panel/src/app/(main)/admin/urunler/_components/urun-form.tsx)): `urun_grubu` seçiminin altına bağlı **"Ürün Alt Grubu"** select'i — seçilen gruba `parent_id` ile bağlı alt grupları listeler; grup değişince alt grup sıfırlanır; opsiyonel alan.
  4. **Backend urunler:** Drizzle şemaya `alt_grup` + create/patch validation + `buildWhere`'e `altGrup` filtresi ([urunler/repository.ts](backend/src/modules/urunler/repository.ts) satır ~48) + DTO.
  5. **Ürünler listesi filtresi** ([urunler-client.tsx](admin_panel/src/app/(main)/admin/urunler/_components/urunler-client.tsx)): grup filtresinin yanına alt grup filtresi.
  6. **Sipariş İşlemleri sekmesi** (`707e63c6`): mevcut "düz liste / ürün bazlı / müşteri bazlı" seçeneklerinin yanına **"ürün alt grubu"** bazlı listeleme — kalemler ürünün `alt_grup` değerine göre gruplanır.
- **Kabul kriteri:** Paspas altına "Maximum" eklenir → MAXIMUM SİYAH ürününe atanır → Ürünler ekranında alt grup filtresiyle bulunur → Sipariş İşlemleri'nde alt grup bazlı listelenir.
- [x] Tamamlandı

### V3-Y2 — Sevkiyat mobil ekran + nakliyeci kısıtlı görünüm
- **Not:** `fb325628` · `/admin/sevkiyat`
- **Karar (F8):** Yeni rol YOK — mevcut **`nakliyeci`** rolü kullanılır.
- **Yapılacak:**
  1. **Rol bazlı görünüm:** `nakliyeci` rolüyle girişte sevkiyat ekranı yalnızca **"Fiziksel Sevk"** modunu gösterir: planlama/oluşturma/onay eylemleri gizli (UI) + backend'de bu eylemler nakliyeci için 403 (permission guard mevcut kalıpla).
  2. **Fiziksel sevk akışı:** "Fiziksel olarak sevk et" → açılan kutuda **planlanan miktar default** gelir, nakliyeci değiştirebilir. Girilen miktar **stoktaki miktardan fazlaysa** kayıt engellenir + uyarı: "Stok yetersiz. Yöneticinizle görüşün." Kaydet → girilen miktar sevk edilir ve stoktan düşer (planlanan miktar bağlayıcı değil).
  3. **Mobil düzen:** Sevkiyat ekranı dar ekranda tek kolon; "Fiziksel sevk" kartları büyük dokunma alanlı (operatör ekranı V2 mobil kalıbı örnek — `grid-cols-1`, büyük buton, `overflow-x-hidden`).
- **Kabul kriteri:** Nakliyeci hesabıyla mobilde yalnızca fiziksel sevk yapılabiliyor; stok üstü miktar engelleniyor; admin tüm ekranı görmeye devam ediyor.
- [x] Tamamlandı

---

## 4. Genel Kurallar (V2 ile aynı disiplin)

1. **Sıra:** V3-B1 → B2 → B3 → B4 → B5 → U1 → U2 → U3 → Y1 → Y2. (B1 en kritik — günlük operasyonu bozuyor.)
2. **Her madde ayrı commit** — kısa Türkçe başlık + madde kodu. Örn: `fix(operator): bitir akisinda yan adim hatalarini izole et (V3-B1)`.
3. **ALTER yasak** — şema yalnızca hazır seed'ler (201/202/203) + Drizzle şema dosyası güncellemesi. Yeni şema ihtiyacı çıkarsa DUR, Claude'a sor.
4. Her madde sonunda build: `cd backend && bun run build` + `cd admin_panel && bun x tsc --noEmit`. Tümü bitince `bun run build` (admin).
5. **Push etme** — bitince Claude'a haber ver: review + seed uygulama + deploy + thread kapatma Claude'da.
6. **Tutarlılık:** V3-B5 ↔ V3-U1 aynı default-filtre mantığını paylaşır. V3-B1 ↔ V3-B2 aynı yan-adım-izolasyon kalıbını paylaşır. V3-Y1'in 6 parçası tek veri modeline (parent_id + alt_grup) dayanır.

## 5. Tamamlama Tablosu

| Madde | Sayfa | Not ID | Durum |
|-------|-------|--------|-------|
| V3-B1 | operator | c8df50d6 | ☑ |
| V3-B2 | satis-siparisleri | 85c46f2a | ☑ |
| V3-B3 | uretim-emirleri | 076a50c3 + ff383df7 | ☑ |
| V3-B4 | sevkiyat | 4cc96950 | ☑ |
| V3-B5 | satis-siparisleri | 4cb164a1 | ☑ |
| V3-U1 | satis-siparisleri | 2cc4ec29 | ☑ |
| V3-U2 | sevkiyat | e9681203 | ☑ |
| V3-U3 | satin-alma | 211ccb7d | ☑ |
| V3-Y1 | urunler + satis-siparisleri + tanimlar | 87e3b9c8 + bc912203 + 707e63c6 | ☑ |
| V3-Y2 | sevkiyat | fb325628 | ☑ |
| — | urunler (ürün görseli, kullanıcı eylemi) | f067136a | ☐ kullanıcıda |
