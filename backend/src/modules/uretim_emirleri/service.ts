import { randomUUID } from 'node:crypto';

import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { hareketler } from '@/modules/hareketler/schema';
import { receteKalemleri, receteler } from '@/modules/receteler/schema';
import { siparisKalemleri } from '@/modules/satis_siparisleri/schema';
import { urunler } from '@/modules/urunler/schema';

import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from './schema';
import { repoCreate, repoGetNextEmirNo, type CreateResult } from './repository';

type Opts = {
  baslangicTarihi?: string;
  bitisTarihi?: string;
  terminTarihi?: string;
};

export class SiparisUretimEmirHatasi extends Error {
  constructor(public readonly code: string, public readonly detay?: string) {
    super(code);
    this.name = 'SiparisUretimEmirHatasi';
  }
}

/**
 * Bir satış siparişi kaleminden, asıl ürünün reçetesindeki yarı mamuller için
 * ayrı ayrı üretim emri oluşturur.
 *
 * Örnek: 10 adet çift op. ürün → 10 Sağ + 10 Sol (2 emir)
 *        10 adet tek op. ürün  → 20 Parça (1 emir)
 */
export async function createUretimEmirleriFromSiparisKalemi(
  siparisKalemId: string,
  opts: Opts = {},
): Promise<CreateResult[]> {
  const kalemRows = await db.select().from(siparisKalemleri).where(eq(siparisKalemleri.id, siparisKalemId)).limit(1);
  const kalem = kalemRows[0];
  if (!kalem) throw new SiparisUretimEmirHatasi('siparis_kalemi_bulunamadi');

  const urunRows = await db.select().from(urunler).where(eq(urunler.id, kalem.urun_id)).limit(1);
  const urun = urunRows[0];
  if (!urun) throw new SiparisUretimEmirHatasi('urun_bulunamadi');
  if (urun.kategori !== 'urun') {
    throw new SiparisUretimEmirHatasi('siparis_kalemi_asil_urun_olmali', urun.kategori);
  }

  const asilReceteRows = await db
    .select()
    .from(receteler)
    .where(and(eq(receteler.urun_id, urun.id), eq(receteler.is_active, 1)))
    .limit(1);
  const asilRecete = asilReceteRows[0];
  if (!asilRecete) throw new SiparisUretimEmirHatasi('asil_urun_recetesi_yok');

  const yariMamulKalemler = await db
    .select({
      urun_id: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      kategori: urunler.kategori,
    })
    .from(receteKalemleri)
    .innerJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
    .where(and(eq(receteKalemleri.recete_id, asilRecete.id), eq(urunler.kategori, 'yarimamul')));

  if (yariMamulKalemler.length === 0) {
    throw new SiparisUretimEmirHatasi('asil_urun_yarimamul_icermiyor');
  }

  const kalemMiktar = Number(kalem.miktar);
  const results: CreateResult[] = [];

  for (const k of yariMamulKalemler) {
    const planlananMiktar = Number(k.miktar) * kalemMiktar;
    const emirNo = await repoGetNextEmirNo();
    const created = await repoCreate(
      {
        emirNo,
        urunId: k.urun_id,
        planlananMiktar,
        uretilenMiktar: 0,
        siparisKalemIds: [kalem.id],
        durum: 'atanmamis',
        baslangicTarihi: opts.baslangicTarihi,
        bitisTarihi: opts.bitisTarihi,
        terminTarihi: opts.terminTarihi,
      },
      { skipKalemUrunCheck: true },
    );
    results.push(created);
  }

  return results;
}

export type MontajSonuc =
  | { basarili: true; urunId: string; uretilenMiktar: number; eksikYariMamuller?: undefined }
  | { basarili: false; urunId: string; uretilenMiktar: number; eksikYariMamuller: Array<{ urunId: string; ad: string; gerekli: number; mevcut: number }> };

