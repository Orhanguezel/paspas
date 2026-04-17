import { randomUUID } from 'node:crypto';

import { inArray, eq, and } from 'drizzle-orm';

import { db } from '@/db/client';
import { receteler, receteKalemleri } from '@/modules/receteler/schema';

import { urunler, urunOperasyonlari, type UrunRow } from './schema';
import type { CreateUrunFullBody, ReceteKalemItem } from './validation';

type YariMamulTanim = {
  id: string;
  ad: string;
  kod: string;
  rol: 'sag' | 'sol' | 'parca';
  miktar: number;
};

export type CreateUrunFullResult = {
  urun: UrunRow;
  yariMamuller: UrunRow[];
  asilUrunReceteId: string | null;
  yariMamulReceteIds: string[];
};

export class KategoriTutarsizligiError extends Error {
  constructor(public readonly code: string, public readonly detay?: string) {
    super(code);
    this.name = 'KategoriTutarsizligiError';
  }
}

/**
 * Asıl ürün + otomatik yarı mamul(ler) + reçeteleri tek transaction içinde kurar.
 *
 * Çift operasyonlu: `{ad} - Sağ` + `{ad} - Sol` yarı mamuller (her biri 1 adet → asıl ürün reçetesinde)
 * Tek operasyonlu:  `{ad} - Parça` yarı mamul (2 adet → asıl ürün reçetesinde)
 *
 * Yarı mamul reçetesi: yariMamulHammaddeleri (plastik vs.)
 * Asıl ürün reçetesi: yarı mamuller + asilUrunMalzemeleri (ambalaj, etiket)
 */
export async function createUrunWithYariMamuller(input: CreateUrunFullBody): Promise<CreateUrunFullResult> {
  await assertTumKalemlerHammadde(input.yariMamulHammaddeleri, 'yari_mamul_recetesinde_sadece_hammadde_olur');
  await assertTumKalemlerHammadde(input.asilUrunMalzemeleri, 'asil_urun_malzemesi_hammadde_olmali');

  const yariMamulTanimlari = tanimlaYariMamuller(input);

  return db.transaction(async (tx) => {
    const urunId = randomUUID();
    const urunPayload: typeof urunler.$inferInsert = {
      id: urunId,
      kategori: 'urun',
      tedarik_tipi: 'uretim',
      urun_grubu: input.urunGrubu ?? null,
      kod: input.kod,
      ad: input.ad,
      aciklama: input.aciklama ?? null,
      birim: input.birim,
      renk: input.renk ?? null,
      image_url: input.imageUrl ?? null,
      storage_asset_id: input.storageAssetId ?? null,
      image_alt: input.imageAlt ?? null,
      stok: input.stok.toFixed(4),
      kritik_stok: input.kritikStok.toFixed(4),
      birim_fiyat: typeof input.birimFiyat === 'number' ? input.birimFiyat.toFixed(2) : undefined,
      kdv_orani: input.kdvOrani.toFixed(2),
      operasyon_tipi: input.operasyonTipi,
    };
    await tx.insert(urunler).values(urunPayload);

    const yariMamulRows: UrunRow[] = [];
    for (const tanim of yariMamulTanimlari) {
      const yariPayload: typeof urunler.$inferInsert = {
        id: tanim.id,
        kategori: 'yarimamul',
        tedarik_tipi: 'uretim',
        urun_grubu: input.urunGrubu ?? null,
        kod: tanim.kod,
        ad: tanim.ad,
        birim: 'adet',
        renk: input.renk ?? null,
        stok: '0.0000',
        kritik_stok: '0.0000',
        kdv_orani: input.kdvOrani.toFixed(2),
        operasyon_tipi: null,
      };
      await tx.insert(urunler).values(yariPayload);

      await tx.insert(urunOperasyonlari).values({
        id: randomUUID(),
        urun_id: tanim.id,
        sira: 1,
        operasyon_adi: tanim.ad,
        hazirlik_suresi_dk: input.hazirlikSuresiDk,
        cevrim_suresi_sn: input.cevrimSuresiSn.toFixed(2),
        montaj: 0,
      });
    }

    const yariMamulReceteIds: string[] = [];
    if (input.yariMamulHammaddeleri.length > 0) {
      for (const tanim of yariMamulTanimlari) {
        const receteId = randomUUID();
        await tx.insert(receteler).values({
          id: receteId,
          kod: `${tanim.kod}-R`,
          ad: `${tanim.ad} Reçetesi`,
          urun_id: tanim.id,
          hedef_miktar: '1.0000',
        });
        const kalemValues = input.yariMamulHammaddeleri.map((k, idx) => ({
          id: randomUUID(),
          recete_id: receteId,
          urun_id: k.urunId,
          miktar: k.miktar.toFixed(4),
          fire_orani: k.fireOrani.toFixed(2),
          sira: k.sira || idx + 1,
        }));
        await tx.insert(receteKalemleri).values(kalemValues);
        yariMamulReceteIds.push(receteId);
      }
    }

    let asilUrunReceteId: string | null = null;
    const asilUrunKalemler = [
      ...yariMamulTanimlari.map((t, idx) => ({
        urunId: t.id,
        miktar: t.miktar,
        fireOrani: 0,
        sira: idx + 1,
      })),
      ...input.asilUrunMalzemeleri.map((k, idx) => ({
        ...k,
        sira: k.sira || yariMamulTanimlari.length + idx + 1,
      })),
    ];
    if (asilUrunKalemler.length > 0) {
      asilUrunReceteId = randomUUID();
      await tx.insert(receteler).values({
        id: asilUrunReceteId,
        kod: `${input.kod}-R`,
        ad: `${input.ad} Reçetesi`,
        urun_id: urunId,
        hedef_miktar: '1.0000',
      });
      const kalemValues = asilUrunKalemler.map((k) => ({
        id: randomUUID(),
        recete_id: asilUrunReceteId!,
        urun_id: k.urunId,
        miktar: k.miktar.toFixed(4),
        fire_orani: k.fireOrani.toFixed(2),
        sira: k.sira,
      }));
      await tx.insert(receteKalemleri).values(kalemValues);
    }

    const yariMamulRowsRes = yariMamulTanimlari.length
      ? await tx.select().from(urunler).where(inArray(urunler.id, yariMamulTanimlari.map((t) => t.id)))
      : [];
    const urunRow = (await tx.select().from(urunler).where(eq(urunler.id, urunId)).limit(1))[0];

    yariMamulRows.push(...yariMamulRowsRes);
    if (!urunRow) throw new Error('insert_failed');

    return {
      urun: urunRow,
      yariMamuller: yariMamulRows,
      asilUrunReceteId,
      yariMamulReceteIds,
    };
  });
}

