# Yazılımcı Notu V18 — 🔴 Üretim emrinde kayıp bağlam: mamul ve taraf saklanmıyor

> **İnceleme:** 2026-07-10 — Claude canlı DB + kod + 6 açık yazılımcı notu + WhatsApp yazışması.
> **Analiz aşaması.** Kod değiştirilmedi, deploy yapılmadı.
> **Vardiya notu (`83d7e393`) → [CEKLIST-V17.md](CEKLIST-V17.md).** Burada tekrar edilmez.
> **Bu bir yama listesi değil.** Altı notun dördü tek bir modelleme eksiğinden türüyor; onu kapatıyoruz.

---

## Açık notlar → kök neden

| Thread | Sayfa | Konu | Kök |
|---|---|---|---|
| `a155bf5c` | uretim-emirleri | Miktar düzeltince "aramamul ekledi" | **R1** + **R2** |
| `69c65161` | is-yukler | Listede yarımamul ismi görünüyor | **R1** |
| `3536f365` | uretim-emirleri | Düzeltme ekranı yeniden tasarlansın | **R1** + **R3** |
| `05912de4` | satis-siparisleri | Kısmen aktarılan kalemin kalanı aktarılamıyor | **R3** |
| `10caa4b3` | uretim-emirleri | Makineden çıkarma hatası | doğrulanmadı |
| `83d7e393` | vardiya-analizi | Vardiya çifti 3 vardiya gösteriyor | V17 |

---

# 🔴 R1 — Çift taraflı üretim emri, bağlamsız iki bağımsız satır olarak modellenmiş

Bir mamulün Sağ ve Sol emirleri, **birbirini ve ait oldukları mamulü bilmeden** yaşıyor. `uretim_emirleri` tablosunda:

