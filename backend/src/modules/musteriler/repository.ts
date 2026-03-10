import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';

import { musteriler, type MusteriRow } from './schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

type ListResult = {
  items: MusteriRow[];
  total: number;
};

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      sql`(${musteriler.ad} LIKE ${pattern} OR ${musteriler.kod} LIKE ${pattern} OR ${musteriler.ilgili_kisi} LIKE ${pattern} OR ${musteriler.email} LIKE ${pattern})`,
    );
  }
  if (query.tur) {
    conditions.push(eq(musteriler.tur, query.tur));
  }
  if (typeof query.isActive === 'boolean') {
    conditions.push(eq(musteriler.is_active, query.isActive ? 1 : 0));
  }

  if (conditions.length === 0) {
    return undefined;
  }
  if (conditions.length === 1) {
    return conditions[0];
  }
  return and(...conditions);
}

async function generateMusteriKod(tur: 'musteri' | 'tedarikci'): Promise<string> {
  const prefix = tur === 'tedarikci' ? 'TED' : 'MUS';
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(musteriler)
    .where(eq(musteriler.tur, tur));
  const next = Number(countResult?.count ?? 0) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export async function repoGetNextKod(tur: 'musteri' | 'tedarikci'): Promise<string> {
  return generateMusteriKod(tur);
}

async function mapCreateInput(data: CreateBody): Promise<typeof musteriler.$inferInsert> {
  const kod = data.kod?.trim() || await generateMusteriKod(data.tur);
  return {
    id: randomUUID(),
    tur: data.tur,
    kod,
    ad: data.ad,
    ilgili_kisi: data.ilgiliKisi,
    telefon: data.telefon,
    email: data.email,
    adres: data.adres,
    cari_kodu: data.cariKodu,
    sevkiyat_notu: data.sevkiyatNotu,
    iskonto: typeof data.iskonto === 'number' ? data.iskonto.toFixed(2) : undefined,
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof musteriler.$inferInsert> {
  const payload: Partial<typeof musteriler.$inferInsert> = {};
  if (data.tur !== undefined) payload.tur = data.tur;
  if (data.kod !== undefined) payload.kod = data.kod;
  if (data.ad !== undefined) payload.ad = data.ad;
  if (data.ilgiliKisi !== undefined) payload.ilgili_kisi = data.ilgiliKisi;
  if (data.telefon !== undefined) payload.telefon = data.telefon;
  if (data.email !== undefined) payload.email = data.email;
  if (data.adres !== undefined) payload.adres = data.adres;
  if (data.cariKodu !== undefined) payload.cari_kodu = data.cariKodu;
  if (data.sevkiyatNotu !== undefined) payload.sevkiyat_notu = data.sevkiyatNotu;
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
      .select()
      .from(musteriler)
      .where(where)
      .orderBy(orderDirection)
      .limit(query.limit)
      .offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(musteriler).where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<MusteriRow | null> {
  const rows = await db.select().from(musteriler).where(eq(musteriler.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreate(data: CreateBody): Promise<MusteriRow> {
  const payload = await mapCreateInput(data);

  await db.insert(musteriler).values(payload);

  const row = await repoGetById(payload.id);
  if (!row) {
    throw new Error('insert_failed');
  }
  return row;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<MusteriRow | null> {
  const payload = mapPatchInput(patch);
  await db.update(musteriler).set(payload).where(eq(musteriler.id, id));
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.delete(musteriler).where(eq(musteriler.id, id));
}