/**
 * Bir yarı mamul üretim emri tamamlandığında, emirin bağlı olduğu sipariş
 * kaleminin asıl ürünü için montaj denemesi yapar.
 *
 * Kullanım: operatörün üretim bitirme akışında, tamamlanan operasyon
 * `montaj=true` işaretli ise çağrılır.
 *
 * Başarılı: yarı mamul stokları düş, asıl ürün stoğu art, ambalaj hammaddeleri düş,
 *          emir durumunu `tamamlandi` yap.
 * Yetersiz: emir durumunu `montaj_bekliyor` yap, karşı yarı mamul beklenir.
 */
export async function tryMontajForUretimEmri(
  uretimEmriId: string,
  operatorUserId?: string | null,
): Promise<MontajSonuc | null> {
  const emirRow = (await db.select().from(uretimEmirleri).where(eq(uretimEmirleri.id, uretimEmriId)).limit(1))[0];
  if (!emirRow) return null;

  const yariMamulRow = (await db.select().from(urunler).where(eq(urunler.id, emirRow.urun_id)).limit(1))[0];
  if (!yariMamulRow || yariMamulRow.kategori !== 'yarimamul') return null;

  const linkedKalem = await db
    .select({ kalemId: uretimEmriSiparisKalemleri.siparis_kalem_id, urun_id: siparisKalemleri.urun_id, miktar: siparisKalemleri.miktar })
    .from(uretimEmriSiparisKalemleri)
    .innerJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .where(eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmriId))
    .limit(1);
  if (!linkedKalem[0]) return null;

  const asilUrunId = linkedKalem[0].urun_id;
  const kalemMiktar = Number(linkedKalem[0].miktar);

  const asilRecete = (
    await db.select().from(receteler).where(and(eq(receteler.urun_id, asilUrunId), eq(receteler.is_active, 1))).limit(1)
  )[0];
  if (!asilRecete) return null;

  const kalemler = await db
    .select({
      urun_id: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      kategori: urunler.kategori,
      ad: urunler.ad,
      stok: urunler.stok,
    })
    .from(receteKalemleri)
    .innerJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
    .where(eq(receteKalemleri.recete_id, asilRecete.id));

  const yariMamuller = kalemler.filter((k) => k.kategori === 'yarimamul');
  const hammaddeler = kalemler.filter((k) => k.kategori === 'hammadde');
  if (yariMamuller.length === 0) return null;

  const eksikYariMamuller: Array<{ urunId: string; ad: string; gerekli: number; mevcut: number }> = [];
  for (const ym of yariMamuller) {
    const gerekli = Number(ym.miktar) * kalemMiktar;
    const mevcut = Number(ym.stok);
    if (mevcut + 1e-9 < gerekli) {
      eksikYariMamuller.push({ urunId: ym.urun_id, ad: ym.ad, gerekli, mevcut });
    }
  }

  if (eksikYariMamuller.length > 0) {
    await db.update(uretimEmirleri).set({ durum: 'montaj_bekliyor' }).where(eq(uretimEmirleri.id, uretimEmriId));
    return { basarili: false, urunId: asilUrunId, uretilenMiktar: kalemMiktar, eksikYariMamuller };
  }

  // Hammadde eksikse de uyar (ambalaj vs.)
  for (const hm of hammaddeler) {
    const gerekli = Number(hm.miktar) * kalemMiktar;
    if (Number(hm.stok) + 1e-9 < gerekli) {
      eksikYariMamuller.push({ urunId: hm.urun_id, ad: hm.ad, gerekli, mevcut: Number(hm.stok) });
    }
  }
  if (eksikYariMamuller.length > 0) {
    await db.update(uretimEmirleri).set({ durum: 'montaj_bekliyor' }).where(eq(uretimEmirleri.id, uretimEmriId));
    return { basarili: false, urunId: asilUrunId, uretilenMiktar: kalemMiktar, eksikYariMamuller };
  }

  await db.transaction(async (tx) => {
    for (const ym of yariMamuller) {
      const dus = Number(ym.miktar) * kalemMiktar;
      await tx.update(urunler).set({ stok: sql`${urunler.stok} - ${dus.toFixed(4)}` }).where(eq(urunler.id, ym.urun_id));
      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: ym.urun_id,
        hareket_tipi: 'cikis',
        referans_tipi: 'montaj',
        referans_id: uretimEmriId,
        miktar: dus.toFixed(4),
        aciklama: 'Montaj: yarı mamul tüketimi',
        created_by_user_id: operatorUserId ?? null,
      });
    }

    for (const hm of hammaddeler) {
      const dus = Number(hm.miktar) * kalemMiktar;
      await tx.update(urunler).set({ stok: sql`${urunler.stok} - ${dus.toFixed(4)}` }).where(eq(urunler.id, hm.urun_id));
      await tx.insert(hareketler).values({
        id: randomUUID(),
        urun_id: hm.urun_id,
        hareket_tipi: 'cikis',
        referans_tipi: 'montaj',
        referans_id: uretimEmriId,
        miktar: dus.toFixed(4),
        aciklama: 'Montaj: hammadde/ambalaj tüketimi',
        created_by_user_id: operatorUserId ?? null,
      });
    }

    await tx.update(urunler).set({ stok: sql`${urunler.stok} + ${kalemMiktar.toFixed(4)}` }).where(eq(urunler.id, asilUrunId));
    await tx.insert(hareketler).values({
      id: randomUUID(),
      urun_id: asilUrunId,
      hareket_tipi: 'giris',
      referans_tipi: 'montaj',
      referans_id: uretimEmriId,
      miktar: kalemMiktar.toFixed(4),
      aciklama: 'Montaj tamamlandı: asıl ürün girişi',
      created_by_user_id: operatorUserId ?? null,
    });

    await tx.update(uretimEmirleri).set({ durum: 'tamamlandi' }).where(eq(uretimEmirleri.id, uretimEmriId));
  });

  return { basarili: true, urunId: asilUrunId, uretilenMiktar: kalemMiktar };
}

