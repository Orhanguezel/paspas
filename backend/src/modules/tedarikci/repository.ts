import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { satinAlmaSiparisleri } from '@/modules/satin_alma/schema';

import { musteriler, type TedarikciRow } from './schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

type ListResult = {
  items: Array<TedarikciRow & {
    toplam_siparis: number;
    acik_siparis: number;
    son_siparis_tarihi: Date | string | null;
  }>;
  total: number;
};

// Her sorguya tur='tedarikci' filtresi eklenir
function buildWhere(query: ListQuery): SQL {
  const conditions: SQL[] = [eq(musteriler.tur, 'tedarikci')];

  if (query.q) {
    conditions.push(sql`(${musteriler.ad} LIKE ${`%${query.q}%`} OR ${musteriler.kod} LIKE ${`%${query.q}%`} OR ${musteriler.email} LIKE ${`%${query.q}%`})`);
  }
  if (typeof query.isActive === 'boolean') {
    conditions.push(eq(musteriler.is_active, query.isActive ? 1 : 0));
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions)!;
}

function mapCreateInput(data: CreateBody): typeof musteriler.$inferInsert {
  return {
    id: randomUUID(),
    tur: 'tedarikci',
    kod: data.kod,
    ad: data.ad,
    ilgili_kisi: data.ilgiliKisi,
    telefon: data.telefon,
    email: data.email,
    adres: data.adres,
    iskonto: typeof data.iskonto === 'number' ? data.iskonto.toFixed(2) : undefined,
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof musteriler.$inferInsert> {
  const payload: Partial<typeof musteriler.$inferInsert> = {};
  if (data.kod !== undefined) payload.kod = data.kod;
  if (data.ad !== undefined) payload.ad = data.ad;
  if (data.ilgiliKisi !== undefined) payload.ilgili_kisi = data.ilgiliKisi;
  if (data.telefon !== undefined) payload.telefon = data.telefon;
  if (data.email !== undefined) payload.email = data.email;
  if (data.adres !== undefined) payload.adres = data.adres;
  if (data.iskonto !== undefined) payload.iskonto = data.iskonto.toFixed(2);
  if (data.isActive !== undefined) payload.is_active = data.isActive ? 1 : 0;
  return payload;
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderColumn = query.sort === 'ad' ? musteriler.ad : musteriler.created_at;
  const orderDirection = query.order === 'asc' ? asc(orderColumn) : desc(orderColumn);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: musteriler.id,
        tur: musteriler.tur,
        kod: musteriler.kod,
        ad: musteriler.ad,
        ilgili_kisi: musteriler.ilgili_kisi,
        telefon: musteriler.telefon,
        email: musteriler.email,
        adres: musteriler.adres,
        cari_kodu: musteriler.cari_kodu,
        sevkiyat_notu: musteriler.sevkiyat_notu,
        iskonto: musteriler.iskonto,
        is_active: musteriler.is_active,
        created_at: musteriler.created_at,
        updated_at: musteriler.updated_at,
        toplam_siparis: sql<number>`count(${satinAlmaSiparisleri.id})`,
        acik_siparis: sql<number>`sum(case when ${satinAlmaSiparisleri.durum} in ('taslak', 'onaylandi', 'siparis_verildi', 'kismen_teslim') then 1 else 0 end)`,
        son_siparis_tarihi: sql<Date | string | null>`max(${satinAlmaSiparisleri.siparis_tarihi})`,
      })
      .from(musteriler)
      .leftJoin(satinAlmaSiparisleri, eq(satinAlmaSiparisleri.tedarikci_id, musteriler.id))
      .where(where)
      .groupBy(musteriler.id)
      .orderBy(orderDirection)
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(musteriler).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<TedarikciRow | null> {
  const rows = await db
    .select({
      id: musteriler.id,
      tur: musteriler.tur,
      kod: musteriler.kod,
      ad: musteriler.ad,
      ilgili_kisi: musteriler.ilgili_kisi,
      telefon: musteriler.telefon,
      email: musteriler.email,
      adres: musteriler.adres,
      cari_kodu: musteriler.cari_kodu,
      sevkiyat_notu: musteriler.sevkiyat_notu,
      iskonto: musteriler.iskonto,
      is_active: musteriler.is_active,
      created_at: musteriler.created_at,
      updated_at: musteriler.updated_at,
      toplam_siparis: sql<number>`count(${satinAlmaSiparisleri.id})`,
      acik_siparis: sql<number>`sum(case when ${satinAlmaSiparisleri.durum} in ('taslak', 'onaylandi', 'siparis_verildi', 'kismen_teslim') then 1 else 0 end)`,
      son_siparis_tarihi: sql<Date | string | null>`max(${satinAlmaSiparisleri.siparis_tarihi})`,
    })
    .from(musteriler)
    .leftJoin(satinAlmaSiparisleri, eq(satinAlmaSiparisleri.tedarikci_id, musteriler.id))
    .where(and(eq(musteriler.id, id), eq(musteriler.tur, 'tedarikci')))
    .groupBy(musteriler.id)
    .limit(1);
  return (rows[0] as TedarikciRow | null) ?? null;
}

export async function repoCreate(data: CreateBody): Promise<TedarikciRow> {
  const payload = mapCreateInput(data);
  await db.insert(musteriler).values(payload);

  const row = await repoGetById(payload.id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<TedarikciRow | null> {
  const payload = mapPatchInput(patch);
  await db
    .update(musteriler)
    .set(payload)
    .where(and(eq(musteriler.id, id), eq(musteriler.tur, 'tedarikci')));
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db
    .delete(musteriler)
    .where(and(eq(musteriler.id, id), eq(musteriler.tur, 'tedarikci')));
}
