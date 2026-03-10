import { sql } from 'drizzle-orm';
import { char, date, datetime, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const vardiyalar = mysqlTable('vardiyalar', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  ad: varchar('ad', { length: 100 }).notNull(),
  baslangic_saati: varchar('baslangic_saati', { length: 5 }).notNull(),
  bitis_saati: varchar('bitis_saati', { length: 5 }).notNull(),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  aciklama: varchar('aciklama', { length: 500 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const durusNedenleri = mysqlTable('durus_nedenleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kod: varchar('kod', { length: 64 }).notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  kategori: varchar('kategori', { length: 64 }).notNull().default('diger'),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  aciklama: varchar('aciklama', { length: 500 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const kaliplar = mysqlTable('kaliplar', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kod: varchar('kod', { length: 64 }).notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  aciklama: varchar('aciklama', { length: 500 }),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const tatiller = mysqlTable('tatiller', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  tarih: date('tarih').notNull(),
  baslangic_saati: varchar('baslangic_saati', { length: 5 }).notNull(),
  bitis_saati: varchar('bitis_saati', { length: 5 }).notNull(),
  aciklama: varchar('aciklama', { length: 500 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tatilMakineler = mysqlTable('tatil_makineler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  tatil_id: char('tatil_id', { length: 36 }).notNull(),
  makine_id: char('makine_id', { length: 36 }).notNull(),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const kalipUyumluMakineler = mysqlTable('kalip_uyumlu_makineler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kalip_id: char('kalip_id', { length: 36 }).notNull(),
  makine_id: char('makine_id', { length: 36 }).notNull(),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type KalipRow = typeof kaliplar.$inferSelect;
export type TatilRow = typeof tatiller.$inferSelect;
export type KalipUyumluMakineRow = typeof kalipUyumluMakineler.$inferSelect;
export type TatilMakineRow = typeof tatilMakineler.$inferSelect;

export function kalipRowToDto(row: KalipRow) {
  return {
    id: row.id,
    kod: row.kod,
    ad: row.ad,
    aciklama: row.aciklama ?? null,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function tatilRowToDto(row: TatilRow) {
  return {
    id: row.id,
    ad: row.ad,
    tarih: row.tarih,
    baslangicSaati: row.baslangic_saati,
    bitisSaati: row.bitis_saati,
    aciklama: row.aciklama ?? null,
    createdAt: row.created_at,
  };
}

export function kalipUyumluMakineRowToDto(row: KalipUyumluMakineRow) {
  return {
    id: row.id,
    kalipId: row.kalip_id,
    makineId: row.makine_id,
  };
}

export type VardiyaRow = typeof vardiyalar.$inferSelect;
export type DurusNedeniRow = typeof durusNedenleri.$inferSelect;

export const DURUS_KATEGORILER = ['makine', 'malzeme', 'personel', 'planlama', 'diger'] as const;
export type DurusKategori = typeof DURUS_KATEGORILER[number];

export function vardiyaRowToDto(row: VardiyaRow) {
  return {
    id: row.id,
    ad: row.ad,
    baslangicSaati: row.baslangic_saati,
    bitisSaati: row.bitis_saati,
    isActive: row.is_active === 1,
    aciklama: row.aciklama ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function durusNedeniRowToDto(row: DurusNedeniRow) {
  return {
    id: row.id,
    kod: row.kod,
    ad: row.ad,
    kategori: row.kategori as DurusKategori,
    isActive: row.is_active === 1,
    aciklama: row.aciklama ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Hafta Sonu Çalışma Planları ──────────────────────────────────────────────
export const haftaSonuPlanlari = mysqlTable('hafta_sonu_planlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  hafta_baslangic: date('hafta_baslangic').notNull(),
  makine_id: char('makine_id', { length: 36 }),
  cumartesi_calisir: tinyint('cumartesi_calisir', { unsigned: true }).notNull().default(0),
  pazar_calisir: tinyint('pazar_calisir', { unsigned: true }).notNull().default(0),
  aciklama: varchar('aciklama', { length: 500 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  created_by: char('created_by', { length: 36 }),
});

export type HaftaSonuPlanRow = typeof haftaSonuPlanlari.$inferSelect;
export type HaftaSonuPlanDtoRow = HaftaSonuPlanRow & {
  makine_ids?: string[];
  makine_adlari?: string[];
};

export function haftaSonuPlanRowToDto(row: HaftaSonuPlanDtoRow, makineAd?: string) {
  const tarih =
    row.hafta_baslangic instanceof Date
      ? row.hafta_baslangic.toISOString().slice(0, 10)
      : String(row.hafta_baslangic).slice(0, 10);
  const day = new Date(`${tarih}T12:00:00Z`).getUTCDay();
  const gunTipi = day === 6 ? 'cumartesi' : day === 0 ? 'pazar' : null;
  return {
    id: row.id,
    haftaBaslangic: tarih,
    makineId: row.makine_id ?? null,
    makineIds: row.makine_ids ?? (row.makine_id ? [row.makine_id] : []),
    makineAd: makineAd ?? null,
    makineAdlari: row.makine_adlari ?? (makineAd ? [makineAd] : []),
    cumartesiCalisir: gunTipi === 'cumartesi',
    pazarCalisir: gunTipi === 'pazar',
    gunTipi,
    aciklama: row.aciklama ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
