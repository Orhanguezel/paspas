# Yazılımcı Notu V20 — 🔴 Inline (çift taraflı) üretim: parçalar tüketiliyor ama hiç üretilmiyor

> **GÜNCELLEME 2026-07-20 — kullanıcı cevapları alındı (`Inline üretim cevaplar.docx`).**
> Aşağıdaki üç varsayımım **yanlış çıktı**, kararlar düzeltildi. Bu blok, eski kararların
> neden geçersiz olduğunu kayda geçirmek için duruyor:
>
> 1. ❌ *"`montaj=1` yanlış işaretlenmiş, düzeltilmeli"* → **Kasıtlı bir tasarım.** Kullanıcı montajı
>    ayrı operasyon olarak tanımlamak yerine, **hangi baskı operasyonuyla eşzamanlı yürüdüğünü**
>    işaretliyor. `montaj=1` = "bu makinedeki baskı ile elde yapılan montaj aynı anda yürüyor",
>    dolayısıyla o operasyonun süresi = montaj süresi. **Veri düzeltilmeyecek.**
> 2. ❌ *"R2: vardiya analizinde toplam montaj hariç olsun"* → **Tam tersi.** Kullanıcı: *"net rakam
>    baskı adedini göstermeli, bitmiş ürünü değil"*. `montaj=1` olan operasyon **da baskı yapıyor**,
>    üretimi sayılmalı. Asıl hata: o operasyonun `baskiNet`'e girmemesi (verimlilik/OEE bozuluyor).
> 3. ❌ *"Backfill yapılmayacak, veriden çıkarılamaz"* → **Çıkarılabilir.** Kullanıcı: *"operasyon adı
>    = üretilen parça adı"*. Ölçüldü: 280 operasyonun **240'ı tam eşleşiyor, çoklu eşleşme 0**.
>    Kalan 40'ı elle doldurulacak.
>
> **Yeni gereksinim (kullanıcıdan):** üretim erken bitirilirse (1000 yerine 700 takım) elde kalan
> operasyonel yarımamuller görünmeli; operatör "bitir" dediğinde sistem **admine kalan miktarları
> gösterip sıfırlamak isteyip istemediğini sormalı**. Yalnız operasyonel yarımamuller için. → R5

Kaynak not: `66c593f3-5c04-4e49-a4c3-1fbe771779a7` — **"Inline (çift taraflı) Üretim Senaryosu"**
(`/admin/vardiya-analizi`, 2026-07-20 08:42, `status=open`). Müşteri ekli görselle birlikte tam bir
akış tarif etmiş: `uploads/admin/vardiya-analizi/Inline_cift_tarfli_Uretim_Senayosu.png`

Müşterinin kendi cümlesi:

> Şu anda vardiya analizinde, hareketler ekranında, stoklarda sorunlar var. Bu sorunlar üretimden
> veri girişi ile ilgili. Aşağıdaki senaryoyu uygulayabilirsek düzeleceğini düşünüyorum.

**Müşteri haklı ve teşhisi de doğru.** Üç ekranın da bozulmasının tek bir kök nedeni var; aşağıda
canlı veriyle kanıtlandı.

---

## Müşterinin tarif ettiği model (referans)

| Saat | 1. Makine (Parça A) | Parça A stoku | 2. Makine (Parça B) | Montaj | Bitmiş (kümülatif) |
|---|---|---|---|---|---|
| 0-1, 1-2, 2-3 | 100 / saat | 100 → 200 → **300** | — | — | 0 |
| 3-4 … 9-10 | 100 / saat | **300 sabit** | 100 / saat | 100 / saat | 100 → 700 |
| 10-11, 11-12, 12-13 | — (durdu) | 200 → 100 → **0** | 100 / saat | 100 / saat | 800 → **1000** |

