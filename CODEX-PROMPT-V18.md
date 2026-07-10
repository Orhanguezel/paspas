# CODEX-PROMPT V18 — Üretim emrinde mamul + taraf kalıcılığı; kısmi yazma; miktar bazlı tahsis

> **Kaynak:** [CEKLIST-V18.md](CEKLIST-V18.md) — kararlar K1–K16 verildi. **Önce onu oku.**
> **Şema:** 2 yeni idempotent seed (`211`, `212`). Ham `ALTER` YASAK — `INFORMATION_SCHEMA` guard + `PREPARE` (205/208/209 deseni).
> **Push ETME** — Claude review + canlı doğrulama + deploy.
> **Sıra bağlayıcıdır:** A → B → C → D → E → F → G. Atlama.

---

## Neden (kısa)

Çift taraflı üretim emrinde **mamul kimliği ve taraf bilgisi hiçbir yerde saklanmıyor.** Türetilemez de:
- Aktif YM emirlerinin 13/14'ünde `recete_id` NULL
- `parti_no` mamul grubu değil (`UP-2026-0017` içinde Pars + Vector)
- Ters reçete araması çok anlamlı (`1118 101-R` üç mamulde geçiyor)
- Kesin kanıt: `UE-0099` ve `UE-0101` **aynı üründen, aynı partide**, farklı mamullere ait

Bu yüzden her ekran bağlamı kendi yöntemiyle uyduruyor ve her düzeltme bir sonraki ekranda açılıyor. **Bilgiyi saklıyoruz.**

---

## A — Seed `211_uretim_emri_mamul.sql` (idempotent)

`backend/src/db/seed/sql/211_uretim_emri_mamul.sql`

1. Guard + PREPARE ile `uretim_emirleri`'ne:
   - `mamul_urun_id char(36) NULL` (şimdilik NULL; NOT NULL adım 4'ten sonra)
   - `taraf varchar(8) NULL`  — `sag` | `sol` | `parca` | NULL
   - index: `idx_uretim_emri_mamul (parti_no, mamul_urun_id)`
2. **Backfill, çeklistteki sırayla** (her adım yalnız `mamul_urun_id IS NULL` satırlara):
   1. **Sipariş bağından:** `uretim_emri_siparis_kalemleri → siparis_kalemleri.urun_id` **tek anlamlıysa** (o emre bağlı tüm kalemler aynı ürün) → o ürün
   2. **Parti ikizinden:** aynı `parti_no` içinde mamulü çözülmüş bir emir varsa ve bu emrin `urun_id`'si o mamulün reçetesinde geçiyorsa → o mamul. *(`UE-2026-0100` bu adımda çözülür.)*
   3. **Ürün emri:** `urunler.kategori = 'urun'` ise → `mamul_urun_id = urun_id`, `taraf = NULL`
   4. **Kalanlar:** tahmin yürütme ve ters reçeteden mamul atama yapma; NULL kalanları raporla.
3. `taraf` backfill: `urunler.kod` sonekinden — `-R` → `sag`, `-L` → `sol`, `-X` → `parca`, aksi halde NULL.
   > Sonek **yalnız backfill için** kullanılır. Yeni emirlerde `taraf` yazılır, sonekten çıkarılmaz.
4. **Rapor:** `SELECT emir_no, urun_id, durum FROM uretim_emirleri WHERE mamul_urun_id IS NULL`.
   - Boşsa → `mamul_urun_id` **NOT NULL** yapılır (aynı guard deseniyle).
   - Boş değilse → **NOT NULL yapma**, raporu çıktıya bas. Claude karar verir.
5. İdempotent: kolon varsa eklenmez; backfill yalnız NULL satırlara; iki kez çalışınca sonuç değişmez.

## B — `_shared/mamul.ts` (saf çekirdek, DB'siz)

`backend/src/modules/_shared/mamul.ts`

```ts
export type Taraf = 'sag' | 'sol' | 'parca';
export interface MamulEmri { id: string; partiNo: string; mamulUrunId: string; urunId: string;
  taraf: Taraf | null; planlananMiktar: number; uretilenMiktar: number; durum: string; }

export function mamulGrupKey(e: MamulEmri): string      // `${partiNo}::${mamulUrunId}`
export function groupByMamul(emirler: MamulEmri[]): MamulGrup[]
export function taraflar(g: MamulGrup): MamulEmri[]
export function grupPlanlanan(g: MamulGrup): number     // K4: tüm taraflar eşit -> tek değer; eşit değilse throw
```

- DB import **yok**, `Date.now()` **yok**, ortam okuma **yok**. Tamamen saf.
- `grupPlanlanan` eşitsizlikte **fırlatır** — K4 invariantı kodda yaşar, yorumda değil.
- `grupUretilen = min(taraflar)` gibi bir sezgi eklenmez; K4'e göre taraf miktarları eşit tutulur.
- **DB'siz unit test** (`__tests__/mamul.test.ts`, skip'siz):
  - Aynı üründen iki emir farklı mamullere aitse **farklı gruba** düşer (`UE-0099` / `UE-0101` senaryosu).
  - Aynı parti + aynı mamul → tek grup, sipariş bağı olsun olmasın.
  - Asimetrik planlanan → `grupPlanlanan` throw.
  - Tek taraflı emir (`taraf = null`) tek elemanlı grup.

