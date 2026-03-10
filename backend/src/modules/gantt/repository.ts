import { and, asc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { uretimEmirleri } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';

import type { GanttItemDto } from './schema';
import type { ListQuery, PatchBody } from './validation';

type QueryRow = {
  id: string;
  emir_no: string;
  urun_id: string;
  musteri_ozet: string | null;
  planlanan_miktar: string;
  uretilen_miktar: string;
  baslangic_tarihi: Date | null;
  bitis_tarihi: Date | null;
  termin_tarihi: Date | null;
  durum: string;
  urunKod: string | null;
  urunAd: string | null;
  montaj: number | boolean | null;
  operasyonOzet: string | null;
};

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.dateFrom) conditions.push(gte(uretimEmirleri.baslangic_tarihi, new Date(query.dateFrom)));
  if (query.dateTo) conditions.push(lte(uretimEmirleri.bitis_tarihi, new Date(query.dateTo)));
  if (query.durum) conditions.push(eq(uretimEmirleri.durum, query.durum));
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        like(uretimEmirleri.emir_no, pattern),
        like(urunler.kod, pattern),
        like(urunler.ad, pattern),
      ) as SQL,
    );
  }
  if (query.makineId) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM uretim_emri_operasyonlari op WHERE op.uretim_emri_id = ${uretimEmirleri.id} AND op.makine_id = ${query.makineId})`,
    );
  }
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export async function repoList(query: ListQuery): Promise<{ items: GanttItemDto[]; total: number }> {
  const where = buildWhere(query);

  const montajSubquery = sql<number>`(SELECT COUNT(*) FROM uretim_emri_operasyonlari op WHERE op.uretim_emri_id = ${uretimEmirleri.id} AND op.montaj = 1)`;
  const operasyonOzetSubquery = sql<string>`(SELECT GROUP_CONCAT(op.operasyon_adi ORDER BY op.sira SEPARATOR ', ') FROM uretim_emri_operasyonlari op WHERE op.uretim_emri_id = ${uretimEmirleri.id})`;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: uretimEmirleri.id,
        emir_no: uretimEmirleri.emir_no,
        urun_id: uretimEmirleri.urun_id,
        musteri_ozet: uretimEmirleri.musteri_ozet,
        planlanan_miktar: uretimEmirleri.planlanan_miktar,
        uretilen_miktar: uretimEmirleri.uretilen_miktar,
        baslangic_tarihi: uretimEmirleri.baslangic_tarihi,
        bitis_tarihi: uretimEmirleri.bitis_tarihi,
        termin_tarihi: uretimEmirleri.termin_tarihi,
        durum: uretimEmirleri.durum,
        urunKod: urunler.kod,
        urunAd: urunler.ad,
        montaj: montajSubquery,
        operasyonOzet: operasyonOzetSubquery,
      })
      .from(uretimEmirleri)
      .leftJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .where(where)
      .orderBy(asc(uretimEmirleri.baslangic_tarihi))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(uretimEmirleri)
      .leftJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .where(where),
  ]);

  return {
    items: rows.map(rowToDto),
    total: Number(countResult[0]?.count ?? 0),
  };
}

function rowToDto(row: QueryRow): GanttItemDto {
  const toDateString = (value: Date | string | null | undefined): string | null => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  };

  return {
    uretimEmriId: row.id,
    emirNo: row.emir_no,
    urunId: row.urun_id,
    urunKod: (row as QueryRow).urunKod ?? null,
    urunAd: (row as QueryRow).urunAd ?? null,
    musteriOzet: row.musteri_ozet ?? null,
    operasyonOzet: (row as QueryRow).operasyonOzet ?? null,
    montaj: Number((row as QueryRow).montaj ?? 0) > 0,
    baslangicTarihi: toDateString(row.baslangic_tarihi),
    bitisTarihi: toDateString(row.bitis_tarihi),
    terminTarihi: toDateString(row.termin_tarihi),
    planlananMiktar: Number(row.planlanan_miktar ?? 0),
    uretilenMiktar: Number(row.uretilen_miktar ?? 0),
    durum: row.durum,
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof uretimEmirleri.$inferInsert> {
  const payload: Partial<typeof uretimEmirleri.$inferInsert> = {};
  if (data.baslangicTarihi !== undefined) {
    payload.baslangic_tarihi = data.baslangicTarihi ? new Date(data.baslangicTarihi) : null;
  }
  if (data.bitisTarihi !== undefined) {
    payload.bitis_tarihi = data.bitisTarihi ? new Date(data.bitisTarihi) : null;
  }
  if (data.durum !== undefined) payload.durum = data.durum;
  return payload;
}

export async function repoGetById(id: string): Promise<GanttItemDto | null> {
  const montajSubquery = sql<number>`(SELECT COUNT(*) FROM uretim_emri_operasyonlari op WHERE op.uretim_emri_id = ${uretimEmirleri.id} AND op.montaj = 1)`;
  const operasyonOzetSubquery = sql<string>`(SELECT GROUP_CONCAT(op.operasyon_adi ORDER BY op.sira SEPARATOR ', ') FROM uretim_emri_operasyonlari op WHERE op.uretim_emri_id = ${uretimEmirleri.id})`;
  const rows = await db
    .select({
      id: uretimEmirleri.id,
      emir_no: uretimEmirleri.emir_no,
      urun_id: uretimEmirleri.urun_id,
      musteri_ozet: uretimEmirleri.musteri_ozet,
      planlanan_miktar: uretimEmirleri.planlanan_miktar,
      uretilen_miktar: uretimEmirleri.uretilen_miktar,
      baslangic_tarihi: uretimEmirleri.baslangic_tarihi,
      bitis_tarihi: uretimEmirleri.bitis_tarihi,
      termin_tarihi: uretimEmirleri.termin_tarihi,
      durum: uretimEmirleri.durum,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      montaj: montajSubquery,
      operasyonOzet: operasyonOzetSubquery,
    })
    .from(uretimEmirleri)
    .leftJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .where(eq(uretimEmirleri.id, id))
    .limit(1);
  return rows[0] ? rowToDto(rows[0] as QueryRow) : null;
}

export async function repoUpdateById(id: string, patch: PatchBody): Promise<GanttItemDto | null> {
  const payload = mapPatchInput(patch);
  await db.update(uretimEmirleri).set(payload).where(eq(uretimEmirleri.id, id));
  return repoGetById(id);
}
