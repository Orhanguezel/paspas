import { sql } from 'drizzle-orm';
import { char, datetime, index, json, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';

export type NotEtiket = string;

export const projeTeklifiNotlari = mysqlTable(
  'proje_teklifi_notlari',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    dokuman_key: varchar('dokuman_key', { length: 64 }).notNull(),
    dokuman_baslik: varchar('dokuman_baslik', { length: 255 }),
    not_tipi: varchar('not_tipi', { length: 32 }).notNull().default('note'),
    baslik: varchar('baslik', { length: 255 }),
    icerik: text('icerik').notNull(),
    etiketler: json('etiketler').$type<NotEtiket[] | null>().default(null),
    oncelik: varchar('oncelik', { length: 16 }).notNull().default('normal'),
    durum: varchar('durum', { length: 16 }).notNull().default('open'),
    created_by_user_id: char('created_by_user_id', { length: 36 }),
    updated_by_user_id: char('updated_by_user_id', { length: 36 }),
    created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (t) => ({
    idx_dokuman: index('idx_proje_teklifi_dokuman').on(t.dokuman_key, t.created_at),
    idx_durum: index('idx_proje_teklifi_durum').on(t.durum, t.oncelik),
    idx_user: index('idx_proje_teklifi_user').on(t.created_by_user_id, t.created_at),
  }),
);

export type ProjeTeklifiNotRow = typeof projeTeklifiNotlari.$inferSelect;

export type ProjeTeklifiNotDto = {
  id: string;
  dokumanKey: string;
  dokumanBaslik: string | null;
  notTipi: 'note' | 'todo' | 'bug' | 'idea' | 'question';
  baslik: string | null;
  icerik: string;
  etiketler: string[];
  oncelik: 'low' | 'normal' | 'high' | 'urgent';
  durum: 'open' | 'in_progress' | 'done' | 'wontfix';
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function rowToDto(row: ProjeTeklifiNotRow): ProjeTeklifiNotDto {
  return {
    id: row.id,
    dokumanKey: row.dokuman_key,
    dokumanBaslik: row.dokuman_baslik ?? null,
    notTipi: (row.not_tipi as ProjeTeklifiNotDto['notTipi']) ?? 'note',
    baslik: row.baslik ?? null,
    icerik: row.icerik,
    etiketler: Array.isArray(row.etiketler) ? row.etiketler : [],
    oncelik: (row.oncelik as ProjeTeklifiNotDto['oncelik']) ?? 'normal',
    durum: (row.durum as ProjeTeklifiNotDto['durum']) ?? 'open',
    createdByUserId: row.created_by_user_id ?? null,
    updatedByUserId: row.updated_by_user_id ?? null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}
