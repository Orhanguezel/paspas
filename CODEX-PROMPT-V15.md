# CODEX-PROMPT V15 — Gantt: çalışma-günü segmentleri + görünüm düzeltmeleri

> **Kaynak:** [CEKLIST-V15.md](CEKLIST-V15.md) — kararlar K1–K5 verildi, uygulanacak. Not: `45366dc9`.
> **Yeni şema YOK. ALTER YASAK. Push etme** — Claude review + canlı doğrulama + deploy + thread kapatır.
> Frontend'e takvim (hafta sonu/tatil) mantığı **KOPYALAMA** — tek kaynak backend `_shared/planlama.ts`.

---

## A — Saf segment bölücü (`backend/src/modules/_shared/planlama.ts`)

Mevcut saf yardımcılar: `toDateKey`, `isWorkingDay(date, makineId, holidays, weekendPlans)`, `skipToNextWorkingDay(...)`, `addWorkingMinutes(start, minutes, config, holidays, weekendPlans)`, tip: `MakineWorkConfig {makineId, calisir24Saat, workStartHour, workEndHour, dailyWorkMinutes}`, `HolidaySet`, `WeekendPlanMap`.

**Ekle (saf, DB'siz, `Date.now()` yok):**
```ts
export type Segment = { baslangic: Date; bitis: Date };

/**
 * [baslangic, bitis] takvim aralığını, makinenin ÇALIŞTIĞI dilimlere böler.
 * Çalışma dışı zaman (hafta sonu, tatil, günlük mesai dışı saatler) segmentlere GİRMEZ.
 * calisir24Saat=true ise gün içi saat kısıtı uygulanmaz, yalnız çalışma-dışı GÜNLER atlanır.
 */
export function splitIntoWorkingSegments(
  baslangic: Date,
  bitis: Date,
  config: MakineWorkConfig,
  holidays: HolidaySet,
  weekendPlans: WeekendPlanMap,
): Segment[];
```
- Gün gün ilerle; `isWorkingDay` false ise o günü atla (segment üretme).
- Çalışma günü içinde: `calisir24Saat` ise [gün başı..gün sonu] ∩ [baslangic..bitis]; değilse [workStartHour..workEndHour] ∩ [baslangic..bitis].
- Ardışık gün segmentleri **birleştirilmez** (Görsel 3'te günler ayrı görünüyor); ama aynı gün içindeki tek dilim tek segmenttir.
- Boş kesişim → segment yok. `bitis <= baslangic` → `[]`.

**Unit test (YENİ, DB'siz, skip'siz):** `backend/src/modules/_shared/__tests__/planlama.segments.test.ts`
- Cuma 14:00 → Pazartesi 10:00 (mesaili makine): Cts/Paz segment YOK; Cuma ve Pzt segmentleri var.
- Tatil günü ortada: atlanır.
- Hafta sonu override planı olan makine: Cts segmenti VAR.
- 24 saat makine: gün içi saat kısıtı yok, yalnız çalışma-dışı günler atlanır.
- **Invariantlar:** segmentler artan sırada, çakışmaz; hiçbiri çalışma-dışı ana taşmaz; Σ segment süresi ≤ toplam aralık; `bitis<=baslangic` → boş dizi.

## B — `backend/src/modules/gantt/repository.ts`

1. **`bitisTarihi` now-hack'ini KALDIR** (satır ~381-409 IIFE):
   - `calisiyor`/`duraklatildi`: `baslangicTarihi = gercek_baslangic ?? planlanan_baslangic`, `bitisTarihi = gercek_bitis ?? planlanan_bitis`. `acikDurus: true` bayrağı KALSIN (frontend görsel ipucu). **`now` kullanma.**
   - `bekliyor`: planlanan tarihleri **olduğu gibi** döndür — geçmiş planlı işi `now`'a itme (o blok tamamen kalkar).
   - Planlanan tarihi olmayan iş: `baslangicTarihi/bitisTarihi = null` (frontend zaten `hasVisiblePlan` ile eler).
2. **Aralık filtresi (`buildWhere`, satır ~45-70):** `durum='bekliyor' AND gercek_* IS NULL` OR-dalları aralığı bypass ediyor. Kural şu olmalı — iş, görünüm penceresiyle **kesişiyorsa** gelir:
   `(etkinBitis >= from) AND (etkinBaslangic <= to)` — `etkinBaslangic = COALESCE(gercek_baslangic, planlanan_baslangic)`, `etkinBitis = COALESCE(gercek_bitis, planlanan_bitis)`. Her ikisi de NULL ise iş **listelenmez**.
3. **`segmentler[]` ekle:** her bar için `splitIntoWorkingSegments(etkinBaslangic, etkinBitis, cfg, holidays, weekendPlans)` sonucu. Makine work-config/tatil/hafta-sonu verisi zaten `loadMachineBlocks` civarında yükleniyor — aynı veriyi kullan, **ikinci kez sorgu atma**.
   - DTO (`gantt/schema.ts`): `segmentler: { baslangicTarihi: string; bitisTarihi: string }[]`.
   - `admin_panel/src/integrations/shared/erp/gantt.types.ts`'e aynı alanı ekle.
4. Mevcut `gantt.test.ts` beklentilerini yeni sözleşmeye göre güncelle (now-hack'e dayanan varsa).

## C — `admin_panel/src/app/(main)/admin/gantt/_components/gantt-client.tsx`

1. **Çubuğu segmentlerden çiz:** tek `getBarRect` yerine `item.segmentler.map(...)` → her segment için ayrı dikdörtgen (aynı satırda, aynı renk). Segmentler arası boşluk = çalışılmayan zaman (arka planda hafta sonu gölgesi görünür). Etiket/ürün adı yalnız **ilk** segmentte; ilerleme dolgusu (`fill`) toplam ilerlemeye göre ilk segment(ler)e uygulanır. `segmentler` boşsa çubuk çizme.
2. **Blokları (hafta_sonu/tatil) şerit yüksekliğine indir ve çubuğun ALTINA al:** full-height + `z-6` yerine satır (şerit) yüksekliğinde, `z` çubuktan (`z-5`) küçük. `getBlockStyle` yorumlarını da güncelle (artık üstte değil).
3. **Hafta sonu uyarısını KALDIR:** `~731` (amber rozet) ve `~752` (⚠ "Bitiş hafta sonuna denk geliyor") satırları.
4. Frontend'de hafta sonu/tatil **hesaplayan** kod olmasın; `isWeekend` yalnız **sütun başlığı** stilinde kalabilir (veri kararı değil).

## D — Günlük (tek gün) görünüm

- Aralık tek gün ise (`rangePreset === 'day'` / başlangıç==bitiş): o günün sütunu yatayda **kalan genişliği doldursun** (yatay scroll'a gerek kalmasın). Gün içi saat ızgarası (ör. 2 saatlik alt bölmeler) eklenebilir; çubuklar saat hassasiyetinde konumlansın (`preciseDayOffset` zaten gün-kesirli).

## Kabul kriterleri (Claude review edecek)

1. `bun test src/modules/_shared/__tests__/planlama.segments.test.ts` → skip'siz yeşil.
2. `grep -rn "getDay()\|isWeekend\|tatil" gantt-client.tsx` → yalnız sütun başlığı stili; takvim **kararı** yok.
3. `grep -n "now" backend/src/modules/gantt/repository.ts` → bar tarihlerinde `now` kullanımı yok.
4. Bugün filtresinde ileri tarihli iş görünmüyor; aktif iş çubuğu şimdi çizgisini aşıyor; ardışık işler arası boşluk yok.
5. Cuma başlayıp Pazartesi biten iş: Cts/Paz'da çubuk YOK, Pzt'de devam segmenti VAR (Görsel 3).
6. Hafta sonu gölgesi yalnız şerit yüksekliğinde; uyarı yok.
7. backend `bun run build`, admin `bunx tsc --noEmit` + `bun run build` temiz.
8. Her madde (A/B/C/D) ayrı commit.

## Dokunma
- `recalcMakineKuyrukTarihleri` / `addWorkingMinutes` planlama mantığı (doğru çalışıyor).
- Montaj/stok akışı, vardiya analizi çekirdeği, diğer modüller.