Temel prensipler (görselden):
- Üretim ve montaj **sürekli akış (inline)**; saatlik tamamlanmış partiler değil.
- Yalnızca **erken başlayan makinenin** ürettiği parçada tampon stok oluşur.
- Diğer parça (B) stok tutulmaz, üretildiği anda montaja gider.
- Erken başlayan makine çalıştığı sürece tampon stok **sabit** kalır.
- Makine durduktan sonra tampon stok montaj tarafından tüketilir.
- Süreç sonunda **her iki parçanın da stoku sıfır** olur.
- Montaj kapasitesi = "montaj" seçilmiş makinenin üretim kapasitesi (üründen ürüne değişir).

> **Müşterinin uyarısı:** 1000 adet / 100 adet-saat / 3 saat / 300 tampon **yalnızca örnektir**,
> kodda sabit değer olarak kullanılmamalıdır. Hangi makinenin ne kadar erken başlayacağı ve
> üretim hızları değiştikçe tampon stok ve süreler otomatik hesaplanmalıdır.

---

## Kök neden — kodun tanımadığı ÜÇÜNCÜ model

Kod bugün iki model tanıyor (`repoUretimBitir`, `operator/repository.ts:1302-1320`):

| Model | Kurulum | Stok davranışı |
|---|---|---|
| **Megane** | Her taraf AYRI emir (`urun_id` = operasyonel_ym) | Taraf stoğu artar (`giris/uretim`) → `tryMontajForUretimEmri` tüketir (`cikis/montaj`) → mamul kredilenir |
| **Tuna** | TEK emir (`urun_id` = mamul), 2 operasyon, **montaj operasyonu yok** | Ara girişler stok üretmez; son op bitince mamul `min(op üretilenleri)` kadar kredilenir, `skipOperasyonelYm: true` ile reçetedeki operasyonel_ym kalemleri atlanır |

**Canlıda üçüncü bir kurulum var ve koda görünmez:**

```
UE-2026-0098 · 41 LT BASIC SİYAH
  urun kategorisi : urun          (operasyonel_ym DEĞİL → Megane değil)
  operasyon sayısı: 2
    sira=1  montaj=1  üretilen=3652
    sira=2  montaj=0  üretilen=3668
  reçete          : Alt Ana Gövde 39L/41L (operasyonel_ym, 1 adet)
                    Üst Ana Gövde - Siyah 41 L (operasyonel_ym, 1 adet)
  parçalar için ayrı üretim emri: YOK
```

Bu kurulum her iki modelin de dışında kalıyor:

- `isSingleOperation` = false (2 op) → Megane yolu kapalı
- `isMultiOpWithoutMontaj` = **false** (montaj operasyonu var) → **Tuna yolu da kapalı**
- `currentOpIsMontaj` = true → `hasImmediateStockImpact` = **true**
- → `applyUretimStockDelta` `skipOperasyonelYm` **verilmeden** çağrılır (`operator/repository.ts:1381-1391`)
- → `consumeRecipeMaterials` reçetedeki `operasyonel_ym` kalemlerini stoktan **düşer** (`repository.ts:499`)
- → ama o parçalar hiçbir yerde **üretilmediği** için stok sonsuza kadar eksiye gider

Ayrıca `tryMontajForUretimEmri` bu emirde **hiç çalışmıyor**: çağrı koşulu emrin `urun_id`
kategorisinin `operasyonel_ym`/`yarimamul` olmasını istiyor (`operator/repository.ts:1496-1500`),
burada kategori `urun`. Yani montaj mantığı devrede değil, sadece reçete sarfı çalışıyor.

### Canlı kanıt (2026-07-20, `promats_erp`)

`Ana Gövde` parçalarının hareket dökümü — **tek bir `giris` yok**:

| Ürün | Hareket | Adet | Toplam | Stok |
|---|---|---|---|---|
| Alt Ana Gövde 39L/41L | `cikis` / `uretim` | 7 | 3093 | **−3093** |
| Üst Ana Gövde - Siyah 41 L | `cikis` / `uretim` | 7 | 3093 | **−3093** |
| Alt Ana Gövde 50L/52L | `cikis` / `uretim` | 4 | 1566 | −1566 |
| Üst Ana Gövde - Siyah 52 L | `cikis` / `uretim` | 4 | 1566 | −1566 |

Çıkış toplamı = negatif stoğun tamamı. İki parçanın birebir aynı değerde olması, ikisinin de aynı
reçeteden aynı çarpanla düşüldüğünü doğruluyor.

