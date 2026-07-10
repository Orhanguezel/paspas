# Yazılımcı Notu V18 — Üretim emirleri: mamul kimliği, kısmi yazma, kalem bazlı aktarım

> **İnceleme:** 2026-07-10 — Claude canlı DB + kod + 6 açık yazılımcı notu + WhatsApp yazışması.
> **Analiz aşaması.** Kod değiştirilmedi, deploy yapılmadı. Kararlar aşağıda; uygulama Codex'e.
> **Not:** Vardiya ile ilgili not (`83d7e393`) [CEKLIST-V17.md](CEKLIST-V17.md) kapsamındadır, burada tekrar edilmez.

---

## Açık notlar

| Thread | Sayfa | Konu | Kök neden |
|---|---|---|---|
| `a155bf5c` | uretim-emirleri | Üretim miktar düzeltme → "aramamul ekledi" | **A** (kısmi yazma) |
| `69c65161` | is-yukler | Listede yarımamul ismi görünüyor | **B** (mamul kimliği) |
| `05912de4` | satis-siparisleri | Kısmen aktarılan kalemin kalanı aktarılamıyor | **C** (kalem bazlı aktarım) |
| `10caa4b3` | uretim-emirleri | Makineden çıkarma hatası | **D** (doğrulanmadı) |
| `3536f365` | uretim-emirleri | Düzeltme ekranı yeniden tasarlansın | **E** (özellik) |
| `83d7e393` | vardiya-analizi | Vardiya çifti 3 vardiya gösteriyor | V17 |

---

## 🔴 A — `syncJunctionRows`: önce siliyor, sonra doğruluyor; transaction yok

Admin'in senaryosu (`UE-2026-0099/0100`, Pars Siyah 2020 → 2250) **canlı veride birebir yeniden üretildi.**

`repository.ts:246-262` + `repoUpdate:569-590`:

```ts
async function syncJunctionRows(uretimEmriId, kalemIds, expectedUrunId?) {
  await db.delete(uretimEmriSiparisKalemleri).where(...)   // 1) BAĞ SİLİNDİ
  if (expectedUrunId) {
    const mismatch = kalemleri.find(k => k.urunId !== expectedUrunId);
    if (mismatch) throw new Error('urun_uyumsuzlugu');      // 2) SONRA HATA
  }
  ...
}
```

`repoUpdate` içinde `db.transaction` **yok** (`grep -c db.transaction` → 0) ve sıra şu:

1. `planlanan_miktar = 2250` yazıldı ✅ kalıcı
2. `syncJunctionRows` → sipariş bağı **silindi** ✅ kalıcı
3. Doğrulama: sipariş kalemi ürünü `1118 101` (mamul) ≠ emir ürünü `1118 101-L` (Sol YM) → **throw**
4. Miktar yayılımı (operasyonlar, hammadde rezervasyonu, kuyruk süreleri) **hiç çalışmadı**

**Canlı kanıt:**

| Emir | Ürün | Emir miktarı | Operasyon miktarı | Sipariş bağı |
|---|---|---|---|---|
| UE-2026-0099 | 1118 101-R (Sağ) | 2020 | 2020 | **1** → SS-2026-0040 |
| UE-2026-0100 | 1118 101-L (Sol) | **2250** | **2020** ❌ | **0** ❌ |

Sistemde emir miktarı ile operasyon miktarı uyuşmayan **tek** emir bu (canlı tarama).

**Admin neden "aramamul ekledi" gördü:** liste, çift taraflı emirleri **sipariş kalemi anahtarıyla** grupluyor (`uretim-emirleri-client.tsx:486`). Bağ düşünce grup ikiye ayrıldı: 0099 mamul adıyla (2.020), 0100 yetim satır olarak kendi YM adıyla (2.250). Yeni kayıt eklenmedi — **var olan satır gruptan koptu.**

**Ayrıca create/update asimetrisi:** create yolunda `skipKalemUrunCheck` kaçış kapısı var (`repository.ts:553`), update yolunda **yok** (`:586`). Yani çift taraflı bir emrin sipariş bağı **create'te kurulabiliyor ama update'te asla korunamıyor** — bu kural tek başına, doğru sırayla çalışsa bile her düzenlemede bağı koparırdı.

