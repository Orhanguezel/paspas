import { and, asc, desc, eq, gte, lte, ne } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineler } from '@/modules/makine_havuzu/schema';

import {
  createMakineKapaliAralikId,
  makineKapaliAraliklar,
  type MakineKapaliAralikRow,
} from './schema';
import type {
  CreateMakineKapaliAralikBody,
  ListMakineKapaliAraliklarQuery,
  PatchMakineKapaliAralikBody,
} from './validation';

export type MakineKapaliAralikJoinedRow = MakineKapaliAralikRow & {
  makineKod?: string | null;
  makineAd?: string | null;
};

function todayDateOnly(value = new Date()): string {
  return value.toISOString().slice(0, 10);
}

function toDateOnly(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toDbDate(value: Date | string): Date {
  return new Date(`${toDateOnly(value)}T12:00:00.000Z`);
}

async function repoGetRawById(id: string): Promise<MakineKapaliAralikRow | null> {
  const rows = await db
    .select()
    .from(makineKapaliAraliklar)
    .where(eq(makineKapaliAraliklar.id, id))
    .limit(1);
  return rows[0] ?? null;
}

async function ensureNoOverlap(
  makineId: string,
  baslangicTarih: string,
  bitisTarih: string,
  excludeId?: string,
): Promise<void> {
  const conditions = [
    eq(makineKapaliAraliklar.makine_id, makineId),
    lte(makineKapaliAraliklar.baslangic_tarih, toDbDate(bitisTarih)),
    gte(makineKapaliAraliklar.bitis_tarih, toDbDate(baslangicTarih)),
  ];
  if (excludeId) conditions.push(ne(makineKapaliAraliklar.id, excludeId));

  const rows = await db
    .select({ id: makineKapaliAraliklar.id })
    .from(makineKapaliAraliklar)
    .where(and(...conditions))
    .limit(1);

  if (rows[0]) throw new Error('cakisan_aralik');
}

export async function repoList(
  query: ListMakineKapaliAraliklarQuery,
): Promise<MakineKapaliAralikJoinedRow[]> {
  const conditions = query.makineId ? [eq(makineKapaliAraliklar.makine_id, query.makineId)] : [];
  const rows = await db
    .select({
      aralik: makineKapaliAraliklar,
      makineKod: makineler.kod,
      makineAd: makineler.ad,
    })
    .from(makineKapaliAraliklar)
    .leftJoin(makineler, eq(makineKapaliAraliklar.makine_id, makineler.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(makineKapaliAraliklar.baslangic_tarih), asc(makineler.kod));

  return rows.map((row) => ({ ...row.aralik, makineKod: row.makineKod, makineAd: row.makineAd }));
}

export async function repoGetById(id: string): Promise<MakineKapaliAralikJoinedRow | null> {
  const rows = await db
    .select({
      aralik: makineKapaliAraliklar,
      makineKod: makineler.kod,
      makineAd: makineler.ad,
    })
    .from(makineKapaliAraliklar)
    .leftJoin(makineler, eq(makineKapaliAraliklar.makine_id, makineler.id))
    .where(eq(makineKapaliAraliklar.id, id))
    .limit(1);
  const row = rows[0];
  return row ? { ...row.aralik, makineKod: row.makineKod, makineAd: row.makineAd } : null;
}

export async function repoCreate(
  body: CreateMakineKapaliAralikBody,
  createdByUserId: string | null,
): Promise<MakineKapaliAralikJoinedRow> {
  await ensureNoOverlap(body.makineId, body.baslangicTarih, body.bitisTarih);
  const id = createMakineKapaliAralikId();
  await db.insert(makineKapaliAraliklar).values({
    id,
    makine_id: body.makineId,
    baslangic_tarih: toDbDate(body.baslangicTarih),
    bitis_tarih: toDbDate(body.bitisTarih),
    aciklama: body.aciklama?.trim() || null,
    created_by_user_id: createdByUserId,
  });
  const row = await repoGetById(id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdate(
  id: string,
  body: PatchMakineKapaliAralikBody,
): Promise<MakineKapaliAralikJoinedRow | null> {
  const current = await repoGetRawById(id);
  if (!current) return null;

  const nextMakineId = body.makineId ?? current.makine_id;
  const nextBaslangic = body.baslangicTarih ?? toDateOnly(current.baslangic_tarih);
  const nextBitis = body.bitisTarih ?? toDateOnly(current.bitis_tarih);
  if (nextBaslangic > nextBitis) throw new Error('bitis_tarihi_baslangictan_once_olamaz');
  await ensureNoOverlap(nextMakineId, nextBaslangic, nextBitis, id);

  const payload: Partial<typeof makineKapaliAraliklar.$inferInsert> = {};
  if (body.makineId !== undefined) payload.makine_id = body.makineId;
  if (body.baslangicTarih !== undefined) payload.baslangic_tarih = toDbDate(body.baslangicTarih);
  if (body.bitisTarih !== undefined) payload.bitis_tarih = toDbDate(body.bitisTarih);
  if (body.aciklama !== undefined) payload.aciklama = body.aciklama?.trim() || null;

  await db.update(makineKapaliAraliklar).set(payload).where(eq(makineKapaliAraliklar.id, id));
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.delete(makineKapaliAraliklar).where(eq(makineKapaliAraliklar.id, id));
}

export async function repoGetActiveForMachine(
  makineId: string,
  value = new Date(),
): Promise<MakineKapaliAralikRow | null> {
  const date = todayDateOnly(value);
  const rows = await db
    .select()
    .from(makineKapaliAraliklar)
    .where(
      and(
        eq(makineKapaliAraliklar.makine_id, makineId),
        lte(makineKapaliAraliklar.baslangic_tarih, toDbDate(date)),
        gte(makineKapaliAraliklar.bitis_tarih, toDbDate(date)),
      ),
    )
    .orderBy(desc(makineKapaliAraliklar.bitis_tarih))
    .limit(1);
  return rows[0] ?? null;
}

export function createPlannedClosureError(row: MakineKapaliAralikRow): Error {
  const label = row.aciklama?.trim() || 'Planlı kapalı';
  const bitis = String(row.bitis_tarih).slice(0, 10);
  const error = new Error('makine_planli_kapali');
  (error as Error & { detail?: string }).detail = `${label} — ${bitis} tarihine kadar`;
  return error;
}
