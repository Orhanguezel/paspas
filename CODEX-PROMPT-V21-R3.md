# CODEX BRIEF — V21/R3: Makineler arası üretim aktarma (güvenli)

> **Bu dosya Codex içindir.** Uygulamadan önce baştan sona oku. `AGENTS.md` kuralları geçerli.
> Çeklist: [`CEKLIST-V21.md`](./CEKLIST-V21.md) R3 bloğu — VERİLMİŞ KARAR bağlayıcı.
> Mimari kararlar bu dosyada; sen implement et, sapma.

---

## 0. Görev tek cümle

İş yükleri ekranında bir üretimi makineden makineye sürükle-bırakla aktarmayı **aç**, ama önce
backend'i güvenli hale getir: kalıp-makine uygunluk denetimi, `montaj_makine_id` senkronu ve
çalışan/tamamlanmış iş koruması ekle.

## 1. Bağlam — neden bu iş güvenli değil (şu an)

Aktarma mantığı backend'de **zaten var**: `is_yukler/repository.ts` `repoUpdate` (satır 234-317),
PATCH body'de `makineId` gelince `movingBetweenMachines` yolunu çalıştırıyor. Sıra yeniden
düzenleniyor, `uretim_emri_operasyonlari.makine_id` güncelleniyor, iki makine için de
`recalcMakineKuyrukTarihleri` çağrılıyor. Sürükle-bırak altyapısı da hazır (@dnd-kit).

**Tek engel frontend'de:** `admin_panel/src/app/(main)/admin/is-yukler/_components/is-yukleri-client.tsx`
satır **424-428** — makineler arası bırakma bir toast ile kapatılmış.

**Ama backend aktarma yolunda 3 eksik var (bu yüzden açmadan önce düzeltilecek):**

| # | Eksik | Sonuç |
|---|---|---|
| 1 | Kalıp-makine uygunluk denetimi yok | Uyumsuz makineye taşımaya izin verir |
| 2 | `montaj_makine_id` senkronu yok | Montaj operasyonu taşınınca eski makinede kalır |
| 3 | Çalışan/tamamlanmış iş guard'ı yok (sadece FE'de) | Çalışan iş taşınabilir → veri tutarsızlığı |

Stok/rezervasyon aktarmadan **etkilenmiyor** (rezervasyon emir yaşam döngüsüne bağlı) — o tarafa
dokunma.

---

## 2. ADIM 1 — Ortak kalıp-makine uygunluk fonksiyonu (DRY)

Uygunluk denetimi şu an TEK yerde: `makine_havuzu/repository.ts` `repoAtaOperasyon` içinde,
satır **416-432**. Bu mantığı ortak bir fonksiyona çıkar ki hem atama hem aktarma kullansın.

### 2a. Yeni dosya: `backend/src/modules/_shared/kalip-makine.ts`

```ts
import { and, eq } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';

import { db } from '@/db/client';
import { kalipUyumluMakineler } from '@/modules/tanimlar/schema';

type TxOrDb = MySql2Database<Record<string, never>> | typeof db;

/**
 * Kalıp-makine uygunluk denetimi (V21/R3).
 * Kural: kalıbın HİÇ uyumluluk kaydı varsa VE hedef makine o listede değilse → uyumsuz.
 * Kalıbın hiç uyumluluk kaydı yoksa serbest (denetim atlanır). kalipId null ise serbest.
 * Uyumsuzsa `kalip_makine_uyumsuz` fırlatır.
 */
export async function assertKalipMakineUyumlu(
  conn: TxOrDb,
  kalipId: string | null,
  makineId: string,
): Promise<void> {
  if (!kalipId) return;

  const [uyumluMakine] = await conn
    .select({ makineId: kalipUyumluMakineler.makine_id })
    .from(kalipUyumluMakineler)
    .where(and(eq(kalipUyumluMakineler.kalip_id, kalipId), eq(kalipUyumluMakineler.makine_id, makineId)))
    .limit(1);

  const [kalipUyumlulukKaydi] = await conn
    .select({ kalipId: kalipUyumluMakineler.kalip_id })
    .from(kalipUyumluMakineler)
    .where(eq(kalipUyumluMakineler.kalip_id, kalipId))
    .limit(1);

  if (kalipUyumlulukKaydi && !uyumluMakine) {
    throw new Error('kalip_makine_uyumsuz');
  }
}
```

### 2b. `repoAtaOperasyon`'u bu fonksiyona bağla (davranış AYNI kalmalı)

`makine_havuzu/repository.ts` satır **416-432** bloğunu şununla değiştir:

```ts
await assertKalipMakineUyumlu(db, opRow.kalip_id, makineId);
```

Import ekle: `import { assertKalipMakineUyumlu } from '@/modules/_shared/kalip-makine';`
**Davranış değişmemeli** — sadece aynı mantık ortak fonksiyona taşındı. Mevcut testler geçmeli.

