# Yazılımcı Notu V17 — 🔴 Vardiya penceresi: kayıt anı ≠ vardiya aidiyeti

> **İnceleme:** 2026-07-09 — Claude canlı DB + canlı `dist` fonksiyon testi + admin ekran görüntüsü.
> **Bu not V16'nın devamıdır.** V16 kapanışında "ikincil, acil değil" dediğim bulgu, asıl kusurun kendisiymiş. Kabulüm hatalıydı; düzeltiyorum.
> **Admin semptomları:** (1) "Bu vardiyada net üretim bulunmuyor demiş. Bence böyle bir şey mümkün değil. Tüm vardiyalarda üretim girişi yapılıyor." (2) "Filtreden 7 gün seçtim, bu sefer hiç üretim göstermedi."

---

## 🔑 Yeni ve belirleyici olgu: üretim, vardiya DEVRİNDE giriliyor

Canlı veri (net > 0 olan tüm kayıtlar, 07.07–09.07):

| Makine | Giriş (TR) | Net | Bağlı vardiya |
|---|---|---|---|
| Enjeksiyon 1 | 07.07 **07:37** | 465 | gece 06.07 |
| Enjeksiyon 1 | 07.07 **19:34** | 485 | gunduz 07.07 |
| Enjeksiyon 1 | 08.07 **07:58** | 485 | gece 07.07 |
| Enjeksiyon 1 | 09.07 **08:53** | 490 | gece 08.07 |
| Enjeksiyon 1 | 09.07 **19:33** | 485 | gunduz 09.07 |
| Enjeksiyon 2 | 07.07 **19:26** | 515 | gunduz 07.07 |
| Enjeksiyon 2 | 08.07 **19:28** | 252 | gunduz 08.07 |
| Enjeksiyon 2 | 09.07 **08:50** | 273+535 | gece 08.07 |
| Enjeksiyon 2 | 09.07 **19:26** | 528 | gunduz 09.07 |

**İstisnasız her giriş, vardiya devir saatinde** (~07:37–08:53 veya ~19:26–19:34 TR). Operatör vardiya boyunca üretir, **çıkarken** toplamı girer. Yani:

> `kayit_tarihi` = üretimin **yazıldığı** an. Vardiya = üretimin **yapıldığı** aralık. Bunlar farklı eksenlerdir ve gece vardiyası için **ayrı takvim günlerine** düşer.

## 🔴 Kök neden 1: Pencere `kayit_tarihi`'ne göre süzülüyor, slota göre değil

`fetchUretimKayitlari(pencere)` → `WHERE kayit_tarihi BETWEEN ...`. Kartlar ise vardiya **aralığına** göre üretiliyor. İki farklı eksen → kart pencereye girer, o kartın kaydı girmez.

**Canlı kanıt (deploy edilmiş `dist`, satırsız kart sayımı):**

| Filtre | Kart | Kayıt | Satırsız kart |
|---|---|---|---|
| Gün 08.07 | 3 | 2 | **1** → `gece 07-08` |
| Vardiya çifti (gunduz-gece 08-09) | 3 | 2 | **1** → `gece 07-08` |
| Vardiya çifti (gece-gunduz 07-08) | 3 | 2 | **1** → `gunduz 07-07` |
| Hafta 03-09 | 12 | 18 | **3** |

08.07 gece vardiyası 08.07 19:30'da başlar; üretimi **09.07 08:50'de** girilir. "Gün = 08.07" penceresi kartı alır, kaydı almaz → **"Bu vardiyada net üretimi olan kayıt bulunmuyor."** Admin'in 1. semptomu birebir bu. Aralık genişledikçe pencerenin sağ ucundaki vardiyaların kayıtları hep dışarıda kalır (2. semptom).

## 🔴 Kök neden 2: Vardiya sınırları duvar-saati olarak saklanıyor

