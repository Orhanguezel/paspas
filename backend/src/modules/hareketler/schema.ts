import { sql } from 'drizzle-orm';
import { char, datetime, decimal, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const hareketler = mysqlTable('hareketler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  hareket_tipi: varchar('hareket_tipi', { length: 32 }).notNull(),
  referans_tipi: varchar('referans_tipi', { length: 32 }),
  referans_id: char('referans_id', { length: 36 }),
  miktar: decimal('miktar', { precision: 12, scale: 4 }).notNull(),
  aciklama: varchar('aciklama', { length: 500 }),
  created_by_user_id: char('created_by_user_id', { length: 36 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type HareketRow = typeof hareketler.$inferSelect;
type HareketLikeRow = HareketRow & {
  urun_kod?: string | null;
  urun_ad?: string | null;
  kaynak_tipi?: string | null;
  created_by_name?: string | null;
};

export type HareketOzetDto = {
  toplamKayit: number;
  toplamGiris: number;
  toplamCikis: number;
  sevkiyatAdet: number;
  sevkiyatMiktar: number;
  malKabulAdet: number;
  malKabulMiktar: number;
  duzeltmeAdet: number;
};

export type HareketDto = {
  id: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  hareketTipi: string;
  kaynakTipi: string;
  referansTipi: string | null;
  referansId: string | null;
  miktar: number;
  aciklama: string | null;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: Date | string;
};

export function rowToDto(row: HareketLikeRow): HareketDto {
  return {
    id: row.id,
    urunId: row.urun_id,
    urunKod: row.urun_kod ?? null,
    urunAd: row.urun_ad ?? null,
    hareketTipi: row.hareket_tipi,
    kaynakTipi: row.kaynak_tipi ?? row.referans_tipi ?? row.hareket_tipi,
    referansTipi: row.referans_tipi ?? null,
    referansId: row.referans_id ?? null,
    miktar: Number(row.miktar ?? 0),
    aciklama: row.aciklama ?? null,
    createdByUserId: row.created_by_user_id ?? null,
    createdByName: row.created_by_name ?? null,
    createdAt: row.created_at,
  };
}
