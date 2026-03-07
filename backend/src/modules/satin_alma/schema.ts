import { sql } from 'drizzle-orm';
import { char, date, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const satinAlmaSiparisleri = mysqlTable('satin_alma_siparisleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  siparis_no: varchar('siparis_no', { length: 64 }).notNull(),
  tedarikci_id: char('tedarikci_id', { length: 36 }).notNull(),
  siparis_tarihi: date('siparis_tarihi').notNull(),
  termin_tarihi: date('termin_tarihi'),
  durum: varchar('durum', { length: 32 }).notNull().default('taslak'),
  aciklama: varchar('aciklama', { length: 500 }),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const satinAlmaKalemleri = mysqlTable('satin_alma_kalemleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  siparis_id: char('siparis_id', { length: 36 }).notNull(),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  miktar: decimal('miktar', { precision: 12, scale: 4 }).notNull(),
  birim_fiyat: decimal('birim_fiyat', { precision: 12, scale: 2 }).notNull().default('0.00'),
  sira: int('sira', { unsigned: true }).notNull().default(0),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type SatinAlmaSiparisRow = typeof satinAlmaSiparisleri.$inferSelect;
export type SatinAlmaKalemRow = typeof satinAlmaKalemleri.$inferSelect;

export type SatinAlmaKalemDto = {
  id: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  birim: string | null;
  miktar: number;
  birimFiyat: number;
  sira: number;
  kabulMiktar: number;
  kalanMiktar: number;
};

export type SatinAlmaSiparisDto = {
  id: string;
  siparisNo: string;
  tedarikciId: string;
  tedarikciAd: string | null;
  siparisTarihi: string;
  terminTarihi: string | null;
  durum: string;
  aciklama: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: SatinAlmaKalemDto[];
};

type SatinAlmaSiparisDtoSource = SatinAlmaSiparisRow & {
  tedarikci_ad?: string | null;
};

type SatinAlmaKalemDtoSource = SatinAlmaKalemRow & {
  urun_kod?: string | null;
  urun_ad?: string | null;
  birim?: string | null;
  kabul_miktar?: string | number | null;
};

export function siparisRowToDto(row: SatinAlmaSiparisDtoSource): SatinAlmaSiparisDto {
  const toDateString = (value: Date | string | null | undefined): string | null => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  };

  return {
    id: row.id,
    siparisNo: row.siparis_no,
    tedarikciId: row.tedarikci_id,
    tedarikciAd: row.tedarikci_ad ?? null,
    siparisTarihi: toDateString(row.siparis_tarihi) ?? '',
    terminTarihi: toDateString(row.termin_tarihi),
    durum: row.durum,
    aciklama: row.aciklama ?? null,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function kalemRowToDto(row: SatinAlmaKalemDtoSource): SatinAlmaKalemDto {
  const miktar = Number(row.miktar ?? 0);
  const kabulMiktar = Number(row.kabul_miktar ?? 0);
  return {
    id: row.id,
    urunId: row.urun_id,
    urunKod: row.urun_kod ?? null,
    urunAd: row.urun_ad ?? null,
    birim: row.birim ?? null,
    miktar,
    birimFiyat: Number(row.birim_fiyat ?? 0),
    sira: row.sira,
    kabulMiktar,
    kalanMiktar: Math.max(0, miktar - kabulMiktar),
  };
}
