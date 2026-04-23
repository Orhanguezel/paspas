import { randomUUID } from 'node:crypto';

import { inArray, eq, and } from 'drizzle-orm';

import { db } from '@/db/client';
import { receteler, receteKalemleri } from '@/modules/receteler/schema';
import { repoGetByUrunId as repoGetReceteByUrunId } from '@/modules/receteler/repository';

import { urunler, urunOperasyonlari, type UrunRow } from './schema';
import { repoGetById, repoListOperasyonMakineleri, repoListOperasyonlar, repoUpdate } from './repository';
import type { CreateUrunFullBody, OperasyonItem, ReceteKalemItem } from './validation';

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

export class OperasyonelYmTutarsizligiError extends Error {
  constructor(public readonly code: string, public readonly detay?: string) {
    super(code);
    this.name = 'OperasyonelYmTutarsizligiError';
  }
}

type ReceteOperasyonKalemi = {
  urunId: string;
  sira?: number;
};

type DerivedAsilUrunOperasyonlari = {
  operasyonTipi: 'tek_tarafli' | 'cift_tarafli' | null;
  operasyonlar: OperasyonItem[];
  yariMamulIds: string[];
};

const LEGACY_YARI_MAMUL_KATEGORISI = 'yarimamul';
const OPERASYONEL_YM_KATEGORISI = 'operasyonel_ym';

/**
 * Asıl ürün + otomatik operasyonel YM(ler) + reçeteleri tek transaction içinde kurar.
 *
 * Çift operasyonlu: `{ad} - Sağ` + `{ad} - Sol` operasyonel YM'ler (her biri 1 adet → asıl ürün reçetesinde)
 * Tek operasyonlu:  `{ad} - Parça` operasyonel YM (2 adet → asıl ürün reçetesinde)
 *
 * Operasyonel YM reçetesi: yariMamulHammaddeleri (plastik vs.)
 * Asıl ürün reçetesi: operasyonel YM'ler + asilUrunMalzemeleri (ambalaj, etiket)
 */
