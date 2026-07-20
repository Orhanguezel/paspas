# Yazılımcı Notu V20 — 🔴 Inline (çift taraflı) üretim: parçalar tüketiliyor ama hiç üretilmiyor

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
| Model adı | **Inline modeli** (Megane/Tuna'nın yanına üçüncü model) | Müşterinin kendi terimi |
| Tanıma kuralı | `urun_id.kategori = 'urun'` **AND** op sayısı > 1 **AND** montaj operasyonu var **AND** reçetede `operasyonel_ym` kalemi var | Megane (`urun_id`=operasyonel_ym) ve Tuna (montaj yok) ile çakışmaz |
| Parça üretimi | Montaj **olmayan** her operasyonun `uretilen_miktar`'ı, o operasyonun ürettiği operasyonel_ym parçasının stoğunu **artırır** (`giris`/`uretim`) | Müşteri tampon stoğu görmek istiyor; stok 0'da tutulursa "300 adet tampon" görünmez |
| Parça tüketimi | Montaj operasyonu, reçetedeki operasyonel_ym kalemlerini montaj adedi kadar **tüketir** (`cikis`/`montaj`) | Müşterinin akışı: montaj A+B'yi tüketip bitmiş ürün üretir |
| Mamul kredisi | Montaj operasyonunun `uretilen_miktar`'ı kadar mamul stoğu artar | Bugünkü davranış korunur |
| Tampon stok | **Hesaplanmaz, türetilir.** Parça girişi − montaj çıkışı farkı doğal olarak tampon stoktur | Müşteri "otomatik hesaplanmalıdır" dedi; sabit sayı yok |

**Kritik engel — şema eksiği:** "Hangi operasyon hangi parçayı üretiyor" bilgisi **şemada yok**.
`urun_operasyonlari` (`urunler/schema.ts:90-102`) yalnızca `operasyon_adi`, `kalip_id`, `montaj`
tutuyor; ürettiği operasyonel_ym ürününe bağ yok. Sıra numarasıyla eşleştirme (`sira=2` → reçetenin
2. operasyonel_ym kalemi) **kırılgandır, yapılmayacak**.

| Konu | Karar |
|---|---|
| Şema | `urun_operasyonlari.uretilen_urun_id` char(36) NULL (operasyonel_ym ürüne FK) + `uretim_emri_operasyonlari.uretilen_urun_id` (emir anındaki snapshot) |
| Migration | Seed dosyası `214_operasyon_uretilen_urun.sql`, **209/213 ile aynı idempotent kalıp** (INFORMATION_SCHEMA kontrolü). `ALTER` doğrudan çalıştırılmaz |
| Backfill | Otomatik backfill **yapılmayacak** — hangi operasyonun hangi parçayı ürettiği veriden güvenle çıkarılamaz. Kolon NULL kalır; NULL ise parça stoğu yazılmaz (bugünkü davranış), uyarı loglanır |
| UI | Ürün operasyon formuna "Bu operasyon hangi parçayı üretir?" seçimi (yalnız montaj=0 operasyonlarda, seçenekler ürünün reçetesindeki operasyonel_ym kalemleri) |

### R1 görevleri

- [ ] Seed `214_operasyon_uretilen_urun.sql` — iki tabloya `uretilen_urun_id`, idempotent, index dahil
- [ ] Drizzle şemaları güncellendi (`urunler/schema.ts`, `uretim_emirleri/schema.ts`)
- [ ] Emir oluşturulurken `urun_operasyonlari.uretilen_urun_id` → `uretim_emri_operasyonlari`'na kopyalanıyor (`autoPopulateOperasyonlar`)
- [ ] `isInlineModel(...)` ayrım fonksiyonu yazıldı ve `repoUretimBitir` + `recordIncrementalProductionEntry` bu modeli tanıyor
- [ ] Montaj olmayan operasyon üretimi → `uretilen_urun_id` stoğuna `giris`/`uretim` (NULL ise no-op + `log.warn`)
- [ ] Montaj operasyonu → operasyonel_ym kalemlerini `cikis`/`montaj` ile tüketiyor, mamulü kreditliyor
- [ ] `consumeRecipeMaterials` inline modelde `skipOperasyonelYm: true` ile çağrılıyor (çift düşme yok)
- [ ] Ürün operasyon formunda parça seçimi (UI)
- [ ] Test: inline emir → parça girişi + montaj tüketimi + mamul kredisi; süreç sonunda parça stoğu **0**
- [ ] Test: `uretilen_urun_id` NULL iken hiçbir stok hareketi oluşmuyor (regresyon güvenliği)

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

| Konu | Karar | Gerekçe |
|---|---|---|
| `ozet.toplamUretim` | Montaj **hariç** (`baskiNet`) | Müşteri "kaç parça bastık" bilmek istiyor; montaj ayrı satırda zaten var |
| Montaj görünürlüğü | `ozet.montajUretim` ayrı alan olarak kalır (bugün var) | Bilgi kaybı olmasın |
| Makine rollup | `toplamUretim` da `baskiNet`'e çevrilir | `hedefGerceklesmeYuzde` zaten `baskiNet` — aynı tabana gelsin |
| Çift taraf (Megane) | **Bu çeklistte normalize edilmeyecek** | Makine bazlı kırılımda parça sayısı **doğru olan**; "takım" sayısı montaj satırından okunur. Toplamı takıma çevirmek makine kırılımını bozar |
| Frontend etiket | Montaj dahil olmayan kolonlar "Baskı Adedi" kalır; toplam kartı "Net Üretim (montaj hariç)" | Etiket ile içerik uyuşsun |
| Testler | `core.test.ts:125` ve `:184` mevcut yanlış davranışı sabitliyor → **güncellenecek** | Test doğruyu korumalı |

### R2 görevleri

- [ ] `reduceOzet` montaj netini genel `net`'e eklemiyor (`core.ts:301`)
- [ ] `MakineRollup.toplamUretim` `baskiNet` tabanına çevrildi (`service.ts:791`)
- [ ] `core.test.ts:125,184` yeni davranışa göre güncellendi
- [ ] `makine_bazli_baski.integration.test.ts`'e **montajlı** senaryo eklendi (üçüncü sayım regresyonu)
- [ ] Frontend toplam kartı "Net Üretim (montaj hariç)" olarak etiketlendi
- [ ] Export (`lib/erp/vardiya-analizi-export.ts`) aynı tabanı kullanıyor

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

## VERİLMİŞ KARAR — R4

| Konu | Karar |
|---|---|
| Kural | `miktar` **daima pozitif** (mutlak değer); yön **yalnız** `hareket_tipi` ile taşınır |
| Aykırılar | `sevkiyat/repository.ts:645` ve `hammadde_service.ts:287` pozitife çevrilir |
| Manuel API | `hareketler/repository.ts` girdiyi `Math.abs` ile normalize eder, `hareket_tipi` zorunlu |
| Geçmiş veri | Negatif yazılmış satırlar tek seferlik düzeltme seed'i ile pozitife çevrilir (`hareket_tipi` korunur) |
| Ölü kod | `hammadde_service.ts` `stokDus`/`stokGeriAl` — **çağıranı yok**, silinir |

### R4 görevleri

- [ ] `sevkiyat/repository.ts:645` + `hammadde_service.ts:287` pozitif yazacak şekilde düzeltildi
- [ ] `hareketler/repoCreate` `Math.abs` normalizasyonu + `hareket_tipi` zorunluluğu
- [ ] Geçmiş negatif `miktar` satırları için düzeltme seed'i
- [ ] `stokDus`/`stokGeriAl` ölü kodu silindi
- [ ] `SUM(miktar)` kullanan raporlar gözden geçirildi (`satis_siparisleri/repository.ts:289-307,588`)

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
