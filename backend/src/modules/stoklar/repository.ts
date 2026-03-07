import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { hareketler } from '@/modules/hareketler/schema';
import { urunBirimDonusumleri } from '@/modules/urunler/schema';
import { receteler, receteKalemleri } from '@/modules/receteler/schema';
import { uretimEmirleri } from '@/modules/uretim_emirleri/schema';

import { stokUrunler, type StokRow, type BirimDonusumItem } from './schema';
import type { AdjustStockBody, ListQuery, YeterlilikQuery } from './validation';

type ListResult = {
  items: StokRow[];
  total: number;
};

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.q) {
    conditions.push(or(
      like(stokUrunler.ad, `%${query.q}%`),
      like(stokUrunler.kod, `%${query.q}%`),
    ) as SQL);
  }

  if (query.kategori) {
    conditions.push(eq(stokUrunler.kategori, query.kategori));
  }

  if (query.kritikOnly) {
    conditions.push(sql`${stokUrunler.stok} <= ${stokUrunler.kritik_stok}`);
  }

  if (query.durum === 'yetersiz') {
    conditions.push(sql`${stokUrunler.stok} <= 0`);
  }

  if (query.durum === 'kritik') {
    conditions.push(sql`${stokUrunler.stok} > 0 AND ${stokUrunler.stok} <= ${stokUrunler.kritik_stok}`);
  }

  if (query.durum === 'yeterli') {
    conditions.push(sql`${stokUrunler.stok} > ${stokUrunler.kritik_stok}`);
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'kod') return query.order === 'asc' ? asc(stokUrunler.kod) : desc(stokUrunler.kod);
  if (query.sort === 'stok') return query.order === 'asc' ? asc(stokUrunler.stok) : desc(stokUrunler.stok);
  if (query.sort === 'kritik_stok') return query.order === 'asc' ? asc(stokUrunler.kritik_stok) : desc(stokUrunler.kritik_stok);
  return query.order === 'asc' ? asc(stokUrunler.ad) : desc(stokUrunler.ad);
}