export async function createUrunWithYariMamuller(input: CreateUrunFullBody): Promise<CreateUrunFullResult> {
  await assertTumKalemlerHammadde(input.yariMamulHammaddeleri, 'operasyonel_ym_recetesinde_sadece_hammadde_olur');
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
        kategori: OPERASYONEL_YM_KATEGORISI,
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
 * Asıl ürün adı değiştiğinde bağlı operasyonel YM/legacy yarı mamullerin adını senkronlar.
 * Öncelik yeni `operasyonel_ym` kategorisindedir; eski veriler için `yarimamul` fallback olarak korunur.
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
      .where(eq(receteKalemleri.recete_id, asilRecete[0].id));

    const operasyonelYmKalemleri = kalemler.filter((kalem) => kalem.kategori === OPERASYONEL_YM_KATEGORISI);
    const hedefKalemler = operasyonelYmKalemleri.length
      ? operasyonelYmKalemleri
      : kalemler.filter((kalem) => kalem.kategori === LEGACY_YARI_MAMUL_KATEGORISI);

    yariMamulIds = hedefKalemler.map((k) => k.urun_id);
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

export async function syncAsilUrunOperasyonlariFromRecete(
  asilUrunId: string,
  items: ReceteOperasyonKalemi[],
): Promise<DerivedAsilUrunOperasyonlari> {
  const derived = await deriveAsilUrunOperasyonlariFromRecete(items);

  await repoUpdate(asilUrunId, {
    operasyonTipi: derived.operasyonTipi,
    operasyonlar: derived.operasyonlar,
  });

  return derived;
}

export async function syncBagliAsilUrunOperasyonlariFromYariMamul(yariMamulId: string): Promise<string[]> {
  const bagliRows = await db
    .select({ asilUrunId: receteler.urun_id })
    .from(receteKalemleri)
    .innerJoin(receteler, eq(receteKalemleri.recete_id, receteler.id))
    .innerJoin(urunler, eq(urunler.id, receteler.urun_id))
    .where(and(eq(receteKalemleri.urun_id, yariMamulId), eq(urunler.kategori, 'urun')));

  const asilUrunIds = Array.from(
    new Set(
      bagliRows
        .map((row) => row.asilUrunId)
        .filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  );
  if (asilUrunIds.length === 0) return [];

  for (const asilUrunId of asilUrunIds) {
    const [asilUrun, receteDetail] = await Promise.all([
      repoGetById(asilUrunId),
      repoGetReceteByUrunId(asilUrunId),
    ]);

    if (!asilUrun || asilUrun.kategori !== 'urun' || asilUrun.tedarik_tipi !== 'uretim' || !receteDetail) {
      continue;
    }

    await syncAsilUrunOperasyonlariFromRecete(
      asilUrunId,
      receteDetail.items.map((item) => ({ urunId: item.urun_id, sira: item.sira })),
    );
  }

  return asilUrunIds;
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

async function deriveAsilUrunOperasyonlariFromRecete(
  items: ReceteOperasyonKalemi[],
): Promise<DerivedAsilUrunOperasyonlari> {
  const receteRefs = items
    .map((item, index) => ({
      urunId: item.urunId,
      sira: Number.isFinite(item.sira) ? Number(item.sira) : index + 1,
      index,
    }))
    .filter((item) => item.urunId);

  if (receteRefs.length === 0) {
    return { operasyonTipi: null, operasyonlar: [], yariMamulIds: [] };
  }

  const itemIds = Array.from(new Set(receteRefs.map((item) => item.urunId)));
  const urunRows = await db
    .select({
      id: urunler.id,
      kategori: urunler.kategori,
    })
    .from(urunler)
    .where(inArray(urunler.id, itemIds));

  const urunById = new Map(urunRows.map((row) => [row.id, row]));
  const operasyonelYmRefs = receteRefs
    .filter((item) => urunById.get(item.urunId)?.kategori === OPERASYONEL_YM_KATEGORISI)
    .sort((a, b) => a.sira - b.sira || a.index - b.index)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.urunId === item.urunId) === index);
  const legacyYmRefs = receteRefs
    .filter((item) => urunById.get(item.urunId)?.kategori === LEGACY_YARI_MAMUL_KATEGORISI)
    .sort((a, b) => a.sira - b.sira || a.index - b.index)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.urunId === item.urunId) === index);
  const yariMamulRefs = operasyonelYmRefs.length > 0 ? operasyonelYmRefs : legacyYmRefs;

  if (yariMamulRefs.length === 0) {
    return { operasyonTipi: null, operasyonlar: [], yariMamulIds: [] };
  }

  if (yariMamulRefs.length > 2) {
    throw new OperasyonelYmTutarsizligiError('urun_recetesinde_en_fazla_iki_operasyonel_ym_olur');
  }

  const kaynakOperasyonListeleri = await Promise.all(
    yariMamulRefs.map((item) => repoListOperasyonlar(item.urunId)),
  );
  const kaynakOperasyonlar = kaynakOperasyonListeleri.map((rows, index) => {
    const first = rows[0];
    if (!first) {
      throw new OperasyonelYmTutarsizligiError('bagli_operasyonel_ym_operasyonu_bulunamadi', yariMamulRefs[index].urunId);
    }
    return first;
  });

  const makineMap = await repoListOperasyonMakineleri(kaynakOperasyonlar.map((row) => row.id));

  return {
    operasyonTipi: kaynakOperasyonlar.length === 2 ? 'cift_tarafli' : 'tek_tarafli',
    operasyonlar: kaynakOperasyonlar.map((row, index) => ({
      operasyonAdi: row.operasyon_adi,
      sira: index + 1,
      kalipId: row.kalip_id ?? undefined,
      hazirlikSuresiDk: row.hazirlik_suresi_dk,
      cevrimSuresiSn: Number(row.cevrim_suresi_sn),
      montaj: row.montaj === 1,
      makineler: (makineMap.get(row.id) ?? []).map((makine) => ({
        makineId: makine.makineId,
        oncelikSira: makine.oncelikSira,
      })),
    })),
    yariMamulIds: yariMamulRefs.map((item) => item.urunId),
  };
}