- `mamul_urun_id` **yok** — emrin hangi mamul için üretildiği hiçbir yerde yazılı değil
- `taraf` (sağ/sol) **yok** — `rol` yalnızca ürün oluşturma anında geçici olarak var (`urunler/service.ts:17`), hiçbir tabloda saklanmıyor (`urun_operasyonlari`'nda bile yok)
- `urun_id` **bazen mamul bazen YM** (Tuna modeli / Megane modeli — bkz. hafıza `project_cift_tarafli_iki_model`)

## Bu bağlam TÜRETİLEMEZ — kanıtlı

| Türetme yolu | Neden çalışmaz |
|---|---|
| `recete_id` üzerinden | Aktif YM emirlerinin **13/14'ünde `recete_id` NULL** |
| `parti_no` üzerinden | Parti ≠ mamul grubu. `UP-2026-0017` içinde **iki farklı mamulün** (Pars + Vector) dört emri var |
| Ters reçete araması (`urun_id` → hangi reçetelerde geçiyor) | **Çok anlamlı.** `1118 101-R` üç reçetede geçiyor (Pars GMAX, Pars Automix, Vector GMAX) |

**Kesin kanıt:** `UE-2026-0099` ve `UE-2026-0101` **aynı üründen** (`1118 101-R`), **aynı partide**, ama biri Pars siparişine biri Vector'e ait. Hiçbir türetme bunları ayırt edemez.

> Sağ taraflar mamuller arasında **paylaşılıyor** (Vector, Pars'ın sağını kullanıyor; `MAXIMUM SİYAH`, `Max-Pro Sağ`'ı kullanıyor). Bu tasarım gereği — ürün adlarında bile yazıyor. Dolayısıyla `urun_id → mamul` fonksiyonu **matematiksel olarak birebir değil.** Türetmeye çalışmak determinizmi baştan imkânsız kılıyor.

## Sonuç: her ekran bağlamı kendi yöntemiyle uyduruyor

| Tüketici | Mamulü nasıl buluyor | Ne zaman bozuluyor |
|---|---|---|
| `uretim-emirleri` | Sipariş kaleminden (`client:486`) | Sipariş bağı düşünce → **grup ikiye ayrılıyor** (`a155bf5c`) |
| `is-yukler` | Bulmuyor; `emir.urun_id`'yi basıyor (`makine_havuzu/repository.ts:203,298`) | Her zaman → **yarımamul adı görünüyor** (`69c65161`) |
| Montaj | `min(taraflar)` sezgisi | Taraflar asimetrik olunca sessizce eksik üretim |
| Manuel emir | Sipariş yok → mamul hiç yok | Her zaman |

**Bu yüzden yamalar tutmuyor.** Türetilemeyen bir bilgiyi üç yerde ayrı ayrı türetmeye çalışıyoruz. Determinizm ancak **bilgi saklanırsa** mümkün.

## VERİLMİŞ KARAR — R1

| # | Karar | Gerekçe |
|---|---|---|
| **K1** | `uretim_emirleri`'ne **`mamul_urun_id char(36) NOT NULL`** ve **`taraf varchar(8) NULL`** (`sag` \| `sol` \| `parca` \| NULL) eklenir. Tek taraflı emirde `mamul_urun_id = urun_id`, `taraf = NULL`. | Kayıp bilgi geri konur. Tek kaynak. |
| **K2** | **Mamul grubu anahtarı** artık `(parti_no, mamul_urun_id)`. Sipariş bağına **bağımlı değil**. | `a155bf5c`'nin semptomu yapısal olarak imkânsız hale gelir. |
| **K3** | `_shared/mamul.ts` → `mamulGrupKey(emir)`, `groupByMamul(emirler)`: **saf, DB'siz, deterministik**. `uretim-emirleri`, `is-yukler`, `gantt` **aynı fonksiyonu** çağırır. Ekranda daima `Mamul adı` üstte, `taraf` altta. | DRY. `69c65161` kapanır. |
| **K4** | **Invariant (DB + servis):** aynı `(parti_no, mamul_urun_id)` grubundaki tüm emirlerin `planlanan_miktar`'ı **eşittir**. Miktar değişikliği yalnız `updateMamulEmri(grupKey, miktar)` üzerinden yapılır; tek emri tek başına güncelleyen yol **kalmaz**. | Asimetri (2020/2250) yapısal olarak üretilemez. Montaj `min()` sezgisi gereksizleşir. |
| **K5** | Reddedilen alternatif: ayrı `mamul_uretim_emri` üst tablosu. Doğru olurdu ama 14 modülün tamamına dokunurdu ve tek seferde deploy edilemezdi. K1 aynı determinizmi, geriye dönük uyumla verir. Üst tablo istenirse K1'in üstüne sonradan eklenebilir. | Risk/kazanç. |

## Backfill — ölçüldü, %100 kurtarılabilir

| Emir | Bağdan mamul | Ters arama adayı |
|---|---|---|
| 13 aktif YM emri | ✅ sipariş bağından tek anlamlı | — |
| `UE-2026-0100` | ❌ bağ düşmüş (R2) | 2 aday → **çok anlamlı** |

`UE-0100`, aynı partideki ikizinden (`UE-0099` → mamul `1118 101`, `1118 101-L` o reçetede) **tek anlamlı** çözülür.

Backfill sırası: (1) sipariş bağı → (2) aynı parti + aynı reçete ikizi → (3) `urun_id` mamulse kendisi → (4) kalan **NULL bırakılmaz, rapor edilir** ve `NOT NULL` kısıtı ancak rapor boşsa konur.

> **Yan kazanç:** `UE-0101` artık `mamul = Vector (1119 101)`, `urun = Pars Sağ (1118 101-R)`, `taraf = sag` olarak yazılır. Paylaşılan sağ taraf **modelde meşru biçimde ifade edilir**; "yanlış ürün" görüntüsü ortadan kalkar. (İlk incelemede bunu hata sandım, veri örüntüsü kasıtlı olduğunu gösterdi — bkz. aşağıdaki hijyen notu.)

---

# 🔴 R2 — `repoUpdate`: transaction yok, doğrulamadan önce siliyor

Admin'in senaryosu (`Pars Siyah 2020 → 2250`) canlı veride **birebir yeniden üretildi.**

`uretim_emirleri/repository.ts:246-262`:
```ts
async function syncJunctionRows(uretimEmriId, kalemIds, expectedUrunId?) {
  await db.delete(uretimEmriSiparisKalemleri).where(...)   // 1) BAĞ SİLİNDİ (kalıcı)
  if (expectedUrunId) {
    const mismatch = kalemleri.find(k => k.urunId !== expectedUrunId);
    if (mismatch) throw new Error('urun_uyumsuzlugu');      // 2) SONRA HATA
  }
}
```

`repoUpdate:569-590` — `grep -c "db.transaction"` → **0**. Sıra:

1. `planlanan_miktar = 2250` yazıldı → **kalıcı**
2. Sipariş bağı silindi → **kalıcı**
3. Doğrulama: kalem ürünü `1118 101` (mamul) ≠ emir ürünü `1118 101-L` (Sol YM) → **throw**
4. Miktar yayılımı (operasyonlar, hammadde rezervasyonu, kuyruk süreleri) **hiç çalışmadı**

**Canlı kanıt:**

| Emir | Ürün | Emir miktarı | Operasyon miktarı | Sipariş bağı |
|---|---|---|---|---|
| UE-2026-0099 | 1118 101-R | 2020 | 2020 | 1 → SS-2026-0040 |
| UE-2026-0100 | 1118 101-L | **2250** | **2020** ❌ | **0** ❌ |

Sistemde `emir.planlanan_miktar ≠ operasyon.planlanan_miktar` olan **tek** aktif emir bu.

**Admin hiçbir şey eklemedi.** Var olan satır, sipariş bağı düştüğü için gruptan koptu ve kendi YM adıyla yalnız satır olarak çizildi.

**Üçüncü kusur — create/update asimetrisi:** `create` yolunda `skipKalemUrunCheck` kaçış kapısı var (`:553`), `update` yolunda **yok** (`:586`). Yani sıra doğru olsa ve transaction bulunsa **bile**, çift taraflı bir emrin sipariş bağı her düzenlemede koparılırdı. Kural yanlış, kaçış kapısı onu gizliyordu.

## VERİLMİŞ KARAR — R2

| # | Karar |
|---|---|
| **K6** | `repoUpdate` **tek transaction**. Kısmi yazma imkânsız. Testle kanıtlanır (ortadan hata enjekte edilir, hiçbir satır değişmemiş olmalı). |
| **K7** | `syncJunctionRows`: **önce doğrula, sonra sil.** Yıkıcı işlem asla doğrulamadan önce gelmez — proje geneli kural. |
| **K8** | Ürün uyum kuralı `emir.urun_id` yerine **`emir.mamul_urun_id`** üzerinden: sipariş kalemi ürünü, emrin **mamulü** ile eşleşmeli. Böylece kural çift taraflı emirlerde doğal olarak geçer; `skipKalemUrunCheck` **silinir** (kaçış kapısı = kuralın yanlış olduğunun itirafı). |
| **K9** | `UE-2026-0100` **veri onarımı** ayrı ve denetimli: admin'in niyeti 2250 ⇒ grup (0099+0100) 2250'ye çekilir, operasyon miktarları senkronlanır, sipariş bağı geri kurulur, rezervasyon/kuyruk yeniden hesaplanır. Hareket kaydı bırakılır. |

---

# 🟡 R3 — Üretime aktarım kalem bazlı, miktar bazlı değil

`satis_siparisleri/repository.ts:119`:
```ts
uretimeAktarilanKalemSayisi: sql`count(distinct ${uretimEmriSiparisKalemleri.siparis_kalem_id})`
```

Bu bir **boolean**: kalemin herhangi bir emre bağı varsa "aktarıldı". 2000 takımlık kalemden 1000 aktarıldıysa kalan 1000 bir daha seçilemiyor. `05912de4` birebir bu.

Köprü tablosunda **miktar kolonu yok** — hangi emrin o kalemden kaç adet aldığı kayıtlı değil. Emir miktarını kullanmak yanlış: bir emir birden çok kaleme bağlanabiliyor.

## VERİLMİŞ KARAR — R3

| # | Karar |
|---|---|
| **K10** | `uretim_emri_siparis_kalemleri`'ne **`miktar decimal(12,4) NOT NULL`** eklenir. Bu tablo artık "bağ" değil, **tahsis (allocation)** tablosudur. |
| **K11** | `aktarilanMiktar(kalem) = Σ tahsis.miktar` (yalnız `durum NOT IN ('iptal')` emirler). `kalanMiktar = kalem.miktar - aktarilanMiktar`. Kalem `kalanMiktar > 0` olduğu sürece seçilebilir; varsayılan miktar `kalanMiktar`. |
| **K12** | **Invariant:** `Σ tahsis.miktar ≤ kalem.miktar`. Aşan istek 400. DB seviyesinde de `CHECK` yerine servis + test (MySQL sürüm bağımlılığı). |
| **K13** | Backfill: mevcut tahsislere emrin `planlanan_miktar`'ı yazılır (bugün 1 emir ↔ 1 kalem ilişkisi geçerli; taranarak doğrulanır, çoklu bağ varsa rapor edilir). |

---

# 🟠 R4 — "Makineden Çıkar" hatası: KÖK NEDEN DOĞRULANMADI

Admin ekran görüntüsü ekli, **hata metni bende yok.** İki aday:

1. `uretim-emirleri-client.tsx:461` → kuyruk sorgusu `skip: !cikarTarget`. Veri gelmeden onaylanırsa `emirItems.length === 0` → *"Bu emrin kuyrukta atanmış operasyonu bulunamadı."*
2. `:576` → aktif/duraklatılmış operasyon reddi. Admin'in ekranındaki emirler `planlandi` ve %0 → **bu değil.**

**Aksiyon:** thread'e hata metni ve emir no sorulur. **Tahminle düzeltme yapılmaz.**

> V16 dersi: kabul kriterini kendi varsayımından değil veriden türet. O turda "19:33 → GECE" doğrulamasını kendi tablomdan üretip doğru sanmıştım; operasyonel gerçek tersiymiş.

---

# 🟢 R5 — Düzeltme ekranı (`3536f365`) — ÖZELLİK, en sona

Admin'in istediği:
- Düzelt'e basılan emrin **ürün grubu** açılır
- O gruba ait mevcut siparişler listelenir, her satırda **ne kadarı aktarılmış** görünür
- Kullanıcı kalan miktardan istediğini aktarır
- **Manuel üretim ekle** aktif kalır
- Tüm işlemler **bulunulan partide** yapılır; başka partiyi etkilemez, yeni parti açmaz
- Hiç aktarılmamış kalem de mevcut partiye eklenebilir

| # | Karar |
|---|---|
| **K14** | **Sıra zorunlu: R1 → R2 → R3 → R5.** "Ne kadarı aktarılmış" R3'süz gösterilemez; grup R1'siz kararlı değil; R2 olmadan her kaydetme bağı koparır. Bu ekran önce yapılırsa üçünün de hatasını miras alır. |
| **K15** | Ekran, "yeni üretim emri" bileşeninden **türetilir, kopyalanmaz**. Tek fark: `mod: 'olustur' \| 'duzenle'`. (DRY — projenin 1. kuralı.) |
| **K16** | **Invariant:** düzenleme boyunca `parti_no` değişmez, başka partinin emirleri etkilenmez. Testle korunur. |

---

## 📌 Veri hijyeni — kod hatası DEĞİL, admin onayı gerekir

`VECTOR SİYAH - GMAX` reçetesi sağ taraf olarak `1118 101-R` "Pars Siyah Aramamul Sağ" kullanıyor. İlk bakışta hata; **ama değil:**

- Aynı örüntü Vector'ün **üç varyantında da** tutarlı (Siyah/Gri/Bej → hep Pars'ın sağı)
- `MAXIMUM SİYAH` da `Max-Pro Siyah Aramamul Sağ`'ı paylaşıyor — paylaşım ürün **adında** kabul edilmiş
- `1119 101-R` (Vector Sağ) **hiçbir reçetede, hiçbir emirde kullanılmıyor** (0/0). `1119 101-SG`, `1119 101-SL` de öyle

