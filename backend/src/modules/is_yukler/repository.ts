import { randomUUID } from 'node:crypto';

import { and, asc, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineKuyrugu, makineler } from '@/modules/makine_havuzu/schema';
import { uretimEmirleri, uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';
import { recalcMakineKuyrukTarihleri } from '@/modules/_shared/planlama';

import type { IsYukuDto } from './schema';
import type { CreateBody, ListQuery, PatchBody } from './validation';

type QueueJoinRow = {
  kuyrukId: string;
  makineId: string;
  makineKod: string;
  makineAd: string;
  uretimEmriId: string;
  emirNo: string;
  urunKod: string | null;
  urunAd: string | null;
  operasyonAdi: string | null;
  musteriAd: string | null;
  sira: number;
  planlananSureDk: number;
  hazirlikSuresiDk: number;
  planlananMiktar: string | number | null;
  uretilenMiktar: string | number | null;
  fireMiktar: string | number | null;
  montaj: number;
  terminTarihi: Date | string | null;
  planlananBaslangic: Date | string | null;
  planlananBitis: Date | string | null;
  durum: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  emirOperasyonId: string | null;
  isMultiOp: number | boolean;
};

function toDateTimeString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toDateString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toDto(row: QueueJoinRow): IsYukuDto {
  return {
    kuyrukId: row.kuyrukId,
    makineId: row.makineId,
    makineKod: row.makineKod,
    makineAd: row.makineAd,
    uretimEmriId: row.uretimEmriId,
    emirNo: row.emirNo,
    urunKod: row.urunKod,
    urunAd: row.urunAd,
    operasyonAdi: row.operasyonAdi,
    musteriAd: row.musteriAd,
    sira: Number(row.sira),
    planlananSureDk: Number(row.planlananSureDk),
    hazirlikSuresiDk: Number(row.hazirlikSuresiDk),
    planlananMiktar: Number(row.planlananMiktar),
    uretilenMiktar: Number(row.uretilenMiktar),
    fireMiktar: Number(row.fireMiktar),
    montaj: row.montaj === 1,
    terminTarihi: toDateString(row.terminTarihi),
    planlananBaslangic: toDateTimeString(row.planlananBaslangic),
    planlananBitis: toDateTimeString(row.planlananBitis),
    durum: row.durum,
    isMultiOp: row.isMultiOp === 1 || row.isMultiOp === true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function selectQueue(where?: SQL) {
  return db
    .select({
      kuyrukId: makineKuyrugu.id,
      makineId: makineler.id,
      makineKod: makineler.kod,
      makineAd: makineler.ad,
      uretimEmriId: uretimEmirleri.id,
      emirNo: uretimEmirleri.emir_no,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
      musteriAd: uretimEmirleri.musteri_ozet,
      sira: makineKuyrugu.sira,
      planlananSureDk: makineKuyrugu.planlanan_sure_dk,
      hazirlikSuresiDk: makineKuyrugu.hazirlik_suresi_dk,
      planlananMiktar: uretimEmriOperasyonlari.planlanan_miktar,
      uretilenMiktar: uretimEmriOperasyonlari.uretilen_miktar,
      fireMiktar: uretimEmriOperasyonlari.fire_miktar,
      montaj: uretimEmriOperasyonlari.montaj,
      terminTarihi: uretimEmirleri.termin_tarihi,
      planlananBaslangic: makineKuyrugu.planlanan_baslangic,
      planlananBitis: makineKuyrugu.planlanan_bitis,
      durum: makineKuyrugu.durum,
      createdAt: makineKuyrugu.created_at,
      updatedAt: makineKuyrugu.updated_at,
      emirOperasyonId: makineKuyrugu.emir_operasyon_id,
      isMultiOp: sql<number>`(SELECT COUNT(*) FROM uretim_emri_operasyonlari WHERE uretim_emri_id = ${uretimEmirleri.id}) > 1`,
    })
    .from(makineKuyrugu)
    .innerJoin(makineler, eq(makineKuyrugu.makine_id, makineler.id))
    .innerJoin(uretimEmirleri, eq(makineKuyrugu.uretim_emri_id, uretimEmirleri.id))
    .leftJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .leftJoin(uretimEmriOperasyonlari, eq(makineKuyrugu.emir_operasyon_id, uretimEmriOperasyonlari.id))
    .where(where)
    .orderBy(asc(makineler.kod), asc(makineKuyrugu.sira))
    .$dynamic();
}

// recalcMakineKuyrukTarihleri artik _shared/planlama.ts'den import ediliyor

async function resequenceMakine(tx: any, makineId: string, currentIds?: string[]) {
  const rows = currentIds
    ? currentIds.map((id) => ({ id }))
    : await tx
        .select({ id: makineKuyrugu.id })
        .from(makineKuyrugu)
        .where(eq(makineKuyrugu.makine_id, makineId))
        .orderBy(asc(makineKuyrugu.sira));

  // Unique constraint (makine_id, sira) oldugu icin once yuksek offset'e tasi
  const offset = 10_000;
  for (const [index, row] of rows.entries()) {
    await tx
      .update(makineKuyrugu)
      .set({ sira: index + 1 + offset })
      .where(eq(makineKuyrugu.id, row.id));
  }
  // Sonra gercek siralara guncelle
  for (const [index, row] of rows.entries()) {
    await tx
      .update(makineKuyrugu)
      .set({ sira: index + 1 })
      .where(eq(makineKuyrugu.id, row.id));
  }
}

export async function repoList(query: ListQuery): Promise<IsYukuDto[]> {
  const conditions: SQL[] = [];
  if (query.makineId) conditions.push(eq(makineKuyrugu.makine_id, query.makineId));
  // Varsayilan: tamamlandi + iptal gizle, toggle ile goster
  if (!query.tamamlananlariGoster) {
    conditions.push(sql`${makineKuyrugu.durum} NOT IN ('tamamlandi', 'iptal')`);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await selectQueue(where).limit(query.limit).offset(query.offset);
  return rows.map((row) => toDto(row as QueueJoinRow));
}

export async function repoGetById(id: string): Promise<IsYukuDto | null> {
  const rows = await selectQueue(eq(makineKuyrugu.id, id)).limit(1);
  return rows[0] ? toDto(rows[0] as QueueJoinRow) : null;
}

function mapCreateInput(data: CreateBody): typeof makineKuyrugu.$inferInsert {
  return {
    id: randomUUID(),
    makine_id: data.makineId,
    uretim_emri_id: data.uretimEmriId,
    sira: data.sira,
    planlanan_sure_dk: data.planlananSureDk,
    durum: data.durum,
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof makineKuyrugu.$inferInsert> {
  const payload: Partial<typeof makineKuyrugu.$inferInsert> = {};
  if (data.makineId !== undefined) payload.makine_id = data.makineId;
  if (data.uretimEmriId !== undefined) payload.uretim_emri_id = data.uretimEmriId;
  if (data.sira !== undefined) payload.sira = data.sira;
  if (data.planlananSureDk !== undefined) payload.planlanan_sure_dk = data.planlananSureDk;
  if (data.durum !== undefined) payload.durum = data.durum;
  return payload;
}

export async function repoCreate(data: CreateBody): Promise<IsYukuDto> {
  const payload = mapCreateInput(data);
  await db.insert(makineKuyrugu).values(payload);
  await recalcMakineKuyrukTarihleri(payload.makine_id);
  const row = await repoGetById(payload.id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdate(id: string, data: PatchBody): Promise<IsYukuDto | null> {
  const [existing] = await db
    .select({
      id: makineKuyrugu.id,
      makineId: makineKuyrugu.makine_id,
      sira: makineKuyrugu.sira,
      emirOperasyonId: makineKuyrugu.emir_operasyon_id,
    })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, id))
    .limit(1);

  if (!existing) return null;

  const targetMakineId = data.makineId ?? existing.makineId;
  const targetSira = Math.max(1, data.sira ?? existing.sira);
  const movingBetweenMachines = targetMakineId !== existing.makineId;
  const movingInsideQueue = targetSira !== existing.sira;
  const payload = mapPatchInput(data);

  await db.transaction(async (tx) => {
    if (movingBetweenMachines || movingInsideQueue) {
      const sourceRows = await tx
        .select({ id: makineKuyrugu.id })
        .from(makineKuyrugu)
        .where(and(eq(makineKuyrugu.makine_id, existing.makineId), sql`${makineKuyrugu.id} != ${id}`))
        .orderBy(asc(makineKuyrugu.sira));

      const targetRows = movingBetweenMachines
        ? await tx
            .select({ id: makineKuyrugu.id })
            .from(makineKuyrugu)
            .where(eq(makineKuyrugu.makine_id, targetMakineId))
            .orderBy(asc(makineKuyrugu.sira))
        : sourceRows;

      const targetIds = targetRows.map((row) => row.id);
      const insertAt = Math.min(Math.max(targetSira - 1, 0), targetIds.length);
      if (!movingBetweenMachines) {
        targetIds.splice(insertAt, 0, id);
      } else {
        targetIds.splice(insertAt, 0, id);
      }

      await tx
        .update(makineKuyrugu)
        .set({ ...payload, makine_id: targetMakineId, sira: 9999 })
        .where(eq(makineKuyrugu.id, id));

      if (existing.emirOperasyonId && movingBetweenMachines) {
        await tx
          .update(uretimEmriOperasyonlari)
          .set({ makine_id: targetMakineId })
          .where(eq(uretimEmriOperasyonlari.id, existing.emirOperasyonId));
      }

      await resequenceMakine(tx, existing.makineId, sourceRows.map((row) => row.id));

      if (movingBetweenMachines) {
        await resequenceMakine(tx, targetMakineId, targetIds);
      } else {
        await resequenceMakine(tx, existing.makineId, targetIds);
      }
      return;
    }

    await tx.update(makineKuyrugu).set(payload).where(eq(makineKuyrugu.id, id));
  });

  await recalcMakineKuyrukTarihleri(existing.makineId);
  if (movingBetweenMachines) {
    await recalcMakineKuyrukTarihleri(targetMakineId);
  }

  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  const [existing] = await db
    .select({
      id: makineKuyrugu.id,
      makineId: makineKuyrugu.makine_id,
      emirOperasyonId: makineKuyrugu.emir_operasyon_id,
    })
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, id))
    .limit(1);

  if (!existing) return;

  await db.transaction(async (tx) => {
    if (existing.emirOperasyonId) {
      await tx
        .update(uretimEmriOperasyonlari)
        .set({
          makine_id: null,
          planlanan_baslangic: null,
          planlanan_bitis: null,
        })
        .where(eq(uretimEmriOperasyonlari.id, existing.emirOperasyonId));
    }

    await tx.delete(makineKuyrugu).where(eq(makineKuyrugu.id, id));
    await resequenceMakine(tx, existing.makineId);
  });

  await recalcMakineKuyrukTarihleri(existing.makineId);
}
