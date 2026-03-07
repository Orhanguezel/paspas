import { sql } from 'drizzle-orm';
import { char, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const makineler = mysqlTable('makineler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kod: varchar('kod', { length: 64 }).notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  tonaj: decimal('tonaj', { precision: 10, scale: 2 }),
  saatlik_kapasite: decimal('saatlik_kapasite', { precision: 10, scale: 2 }),
  calisir_24_saat: tinyint('calisir_24_saat', { unsigned: true }).notNull().default(0),
  durum: varchar('durum', { length: 32 }).notNull().default('aktif'),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const makineKuyrugu = mysqlTable('makine_kuyrugu', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  makine_id: char('makine_id', { length: 36 }).notNull(),
  uretim_emri_id: char('uretim_emri_id', { length: 36 }).notNull(),
  emir_operasyon_id: char('emir_operasyon_id', { length: 36 }),
  sira: int('sira', { unsigned: true }).notNull().default(0),
  planlanan_sure_dk: int('planlanan_sure_dk', { unsigned: true }).notNull().default(0),
  hazirlik_suresi_dk: int('hazirlik_suresi_dk', { unsigned: true }).notNull().default(0),
  planlanan_baslangic: datetime('planlanan_baslangic'),
  planlanan_bitis: datetime('planlanan_bitis'),
  gercek_baslangic: datetime('gercek_baslangic'),
  gercek_bitis: datetime('gercek_bitis'),
  durum: varchar('durum', { length: 32 }).notNull().default('bekliyor'),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type MakineRow = typeof makineler.$inferSelect;
export type MakineKuyruguRow = typeof makineKuyrugu.$inferSelect;

export type MakineDto = {
  id: string;
  kod: string;
  ad: string;
  tonaj: number | null;
  saatlikKapasite: number | null;
  calisir24Saat: boolean;
  kalipIds: string[];
  kaliplar: Array<{ id: string; kod: string; ad: string }>;
  durum: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function rowToDto(
  row: MakineRow,
  kaliplar: Array<{ id: string; kod: string; ad: string }> = [],
): MakineDto {
  return {
    id: row.id,
    kod: row.kod,
    ad: row.ad,
    tonaj: row.tonaj ? Number(row.tonaj) : null,
    saatlikKapasite: row.saatlik_kapasite ? Number(row.saatlik_kapasite) : null,
    calisir24Saat: row.calisir_24_saat === 1,
    kalipIds: kaliplar.map((kalip) => kalip.id),
    kaliplar,
    durum: row.durum,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type MakineKuyruguDto = {
  id: string;
  makineId: string;
  uretimEmriId: string;
  emirOperasyonId: string | null;
  sira: number;
  planlananSureDk: number;
  hazirlikSuresiDk: number;
  planlananBaslangic: string | null;
  planlananBitis: string | null;
  gercekBaslangic: string | null;
  gercekBitis: string | null;
  durum: string;
};

export function kuyruguRowToDto(row: MakineKuyruguRow): MakineKuyruguDto {
  const toStr = (v: Date | string | null | undefined): string | null => {
    if (!v) return null;
    if (v instanceof Date) return v.toISOString();
    return String(v);
  };
  return {
    id: row.id,
    makineId: row.makine_id,
    uretimEmriId: row.uretim_emri_id,
    emirOperasyonId: row.emir_operasyon_id ?? null,
    sira: row.sira,
    planlananSureDk: row.planlanan_sure_dk,
    hazirlikSuresiDk: row.hazirlik_suresi_dk,
    planlananBaslangic: toStr(row.planlanan_baslangic),
    planlananBitis: toStr(row.planlanan_bitis),
    gercekBaslangic: toStr(row.gercek_baslangic),
    gercekBitis: toStr(row.gercek_bitis),
    durum: row.durum,
  };
}
