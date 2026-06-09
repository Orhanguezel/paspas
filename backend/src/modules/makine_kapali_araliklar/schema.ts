import { randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { char, date, datetime, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const makineKapaliAraliklar = mysqlTable('makine_kapali_araliklar', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  makine_id: char('makine_id', { length: 36 }).notNull(),
  baslangic_tarih: date('baslangic_tarih').notNull(),
  bitis_tarih: date('bitis_tarih').notNull(),
  aciklama: varchar('aciklama', { length: 255 }),
  created_by_user_id: char('created_by_user_id', { length: 36 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type MakineKapaliAralikRow = typeof makineKapaliAraliklar.$inferSelect;

function toDateString(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function createMakineKapaliAralikId(): string {
  return randomUUID();
}

export function rowToDto(row: MakineKapaliAralikRow & { makineKod?: string | null; makineAd?: string | null }) {
  return {
    id: row.id,
    makineId: row.makine_id,
    makineKod: row.makineKod ?? null,
    makineAd: row.makineAd ?? null,
    baslangicTarih: toDateString(row.baslangic_tarih),
    bitisTarih: toDateString(row.bitis_tarih),
    aciklama: row.aciklama ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
