# CODEX-PROMPT V8 — Achievable (kısmi) montaj mantığı

> **Kaynak:** [CEKLIST-V8.md](CEKLIST-V8.md) Not B1. Karar VERİLDİ; uygulanacak.
> **Tek dosya odak:** `backend/src/modules/uretim_emirleri/service.ts` (`tryMontajForUretimEmri`).
> **Yeni şema YOK. ALTER YASAK.** Push etme — Claude review + deploy + canlı veri fix + thread kapatır.

---

## Problem (kısa)

`tryMontajForUretimEmri` montaj için **sipariş kalem miktarının tamamını** (`kalemMiktar`) her taraftan istiyor:

```ts
const gerekli = Number(ym.miktar) * kalemMiktar;   // 4000
const mevcut  = Number(ym.stok);                    // 3970
if (mevcut + 1e-9 < gerekli) eksikYariMamuller.push(...)  // → montaj_bekliyor, montaj HİÇ olmaz
```

Üretim 3970'te bitince (30 eksik) montaj kalıcı kilitlenir; mamul stoğu 0 kalır, sipariş "üretilmemiş" görünür.

## Hedef davranış

Montaj, eldeki bileşenlerle yapılabilecek **tam takım sayısını** montajlar (achievable). Kalem miktarını aşmaz.

---

## Uygulama — `tryMontajForUretimEmri` (service.ts ~164-296)

### 1. Eksik-kontrolü yerine "achievable miktar" hesapla

Şu anki blok (satır ~214-240) eksik listesi kurup montaj_bekliyor'a düşüyor. Yerine:

```ts
// Kaç tam mamul montajlanabilir? (kontrol edilen: operasyonel-YM taraflar + hammadde)
let montajMiktar = kalemMiktar;

for (const ym of yariMamuller) {
  if (ym.stokTakipAktif === 0) continue;
  const perUnit = Number(ym.miktar);
  if (perUnit <= 0) continue;
  const yapilabilir = Math.floor((Number(ym.stok) + 1e-9) / perUnit);
  if (yapilabilir < montajMiktar) montajMiktar = yapilabilir;
}
for (const hm of hammaddeler) {
  if (hm.stokTakipAktif === 0) continue;
  const perUnit = Number(hm.miktar);
  if (perUnit <= 0) continue;
  const yapilabilir = Math.floor((Number(hm.stok) + 1e-9) / perUnit);
  if (yapilabilir < montajMiktar) montajMiktar = yapilabilir;
}

if (montajMiktar <= 0) {
  // Gerçekten hiçbir tam takım yapılamıyor → beklemede kal
  await db.update(uretimEmirleri).set({ durum: 'montaj_bekliyor' }).where(eq(uretimEmirleri.id, uretimEmriId));
  // Bilgi amaçlı eksik listesi (mevcut MontajSonuc tipini koru)
  const eksik = [...yariMamuller, ...hammaddeler]
    .filter((k) => k.stokTakipAktif === 1 && Number(k.stok) + 1e-9 < Number(k.miktar) * kalemMiktar)
    .map((k) => ({ urunId: k.urun_id, ad: k.ad, gerekli: Number(k.miktar) * kalemMiktar, mevcut: Number(k.stok) }));
  return { basarili: false, urunId: asilUrunId, uretilenMiktar: kalemMiktar, eksikYariMamuller: eksik };
}
```

> `Math.floor` → tam takım. `montajMiktar` **kalemMiktar ile başlar** → siparişten fazla montajlanmaz (Sağ 4062 fazlası mamule dönüşmez).

### 2. Transaction: `kalemMiktar` yerine `montajMiktar` kullan

Mevcut transaction bloğu (satır ~242-293) `kalemMiktar` ile tüketip üretiyor. **Hepsini `montajMiktar` yap:**

