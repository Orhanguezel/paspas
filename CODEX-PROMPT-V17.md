# CODEX-PROMPT V17 — Vardiya penceresi: slot ekseni + gerçek-an sınırlar + simetrik devir

> **Kaynak:** [CEKLIST-V17.md](CEKLIST-V17.md) — kararlar K1–K7 verildi. Önce onu oku.
> **Şema:** yalnız **1 yeni idempotent seed** (210). Ham `ALTER` YASAK (INFORMATION_SCHEMA guard + PREPARE; 205/208/209 deseni).
> **Push ETME** — Claude review + canlı doğrulama + deploy.
> **KRİTİK:** B ve C aynı deploy'da gitmeli (K4). Ayrı giderse ekran arada bozulur.

---

## Neden (kısa)

Operatörler üretimi **vardiya devrinde** giriyor: gece vardiyasının çıktısı ertesi sabah 07:37–08:53 TR'de, gündüzünki akşam 19:26–19:34 TR'de yazılıyor. Canlı veride istisna yok.

Bundan üç kusur doğuyor:
1. Pencere `kayit_tarihi`'ne göre süzülüyor, kartlar vardiya aralığına göre üretiliyor → **kart var, satır yok** (canlıda 4 filtrede 1–3 satırsız kart).
2. `vardiya_kayitlari.baslangic/bitis` duvar-saati (`07:30`) olarak saklanıyor, gerçek an sanılıyor → aynı payload'da iki farklı sınır temsili; duruş penceresi 3 saat kayıyor.
3. Sabah devir kuralı (hibrit) var, **akşam simetriği yok** → `19:33` girişi geceye düşmeli görünüyor ama biten gündüzün çıktısı.

**2 ve 3 şu an birbirini örtüyor.** Tek başına birini düzeltmek ekranı bozar. İkisi birlikte gider.

---

## A — `core.ts`: simetrik devir kuralı (K3)

`backend/src/modules/vardiya_analizi/core.ts`

1. Sabit:
   ```ts
   /** Vardiya bitişinden sonra bu süre içindeki giriş, BİTEN vardiyaya yazılır. */
   export const DEVIR_TOLERANS_DK = 120;
   ```
2. `assignVardiya(kayitTarihi, tanimlar, tzOffsetDk = VARDIYA_TZ_OFFSET_DK)`:
   - Kaydı içeren slot bulunur.
   - **Eğer kayıt, bir önceki slotun bitişinden itibaren `DEVIR_TOLERANS_DK` içindeyse → önceki slot döner.**
   - Mevcut `07:30–09:30 → önceki gece` özel kodu **kaldırılır**; bu kuralın özel hâlidir (DRY). İki ayrı kural bırakma.
3. Ortam TZ'si okuma yasağı sürüyor (V16-K1): yalnız `toLocal(...)` + `getUTC*`.

**Testler (`core.test.ts`, TR yerel saatiyle, `TZ=UTC` ve `TZ=Europe/Istanbul` altında aynı):**

| Giriş (TR) | Beklenen slot |
|---|---|
| 19:33 | **gunduz (aynı gün)** ← V16'da gece'ydi, değişiyor |
| 21:29 | gunduz (aynı gün) |
| 21:31 | gece (aynı gün başlayan) |
| 07:58 | önceki gece |
| 09:29 | önceki gece |
| 09:31 | gunduz (aynı gün) |
| 03:00 | önceki gün başlayan gece |
| 11:00 | gunduz |

V16'nın I1–I5 invariantları korunur.

## B — Seed `210_vardiya_sinir_duzeltme.sql` (idempotent)

`backend/src/db/seed/sql/210_vardiya_sinir_duzeltme.sql`

1. **Tek seferlik olduğunu işaretle** — tekrar çalışırsa saatleri tekrar geri almasın. Öneri: `vardiya_kayitlari` tablosuna `sinir_utc_duzeltildi tinyint NOT NULL DEFAULT 0` kolonu (INFORMATION_SCHEMA guard + PREPARE), sonra:
   ```sql
   UPDATE vardiya_kayitlari
   SET baslangic = DATE_SUB(baslangic, INTERVAL 3 HOUR),
       bitis     = IF(bitis IS NULL, NULL, DATE_SUB(bitis, INTERVAL 3 HOUR)),
       sinir_utc_duzeltildi = 1
   WHERE sinir_utc_duzeltildi = 0;
   ```
   > Guard'sız `-3 saat` YAZMA. İkinci kez çalışırsa veri bozulur.