### Kararlar
| # | Karar |
|---|---|
| **A1** | `repoUpdate` **tek transaction** içine alınır. Herhangi bir adım patlarsa hiçbiri kalıcı olmaz. |
| **A2** | `syncJunctionRows` **önce doğrular, sonra siler.** Yıkıcı işlem asla doğrulamadan önce gelmez. |
| **A3** | Ürün uyum kuralı düzeltilir: sipariş kalemi ürünü, emir ürününün **mamulü** ise geçerlidir (çift taraflı YM emirleri için). Update yolu da create ile aynı kuralı kullanır — tek fonksiyon, iki çağıran. |
| **A4** | Çift taraflı emirlerde miktar düzenlemesi **her iki tarafa** uygulanır. Tek taraf 2250, diğeri 2020 kalamaz (montaj `min()` aldığı için 230 adet Sol boşa üretilirdi). |
| **A5** | **Veri onarımı** (ayrı, denetimli): `UE-2026-0100` → miktar 2020'ye geri alınır **veya** 0099 da 2250'ye çıkarılır (admin'in niyeti: 2250 ⇒ ikisi de 2250), operasyon miktarları senkronlanır, sipariş bağı geri kurulur. Rezervasyon/kuyruk yeniden hesaplanır. |

---

## 🔴 B — Mamul kimliği emirde saklanmıyor, sipariş bağından türetiliyor

`uretim_emirleri.urun_id` **bazen mamul, bazen operasyonel YM.** (Hafıza: `project_cift_tarafli_iki_model` — Megane modeli 2 emir/YM, Tuna modeli 1 emir/mamul.) Emirde "bu hangi mamulün emri" bilgisi **hiçbir yerde yazılı değil.**

Ekranlar bunu farklı şekilde telafi ediyor:
- `uretim-emirleri`: sipariş kalemi üzerinden mamulü çözüyor → **bağ düşerse bozuluyor** (A'nın görünen yüzü).
- `is-yukler` (`makine_havuzu/repository.ts:203,298`): `urunler.ad`'ı doğrudan `emir.urun_id`'den alıyor → çözümleme **hiç yok** → YM adı hem üstte hem altta yazıyor.

Admin'in `69c65161` notundaki "birinci satırda ürün ismi, sonrakilerde yarımamul ismi" farkı da bundan: eski satır Tuna modeli (mamul emri), yeniler Megane modeli (YM emri).

> Admin'in korkusu ("stoklara ürün olarak girmeme ihtimali yüksek") **yersiz** — stok/montaj akışı `urun_id`'yi doğru kullanıyor, sorun yalnızca **gösterimde**. Yine de kök neden gerçek.

### Kararlar
| # | Karar |
|---|---|
| **B1** | Emir seviyesinde **mamul çözümlemesi tek bir yerde** yapılır: `_shared/mamul.ts` → `resolveMamul(emir)`. Sipariş bağına bağımlı olmayan, reçete/ürün ilişkisinden türeyen saf çözümleme. |
| **B2** | `uretim-emirleri`, `is-yukler`, `gantt` bu tek kaynağı kullanır. Ekranda **daima** `Mamul adı` üstte, `taraf/YM adı` altta görünür. |
| **B3** | Gruplama anahtarı sipariş kalemi **değil**, `resolveMamul(emir).id + parti` olur. Bağ düşse bile grup dağılmaz (A'nın semptomu bir daha görünmez). |

---

## 🟡 C — Üretime aktarım kalem bazlı, miktar bazlı değil

`satis_siparisleri/repository.ts:119`:
```ts
uretimeAktarilanKalemSayisi: sql`count(distinct ${uretimEmriSiparisKalemleri.siparis_kalem_id})`
```

Bu bir **boolean**: kalemin herhangi bir üretim emrine bağı varsa "aktarıldı" sayılıyor. 2000 takımlık kalemden 1000 aktarılmışsa kalan 1000 bir daha seçilemiyor. Admin'in `05912de4` notu tam olarak bu ("kısmen aktarılmıştı, geri kalanını aktarmıyor").

### Kararlar
| # | Karar |
|---|---|
| **C1** | Aktarım takibi **miktar bazlı** olur: `aktarilanMiktar = Σ(o kaleme bağlı emirlerin planlanan_miktar'ı)`; `kalanMiktar = kalem.miktar - aktarilanMiktar`. |
| **C2** | Kalem, `kalanMiktar > 0` olduğu sürece seçilebilir; seçildiğinde varsayılan miktar `kalanMiktar`. |
| **C3** | Sipariş durumu (`uretimeAktarilanKalemSayisi > 0` → kısmen aktarıldı) miktar oranına göre yeniden ifade edilir. |
| **C4** | Aşırı aktarım engellenir: `aktarilanMiktar > kalem.miktar` olacak istek 400 döner. |

---

## 🟠 D — "Makineden Çıkar" hatası — kök neden DOĞRULANMADI

Admin ekran görüntüsü ekli, **hata metni bende yok.** İki aday var:

1. `uretim-emirleri-client.tsx:461` → kuyruk sorgusu `skip: !cikarTarget` ile **dialog açılınca** başlıyor. Veri gelmeden onaylanırsa `emirItems.length === 0` → *"Bu emrin kuyrukta atanmış operasyonu bulunamadı."*
2. `:576` → `calisiyor`/`duraklatildi` operasyon varsa reddediliyor: *"Aktif veya duraklatılmış operasyonlar çıkarılamaz."* (Bu **doğru davranış** olabilir; admin'in ekranındaki emirler `planlandi`, %0 — yani bu değil.)

**Aksiyon:** thread'e hata metni + hangi emir olduğu sorulur. Tahminle düzeltme yapılmaz. (V16 dersi: kriteri veriden türet.)

---

## 🟢 E — Düzeltme ekranı yeniden tasarımı (`3536f365`) — ÖZELLİK

Admin'in istediği ekran, C'nin çözülmesine **bağımlı**: sipariş kalemlerinin kalan miktarını göstermek C1 olmadan mümkün değil.

Gereksinimler (admin'in ifadesiyle):
- Düzelt'e basılan emrin **ürün grubu** açılır.
- O gruba ait **mevcut siparişler** listelenir (yeni emir ekranındaki gibi).
- Her sipariş satırında **ne kadarı daha önce aktarılmış** görünür.
- Kullanıcı kalan miktardan istediği kadarını aktarır.
- **Manuel üretim ekle** butonu aktif kalır.
- Tüm işlemler **bulunulan üretim partisinde** değişiklik yapar; başka partiyi etkilemez, yeni parti açmaz.
- Siparişte hiç aktarılmamış bir kalem de mevcut partiye eklenebilir.

### Kararlar
| # | Karar |
|---|---|
| **E1** | **Sıra:** A → B → C → E. E, C'siz yapılamaz; A ve B yapılmadan E üstüne inşa edilirse aynı bağ kopması yeni ekranda tekrarlanır. |
| **E2** | Ekran, mevcut "yeni üretim emri" bileşeninden **türetilir**, kopyalanmaz (DRY). Fark tek bir prop: `mod: 'olustur' \| 'duzenle'`. |
| **E3** | Parti kimliği (`parti_no`) düzenleme boyunca **değişmez** — invariant, testle korunur. |

---

## 📌 Ayrıca: veri hijyeni (kod hatası değil — admin onayı gerekir)

Reçete taramasında `VECTOR SİYAH - GMAX` (`1119 101`) sağ tarafı olarak **`1118 101-R` "Pars Siyah Aramamul Sağ"** kullanıyor. İlk bakışta hata gibi görünüyor, **ama:**
- Aynı örüntü Vector'ün üç varyantında da tutarlı (Siyah/Gri/Bej → hep Pars'ın sağı).
- `MAXIMUM SİYAH` da `Max-Pro Siyah Aramamul Sağ`'ı paylaşıyor; paylaşım isimlendirmede zaten kabul edilmiş.
- `1119 101-R` (Vector Sağ) **hiçbir reçetede ve hiçbir emirde kullanılmıyor** (0/0), `1119 101-SG` / `1119 101-SL` de öyle.

**Değerlendirme:** paylaşım büyük olasılıkla **kasıtlı** (aynı fiziksel parça), `1119 101-R/-SG/-SL` ise ürün içe aktarımından kalan **ölü kayıtlar**. Bu fiziksel bir sorudur, koddan cevaplanamaz.

**Aksiyon:** Admin'e sorulur — *"Vector'ün sağ parçası Pars ile aynı kalıptan mı çıkıyor?"* Evetse ölü ürün kayıtları pasifleştirilir; hayırsa reçete düzeltilir. **Kendiliğinden değiştirilmez** (V11'de reçete/stok verisine izinsiz dokunmanın maliyeti görüldü).

---

## Yapılacaklar

| # | İş | Sahip |
|---|----|-------|
| A | `repoUpdate` transaction; `syncJunctionRows` doğrula-sonra-sil; ürün uyum kuralı mamul üzerinden; çift taraflı miktar simetrisi | Codex |
| B | `_shared/mamul.ts` → `resolveMamul`; uretim-emirleri + is-yukler + gantt tek kaynağa bağlanır; gruplama anahtarı mamul+parti | Codex |
| C | Aktarım takibi miktar bazlı; kalan miktar; aşırı aktarım guard'ı | Codex |
| D | Thread'e hata metni sorusu; cevap gelince ayrı çeklist | Claude |
| E | Düzeltme ekranı (A+B+C sonrası) | Codex |
| — | `UE-2026-0100` veri onarımı (denetimli, hareket kaydıyla) | Claude |
| — | Vector/Pars sağ taraf sorusu | Claude → admin |

**Kabul kriterleri (invariant):**
1. Herhangi bir `repoUpdate` hatasında **hiçbir** kısmi yazma kalmaz (hata enjekte edilen test).
2. Sistemde `emir.planlanan_miktar ≠ operasyon.planlanan_miktar` olan aktif emir **yok**.
3. Çift taraflı emirlerde iki tarafın planlanan miktarı **daima eşit**.
4. Sipariş bağı olan/olmayan hiçbir emir gruptan kopmaz — grup anahtarı sipariş bağına bağlı değil.
5. Kısmen aktarılmış kalem, kalanı kadar tekrar seçilebilir; toplam aktarım kalem miktarını aşamaz.
6. `is-yukler` ve `uretim-emirleri` aynı emir için **aynı mamul adını** gösterir.
7. Düzenleme sonrası `parti_no` değişmez.
8. backend `bun run build` + tüm testler; admin `bunx tsc --noEmit` + `bun run build` temiz.

## Dokunma
- Montaj/stok akışı (`tryMontajForUretimEmri`, `repoUretimBitir`), vardiya çekirdeği (V17'de).
- Reçete verisi (admin onayı olmadan).