```ts
await db.transaction(async (tx) => {
  for (const ym of yariMamuller) {
    const dus = Number(ym.miktar) * montajMiktar;       // was kalemMiktar
    if (ym.stokTakipAktif === 1) {
      await tx.update(urunler).set({ stok: sql`${urunler.stok} - ${dus.toFixed(4)}` }).where(eq(urunler.id, ym.urun_id));
    }
    await tx.insert(hareketler).values({ /* ...cikis, referans_tipi:'montaj', miktar: dus.toFixed(4)... */ });
  }
  for (const hm of hammaddeler) {
    const dus = Number(hm.miktar) * montajMiktar;        // was kalemMiktar
    // ... aynı ...
  }
  // Asıl ürün girişi
  await tx.update(urunler)
    .set({ stok: sql`${urunler.stok} + ${montajMiktar.toFixed(4)}` })   // was kalemMiktar
    .where(and(eq(urunler.id, asilUrunId), eq(urunler.stok_takip_aktif, 1)));
  await tx.insert(hareketler).values({ /* ...giris, miktar: montajMiktar.toFixed(4)... */ });

  // Durum: siparişi karşıladıysak VEYA tüm kardeş operasyonel-YM üretim operasyonları bittiyse tamam.
  const durum = (montajMiktar + 1e-9 >= kalemMiktar) || (await tumKardesUretimBitti(tx, uretimEmriId))
    ? 'tamamlandi' : 'montaj_bekliyor';
  await tx.update(uretimEmirleri)
    .set({ durum, uretilen_miktar: montajMiktar.toFixed(4) })
    .where(eq(uretimEmirleri.id, uretimEmriId));
});

return { basarili: true, urunId: asilUrunId, uretilenMiktar: montajMiktar };
```

### 3. Yardımcı — `tumKardesUretimBitti`

Bu mamulün siparişine bağlı, montaj tarafı DAHİL tüm operasyonel-YM üretim emirlerinin operasyonlarının `tamamlandi` olup olmadığını kontrol et. Basit sürüm: **bu emrin kendi operasyonları + kardeş emirlerin operasyonları** hepsi `tamamlandi` mı?

```ts
async function tumKardesUretimBitti(tx: TxLike, uretimEmriId: string): Promise<boolean> {
  // Aynı sipariş kalemine bağlı tüm üretim emirlerinin operasyonlarını kontrol et.
  const kardesEmirIds = await tx
    .selectDistinct({ id: uretimEmirleri.id })
    .from(uretimEmirleri)
    .innerJoin(uretimEmriSiparisKalemleri, eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmirleri.id))
    .where(inArray(uretimEmriSiparisKalemleri.siparis_kalem_id,
      db.select({ id: uretimEmriSiparisKalemleri.siparis_kalem_id })
        .from(uretimEmriSiparisKalemleri)
        .where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmriId))));
  const ids = kardesEmirIds.map((r) => r.id);
  if (ids.length === 0) return true;
  const [bekleyen] = await tx
    .select({ count: sql<number>`count(*)` })
    .from(uretimEmriOperasyonlari)
    .where(and(inArray(uretimEmriOperasyonlari.uretim_emri_id, ids),
               sql`${uretimEmriOperasyonlari.durum} != 'tamamlandi'`));
  return Number(bekleyen?.count ?? 0) === 0;
}
```

> Alt-sorgu Drizzle'da zorsa: iki adımda çek (önce kalem_id'ler, sonra emir_id'ler). Mantık aynı kalsın.

---

## `tryPendingMontajlarAfterStokArtis` (satır ~305+)

Değişiklik gerekmez — zaten `tryMontajForUretimEmri`'yi çağırıyor; yeni achievable mantığından otomatik yararlanır. Sağ taraf (montaj=0) bitip stok artınca, Sol'un `montaj_bekliyor` emri yeniden denenir ve eldeki kadar montajlanır.

---

## Sınırlar / DOKUNMA

- **Ambalaj yarimamul tüketimi V8 kapsamı DIŞI.** `pickOperasyonKaynakKalemler` ve hammadde filtresi **aynı kalsın** — sadece "hep-ya-hiç" → "achievable" değişir. Kontrol edilen bileşen kümesi bugünküyle birebir aynı.
- İdempotentlik: durum `montaj_bekliyor` kalırsa tekrar tetiklenince eldeki YENİ stok kadar montajlar (stok'tan okur, çift-tüketim yok).
- `MontajSonuc` tipini bozma (`uretimEmirleri/service.ts` içindeki union).

## Build & teslim

- `cd backend && bun run build` (tsc temiz).
- Mevcut montaj testleri varsa güncelle: tam-miktar senaryosu hâlâ `tamamlandi`; **yeni**: eksik-üretim (3970/4000, tüm ops tamamlandi) → montaj 3970, durum `tamamlandi`.
- Her madde ayrı commit. **Push YOK** — Claude devralır.
