import { sql } from 'drizzle-orm';
import { char, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const receteler = mysqlTable('receteler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kod: varchar('kod', { length: 64 }).notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  urun_id: char('urun_id', { length: 36 }),
  aciklama: varchar('aciklama', { length: 500 }),
  hedef_miktar: decimal('hedef_miktar', { precision: 12, scale: 4 }).notNull().default('1.0000'),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const receteKalemleri = mysqlTable('recete_kalemleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  recete_id: char('recete_id', { length: 36 }).notNull(),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  miktar: decimal('miktar', { precision: 12, scale: 4 }).notNull(),
  fire_orani: decimal('fire_orani', { precision: 5, scale: 2 }).notNull().default('0.00'),
  sira: int('sira', { unsigned: true }).notNull().default(0),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type ReceteRow = typeof receteler.$inferSelect;
export type ReceteKalemRow = typeof receteKalemleri.$inferSelect;

export type ReceteKalemDto = {
  id: string;
  urunId: string;
  malzemeKod: string | null;
  malzemeAd: string | null;
  malzemeBirim: string | null;
  malzemeBirimFiyat: number | null;
  miktar: number;
  fireOrani: number;
  sira: number;
};

export type ReceteDto = {
  id: string;
  kod: string;
  ad: string;
  urunId: string | null;
  aciklama: string | null;
  hedefMiktar: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: ReceteKalemDto[];
};

export function receteRowToDto(row: ReceteRow): ReceteDto {
  return {
    id: row.id,
    kod: row.kod,
    ad: row.ad,
    urunId: row.urun_id ?? null,
    aciklama: row.aciklama ?? null,
    hedefMiktar: Number(row.hedef_miktar ?? 0),
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type EnrichedReceteKalemRow = ReceteKalemRow & {
  malzemeKod?: string | null;
  malzemeAd?: string | null;
  malzemeBirim?: string | null;
  malzemeBirimFiyat?: string | null;
};

export function receteKalemRowToDto(row: EnrichedReceteKalemRow): ReceteKalemDto {
  return {
    id: row.id,
    urunId: row.urun_id,
    malzemeKod: row.malzemeKod ?? null,
    malzemeAd: row.malzemeAd ?? null,
    malzemeBirim: row.malzemeBirim ?? null,
    malzemeBirimFiyat: row.malzemeBirimFiyat ? Number(row.malzemeBirimFiyat) : null,
    miktar: Number(row.miktar ?? 0),
    fireOrani: Number(row.fire_orani ?? 0),
    sira: row.sira,
  };
}