`vardiya_kayitlari.baslangic/bitis` DB'de `07:30:00` / `19:30:00`. Sunucu UTC olduğu için bunlar **UTC anı** olarak okunuyor (gerçekte TR 10:30 / 22:30). Sonuç: aynı payload'da **aynı vardiyanın sınırı iki farklı biçimde** dönüyor:

```
vardiyalar[].baslangic        = 2026-07-08T04:30:00Z   ← gerçek an (TR 07:30) ✅
uretimKayitlari[].vardiyaBaslangic = 2026-07-08T07:30:00Z   ← ham duvar-saati ❌
```

Frontend bu ikisini **ISO dizesini kesip** (`slice(0,10)`) eşleştiriyor. Bu vardiya saatleri için tesadüfen tutuyor. **An olarak** karşılaştıran her tüketici 3 saat yanılıyor — `filterDuruslarForWindow(…, vBaslangic, effectiveBitis)` (`service.ts:687`) duruş penceresini 3 saat kaydırıyor.

## 🟡 Kök neden 3: V16'nın "doğruluk tablosu" operasyonel olarak eksikti

V16'da `19:33 TR → GECE` doğrulandı. **Matematiksel olarak doğru, operasyonel olarak yanlış:** 19:33'teki giriş, 19:30'da **biten gündüz vardiyasının** çıktısıdır. Sabah için simetriği zaten var (hibrit kural: 07:30–09:30 → önceki gece); **akşam için yok.**