**Değerlendirme:** paylaşım kasıtlı (aynı fiziksel parça); `-R/-SG/-SL` içe aktarımdan kalan ölü kayıtlar. Bu **fiziksel bir soru**, koddan cevaplanamaz.

**Aksiyon:** admin'e sorulur — *"Vector'ün sağ parçası Pars ile aynı kalıptan mı çıkıyor?"* Evetse ölü ürünler pasifleştirilir; hayırsa reçete düzeltilir. **Kendiliğinden dokunulmaz** (V11'de reçete/stok verisine izinsiz müdahalenin maliyeti görüldü).

---

## Yapılacaklar

| # | İş | Sahip | Bağımlılık |
|---|----|-------|---|
| A | Seed `211` (idempotent): `uretim_emirleri.mamul_urun_id`, `taraf`; 4 aşamalı backfill; kalan NULL raporu | Codex | — |
| B | `_shared/mamul.ts` saf çekirdek (`mamulGrupKey`, `groupByMamul`, `taraflar`) + DB'siz unit test | Codex | — |
| C | `repoUpdate` transaction; `syncJunctionRows` doğrula-sonra-sil; K8 kuralı; `skipKalemUrunCheck` sil | Codex | A |
| D | `updateMamulEmri(grupKey, patch)` — miktar yalnız grup bazında; tek-emir miktar yolu kapatılır | Codex | A, C |
| E | Seed `212` (idempotent): `uretim_emri_siparis_kalemleri.miktar` + backfill; miktar bazlı aktarım + guard | Codex | — |
| F | `uretim-emirleri` + `is-yukler` + `gantt` → `_shared/mamul.ts`'e bağlanır; grup anahtarı `(parti, mamul)` | Codex | B |
| G | Düzeltme ekranı (`mod: 'duzenle'`) | Codex | A–F |
| H | `UE-2026-0100` veri onarımı (denetimli, hareket kaydıyla) | Claude | A, C, D |
| I | Makineden çıkar → hata metni sorusu; Vector/Pars → admin sorusu | Claude | — |