/**
 * Bir yarı mamulün stoğu arttıktan sonra, bu yarı mamulün karşılığında bekleyen
 * montajları tarar ve her birinde tekrar `tryMontajForUretimEmri` çalıştırır.
 *
 * Kullanım: operatör bir yarı mamul üretim emri tamamlanınca (montaj olmayan tarafta)
 * stok artar; bu helper ile kardeş emirlerin `montaj_bekliyor` durumu çözümlenir.
 */
export async function tryPendingMontajlarAfterStokArtis(
  yariMamulId: string,
  operatorUserId?: string | null,
): Promise<MontajSonuc[]> {
  // Bu yarı mamulün kullanıldığı asıl ürünleri bul (reçetelerde)
  const asilUrunler = await db
    .selectDistinct({ urunId: receteler.urun_id })
    .from(receteKalemleri)
    .innerJoin(receteler, eq(receteler.id, receteKalemleri.recete_id))
    .where(eq(receteKalemleri.urun_id, yariMamulId));

  const asilUrunIds = asilUrunler.map((r) => r.urunId).filter((x): x is string => Boolean(x));
  if (asilUrunIds.length === 0) return [];

  // Bu asıl ürünlerin sipariş kalemlerine bağlı ve montaj_bekliyor durumunda olan
  // üretim emirlerini bul
  const bekleyenEmirler = await db
    .selectDistinct({ uretimEmriId: uretimEmirleri.id })
    .from(uretimEmirleri)
    .innerJoin(uretimEmriSiparisKalemleri, eq(uretimEmriSiparisKalemleri.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(siparisKalemleri, eq(siparisKalemleri.id, uretimEmriSiparisKalemleri.siparis_kalem_id))
    .where(and(eq(uretimEmirleri.durum, 'montaj_bekliyor'), inArray(siparisKalemleri.urun_id, asilUrunIds)));

  const results: MontajSonuc[] = [];
  for (const row of bekleyenEmirler) {
    const sonuc = await tryMontajForUretimEmri(row.uretimEmriId, operatorUserId);
    if (sonuc) results.push(sonuc);
  }
  return results;
}
