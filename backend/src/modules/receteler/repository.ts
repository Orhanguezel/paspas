import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';

import { urunler } from '@/modules/urunler/schema';
import { receteKalemleri, receteler, type EnrichedReceteKalemRow, type ReceteKalemRow, type ReceteRow } from './schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

type ListResult = {
  items: ReceteRow[];
  total: number;
};

type ReceteDetail = {
  recete: ReceteRow;
  items: EnrichedReceteKalemRow[];
};

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.q) {
    conditions.push(like(receteler.ad, `%${query.q}%`));
  }
  if (typeof query.isActive === 'boolean') {
    conditions.push(eq(receteler.is_active, query.isActive ? 1 : 0));
  }

  if (conditions.length === 0) {
    return undefined;
  }
  if (conditions.length === 1) {
    return conditions[0];
  }
  return and(...conditions);
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'ad') return query.order === 'asc' ? asc(receteler.ad) : desc(receteler.ad);
  if (query.sort === 'kod') return query.order === 'asc' ? asc(receteler.kod) : desc(receteler.kod);
  return query.order === 'asc' ? asc(receteler.created_at) : desc(receteler.created_at);
}

function mapReceteInsert(data: CreateBody): typeof receteler.$inferInsert {
  return {
    id: randomUUID(),
    kod: data.kod,
    ad: data.ad,
    urun_id: data.urunId,
    aciklama: data.aciklama,
    hedef_miktar: data.hedefMiktar.toFixed(4),
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapRecetePatch(data: PatchBody): Partial<typeof receteler.$inferInsert> {
  const payload: Partial<typeof receteler.$inferInsert> = {};
  if (data.kod !== undefined) payload.kod = data.kod;
  if (data.ad !== undefined) payload.ad = data.ad;
  if (data.urunId !== undefined) payload.urun_id = data.urunId;
  if (data.aciklama !== undefined) payload.aciklama = data.aciklama;
  if (data.hedefMiktar !== undefined) payload.hedef_miktar = data.hedefMiktar.toFixed(4);
  if (data.isActive !== undefined) payload.is_active = data.isActive ? 1 : 0;
  return payload;
}

function mapKalemInsert(receteId: string, items: CreateBody['items'] | PatchBody['items']) {
  if (!items || items.length === 0) return [];
  return items.map((item) => ({
    id: randomUUID(),
    recete_id: receteId,
    urun_id: item.urunId,
    miktar: item.miktar.toFixed(4),
    fire_orani: item.fireOrani.toFixed(2),
    aciklama: item.aciklama?.trim() || null,
    sira: item.sira,
  }));
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = getOrderBy(query);

  const [items, countResult] = await Promise.all([
    db.select().from(receteler).where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(receteler).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<ReceteDetail | null> {
  const receteRows = await db.select().from(receteler).where(eq(receteler.id, id)).limit(1);
  const recete = receteRows[0];
  if (!recete) return null;

  const items = await db
    .select({
      id: receteKalemleri.id,
      recete_id: receteKalemleri.recete_id,
      urun_id: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      fire_orani: receteKalemleri.fire_orani,
      aciklama: receteKalemleri.aciklama,
      sira: receteKalemleri.sira,
      created_at: receteKalemleri.created_at,
      updated_at: receteKalemleri.updated_at,
      malzemeKod: urunler.kod,
      malzemeAd: urunler.ad,
      malzemeKategori: urunler.kategori,
      malzemeBirim: urunler.birim,
      malzemeBirimFiyat: urunler.birim_fiyat,
      malzemeGorselUrl: urunler.image_url,
    })
    .from(receteKalemleri)
    .leftJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
    .where(eq(receteKalemleri.recete_id, id))
    .orderBy(asc(receteKalemleri.sira), asc(receteKalemleri.created_at));

  return { recete, items };
}

export async function repoCreate(data: CreateBody): Promise<ReceteDetail> {
  const recetePayload = mapReceteInsert(data);
  const receteId = recetePayload.id;

  await db.transaction(async (tx) => {
    await tx.insert(receteler).values(recetePayload);
    const kalemPayload = mapKalemInsert(receteId, data.items);
    await tx.insert(receteKalemleri).values(kalemPayload);
  });

  const detail = await repoGetById(receteId);
  if (!detail) {
    throw new Error('insert_failed');
  }
  return detail;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<ReceteDetail | null> {
  const current = await repoGetById(id);
  if (!current) return null;

  await db.transaction(async (tx) => {
    const recetePatch = mapRecetePatch(patch);
    if (Object.keys(recetePatch).length > 0) {
      await tx.update(receteler).set(recetePatch).where(eq(receteler.id, id));
    }

    if (patch.items) {
      await tx.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, id));
      const kalemPayload = mapKalemInsert(id, patch.items);
      await tx.insert(receteKalemleri).values(kalemPayload);
    }
  });

  return repoGetById(id);
}

export async function repoGetByUrunId(urunId: string): Promise<ReceteDetail | null> {
  const receteRows = await db
    .select()
    .from(receteler)
    .where(eq(receteler.urun_id, urunId))
    .limit(1);
  const recete = receteRows[0];
  if (!recete) return null;

  const items = await db
    .select({
      id: receteKalemleri.id,
      recete_id: receteKalemleri.recete_id,
      urun_id: receteKalemleri.urun_id,
      miktar: receteKalemleri.miktar,
      fire_orani: receteKalemleri.fire_orani,
      aciklama: receteKalemleri.aciklama,
      sira: receteKalemleri.sira,
      created_at: receteKalemleri.created_at,
      updated_at: receteKalemleri.updated_at,
      malzemeKod: urunler.kod,
      malzemeAd: urunler.ad,
      malzemeKategori: urunler.kategori,
      malzemeBirim: urunler.birim,
      malzemeBirimFiyat: urunler.birim_fiyat,
      malzemeGorselUrl: urunler.image_url,
    })
    .from(receteKalemleri)
    .leftJoin(urunler, eq(receteKalemleri.urun_id, urunler.id))
    .where(eq(receteKalemleri.recete_id, recete.id))
    .orderBy(asc(receteKalemleri.sira), asc(receteKalemleri.created_at));

  return { recete, items };
}

export async function repoDelete(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(receteKalemleri).where(eq(receteKalemleri.recete_id, id));
    await tx.delete(receteler).where(eq(receteler.id, id));
  });
}