function tanimlaYariMamuller(input: CreateUrunFullBody): YariMamulTanim[] {
  if (input.operasyonTipi === 'cift_tarafli') {
    return [
      { id: randomUUID(), ad: `${input.ad} - Sağ`, kod: `${input.kod}-SG`, rol: 'sag', miktar: 1 },
      { id: randomUUID(), ad: `${input.ad} - Sol`, kod: `${input.kod}-SL`, rol: 'sol', miktar: 1 },
    ];
  }
  return [{ id: randomUUID(), ad: `${input.ad} - Parça`, kod: `${input.kod}-PR`, rol: 'parca', miktar: 2 }];
}

/**
 * Asıl ürün adı değiştiğinde bağlı yarı mamullerin adını, operasyon adını ve reçete adını senkronlar.
 * Yarı mamuller, asıl ürünün reçetesinde `yarimamul` kategorili kalemler üzerinden bulunur.
 * Kod değişmez — sadece ad alanları güncellenir.
 */
export async function syncYariMamulIsimleri(asilUrunId: string, yeniAd: string): Promise<void> {
  const asilRow = await db.select().from(urunler).where(eq(urunler.id, asilUrunId)).limit(1);
  const asil = asilRow[0];
  if (!asil || asil.kategori !== 'urun') return;

  const asilRecete = await db.select().from(receteler).where(eq(receteler.urun_id, asilUrunId)).limit(1);

  let yariMamulIds: string[] = [];
  if (asilRecete[0]) {
    const kalemler = await db
      .select({ urun_id: receteKalemleri.urun_id, kategori: urunler.kategori })
      .from(receteKalemleri)
      .innerJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
      .where(and(eq(receteKalemleri.recete_id, asilRecete[0].id), eq(urunler.kategori, 'yarimamul')));
    yariMamulIds = kalemler.map((k) => k.urun_id);
  }

  if (yariMamulIds.length === 0) return;

  const yariMamuller = await db.select().from(urunler).where(inArray(urunler.id, yariMamulIds));

  await db.transaction(async (tx) => {
    for (const ym of yariMamuller) {
      const rol = ymRoluIsimdenCikar(ym.ad);
      if (!rol) continue;
      const yeniYmAd = `${yeniAd} - ${rol}`;
      if (yeniYmAd === ym.ad) continue;

      await tx.update(urunler).set({ ad: yeniYmAd }).where(eq(urunler.id, ym.id));
      await tx
        .update(urunOperasyonlari)
        .set({ operasyon_adi: yeniYmAd })
        .where(and(eq(urunOperasyonlari.urun_id, ym.id), eq(urunOperasyonlari.operasyon_adi, ym.ad)));

      const ymRecete = await tx.select().from(receteler).where(eq(receteler.urun_id, ym.id)).limit(1);
      if (ymRecete[0]) {
        await tx.update(receteler).set({ ad: `${yeniYmAd} Reçetesi` }).where(eq(receteler.id, ymRecete[0].id));
      }
    }

    if (asilRecete[0]) {
      await tx.update(receteler).set({ ad: `${yeniAd} Reçetesi` }).where(eq(receteler.id, asilRecete[0].id));
    }
  });
}

const YM_SUFFIXES = ['Sağ', 'Sol', 'Parça'] as const;

function ymRoluIsimdenCikar(ymAd: string): string | null {
  for (const suffix of YM_SUFFIXES) {
    if (ymAd.endsWith(` - ${suffix}`)) return suffix;
  }
  return null;
}

async function assertTumKalemlerHammadde(items: ReceteKalemItem[], errorCode: string): Promise<void> {
  if (items.length === 0) return;
  const ids = Array.from(new Set(items.map((i) => i.urunId)));
  const rows = await db.select({ id: urunler.id, kategori: urunler.kategori }).from(urunler).where(inArray(urunler.id, ids));
  if (rows.length !== ids.length) {
    throw new KategoriTutarsizligiError('kalem_urunu_bulunamadi');
  }
  const gecersiz = rows.find((r) => r.kategori !== 'hammadde');
  if (gecersiz) {
    throw new KategoriTutarsizligiError(errorCode, gecersiz.id);
  }
}
