import { randomUUID } from 'node:crypto';

import { asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineler } from '@/modules/makine_havuzu/schema';

import { kaliplar, kalipUyumluMakineler, tatilMakineler, tatiller, vardiyalar, durusNedenleri, haftaSonuPlanlari, type KalipRow, type TatilRow, type VardiyaRow, type DurusNedeniRow, type HaftaSonuPlanDtoRow, type HaftaSonuPlanRow } from './schema';
import type { CreateKalipBody, CreateTatilBody, PatchKalipBody, PatchTatilBody, SetKalipUyumluMakinelerBody, CreateVardiyaBody, PatchVardiyaBody, CreateDurusNedeniBody, PatchDurusNedeniBody, CreateHaftaSonuPlanBody, PatchHaftaSonuPlanBody } from './validation';

function toDateOnly(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function toDbDate(value: Date | string): Date {
  return new Date(`${toDateOnly(value)}T12:00:00.000Z`);
}

function isWeekendDate(value: Date | string): boolean {
  const gun = new Date(`${toDateOnly(value)}T12:00:00Z`).getUTCDay();
  return gun === 0 || gun === 6;
}

export async function repoListMakineler() {
  return db.select().from(makineler).orderBy(desc(makineler.created_at));
}

export async function repoListKaliplar(): Promise<KalipRow[]> {
  return db.select().from(kaliplar).orderBy(desc(kaliplar.created_at));
}

export async function repoGetKalipById(id: string): Promise<KalipRow | null> {
  const rows = await db.select().from(kaliplar).where(eq(kaliplar.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreateKalip(body: CreateKalipBody): Promise<KalipRow> {
  const id = randomUUID();
  await db.insert(kaliplar).values({
    id,
    kod: body.kod,
    ad: body.ad,
    aciklama: body.aciklama,
    is_active: typeof body.isActive === 'boolean' ? (body.isActive ? 1 : 0) : undefined,
  });
  const row = await repoGetKalipById(id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdateKalip(id: string, body: PatchKalipBody): Promise<KalipRow | null> {
  const payload: Partial<typeof kaliplar.$inferInsert> = {};
  if (body.kod !== undefined) payload.kod = body.kod;
  if (body.ad !== undefined) payload.ad = body.ad;
  if (body.aciklama !== undefined) payload.aciklama = body.aciklama;
  if (body.isActive !== undefined) payload.is_active = body.isActive ? 1 : 0;
  await db.update(kaliplar).set(payload).where(eq(kaliplar.id, id));
  return repoGetKalipById(id);
}

export async function repoDeleteKalip(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(kalipUyumluMakineler).where(eq(kalipUyumluMakineler.kalip_id, id));
    await tx.delete(kaliplar).where(eq(kaliplar.id, id));
  });
}

export async function repoListUyumluMakineler(kalipId: string) {
  return db
    .select({
      id: kalipUyumluMakineler.id,
      kalipId: kalipUyumluMakineler.kalip_id,
      makineId: kalipUyumluMakineler.makine_id,
    })
    .from(kalipUyumluMakineler)
    .where(eq(kalipUyumluMakineler.kalip_id, kalipId));
}

export async function repoSetUyumluMakineler(kalipId: string, body: SetKalipUyumluMakinelerBody) {
  await db.transaction(async (tx) => {
    await tx.delete(kalipUyumluMakineler).where(eq(kalipUyumluMakineler.kalip_id, kalipId));
    if (body.makineIds.length === 0) return;

    const rows = await tx
      .select({ id: makineler.id })
      .from(makineler)
      .where(inArray(makineler.id, body.makineIds));

    const validMakineIds = new Set(rows.map((row) => row.id));
    const insertRows = body.makineIds
      .filter((makineId) => validMakineIds.has(makineId))
      .map((makineId) => ({
        id: randomUUID(),
        kalip_id: kalipId,
        makine_id: makineId,
      }));

    if (insertRows.length > 0) {
      await tx.insert(kalipUyumluMakineler).values(insertRows);
    }
  });

  return repoListUyumluMakineler(kalipId);
}

export async function repoListTatiller(): Promise<TatilRow[]> {
  return db.select().from(tatiller).orderBy(desc(tatiller.tarih));
}

export async function repoGetTatilById(id: string): Promise<TatilRow | null> {
  const rows = await db.select().from(tatiller).where(eq(tatiller.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreateTatil(body: CreateTatilBody): Promise<TatilRow> {
  const id = randomUUID();
  await db.insert(tatiller).values({
    id,
    ad: body.ad,
    tarih: new Date(body.tarih),
    baslangic_saati: body.baslangicSaati,
    bitis_saati: body.bitisSaati,
    aciklama: body.aciklama,
  });
  const row = await repoGetTatilById(id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdateTatil(id: string, body: PatchTatilBody): Promise<TatilRow | null> {
  const payload: Partial<typeof tatiller.$inferInsert> = {};
  if (body.ad !== undefined) payload.ad = body.ad;
  if (body.tarih !== undefined) payload.tarih = new Date(body.tarih);
  if (body.baslangicSaati !== undefined) payload.baslangic_saati = body.baslangicSaati;
  if (body.bitisSaati !== undefined) payload.bitis_saati = body.bitisSaati;
  if (body.aciklama !== undefined) payload.aciklama = body.aciklama;
  await db.update(tatiller).set(payload).where(eq(tatiller.id, id));
  return repoGetTatilById(id);
}

export async function repoDeleteTatil(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(tatilMakineler).where(eq(tatilMakineler.tatil_id, id));
    await tx.delete(tatiller).where(eq(tatiller.id, id));
  });
}

// ── Vardiyalar ──────────────────────────────────────────────

export async function repoListVardiyalar(): Promise<VardiyaRow[]> {
  return db.select().from(vardiyalar).orderBy(desc(vardiyalar.created_at));
}

export async function repoGetVardiyaById(id: string): Promise<VardiyaRow | null> {
  const rows = await db.select().from(vardiyalar).where(eq(vardiyalar.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreateVardiya(body: CreateVardiyaBody): Promise<VardiyaRow> {
  const id = randomUUID();
  await db.insert(vardiyalar).values({
    id,
    ad: body.ad,
    baslangic_saati: body.baslangicSaati,
    bitis_saati: body.bitisSaati,
    aciklama: body.aciklama,
    is_active: typeof body.isActive === 'boolean' ? (body.isActive ? 1 : 0) : undefined,
  });
  const row = await repoGetVardiyaById(id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdateVardiya(id: string, body: PatchVardiyaBody): Promise<VardiyaRow | null> {
  const payload: Partial<typeof vardiyalar.$inferInsert> = {};
  if (body.ad !== undefined) payload.ad = body.ad;
  if (body.baslangicSaati !== undefined) payload.baslangic_saati = body.baslangicSaati;
  if (body.bitisSaati !== undefined) payload.bitis_saati = body.bitisSaati;
  if (body.aciklama !== undefined) payload.aciklama = body.aciklama;
  if (body.isActive !== undefined) payload.is_active = body.isActive ? 1 : 0;
  await db.update(vardiyalar).set(payload).where(eq(vardiyalar.id, id));
  return repoGetVardiyaById(id);
}

export async function repoDeleteVardiya(id: string): Promise<void> {
  await db.delete(vardiyalar).where(eq(vardiyalar.id, id));
}

// ── Duruş Nedenleri ─────────────────────────────────────────

export async function repoListDurusNedenleri(): Promise<DurusNedeniRow[]> {
  return db.select().from(durusNedenleri).orderBy(asc(durusNedenleri.kategori), asc(durusNedenleri.ad));
}

export async function repoGetDurusNedeniById(id: string): Promise<DurusNedeniRow | null> {
  const rows = await db.select().from(durusNedenleri).where(eq(durusNedenleri.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreateDurusNedeni(body: CreateDurusNedeniBody): Promise<DurusNedeniRow> {
  const id = randomUUID();
  await db.insert(durusNedenleri).values({
    id,
    kod: body.kod,
    ad: body.ad,
    kategori: body.kategori ?? 'diger',
    aciklama: body.aciklama,
    is_active: typeof body.isActive === 'boolean' ? (body.isActive ? 1 : 0) : undefined,
  });
  const row = await repoGetDurusNedeniById(id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdateDurusNedeni(id: string, body: PatchDurusNedeniBody): Promise<DurusNedeniRow | null> {
  const payload: Partial<typeof durusNedenleri.$inferInsert> = {};
  if (body.kod !== undefined) payload.kod = body.kod;
  if (body.ad !== undefined) payload.ad = body.ad;
  if (body.kategori !== undefined) payload.kategori = body.kategori;
  if (body.aciklama !== undefined) payload.aciklama = body.aciklama;
  if (body.isActive !== undefined) payload.is_active = body.isActive ? 1 : 0;
  await db.update(durusNedenleri).set(payload).where(eq(durusNedenleri.id, id));
  return repoGetDurusNedeniById(id);
}

export async function repoDeleteDurusNedeni(id: string): Promise<void> {
  await db.delete(durusNedenleri).where(eq(durusNedenleri.id, id));
}

// ── Hafta Sonu Çalışma Planları ─────────────────────────────

export async function repoListHaftaSonuPlanlari(): Promise<Array<HaftaSonuPlanRow & { makine_ad?: string }>> {
  const rows = await db
    .select({
      id: haftaSonuPlanlari.id,
      hafta_baslangic: haftaSonuPlanlari.hafta_baslangic,
      makine_id: haftaSonuPlanlari.makine_id,
      cumartesi_calisir: haftaSonuPlanlari.cumartesi_calisir,
      pazar_calisir: haftaSonuPlanlari.pazar_calisir,
      aciklama: haftaSonuPlanlari.aciklama,
      created_at: haftaSonuPlanlari.created_at,
      updated_at: haftaSonuPlanlari.updated_at,
      created_by: haftaSonuPlanlari.created_by,
      makine_ad: makineler.ad,
    })
    .from(haftaSonuPlanlari)
    .leftJoin(makineler, eq(haftaSonuPlanlari.makine_id, makineler.id))
    .orderBy(desc(haftaSonuPlanlari.hafta_baslangic), asc(makineler.ad));

  const grouped = new Map<string, HaftaSonuPlanDtoRow & { makine_ad?: string }>();

  for (const row of rows as (HaftaSonuPlanRow & { makine_ad?: string })[]) {
    if (!isWeekendDate(row.hafta_baslangic)) continue;
    const tarih = toDateOnly(row.hafta_baslangic);
    const current = grouped.get(tarih);

    if (!current) {
      grouped.set(tarih, {
        ...row,
        makine_ids: row.makine_id ? [row.makine_id] : [],
        makine_adlari: row.makine_ad ? [row.makine_ad] : [],
      });
      continue;
    }

    if (row.makine_id && !(current.makine_ids ?? []).includes(row.makine_id)) {
      current.makine_ids = [...(current.makine_ids ?? []), row.makine_id];
    }
    if (row.makine_ad && !(current.makine_adlari ?? []).includes(row.makine_ad)) {
      current.makine_adlari = [...(current.makine_adlari ?? []), row.makine_ad];
    }
  }

  return [...grouped.values()] as (HaftaSonuPlanRow & { makine_ad?: string })[];
}

export async function repoGetHaftaSonuPlanById(id: string): Promise<(HaftaSonuPlanRow & { makine_ad?: string }) | null> {
  const [baseRow] = await db
    .select({ tarih: haftaSonuPlanlari.hafta_baslangic })
    .from(haftaSonuPlanlari)
    .where(eq(haftaSonuPlanlari.id, id))
    .limit(1);

  if (!baseRow?.tarih) return null;

  const rows = await db
    .select({
      id: haftaSonuPlanlari.id,
      hafta_baslangic: haftaSonuPlanlari.hafta_baslangic,
      makine_id: haftaSonuPlanlari.makine_id,
      cumartesi_calisir: haftaSonuPlanlari.cumartesi_calisir,
      pazar_calisir: haftaSonuPlanlari.pazar_calisir,
      aciklama: haftaSonuPlanlari.aciklama,
      created_at: haftaSonuPlanlari.created_at,
      updated_at: haftaSonuPlanlari.updated_at,
      created_by: haftaSonuPlanlari.created_by,
      makine_ad: makineler.ad,
    })
    .from(haftaSonuPlanlari)
    .leftJoin(makineler, eq(haftaSonuPlanlari.makine_id, makineler.id))
    .where(eq(haftaSonuPlanlari.hafta_baslangic, baseRow.tarih))
    .orderBy(asc(makineler.ad));

  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    makine_ad: row.makine_ad ?? undefined,
    makine_ids: rows.map((item) => item.makine_id).filter((value): value is string => Boolean(value)),
    makine_adlari: rows.map((item) => item.makine_ad).filter((value): value is string => Boolean(value)),
  } as HaftaSonuPlanRow & { makine_ad?: string };
}

export async function repoCreateHaftaSonuPlan(body: CreateHaftaSonuPlanBody, userId?: string): Promise<HaftaSonuPlanRow & { makine_ad?: string }> {
  const hedefTarih = toDbDate(body.haftaBaslangic);
  const hedefTarihStr = toDateOnly(body.haftaBaslangic);
  const isSaturday = new Date(`${body.haftaBaslangic}T12:00:00Z`).getUTCDay() === 6;

  await db.transaction(async (tx) => {
    await tx.delete(haftaSonuPlanlari).where(sql`date(${haftaSonuPlanlari.hafta_baslangic}) = ${hedefTarihStr}`);
    await tx.insert(haftaSonuPlanlari).values(
      body.makineIds.map((makineId) => ({
        id: randomUUID(),
        hafta_baslangic: hedefTarih,
        makine_id: makineId,
        cumartesi_calisir: isSaturday ? 1 : 0,
        pazar_calisir: isSaturday ? 0 : 1,
        aciklama: body.aciklama,
        created_by: userId,
      })),
    );
  });

  const [inserted] = await db
    .select({ id: haftaSonuPlanlari.id })
    .from(haftaSonuPlanlari)
    .where(sql`date(${haftaSonuPlanlari.hafta_baslangic}) = ${hedefTarihStr}`)
    .limit(1);
  const row = inserted ? await repoGetHaftaSonuPlanById(inserted.id) : null;
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdateHaftaSonuPlan(id: string, body: PatchHaftaSonuPlanBody): Promise<(HaftaSonuPlanRow & { makine_ad?: string }) | null> {
  const current = await repoGetHaftaSonuPlanById(id);
  if (!current) return null;

  const hedefTarihStr = body.haftaBaslangic ?? toDateOnly(current.hafta_baslangic);
  const hedefTarih = toDbDate(hedefTarihStr);
  const eskiTarih = toDateOnly(current.hafta_baslangic);
  const currentMakineIds = (current as unknown as HaftaSonuPlanDtoRow).makine_ids
    ?? (current.makine_id ? [current.makine_id] : []);
  const makineIds = body.makineIds ?? currentMakineIds;
  const aciklama = body.aciklama !== undefined ? body.aciklama : current.aciklama;
  const isSaturday = new Date(`${hedefTarihStr}T12:00:00Z`).getUTCDay() === 6;

  await db.transaction(async (tx) => {
    await tx.delete(haftaSonuPlanlari).where(sql`date(${haftaSonuPlanlari.hafta_baslangic}) = ${eskiTarih}`);
    await tx.insert(haftaSonuPlanlari).values(
      makineIds.map((makineId) => ({
        id: randomUUID(),
        hafta_baslangic: hedefTarih,
        makine_id: makineId,
        cumartesi_calisir: isSaturday ? 1 : 0,
        pazar_calisir: isSaturday ? 0 : 1,
        aciklama,
        created_by: current.created_by ?? null,
      })),
    );
  });

  const [updated] = await db
    .select({ id: haftaSonuPlanlari.id })
    .from(haftaSonuPlanlari)
    .where(sql`date(${haftaSonuPlanlari.hafta_baslangic}) = ${hedefTarihStr}`)
    .limit(1);
  return updated ? repoGetHaftaSonuPlanById(updated.id) : null;
}

export async function repoDeleteHaftaSonuPlan(id: string): Promise<void> {
  const current = await repoGetHaftaSonuPlanById(id);
  if (!current) return;
  await db.delete(haftaSonuPlanlari).where(sql`date(${haftaSonuPlanlari.hafta_baslangic}) = ${toDateOnly(current.hafta_baslangic)}`);
}

/**
 * Belirli tarih için hafta sonu çalışma planını getir.
 * makineId null ise genel plan, doluysa makine-özel plan.
 */
export async function repoGetHaftaSonuPlanByDate(
  tarih: Date,
  makineId?: string | null,
): Promise<{ calisiyor: boolean } | null> {
  if (!makineId) return null;

  const tarihStr = toDateOnly(tarih);
  const rows = await db
    .select({ makine_id: haftaSonuPlanlari.makine_id })
    .from(haftaSonuPlanlari)
    .where(sql`date(${haftaSonuPlanlari.hafta_baslangic}) = ${tarihStr}`)
    .limit(200);

  if (rows.length === 0) return null;
  return { calisiyor: rows.some((row) => row.makine_id === makineId) };
}