**Kabul kriterleri — invariant, örnek değil:**

1. `mamul_urun_id` **NOT NULL**; hiçbir aktif emirde boş değil (backfill raporu boş).
2. Aynı `(parti_no, mamul_urun_id)` grubundaki emirlerin `planlanan_miktar`'ı **daima eşit** — canlı tarama 0 ihlal.
3. Sistemde `emir.planlanan_miktar ≠ operasyon.planlanan_miktar` olan aktif emir **yok**.
4. `repoUpdate`'in **herhangi bir** adımına hata enjekte edildiğinde hiçbir satır değişmez (transaction testi).
5. `Σ tahsis.miktar ≤ kalem.miktar`, her kalem için. Aşırı aktarım 400.
6. Kısmen aktarılmış kalem, kalanı kadar tekrar seçilebilir.
7. `is-yukler` ve `uretim-emirleri` aynı emir için **aynı mamul adını** gösterir (aynı fonksiyondan).
8. Sipariş bağı silinmiş bir emir bile **gruptan kopmaz** (grup anahtarı sipariş bağına bağlı değil) — regresyon testi: `a155bf5c` senaryosu.
9. Düzenleme sonrası `parti_no` değişmez; başka parti etkilenmez.
10. `grep -rn "skipKalemUrunCheck"` → **0**.
11. backend `bun run build` + tüm testler; admin `bunx tsc --noEmit` + `bun run build` temiz.
12. **Push YOK** — Claude review + deploy.

## Dokunma
- Montaj/stok akışı (`tryMontajForUretimEmri`, `repoUretimBitir`), vardiya çekirdeği (V17'de).
- Reçete verisi (admin onayı olmadan).
- Ham `ALTER` (seed 211/212 → `INFORMATION_SCHEMA` guard + `PREPARE`, 205/208/209 deseni).

---

## Neden bu sefer yama değil

Önceki turlarda semptomu düzelttik: grup bozulunca gruplama anahtarını değiştirdik, isim yanlış görününce ismi düzelttik. Her seferinde **türetilemeyen bir bilgiyi türetmeye** çalıştık ve bir sonraki ekranda aynı boşluk yeniden açıldı.

R1 bunu bitiriyor: bilgi **saklanıyor**, tek bir saf fonksiyondan okunuyor, ve K4 ile asimetri **yapısal olarak üretilemez** hale geliyor. Kabul kriterleri örnek değere değil invariant'a bakıyor — yani gelecekteki bir regresyon, ekranı değil **taramayı** düşürür.