2. Ardından `operator_gunluk_kayitlari.vardiya_kayit_id` backfill'ini **yeniden** yap (209'unkini ezerek): her kayıt, K3 devir kuralına uyan slota bağlanır. SQL'de devir toleransını şöyle ifade edebilirsin:
   ```sql
   -- kayit, vk aralığında YA DA vk bitişinden sonraki 120 dk içinde
   JOIN vardiya_kayitlari vk ON vk.makine_id = ogk.makine_id
     AND ogk.kayit_tarihi >= vk.baslangic
     AND ogk.kayit_tarihi <  DATE_ADD(COALESCE(vk.bitis,'2099-01-01'), INTERVAL 120 MINUTE)
   ```
   Birden fazla slot eşleşirse **en geç başlayanı değil, kaydı devir penceresinde kapsayanı** seç — deterministik olsun (`ORDER BY vk.baslangic DESC LIMIT 1` mantığı; MySQL'de korele subquery ile).
3. Backfill sonrası `vardiya_kayit_id IS NULL` kalan kayıt sayısını `SELECT` ile raporla (Claude doğrulayacak).

## C — `operator/repository.ts`: gerçek-an sınırlar + devir varsayılanı

1. Vardiya penceresi üretilirken (`VARDIYA_SAATLERI` → Date) **`fromLocal(..., 180)`** uygulanır; artık `07:30` UTC değil, `04:30Z` yazılır. (`core.ts`'teki yardımcıyı import et — kopyalama.)
2. `resolveVardiyaKayitIdForProduction`: varsayılan, kayıt **devir toleransı içindeyse biten vardiya**, değilse açık vardiya (K6).
3. Body'de `vardiyaKayitId` gelirse o kullanılır; makineye ait değilse 400 (V16'daki doğrulama korunur).

## D — `vardiya_analizi/repository.ts`: slot eksenli çekim (K1)

`fetchUretimKayitlari` artık `kayit_tarihi BETWEEN pencere` ile süzmez. Yerine:

1. Aralıkla **kesişen slotlar** belirlenir (vardiya_kayitlari + kayıtlardan türeyen sentetik slotlar).
2. Kayıtlar şu koşulla çekilir:
   - `vardiya_kayit_id IN (kesişen slot id'leri)` **VEYA**
   - `vardiya_kayit_id IS NULL AND kayit_tarihi` ∈ *genişletilmiş* pencere `[pencere.baslangic, pencere.bitis + DEVIR_TOLERANS_DK]` (bağsız eski kayıtlar için; slot `assignVardiya` ile çıkarılır, aralık dışına düşenler elenir).

> Sonuç invariantı: **kart üretilen her slotun kayıtları payload'da olmalı.**

## E — `service.ts`: tek temsil (K7)

- `filterDuruslarForWindow`, `planlananSureDk`, `clampDate` → hepsi **gerçek an** kullanır. B'den sonra `vardiya_kayitlari.baslangic` zaten gerçek an olur; `meta.slot.baslangic` ile aynı frame'e gelir.
- `vardiyalar[].baslangic` ile `uretimKayitlari[].vardiyaBaslangic` **aynı slot için birebir aynı ISO** dönmeli. (Şu an biri `04:30Z` biri `07:30Z`.)
- Frontend'de `slice(0,10)` ile tarih çıkarımı kalabilir, ama artık tesadüfe değil tek temsile dayanır.

---

## Kabul kriterleri (Claude review edecek — invariant, örnek değil)

1. **Satırsız kart = 0.** Şu 4 filtrede: `{tarih:'2026-07-08'}`, `{08-09, gunduz-gece}`, `{07-08, gece-gunduz}`, `{03-09}`. Kart üretilen her slotun net>0 kayıtları payload'da.
2. `vardiyalar[].baslangic` === o slota ait `uretimKayitlari[].vardiyaBaslangic` (string eşitlik).
3. Canlı: Enjeksiyon 2 · gündüz 08.07 = **252**, gece 08.07 = **808**; Enjeksiyon 1 · gündüz 09.07 = **485**.
4. Her filtrede: makine neti = Σ kart neti = Σ satır neti.
5. `TZ=UTC` ve `TZ=Europe/Istanbul` → testler aynı (V16 kazanımı).
6. `grep -nE "\.getHours\(|\.getMinutes\(|\.getDate\(|\.getMonth\(|\.getFullYear\(" core.ts` → 0.
7. Seed 210 iki kez çalıştırılınca saatler **bir kez** kayar (idempotent kanıtı).
8. backend `bun run build` + tüm testler; admin `bunx tsc --noEmit` + `bun run build` temiz.
9. Her madde (A/B/C/D/E) ayrı commit; yalnız göreve ait dosyalar `git add`.

## Dokunma
- Sunucu/PM2 `TZ` env'i, MySQL `time_zone` (veri karışır).
- Montaj/stok akışı (`tryMontaj`, `repoUretimBitir` stok mantığı), Gantt.

## Uyarı
`DEVIR_TOLERANS_DK` tek yerde (`core.ts`) tanımlı olsun; seed SQL'deki `120` değeri yorumla ona referans versin. İki ayrı sabit tanımlama.
