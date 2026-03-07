import { sql } from 'drizzle-orm';
import { char, datetime, decimal, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

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
    iskonto: row.iskonto ? Number(row.iskonto) : 0,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