---

## 3. ADIM 2 — `is_yukler/repoUpdate` aktarma yolunu güvenli yap

Dosya: `backend/src/modules/is_yukler/repository.ts`, `repoUpdate` (satır 234).

### 3a. `existing` seçimine gerekli alanları ekle

Satır 235-244'teki select'e `durum`, `emirOperasyonId` zaten var; ek olarak taşınan işin durumunu
ve montaj bilgisini almak için genişlet:

```ts
const [existing] = await db
  .select({
    id: makineKuyrugu.id,
    makineId: makineKuyrugu.makine_id,
    sira: makineKuyrugu.sira,
    durum: makineKuyrugu.durum,                        // YENİ
    emirOperasyonId: makineKuyrugu.emir_operasyon_id,
  })
  .from(makineKuyrugu)
  .where(eq(makineKuyrugu.id, id))
  .limit(1);
```

### 3b. Aktarma öncesi 3 guard (transaction'a girmeden önce, `movingBetweenMachines` ise)

`const payload = mapPatchInput(data);` satırından SONRA, `await db.transaction` ÖNCESİNE ekle:

```ts
if (movingBetweenMachines) {
  // Guard 1 — çalışan/tamamlanmış iş taşınamaz
  if (existing.durum === 'calisiyor' || existing.durum === 'tamamlandi') {
    throw new Error('calisan_is_tasinamaz');
  }

  // Guard 2 — hedef makinede aynı anda çalışan iş varsa, oraya yeni iş taşımak sorun değil
  //           (kuyruğa eklenir), ama kalıp uygunluğu denetlenmeli.
  if (existing.emirOperasyonId) {
    const [op] = await db
      .select({
        kalipId: uretimEmriOperasyonlari.kalip_id,
        montaj: uretimEmriOperasyonlari.montaj,
        montajMakineId: uretimEmriOperasyonlari.montaj_makine_id,
      })
      .from(uretimEmriOperasyonlari)
      .where(eq(uretimEmriOperasyonlari.id, existing.emirOperasyonId))
      .limit(1);

    // Guard 3 — kalıp-makine uygunluğu (atama yoluyla AYNI kural)
    await assertKalipMakineUyumlu(db, op?.kalipId ?? null, targetMakineId);
  }
}
```

Import ekle: `import { assertKalipMakineUyumlu } from '@/modules/_shared/kalip-makine';`
Ayrıca `uretimEmriOperasyonlari` zaten import'lu mu kontrol et; değilse ekle.

### 3c. `montaj_makine_id` senkronu (transaction içinde, makine_id güncellemesinin yanına)

Satır **291-296**'daki `uretim_emri_operasyonlari.makine_id` güncellemesini genişlet: taşınan
operasyon montaj operasyonuysa **ve** `montaj_makine_id` eski makineye eşitse, onu da yeni makineye taşı:

```ts
if (existing.emirOperasyonId && movingBetweenMachines) {
  const [op] = await tx
    .select({ montaj: uretimEmriOperasyonlari.montaj, montajMakineId: uretimEmriOperasyonlari.montaj_makine_id })
    .from(uretimEmriOperasyonlari)
    .where(eq(uretimEmriOperasyonlari.id, existing.emirOperasyonId))
    .limit(1);

  const opUpdate: Partial<typeof uretimEmriOperasyonlari.$inferInsert> = { makine_id: targetMakineId };
  // Montaj operasyonu ve montaj makinesi eski makineyse → montajı da taşı
  if (Number(op?.montaj ?? 0) === 1 && op?.montajMakineId === existing.makineId) {
    opUpdate.montaj_makine_id = targetMakineId;
  }
  await tx
    .update(uretimEmriOperasyonlari)
    .set(opUpdate)
    .where(eq(uretimEmriOperasyonlari.id, existing.emirOperasyonId));
}
```

**Not:** Mevcut 291-296 bloğunun yerine geçer (o blok sadece `makine_id` güncelliyordu).

---

## 4. ADIM 3 — Controller hata eşlemesi

Dosya: `backend/src/modules/is_yukler/controller.ts`. `repoUpdate`'i çağıran handler'da
(muhtemelen `updateIsYuku`), `try/catch` içinde yeni hata kodlarını 400/409'a eşle:

```ts
const msg = (error as Error).message;
if (msg === 'kalip_makine_uyumsuz')
  return reply.code(400).send({ error: { message: 'kalip_makine_uyumsuz', detail: 'Bu kalıp seçilen makinede kullanılamaz.' } });
if (msg === 'calisan_is_tasinamaz')
  return reply.code(409).send({ error: { message: 'calisan_is_tasinamaz', detail: 'Çalışan veya tamamlanmış iş başka makineye taşınamaz.' } });
```

Mevcut controller'daki hata bloğunun kalıbına uy (nasıl yazıldıysa öyle). Diğer hataları bozma.

---

