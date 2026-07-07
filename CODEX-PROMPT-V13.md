# CODEX-PROMPT V13 — Makine sırası (liste default) + montaj tarafı default

> **Kaynak:** [CEKLIST-V13.md](CEKLIST-V13.md). A (kuyruk sorgusu çökmesi) Claude tarafından çözüldü ve yayında (`cb1bbf1`). Bu brief **B ve C**.
> **Yeni şema YOK. ALTER YASAK.** Push etme — Claude review + deploy + thread kapatır.
> Her madde ayrı commit. Build: backend `bun run build`, admin `bunx tsc --noEmit` + sonda `bun run build`.

## B — Makine sırası (`4e29247f`)

**Kök neden:** Makine listesi sorgusu (`repoListMakineler` → `useListMakinelerAdminQuery`) `getOrderBy`'ı kullanıyor ama `makine_havuzu/validation.ts` `sort` default'u **`'created_at'`** olduğu için `getOrderBy` `gosterim_sira` dalına (repository.ts:39) hiç girmiyor → makineler `created_at DESC` sıralı dönüyor. is-yükler ve operatör ekranı makine sırasını bu listeden aldığından yanlış.

**Yapılacak:**
1. `backend/src/modules/makine_havuzu/validation.ts`: liste sorgusunda `sort` default'unu kaldır (opsiyonel bırak) — böylece açık sort istenmezse `getOrderBy` son satır `gosterim_sira`'ya düşer. `getOrderBy` (repository.ts:35-40): `query.sort` undefined → `asc(makineler.gosterim_sira)`. Açık `sort=ad|kod|created_at` istekleri korunsun.
   - Alternatif: `sortEnum`'a `'gosterim_sira'` ekle ve default'u ona çevir; `getOrderBy`'a karşılığını ekle. Hangisini seçersen tutarlı yap.
2. **Frontend doğrula (kod değişikliği gerekmeyebilir):**
   - `is-yukleri-client.tsx`: `machineList` = `makineler?.items` → backend düzelince doğru sırada gelir. İçindeki `.sort()` yalnız her makinenin İŞLERİNİ sıralıyor (durum/sıra) — makine sırasını değiştirmiyor, dokunma.
   - Operatör ekranı: makine sekme/kart/grup sırası API sırasını korumalı. Eğer operatör client makineleri kendi içinde yeniden sıralıyorsa (ör. ad/kod'a göre), o re-sort'u `gosterim_sira` API sırasına saygı gösterecek şekilde düzelt. `repoListMakineKuyrugu` zaten `gosterim_sira` sıralı döndürüyor (repository.ts:880).
3. Doğrulama: is-yükler + operatör ekranında sıra **Enjeksiyon 1 (900 T ÖN) → Enjeksiyon 2 (900 T ARKA) → Ekstrüzyon** olmalı.

## C — Montaj tarafı default seçimi (`9e77dc2f`)

**İstek:** Çift taraflı üretimde "Makine ve Montaj Planlama" bloğunda (montaj Evet/Hayır) iki taraf için:
- Default: **Enjeksiyon 2**'ye (900 T ARKA, gosterim_sira=2) atanmış taraf montaj=**evet**.
- Kullanıcı bunu hayır yaparsa **Enjeksiyon 1** tarafı otomatik evet olur.
- Her zaman **ikisinden tam biri** montaj=evet (ikisi birden hayır olamaz; ikisi birden evet olamaz).

**Yer:** `admin_panel/.../uretim-emirleri/_components/makine-montaj-planlama.tsx`. Blok her operasyon (Sağ/Sol taraf) için montaj Evet/Hayır Select'i gösteriyor; değişiklik `updateOperasyonPlanlari` (operasyon-planlari PATCH) ile kaydediliyor.

**Yapılacak:**
- Montaj'ı **karşılıklı dışlayıcı** yap: bir tarafa "evet" set edilince diğer taraf otomatik "hayır" (aynı parti/mamulün iki tarafı arasında). Tek PATCH ile iki operasyonu (biri montaj=1, diğeri montaj=0) göndermek en tutarlısı.
- **Default seçim:** Parti ilk açıldığında hiç montaj işaretli değilse VEYA yeni atama yapıldığında: Enjeksiyon 2'ye atanmış tarafı montaj=evet yap. Makine henüz atanmamışsa Sol tarafı (V11 kuralı) default evet.
- "Hayır" seçilirse diğer tarafı "evet"e çevir (ikisi de hayır olamaz kuralı). UI'da bunu net göster (radio-benzeri davranış: iki taraftan biri montaj).
- Backend zaten `montaj` set edebiliyor; ek endpoint gerekmez. Mevcut V11 montaj/stok mantığına (tryMontaj) DOKUNMA — yalnız hangi operasyonun montaj=1 olduğunu değiştiriyorsun.

## Sınırlar
- Montaj/stok hesap mantığı (tryMontajForUretimEmri, repoUretimBitir, consumeRecipeMaterials) — DOKUNMA.
- Kuyruk/makine sorgularının makineler JOIN'ini bozma (A'da düzeltildi).
- **Doğrulama:** backend `bun run build`, admin `bunx tsc --noEmit` + `bun run build` temiz.