## C — `repoUpdate`: transaction + doğrula-sonra-sil + doğru kural

`backend/src/modules/uretim_emirleri/repository.ts`

1. `repoUpdate` **tamamı `db.transaction` içine** alınır. Şu an `grep -c "db.transaction"` → 0.
2. `syncJunctionRows`: **önce doğrula, sonra sil.**
   ```ts
   // ÖNCE
   const mismatch = ...; if (mismatch) throw ...;
   // SONRA
   await tx.delete(...); await tx.insert(...);
   ```
3. **Kural K8:** uyum kontrolü `emir.urun_id` ile değil **`emir.mamul_urun_id`** ile yapılır — sipariş kalemi ürünü emrin **mamulü** olmalı.
4. `skipKalemUrunCheck` parametresi **tamamen silinir** (`repository.ts:553` çağrısı dahil). `grep -rn "skipKalemUrunCheck"` → 0 olmalı.
5. `repoCreate` de aynı `syncJunctionRows`'u aynı kuralla çağırır — create/update asimetrisi biter.
6. **Test:** `syncJunctionRows`'un ortasına hata enjekte et → transaction geri alınır, `planlanan_miktar` **ve** köprü satırları değişmemiş olmalı.

## D — `updateMamulEmri`: miktar yalnız grup bazında

`backend/src/modules/uretim_emirleri/service.ts`

1. Yeni: `updateMamulEmri(partiNo, mamulUrunId, patch)` — tek transaction:
   - Gruptaki **tüm** emirlerin `planlanan_miktar`'ını aynı değere yazar
   - Her emrin `uretim_emri_operasyonlari.planlanan_miktar`'ını senkronlar
   - Hammadde rezervasyonunu ve kuyruk sürelerini yeniden hesaplar (mevcut mantık)
