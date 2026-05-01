import { sql } from 'drizzle-orm';
import { char, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const musteriler = mysqlTable('musteriler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  tur: varchar('tur', { length: 32 }).notNull().default('musteri'),
  kod: varchar('kod', { length: 32 }).notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  ilgili_kisi: varchar('ilgili_kisi', { length: 255 }),
  telefon: varchar('telefon', { length: 32 }),
  email: varchar('email', { length: 255 }),
  adres: varchar('adres', { length: 500 }),
  cari_kodu: varchar('cari_kodu', { length: 64 }),
  sevkiyat_notu: varchar('sevkiyat_notu', { length: 500 }),
  website_url: varchar('website_url', { length: 500 }),
  google_maps_url: varchar('google_maps_url', { length: 500 }),
  instagram_url: varchar('instagram_url', { length: 500 }),
  facebook_url: varchar('facebook_url', { length: 500 }),
  bayi_segment: varchar('bayi_segment', { length: 32 }),
  kredi_limit: decimal('kredi_limit', { precision: 12, scale: 2 }),
  mevcut_bakiye: decimal('mevcut_bakiye', { precision: 12, scale: 2 }),
  vade_gunu: int('vade_gunu', { unsigned: true }),
  portal_enabled: tinyint('portal_enabled', { unsigned: true }).notNull().default(0),
  portal_status: varchar('portal_status', { length: 32 }).notNull().default('not_invited'),
  public_veri_izni: tinyint('public_veri_izni', { unsigned: true }).notNull().default(0),
  iskonto: decimal('iskonto', { precision: 5, scale: 2 }),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type MusteriRow = typeof musteriler.$inferSelect;

export type MusteriDto = {
  id: string;
  tur: 'musteri' | 'tedarikci';
  kod: string;
  ad: string;
  ilgiliKisi: string | null;
  telefon: string | null;
  email: string | null;
  adres: string | null;
  cariKodu: string | null;
  sevkiyatNotu: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  bayiSegment: string | null;
  krediLimit: number;
  mevcutBakiye: number;
  vadeGunu: number | null;
  portalEnabled: boolean;
  portalStatus: string;
  publicVeriIzni: boolean;
  iskonto: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function rowToDto(row: MusteriRow): MusteriDto {
  return {
    id: row.id,
    tur: row.tur as 'musteri' | 'tedarikci',
    kod: row.kod,
    ad: row.ad,
    ilgiliKisi: row.ilgili_kisi ?? null,
    telefon: row.telefon ?? null,
    email: row.email ?? null,
    adres: row.adres ?? null,
    cariKodu: row.cari_kodu ?? null,
    sevkiyatNotu: row.sevkiyat_notu ?? null,
    websiteUrl: row.website_url ?? null,
    googleMapsUrl: row.google_maps_url ?? null,
    instagramUrl: row.instagram_url ?? null,
    facebookUrl: row.facebook_url ?? null,
    bayiSegment: row.bayi_segment ?? null,
    krediLimit: row.kredi_limit ? Number(row.kredi_limit) : 0,
    mevcutBakiye: row.mevcut_bakiye ? Number(row.mevcut_bakiye) : 0,
    vadeGunu: row.vade_gunu ?? null,
    portalEnabled: row.portal_enabled === 1,
    portalStatus: row.portal_status ?? 'not_invited',
    publicVeriIzni: row.public_veri_izni === 1,
    iskonto: row.iskonto ? Number(row.iskonto) : 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