Şu an ekranda doğru görünüyor olmasının sebebi, bağın (kök neden 2'deki) duvar-saati sınırlarıyla eşleşmesi. **Yani iki hata birbirini örtüyor.** Sınırları tek başına düzeltirsek akşam girişleri geceye kayar ve gündüz vardiyaları boşalır.

> Bu, "bir türlü stabil olmuyor"un kaynağı: her düzeltme, diğer hatanın maskesini kaldırıyor.

---

## VERİLMİŞ KARARLAR

| # | Karar | Gerekçe |
|---|-------|---------|
| **K1** | **Pencere slot eksenine taşınır.** Önce aralıkla kesişen vardiya **slotları** belirlenir; sonra o slotlara ait **tüm** kayıtlar çekilir — `kayit_tarihi` pencerenin dışında olsa bile. Kayıt çekimi `vardiya_kayit_id IN (slotlar)` **VEYA** (bağsızsa) genişletilmiş zaman penceresi ile yapılır. | Kök neden 1. Kart ile satır aynı ekseni kullanır: **kart varsa satırı da gelir.** |
| **K2** | **Sınırlar gerçek an olarak saklanır.** `vardiya_kayitlari.baslangic/bitis` yazılırken TR duvar-saati → UTC dönüşümü yapılır (`fromLocal`). Mevcut satırlar tek seferlik `-3 saat` ile düzeltilir (idempotent seed, işaretli). | Kök neden 2. Tek temsil, tek gerçek. Duruş penceresi de düzelir. |
| **K3** | **Simetrik devir kuralı.** Bir vardiyanın bitişinden sonraki `DEVIR_TOLERANS_DK = 120` dakika içindeki giriş, **biten vardiyaya** yazılır. Sabah hibrit kuralı bunun özel hâlidir; ayrı kod olarak kalmaz — tek `assignVardiya` içinde genelleşir. | Kök neden 3. DRY: iki ayrı kural yerine tek kural. |
| **K4** | **K2 ve K3 aynı commit'te** deploy edilir. Ayrı ayrı deploy edilirse ekran arada bozulur (iki hata birbirini örtüyor). | Yukarıdaki "maske" etkisi. |
| **K5** | Bağ (`vardiya_kayit_id`) önceliği **korunur** (V16-K4). Ama bağ artık düzeltilmiş sınırlara sahip slota işaret eder. Backfill K2 sonrası **yeniden** çalıştırılır (`209` idempotent olduğu için yeni seed `210` ile). | Bağ doğru, referansı yanlıştı. |
| **K6** | Operatör modalindeki vardiya seçiminin **varsayılanı**, devir toleransı içindeyse **biten vardiya** olur; değilse açık vardiya. | Operatörün gerçek niyeti. |
| **K7** | `service.ts` içinde slot sınırı ile gerçek anı karıştıran her karşılaştırma (`filterDuruslarForWindow`, `planlananSureDk`, `clampDate`) tek tip — **gerçek an** — üzerinden yapılır. | Tek temsil kuralı. |

### Neden `TZ` env'i hâlâ değiştirilmiyor
V16-K2 geçerli: mysql2 DATETIME'ı yerel TZ ile yazar; `TZ` değişirse eski satırlar UTC, yeniler +03 olur. Çözüm **uygulama katmanında açık dönüşüm**, ortam değişkeni değil.

---

## Yapılacaklar

| # | İş | Sahip |
|---|----|-------|
| A | `core.ts` → `assignVardiya` genelleştirilmiş devir toleransı (K3); sabah hibrit özel-kodu kaldırılır. Testler: `19:33 → gunduz(aynı gün)`, `21:29 → gunduz`, `21:31 → gece`, `07:58 → önceki gece`, `09:29 → önceki gece`, `09:31 → gunduz`, `03:00 → önceki gece` | Codex |
| B | Seed `210_vardiya_sinir_duzeltme.sql` (idempotent, işaretli) → mevcut `vardiya_kayitlari.baslangic/bitis` `-3 saat`; ardından `vardiya_kayit_id` backfill'i K3 kuralıyla **yeniden** | Codex |
| C | `operator/repository.ts` → vardiya penceresi yazımında `fromLocal` (K2); `resolveVardiyaKayitIdForProduction` K6 varsayılanı | Codex |
| D | `vardiya_analizi/repository.ts` → **slot eksenli** kayıt çekimi (K1) | Codex |
| E | `service.ts` → K7: slot sınırı/gerçek an karışımı temizlenir | Codex |
| F | Review + canlı doğrulama + deploy + admin cevabı | Claude |

**Kabul kriterleri (invariant, örnek değil):**
1. **Hiçbir filtrede satırsız kart kalmaz** — kart üretiliyorsa o slotun net>0 kayıtları da payload'da olmalı. Canlıda 4 filtre için `SATIRSIZ KART = 0`.
2. `vardiyalar[].baslangic` ile `uretimKayitlari[].vardiyaBaslangic` **aynı slot için birebir aynı ISO** değeri döner (iki temsil yok).
3. Canlı: Enjeksiyon 2 · gündüz 08.07 → **252**; gece 08.07 → **808**; Enjeksiyon 1 · gündüz 09.07 → **485** (19:33 girişi).
4. Makine neti = Σ kart neti = Σ satır neti (V14 I2 invariantı) **her filtrede**.
5. `TZ=UTC` ve `TZ=Europe/Istanbul` altında testler aynı sonucu verir (V16 kazanımı korunur).
6. Duruş penceresi gerçek anlarla filtrelenir (3 saatlik sapma yok).
7. backend `bun run build` + tüm testler; admin `bunx tsc --noEmit` + `bun run build` temiz.
8. **Push YOK** — Claude review + deploy. K4 gereği B+C tek deploy'da.

## Dokunma
- Sunucu/PM2 `TZ` env'i, MySQL `time_zone` (V16-K2).
- Montaj/stok akışı, Gantt.

---

## Not — süreç dersi

V16'da kabul kriterlerini **kendi kurduğum doğruluk tablosuna** göre doğruladım; tablo operasyonel gerçeği (girişin devirde yapıldığını) içermiyordu. Kriter, veriden türetilmeliydi. V17'de kabul kriterleri **invariant** (satırsız kart = 0, tek temsil) olarak yazıldı; örnek değere değil, yapıya bakıyor.