2. Controller/route: miktar patch'i **yalnız** bu yoldan geçer. Tek emrin `planlananMiktar`'ını değiştiren eski yol **kapatılır** (validation'dan çıkarılır → 400).
3. Diğer alanlar (termin, durum, notlar) emir bazında kalabilir.
4. **Test:** çift taraflı grupta miktar 2020 → 2250; iki emir de 2250, iki emrin operasyonları da 2250.

## E — Seed `212_tahsis_miktar.sql` + miktar bazlı aktarım

1. Seed (idempotent): `uretim_emri_siparis_kalemleri.miktar decimal(12,4) NOT NULL DEFAULT 0`.
   Backfill: `miktar = uretim_emirleri.planlanan_miktar` (bugün bir emir tek kaleme bağlı).
   **Önce doğrula:** birden çok kaleme bağlı emir var mı? Varsa **backfill yapma**, raporla.
2. `satis_siparisleri/repository.ts`:
   - `uretimeAktarilanKalemSayisi` (`count(distinct ...)`) → **kaldır**.
   - `aktarilanMiktar = Σ tahsis.miktar` (emir `durum <> 'iptal'`), `kalanMiktar = kalem.miktar - aktarilanMiktar`.
   - Kalem `kalanMiktar > 0` iken seçilebilir; DTO'ya `aktarilanMiktar`, `kalanMiktar` eklenir.
   - Sipariş durumu (`kısmen aktarıldı`) miktar oranından hesaplanır.
3. **Guard (K12):** `Σ tahsis.miktar > kalem.miktar` olacak istek → `400 { error: { message: 'asiri_aktarim' } }`.
4. Frontend: sipariş kalemi satırında `2000 takım · 1000 aktarıldı · 1000 kalan`; varsayılan miktar `kalanMiktar`.

## F — Tüketicileri tek kaynağa bağla

- `uretim-emirleri-client.tsx`: `mamulKey` (satır ~486, `sk:` / `sko:` / `emir:` üçlüsü) **silinir** → `mamulGrupKey`. Grup anahtarı artık sipariş bağına bağlı değil.
- `makine_havuzu/repository.ts:203,298`: `urunAd` yanına `mamulAd` eklenir; `is-yukler` **mamul adı üstte, taraf altta** gösterir.
- `gantt/repository.ts`: aynı gruplama.
- Frontend'de mamul **hesaplayan** kod kalmaz; yalnız API'den geleni çizer.

## G — Düzeltme ekranı (`3536f365`)

- "Yeni üretim emri" bileşeninden **türetilir, kopyalanmaz**: tek fark `mod: 'olustur' | 'duzenle'`.
- Düzenlemede: emrin ürün grubu açılır; o gruba ait siparişler `aktarilanMiktar` / `kalanMiktar` ile listelenir; kullanıcı kalandan aktarır; manuel ekle aktif.
- **Invariant:** `parti_no` değişmez, başka partinin emirleri etkilenmez. Testle korunur.

---

## Kabul kriterleri (Claude review edecek — invariant)

1. Hiçbir emirde `mamul_urun_id` NULL değil; `NOT NULL` kısıtı konmuş.
2. Canlı tarama: aynı `(parti_no, mamul_urun_id)` grubunda `planlanan_miktar` farkı olan grup **yok**.
3. Canlı tarama: `emir.planlanan_miktar ≠ operasyon.planlanan_miktar` olan aktif emir **yok**.
4. Transaction testi: `repoUpdate` ortasında hata → hiçbir satır değişmemiş.
5. `Σ tahsis.miktar ≤ kalem.miktar` her kalemde; aşırı aktarım 400.
6. Kısmen aktarılmış kalem kalanı kadar tekrar seçilebiliyor.
7. Regresyon testi: sipariş bağı silinmiş emir **gruptan kopmuyor** (`a155bf5c` senaryosu).
8. `is-yukler` ve `uretim-emirleri` aynı emir için aynı mamul adını gösteriyor.
9. Düzenleme sonrası `parti_no` değişmiyor; başka parti etkilenmiyor.
10. `grep -rn "skipKalemUrunCheck"` → **0**.
11. backend `bun run build` + tüm testler; admin `bunx tsc --noEmit` + `bun run build` temiz.
12. **Push yok** — Claude review + canlı doğrulama + deploy.

## Dokunma
- Montaj/stok akışı: `tryMontajForUretimEmri`, `repoUretimBitir`, `consumeRecipeMaterials`.
- Vardiya modülü (V17'de ele alınıyor).
- Reçete verisi — özellikle `1119 101` (Vector) reçetesi. **Admin onayı bekliyor**, dokunma.
- Sunucu/PM2 `TZ`, MySQL `time_zone`.

## Uyarı
`UE-2026-0100` şu an bozuk durumda (miktar 2250, operasyon 2020, sipariş bağı yok). **Onarımı Claude yapacak** — seed backfill'i bu satırı adım 2.3'te (parti ikizi) çözmeli, ama miktarı **düzeltmemeli**. Backfill yalnız `mamul_urun_id`/`taraf` yazar.