## 5. ADIM 4 — Frontend: aktarmayı aç + hata göster

Dosya: `admin_panel/src/app/(main)/admin/is-yukler/_components/is-yukleri-client.tsx`.

### 5a. Engeli kaldır (satır 424-428)

```ts
// SİL:
if (sourceGroupId !== targetGroupId) {
  toast.warning('Makineler arası taşıma için önce "Makineden Çıkar" deyip yeniden atama yapın.');
  return;
}
```

Makineler arası bırakınca `updateIsYuku({ id, makineId: targetGroupId, sira })` çağrılmalı
(aynı makine içi sıralamadaki `updateIsYuku` kalıbına bak, satır ~479-482). Yani `makineId`'yi
hedef makine grubuna set et.

### 5b. Çalışan/tamamlanmış iş taşımasını FE'de de engelle (varsa mevcut kontrolü koru)

Satır 432-452'deki çalışan/tamamlanmış iş kontrolleri **kalsın** (backend guard'ı ikinci savunma hattı).

### 5c. Backend hatasını kullanıcıya göster

`updateIsYuku(...).unwrap()` çağrısını `try/catch`'e al; `kalip_makine_uyumsuz` ve
`calisan_is_tasinamaz` için `toast.error(err.data.error.detail ?? '...')` göster. Mevcut
`catch` kalıbına uy. Hata olursa optimistic UI değişikliğini geri al (liste refetch veya invalidate).

---

## 6. Testler (zorunlu)

Yeni test dosyası: `backend/src/modules/is_yukler/__tests__/makine_aktarma.integration.test.ts`
(mevcut `makine_havuzu/__tests__/makine_is_yukleri.real.integration.test.ts` kalıbını izle;
`RUN_INTEGRATION` env guard'ı ile). Senaryolar:

- [ ] Uyumlu makineye aktarma → başarılı, `makine_id` iki tabloda da güncellenir, iki makine recalc olur
- [ ] Uyumsuz makineye aktarma → `kalip_makine_uyumsuz` hatası, hiçbir şey değişmez
- [ ] Kalıbın hiç uyumluluk kaydı yoksa → serbest aktarma çalışır
- [ ] `calisiyor` durumdaki iş aktarılamaz → `calisan_is_tasinamaz`
- [ ] Montaj operasyonu (montaj=1, montaj_makine_id=eski) aktarılınca `montaj_makine_id` yeni makineye taşınır
- [ ] Aktarma stok/rezervasyonu değiştirmez (mevcut testin garantisi korunur)

Ayrıca saf birim test (DB'siz): `assertKalipMakineUyumlu` mantığı mock conn ile — opsiyonel ama tercih edilir.

---

## 7. Doğrulama (bitirmeden önce ÇALIŞTIR)

```bash
cd backend && bunx tsc --noEmit          # exit 0 olmalı
cd backend && bun test                    # yeni testler geçmeli, taban fail sayısı artmamalı
cd admin_panel && bunx tsc --noEmit       # src/ altında 0 hata
cd admin_panel && bunx next build         # 47/47 sayfa, exit 0
```

Taban: `bun test` şu an 438 pass / 13 fail (13 fail DB kimlik bilgisi eksikliğinden, V21 ile
ilgisiz — **artmamalı**).

---

## 8. YAPMA / DİKKAT

- ❌ **Şema değişikliği YOK.** `kalip_uyumlu_makineler` tablosu ve tüm kolonlar zaten var. `ALTER` yasak.
- ❌ `repoAtaOperasyon`'un davranışını DEĞİŞTİRME — sadece uygunluk denetimini ortak fonksiyona taşı.
- ❌ Stok/rezervasyon koduna dokunma — aktarma onları etkilemez.
- ❌ `montaj_makine_id`'yi montaj olmayan operasyonlarda set etme.
- ⚠️ `repoUpdate` satır 280-284'te `if/else` iki dalı da aynı (`targetIds.splice(insertAt, 0, id)`).
  Bu mevcut bir gariplik; düzeltmek istersen tek satıra indir ama davranışı değiştirme (kapsam dışı, opsiyonel).
- ⚠️ Transaction sınırına dikkat: guard'lar (kalıp uygunluk, çalışan iş) transaction ÖNCESİNDE
  okuma yapabilir (mevcut `repoAtaOperasyon` da `db` ile okuyor). Montaj senkronu transaction İÇİNDE.
- ✅ Hata mesajları Türkçe ve `{ error: { message, detail } }` formatında.
- ✅ Push etme, deploy etme — sadece kod + test + yeşil doğrulama. Deploy'u mimar (Claude) yapacak.

---

## 9. Bitince rapor et

- Değişen dosyalar + her birinde ne yaptığın (kısa)
- Doğrulama çıktıları (tsc, test, build sonuçları)
- Yeni testlerin geçtiği
- Yapamadığın / atladığın bir şey varsa neden