/** Urun ID'lerine gore birim donusumlerini getir, urunId bazli grupla */
export async function repoListBirimDonusumleri(urunIds: string[]): Promise<Map<string, BirimDonusumItem[]>> {
  if (urunIds.length === 0) return new Map();
  const rows = await db
    .select({
      urunId: urunBirimDonusumleri.urun_id,
      hedefBirim: urunBirimDonusumleri.hedef_birim,
      carpan: urunBirimDonusumleri.carpan,
    })
    .from(urunBirimDonusumleri)
    .where(inArray(urunBirimDonusumleri.urun_id, urunIds));

  const map = new Map<string, BirimDonusumItem[]>();
  for (const row of rows) {
    const items = map.get(row.urunId) ?? [];
    items.push({ hedefBirim: row.hedefBirim, carpan: Number(row.carpan) });
    map.set(row.urunId, items);
  }
  return map;
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = getOrderBy(query);
  const [items, countResult] = await Promise.all([
    db.select().from(stokUrunler).where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(stokUrunler).where(where),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetAcikUretimIhtiyaciMap(urunIds?: string[]): Promise<Map<string, number>> {
  const conditions: SQL[] = [
    eq(uretimEmirleri.is_active, 1),
    inArray(uretimEmirleri.durum, ['planlandi', 'hazirlaniyor', 'uretimde']),
  ];

  if (urunIds?.length) {
    conditions.push(inArray(receteKalemleri.urun_id, urunIds));
  }

  const rows = await db
    .select({
      urunId: receteKalemleri.urun_id,
      ihtiyac: sql<number>`sum(
        (
          greatest(cast(${uretimEmirleri.planlanan_miktar} as decimal(12,4)) - cast(${uretimEmirleri.uretilen_miktar} as decimal(12,4)), 0)
          / nullif(cast(${receteler.hedef_miktar} as decimal(12,4)), 0)
        ) * cast(${receteKalemleri.miktar} as decimal(12,4)) * (1 + cast(${receteKalemleri.fire_orani} as decimal(12,4)) / 100)
      )`,
    })
    .from(uretimEmirleri)
    .innerJoin(receteler, eq(uretimEmirleri.recete_id, receteler.id))
    .innerJoin(receteKalemleri, eq(receteler.id, receteKalemleri.recete_id))
    .where(and(...conditions))
    .groupBy(receteKalemleri.urun_id);

  return new Map(rows.map((row) => [row.urunId, Number(row.ihtiyac ?? 0)]));
}

export async function repoGetById(id: string): Promise<StokRow | null> {
  const rows = await db.select().from(stokUrunler).where(eq(stokUrunler.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoAdjustStock(id: string, body: AdjustStockBody, createdByUserId: string | null): Promise<StokRow | null> {
  const current = await repoGetById(id);
  if (!current) return null;
  const currentStock = Number(current.stok ?? 0);
  const nextStock = currentStock + body.miktarDegisimi;
  if (nextStock < 0) throw new Error('negative_stock_not_allowed');

  await db.transaction(async (tx) => {
    await tx.update(stokUrunler).set({ stok: nextStock.toFixed(4) }).where(eq(stokUrunler.id, id));
    await tx.insert(hareketler).values({
      id: randomUUID(),
      urun_id: id,
      hareket_tipi: 'duzeltme',
      referans_tipi: 'stok_duzeltme',
      miktar: body.miktarDegisimi.toFixed(4),
      aciklama: body.aciklama?.trim() || 'Manuel stok duzeltmesi',
      created_by_user_id: createdByUserId,
    });
  });
  return repoGetById(id);
}

export type YeterlilikKalemResult = {
  malzemeId: string;
  malzemeKod: string;
  malzemeAd: string;
  birim: string;
  gerekliMiktar: number;
  fireOrani: number;
  gerekliMiktarFireli: number;
  mevcutStok: number;
  fark: number;
  yeterli: boolean;
};

export type YeterlilikResult = {
  urunId: string;
  receteId: string;
  receteAd: string;
  hedefMiktar: number;
  istenilenMiktar: number;
  carpan: number;
  kalemler: YeterlilikKalemResult[];
  tumYeterli: boolean;
};

export async function repoCheckYeterlilik(query: YeterlilikQuery): Promise<YeterlilikResult | null> {
  // 1. Find active recipe for this product
  const receteRows = await db
    .select()
    .from(receteler)
    .where(and(eq(receteler.urun_id, query.urunId), eq(receteler.is_active, 1)))
    .limit(1);
  const recete = receteRows[0];
  if (!recete) return null;

  // 2. Get recipe items
  const kalemRows = await db
    .select()
    .from(receteKalemleri)
    .where(eq(receteKalemleri.recete_id, recete.id))
    .orderBy(asc(receteKalemleri.sira));

  if (kalemRows.length === 0) return null;

  // 3. Calculate multiplier: istenilenMiktar / hedefMiktar
  const hedefMiktar = Number(recete.hedef_miktar ?? 1);
  const carpan = query.miktar / hedefMiktar;

  // 4. Get current stock for all materials in recipe
  const malzemeIds = kalemRows.map((k) => k.urun_id);
  const malzemeRows = await db
    .select()
    .from(stokUrunler)
    .where(inArray(stokUrunler.id, malzemeIds));

  const malzemeMap = new Map(malzemeRows.map((m) => [m.id, m]));

  // 5. Calculate sufficiency per material
  const kalemler: YeterlilikKalemResult[] = kalemRows.map((kalem) => {
    const malzeme = malzemeMap.get(kalem.urun_id);
    const miktar = Number(kalem.miktar ?? 0) * carpan;
    const fireOrani = Number(kalem.fire_orani ?? 0);
    const gerekliMiktarFireli = miktar * (1 + fireOrani / 100);
    const mevcutStok = malzeme ? Number(malzeme.stok ?? 0) : 0;
    const fark = mevcutStok - gerekliMiktarFireli;

    return {
      malzemeId: kalem.urun_id,
      malzemeKod: malzeme?.kod ?? '',
      malzemeAd: malzeme?.ad ?? '',
      birim: malzeme?.birim ?? 'kg',
      gerekliMiktar: miktar,
      fireOrani,
      gerekliMiktarFireli,
      mevcutStok,
      fark,
      yeterli: fark >= 0,
    };
  });

  return {
    urunId: query.urunId,
    receteId: recete.id,
    receteAd: recete.ad,
    hedefMiktar,
    istenilenMiktar: query.miktar,
    carpan,
    kalemler,
    tumYeterli: kalemler.every((k) => k.yeterli),
  };
}