Genel tablo: `operasyonel_ym` kategorisinde **191 `cikis` / 46 `giris`** hareketi var — yani bazı
ürünler Megane modeliyle düzgün üretilirken (giriş var), bu modeldekiler yalnızca tüketiliyor.

Negatif stok özeti: `yarimamul` 21 ürün, `operasyonel_ym` 6 ürün, `urun` 4 ürün.
En büyükler: −5967, −5850, −5040, −4129, −4064, −3093, −3093.

---

# 🔴 R1 — Parça üretimi stoğa yazılmıyor (negatif stok kaynağı)

## VERİLMİŞ KARAR — R1

| Konu | Karar | Gerekçe |
|---|---|---|
| Model adı | **Inline modeli** (Megane/Tuna'nın yanına üçüncü model) | Kullanıcının kendi terimi |
| Tanıma kuralı | `urun_id.kategori = 'urun'` **AND** op sayısı > 1 **AND** reçetede `operasyonel_ym` kalemi var | Megane (`urun_id`=operasyonel_ym) ve Tuna (reçetede operasyonel_ym yok) ile çakışmaz |
| **`montaj=1`'in anlamı** | **"Bu baskı operasyonu ile elde yapılan montaj eşzamanlı yürüyor."** Operasyon **hem parça basar hem monte eder** | Kullanıcı: *"Makine 2 B parçasından 1 adet ürettiği anda, daha önce üretilmiş A parçalarından biri ile birleştiriliyor"* |
| Parça üretimi | **Her** operasyon (montaj bayrağından bağımsız), `uretilen_urun_id` parçasının stoğunu `uretilen_miktar` kadar **artırır** (`giris`/`uretim`) | `montaj=1` olan operasyon da baskı yapıyor — üretimi kaybedilmemeli |
| Montaj tüketimi | `montaj=1` operasyonun ürettiği miktar kadar, reçetedeki **tüm** operasyonel_ym kalemleri **tüketilir** (`cikis`/`montaj`) | 1 B üretimi = 1 montaj = 1 A + 1 B tüketimi |
| Mamul kredisi | `montaj=1` operasyonun `uretilen_miktar`'ı kadar mamul stoğu artar (`giris`/`montaj`) | Montaj eşzamanlı olduğu için baskı adedi = montaj adedi |
| Net etki | Montajlı parça: `+üretim −montaj = 0` (stok tutmaz). Diğer parça: `−montaj` (tampondan düşer) | Kullanıcının senaryosuyla birebir: *"Diğer parçada (B) stok tutulmaz, üretildiği anda montaja gider"* |
| Tampon stok | **Hesaplanmaz, türetilir.** Erken başlayan makinenin girişi − montaj çıkışı | Kullanıcı: *"otomatik hesaplanmalıdır"*; sabit sayı yok |
| Montaj > mevcut parça stoğu | Montaj `min(operasyon üretimi, en kısıtlı parça stoğu)` ile sınırlanır; fark `log.warn` | Savunmacı sınır — parça stoğu negatife **düşemez** |

**Doğrulama — `UE-2026-0098` (41 LT BASIC SİYAH) bu kurallarla:**

```
OP2 (Alt Gövde, montaj=0) üretim 3668 → Alt stok +3668
OP1 (Üst Gövde, montaj=1) üretim 3652 → Üst stok +3652
                                       → montaj 3652: Alt −3652, Üst −3652, Mamul +3652
────────────────────────────────────────────────────────────────
Alt Gövde : 3668 − 3652 = 16   (tampon — erken başlayan makinenin fazlası)
Üst Gövde : 3652 − 3652 = 0    (stok tutmaz, anında montaja gider)
Mamul     : 3652               (satılabilir takım)
```

Bugünkü sonuç: Alt −3093, Üst −3093, tampon görünmüyor. Yeni model kullanıcının tablosuyla uyuşuyor.

**Kritik engel — şema eksiği:** "Hangi operasyon hangi parçayı üretiyor" bilgisi **şemada yok**.
`urun_operasyonlari` (`urunler/schema.ts:90-102`) yalnızca `operasyon_adi`, `kalip_id`, `montaj`
tutuyor. Kullanıcının kendi ifadesiyle: *"Biz bir adımı atlamışız ve operasyon adı ile üretilen
parçanın adını eşitlemişiz."* Sıra numarasıyla eşleştirme kırılgandır, **yapılmayacak**.

Kullanıcı iki seçenek sundu (elle tanımlama / isimden çıkarma) ve *"hangisi daha sağlıklı ve
sorunsuz olacaksa"* diyerek kararı bıraktı. **İkisi birleştirildi** — çünkü isimden runtime'da
çıkarmak deterministik değildir (isim değişince bağ sessizce kopar):

| Konu | Karar | Gerekçe |
|---|---|---|
| Şema | `urun_operasyonlari.uretilen_urun_id` char(36) NULL + `uretim_emri_operasyonlari.uretilen_urun_id` (emir anı snapshot) | Bağ **veriye yazılır**, her çalışmada string eşleşmesiyle yeniden tahmin edilmez |
| Migration | Seed `214_operasyon_uretilen_urun.sql`, 209/213 idempotent kalıbı | `ALTER` doğrudan çalıştırılmaz |
| Backfill | **Yapılacak** — yalnız **TAM** isim eşleşmesinde (`TRIM(ad) = TRIM(operasyon_adi)`), yalnız aktif reçetenin operasyonel_ym kalemleri arasında | Ölçüldü: 280 op → **240 tam eşleşme, 0 çoklu eşleşme**. Belirsizlik yok |
| Eşleşmeyen 40 op | NULL kalır → admin UI'dan doldurulur | Tahmin yürütmek yerine boş bırakmak güvenli |
| NULL davranışı | Parça stoğu yazılmaz **ve** reçeteden de düşülmez (`skipOperasyonelYm`) + `log.warn` | Bugünkü negatif-stok üretme davranışı **tekrarlanmaz**; eksik veri sessiz veri bozulmasına yol açmaz |
| UI | Ürün operasyon formunda "Üretilen yarımamul" seçimi; seçenekler ürünün aktif reçetesindeki operasyonel_ym kalemleri | Kullanıcının tarif ettiği tablo yapısı (Operasyon / Üretilen Aramamul / Kalıp) |

### R1 görevleri

- [ ] Seed `214_operasyon_uretilen_urun.sql` — iki tabloya `uretilen_urun_id`, idempotent, index + **TAM isim eşleşmesiyle backfill**
- [ ] Drizzle şemaları güncellendi (`urunler/schema.ts`, `uretim_emirleri/schema.ts`)
- [ ] Emir oluşturulurken `urun_operasyonlari.uretilen_urun_id` → `uretim_emri_operasyonlari`'na kopyalanıyor (`autoPopulateOperasyonlar`)
- [ ] `isInlineModel(...)` ayrım fonksiyonu yazıldı; `repoUretimBitir` + `recordIncrementalProductionEntry` bu modeli tanıyor
- [ ] **Her** operasyon üretimi → `uretilen_urun_id` stoğuna `giris`/`uretim` (NULL ise no-op + `log.warn`)
- [ ] `montaj=1` operasyon → reçetedeki operasyonel_ym kalemlerini `cikis`/`montaj` ile tüketir, mamulü kreditler
- [ ] Montaj miktarı `min(operasyon üretimi, en kısıtlı parça stoğu)` ile sınırlı — parça stoğu negatife düşemez
- [ ] `consumeRecipeMaterials` inline modelde `skipOperasyonelYm: true` (çift düşme yok)
- [ ] Ürün operasyon formunda "Üretilen yarımamul" seçimi (UI) — eşleşmeyen 40 op buradan doldurulacak
- [ ] Test: `UE-2026-0098` senaryosu → Alt 16 (tampon), Üst 0, Mamul 3652
- [ ] Test: `uretilen_urun_id` NULL iken hiçbir stok hareketi oluşmuyor (negatif stok imkansız)
- [ ] **Regresyon:** Megane ve Tuna modelleri davranış değiştirmiyor

---

# 🔴 R2 — Vardiya analizi üretimi 2 kat sayıyor

Müşterinin "vardiya analizinde sorunlar var" dediği kalem. R1'den **bağımsız** bir hata.

## Kanıt (canlı)

Vardiya analizi üretim adedini yalnız `operator_gunluk_kayitlari`'ndan okuyor
(`vardiya_analizi/repository.ts:24`). Montaj kaydı da normal üretim kaydı gibi toplanıyor:

```
montaj operasyonu = 0 : 222 kayıt, net 95.928
montaj operasyonu = 1 : 189 kayıt, net 91.501
```

Örnek tek üründe:

| Ürün | montaj=0 | montaj=1 | Analizde görünen | Gerçek |
|---|---|---|---|---|
| 41 LT BASIC SİYAH | 3668 | 3652 | **7320** | ~3652 takım |
| CLIO UYUMLU OTO PASPAS | 7030 | 6990 | **14020** | ~6990 takım |

## Mekanizma

`reduceOzet` (`vardiya_analizi/core.ts:287-349`) montaj kaydını **önce genel `net`'e ekliyor**
(`core.ts:301`), **sonra ayrıca** `montajNet`'e yazıyor (`core.ts:317`). `ozet.toplamUretim` =
`ozet.net` (`service.ts:739,755`) olduğu için montaj ikinci kez sayılıyor.

Montaj yalnız üç yerde dışlanmış: OEE/verimlilik (`service.ts:717-722`), kalıp rollup
(`service.ts:822`), kayıt bazlı verimlilik (`service.ts:872`). Makine rollup'ta
`toplamUretim = prod.net` **montajı içeriyor** ama `hedefGerceklesmeYuzde` `baskiNet` kullanıyor —
aynı satırda iki farklı taban, **tutarsız** (`service.ts:791` vs `:803`).

Ek olarak: modül `taraf` / `mamul_urun_id` alanlarını **hiç kullanmıyor** (grep: sıfır eşleşme).
Megane modelinde Sağ 100 + Sol 100 → `toplamUretim = 200`; "takım" diye normalize eden mantık yok.
Bunu test de sabitlemiş: `makine_bazli_baski.integration.test.ts:202` → `toBe(30)` (12+18).

Frontend bu değeri **"Baskı Adedi"** ve **"Net Üretim"** olarak etiketliyor
(`vardiya-analizi-client.tsx:414-429`, `:734`) — montaj makinesi satırında "Baskı Adedi" aslında
montaj adedi gösteriyor.

## VERİLMİŞ KARAR — R2

> **DÜZELTME:** İlk kararım "toplam montaj hariç olsun" idi — **yanlış**. Kullanıcı: *"Vardiya
> analizinde net rakam baskı adedini göstermeli, bitmiş ürünü değil. Buradaki amacımız hangi
> vardiyada hangi parçadan kaç adet üretildiğini ve buna bağlı üretim istatistiklerini,
> verimliliği, duruşları görmek."* `montaj=1` olan operasyon **da baskı yapıyor** (R1'e bakınız),
> dolayısıyla üretimi toplamdan çıkarılamaz. Gerçek hata başka yerde.

| Konu | Karar | Gerekçe |
|---|---|---|
| `ozet.toplamUretim` | **Değişmiyor** — tüm baskı adedi (bugünkü 7.320 doğru) | Kullanıcı baskı adedi istiyor; `41 LT BASIC` için 3668+3652 gerçekten basılan parça sayısı |
| **Asıl hata** | `montaj=1` operasyonun üretimi `baskiNet`'e **girmiyor** (`core.ts:317` yalnız `montajNet`'e yazıyor) → OEE/verimlilik/hedef yüzdesi o makineyi **sıfır üretim** sayıyor | O operasyon fiziksel olarak kalıpla baskı yapıyor; verimliliği hesaplanmalı |
| Düzeltme | Kalıbı olan (`kalip_id IS NOT NULL`) montaj operasyonu **hem** `baskiNet`'e **hem** `montajNet`'e yazılır | Baskı = üretim istatistiği, montaj = ayrı bilgi etiketi. İkisi farklı sorular |
| Kalıpsız montaj (10 op) | Yalnız `montajNet` — bugünkü davranış | Gerçek montaj, baskı yapmıyor, verimlilik tabanına girmemeli |
| Kalıp rollup | Kalıbı olan montaj operasyonu artık kalıp kırılımına **dahil** (`service.ts:822` guard'ı gevşetilir) | Kalıp kullanıyorsa kalıp performansına sayılmalı |
| Ürün kırılımı | Parça adı + ait olduğu ürün gösterimi **korunur** | Kullanıcı: *"bu yapı korunabilir, zararı yok"* |
| Testler | `core.test.ts:125,184` mevcut davranışı sabitliyor → **güncellenecek** | Test doğruyu korumalı |

### R2 görevleri

- [ ] `reduceOzet` kayıtlara `kalipId` bilgisini taşıyor (bugün `montaj` bayrağı var, kalıp yok)
- [ ] Kalıbı olan montaj operasyonu `baskiNet`'e de ekleniyor (`core.ts:317` çevresi)
- [ ] Kalıp rollup guard'ı `if (kayit.montaj || !kayit.kalipId)` → `if (!kayit.kalipId)` (`service.ts:822`)
- [ ] `core.test.ts:125,184` yeni davranışa göre güncellendi
- [ ] `makine_bazli_baski.integration.test.ts`'e kalıplı-montaj senaryosu eklendi
- [ ] Frontend "Montaj üretimi: X (net üretime dahil, verimlilik hesabına dahil değil)" uyarısı düzeltildi — artık kalıplı montaj verimliliğe dahil

---

# 🟠 R3 — Canlı negatif stokların düzeltilmesi

R1 kodu düzeltir ama **geçmiş veri kendiliğinden düzelmez**. Bugünkü negatifler kalır.

## VERİLMİŞ KARAR — R3

| Konu | Karar | Gerekçe |
|---|---|---|
| Yöntem | `stoklar/repoAdjustStock` (`hareket_tipi='duzeltme'`, `referans_tipi='stok_duzeltme'`) üzerinden, **kod yoluyla** | Doğrudan `UPDATE urunler SET stok` yasak — hareket izi kalmaz |
| Hedef değer | Inline parçalar için **0** (müşteri: "süreç sonunda her iki parçanın da stoku sıfır olur") | Geçmiş üretim zaten mamul olarak sevk edilmiş |
| Kapsam | Yalnız R1'deki inline modele ait operasyonel_ym parçaları | Diğer negatifler (`yarimamul` 21 ürün) **ayrı bir kök nedene** ait olabilir — önce araştırılacak, körlemesine sıfırlanmayacak |
| Zamanlama | R1 canlıya alındıktan **sonra** | Önce düzeltilirse yeni üretimlerle tekrar eksiye düşer |
| Yedek | Düzeltme öncesi `mysqldump` zorunlu | V19'da alınan `backups/promats_erp_pre_v19_*.sql` deseni |

### R3 görevleri

- [ ] R1 canlıda doğrulandıktan sonra çalıştırılacak düzeltme scripti yazıldı (`scripts/`, kod yolu üzerinden)
- [ ] `yarimamul` kategorisindeki 21 negatif ürünün kök nedeni ayrıca araştırıldı (aynı sebep mi, farklı mı — tabloya işlenecek)
- [ ] Düzeltme öncesi yedek alındı, sonrası doğrulandı (negatif kalmadı, hareket izi mevcut)

---

# 🟡 R4 — `hareketler` miktar işareti tutarsız

Müşterinin "hareketler ekranında sorunlar var" dediği kalem.

Aynı tabloya üç farklı işaret kuralıyla yazılıyor:

| Yer | İşaret |
|---|---|
| `operator/repository.ts` (511, 786, 830, 1777), `uretim_emirleri/service.ts` (387, 404, 420) | **mutlak değer** (`abs`) |
| `sevkiyat/repository.ts:645`, `hammadde_service.ts:287` | **negatif** |
| `hareketler/repository.ts:180-186` (manuel API) | **signed** (kullanıcı ne verirse) |

Yön bilgisi `hareket_tipi` (`giris`/`cikis`) kolonunda da var. Aynı yönü iki farklı yerde
kodlamak, `SUM(miktar)` alan her rapora tuzak kuruyor.

## VERİLMİŞ KARAR — R4 (uygulandı)

> **Düzeltme:** İlk kararım "miktar daima pozitif, yön yalnız hareket_tipi'nde" idi. Ama
> `repoAdjustStock` `hareket_tipi='duzeltme'` yazıyor ve yönü **miktar işaretinde** taşıyor
> (pozitif=artış, negatif=azalış). Tek `duzeltme` tipi var, +/- ayrımı yapmıyor. Kural bu yüzden
> **yalnız `giris`/`cikis` için** geçerli; `duzeltme` işaretini korur.

| Konu | Karar | Gerekçe |
|---|---|---|
| Kural | `giris`/`cikis`'te `miktar` daima pozitif; yön `hareket_tipi`'nde | Aynı yönü iki yerde kodlamak SUM tuzağı kurar |
| `duzeltme` | İşaret **korunur** (yön oradan geliyor) | Tek `duzeltme` tipi +/- ayrımı yapmıyor; pozitife zorlarsak azalış/artış ayrımı kaybolur |
| Kod | `sevkiyat/repository.ts` cikis'i pozitif; `hareketler/repoCreate` giris/cikis pozitif, duzeltme korunur | — |
| Ölü kod | `hammadde_service` `stokDus`/`stokGeriAl` **silindi** (çağıranı yorum satırıydı) | — |
| Geçmiş veri | Seed 215: yalnız `cikis` + `miktar<0` → `ABS`. `duzeltme`'ye dokunmaz | Canlıda 135 cikis satırı (uretim_emri 74 + sevkiyat 61); 48 duzeltme korunur |
| Güvenlik | `SUM(hareketler.miktar)` yapan tek gerçek rapor (`satis_siparisleri:297`) `giris` filtreli — cikis'e bakmaz; çıkış raporları zaten `ABS()` | İşaret düzeltmesi hiçbir raporu değiştirmez |

### R4 görevleri

- [x] `sevkiyat/repository.ts` cikis pozitif yazıyor
- [x] `hareketler/repoCreate` giris/cikis pozitif, duzeltme işaret korur; stok deltası ayrı signed
- [x] Geçmiş için seed 215 (`cikis` + `miktar<0` → `ABS`, idempotent)
- [x] `stokDus`/`stokGeriAl` ölü kodu silindi
- [x] `SUM(miktar)` raporları incelendi — `satis_siparisleri:297` giris filtreli, güvenli

---

---

# 🟠 R5 — Üretim erken bitirilince elde kalan yarımamuller (yeni gereksinim)

Kullanıcının kendi cümlesi:

> Bazı istisnai durumlarda elimizdeki tampon stok bitmeden üretimin kullanıcı tarafından bitirildiği
> olur. Benim verdiğim 1000 adetlik üretim tamamlanmadan, örneğin 700 takım bitmiş ürün
> tamamlandığında bitirilseydi, elimizde 300 adet yarımamul kalacaktı. Bu durumda stoktaki
> yarımamulleri görmek gerekir. Fakat gene kural, üretim bittiğinde o üretime ait iki operasyonel
> yarımamulin de bitmiş olmasıdır.
>
> Her üretim bittiğinde (operatör "üretimi bitir" butonuna bastığında) sistem admine operasyonel
> yarımamullerden elde kalan sayıları göstersin ve bunları sıfırlamak isteyip istemediğini sorsun.
> Admin sıfırlama talimatı verirse bunların stok miktarında düzeltme yapılarak sıfırlansın. Fakat bu
> durum diğer yarımamuller için değil, **sadece operasyonel yarımamuller** için geçerli.

## VERİLMİŞ KARAR — R5

| Konu | Karar | Gerekçe |
|---|---|---|
| Tetikleyici | Emir `tamamlandi` olduğunda (operatör "bitir") | Kullanıcının tarifi |
| Kim görür | **Admin**, operatör değil | Kullanıcı açıkça "admine göstersin" dedi; operatör ekranı sade kalmalı |
| Sunum | Otomatik sıfırlama **yok**. Emir tamamlandığında kalan operasyonel_ym miktarları listelenir, admin tek tek/toplu onaylar | Kullanıcı "sormalı" dedi; sessiz stok değişimi güven kırar |
| Kapsam | Yalnız `kategori='operasyonel_ym'` **ve** o emrin reçetesinde geçen parçalar | Kullanıcı: *"diğer yarımamuller için değil"* |
| Uygulama | Sıfırlama `repoAdjustStock` üzerinden (`hareket_tipi='duzeltme'`) | Hareket izi kalsın, doğrudan `UPDATE` yok |
| Nerede | Üretim emri detay ekranında uyarı kartı + toplu "Sıfırla" aksiyonu | Admin zaten emri orada inceliyor |

### R5 görevleri

- [x] Emir tamamlandığında kalan operasyonel_ym miktarlarını dönen endpoint (`GET :id/kalan-yarimamuller`)
- [x] Üretim emri detayında "Elde kalan yarımamuller" kartı + seçmeli sıfırlama
- [x] Sıfırlama hareket iziyle (`hareket_tipi=duzeltme`, `referans_id=emir`), yalnız o emrin reçetesindeki operasyonel_ym'e izinli
- [ ] Test: 700/1000 senaryosu (DB entegrasyon testi — yerel DB erişimi yok, canlı doğrulamaya bırakıldı)

---

## Sıralama ve kapanış

1. **R2** (vardiya analizi) — en ucuz, en görünür; şema değişikliği gerektirmiyor, tek başına deploy edilebilir
2. **R1** (inline model) — asıl iş; şema + seed + stok akışı + UI
3. **R3** (canlı veri düzeltmesi) — R1 canlıda doğrulandıktan **sonra**
4. **R4** (hareket işareti) — bağımsız, istenirse R2 ile birlikte

**Kapsam uyarısı:** R1 stok akışının çekirdeğine dokunuyor ve Megane/Tuna modellerini **bozmamalı**.
Her iki model için de regresyon testi yazılmadan canlıya alınmaz. V19'da `durus_kayitlari` örneğinde
görüldüğü gibi, birim testleri geçse de `tsc --noEmit` + gerçek akış doğrulaması yapılmadan
"tamamlandı" denmez.

**Kapsam dışı (bilinçli):** Megane modelinde vardiya analizi toplamının "takım"a normalize edilmesi
(R2 kararına bakınız), üretim planlamada tampon stok/erken başlama süresinin **önceden hesaplanması**
(müşteri bunu istemiyor — "otomatik hesaplanmalıdır" derken çalışma anındaki stok akışını kastediyor).

---

## V19'dan devreden açık notlar (kod tarafı bitti, müşteri onayı bekliyor)

| Not | Konu | Durum |
|---|---|---|
| `10caa4b3` | Makineden çıkarma hatası | V19/R1 — kod canlıda, müşteri doğrulaması bekliyor |
| `83d7e393` + `fd541ef6` | Vardiya çifti / Vardiya analizi | V19/R2 — kod canlıda, müşteri doğrulaması bekliyor |
| `fe149b76` | Günlük Üretim Girişi (vardiya seçimi) | V19/R3 — kod canlıda, müşteri doğrulaması bekliyor |
| `3536f365` | Üretim emirleri düzeltme ekranı | V19/R4 — kod hazır (`988d33e`), **canlıya alınmadı**, müşteri doğrulaması bekliyor |

> **Codex için:** implementasyon başlamadan önce bu dosya okunur; her R bloğundaki VERİLMİŞ KARAR
> tablosu bağlayıcıdır. `AGENTS.md` kuralları geçerli. **R1 şema değişikliği gerektiriyor** —
> `ALTER` doğrudan çalıştırılmaz, `214_*.sql` seed dosyası 209/213 kalıbıyla yazılır ve
> `CREATE TABLE` tanımları da güncellenir.
