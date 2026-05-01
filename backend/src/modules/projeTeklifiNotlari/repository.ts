import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, like, or, sql } from 'drizzle-orm';

import { db } from '@/db/client';

import { projeTeklifiNotlari, type ProjeTeklifiNotRow } from './schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

export async function repoList(
  q: ListQuery,
): Promise<{ items: ProjeTeklifiNotRow[]; total: number }> {
  const conds = [] as ReturnType<typeof eq>[];

  if (q.dokumanKey) conds.push(eq(projeTeklifiNotlari.dokuman_key, q.dokumanKey));
  if (q.notTipi) conds.push(eq(projeTeklifiNotlari.not_tipi, q.notTipi));
  if (q.oncelik) conds.push(eq(projeTeklifiNotlari.oncelik, q.oncelik));
  if (q.durum) conds.push(eq(projeTeklifiNotlari.durum, q.durum));
  if (q.q) {
    const searchClause = or(
      like(projeTeklifiNotlari.baslik, `%${q.q}%`),
      like(projeTeklifiNotlari.icerik, `%${q.q}%`),
    );
    if (searchClause) conds.push(searchClause as ReturnType<typeof eq>);
  }

  const where = conds.length ? and(...conds) : undefined;
  const orderColMap = {
    created_at: projeTeklifiNotlari.created_at,
    updated_at: projeTeklifiNotlari.updated_at,
    oncelik: projeTeklifiNotlari.oncelik,
  } as const;
  const orderCol = orderColMap[q.sort];
  const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(projeTeklifiNotlari)
      .where(where)
      .orderBy(orderDir)
      .limit(q.limit)
      .offset(q.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projeTeklifiNotlari)
      .where(where),
  ]);

  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<ProjeTeklifiNotRow | null> {
  const rows = await db
    .select()
    .from(projeTeklifiNotlari)
    .where(eq(projeTeklifiNotlari.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function repoCreate(
  data: CreateBody,
  createdByUserId: string | null,
): Promise<ProjeTeklifiNotRow> {
  const id = randomUUID();
  await db.insert(projeTeklifiNotlari).values({
    id,
    dokuman_key: data.dokumanKey,
    dokuman_baslik: data.dokumanBaslik ?? null,
    not_tipi: data.notTipi,
    baslik: data.baslik ?? null,
    icerik: data.icerik,
    etiketler: data.etiketler ?? null,
    oncelik: data.oncelik,
    durum: data.durum,
    created_by_user_id: createdByUserId,
    updated_by_user_id: createdByUserId,
  });

  const row = await repoGetById(id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdate(
  id: string,
  patch: PatchBody,
  updatedByUserId: string | null,
): Promise<ProjeTeklifiNotRow | null> {
  const update: Partial<typeof projeTeklifiNotlari.$inferInsert> = {
    updated_by_user_id: updatedByUserId,
  };
  if (patch.dokumanKey !== undefined) update.dokuman_key = patch.dokumanKey;
  if (patch.dokumanBaslik !== undefined) update.dokuman_baslik = patch.dokumanBaslik;
  if (patch.notTipi !== undefined) update.not_tipi = patch.notTipi;
  if (patch.baslik !== undefined) update.baslik = patch.baslik;
  if (patch.icerik !== undefined) update.icerik = patch.icerik;
  if (patch.etiketler !== undefined) update.etiketler = patch.etiketler;
  if (patch.oncelik !== undefined) update.oncelik = patch.oncelik;
  if (patch.durum !== undefined) update.durum = patch.durum;

  await db.update(projeTeklifiNotlari).set(update).where(eq(projeTeklifiNotlari.id, id));
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.delete(projeTeklifiNotlari).where(eq(projeTeklifiNotlari.id, id));
}

export async function repoStats(): Promise<{
  total: number;
  byDurum: Record<string, number>;
  byOncelik: Record<string, number>;
  byDokuman: Array<{ dokumanKey: string; count: number }>;
}> {
  const [totalRow, durumRows, oncelikRows, dokumanRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(projeTeklifiNotlari),
    db
      .select({
        durum: projeTeklifiNotlari.durum,
        count: sql<number>`count(*)`,
      })
      .from(projeTeklifiNotlari)
      .groupBy(projeTeklifiNotlari.durum),
    db
      .select({
        oncelik: projeTeklifiNotlari.oncelik,
        count: sql<number>`count(*)`,
      })
      .from(projeTeklifiNotlari)
      .groupBy(projeTeklifiNotlari.oncelik),
    db
      .select({
        dokumanKey: projeTeklifiNotlari.dokuman_key,
        count: sql<number>`count(*)`,
      })
      .from(projeTeklifiNotlari)
      .groupBy(projeTeklifiNotlari.dokuman_key)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(20),
  ]);

  const byDurum: Record<string, number> = {};
  for (const r of durumRows) byDurum[r.durum] = Number(r.count);

  const byOncelik: Record<string, number> = {};
  for (const r of oncelikRows) byOncelik[r.oncelik] = Number(r.count);

  return {
    total: Number(totalRow[0]?.count ?? 0),
    byDurum,
    byOncelik,
    byDokuman: dokumanRows.map((r) => ({ dokumanKey: r.dokumanKey, count: Number(r.count) })),
  };
}
