import { sql } from 'drizzle-orm';
import { char, date, datetime, decimal, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const sevkEmirleri = mysqlTable('sevk_emirleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  sevk_emri_no: varchar('sevk_emri_no', { length: 64 }).notNull(),
  siparis_id: char('siparis_id', { length: 36 }),
  siparis_kalem_id: char('siparis_kalem_id', { length: 36 }),
  musteri_id: char('musteri_id', { length: 36 }).notNull(),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  miktar: decimal('miktar', { precision: 12, scale: 4 }).notNull(),
  tarih: date('tarih').notNull(),
  durum: varchar('durum', { length: 32 }).notNull().default('bekliyor'),
  operator_onay: tinyint('operator_onay', { unsigned: true }).notNull().default(0),
  notlar: varchar('notlar', { length: 500 }),
  created_by: char('created_by', { length: 36 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type SevkEmriRow = typeof sevkEmirleri.$inferSelect;

export type SevkEmriDto = {
  id: string;
  sevkEmriNo: string;
  siparisId: string | null;
  siparisKalemId: string | null;
  musteriId: string;
  musteriAd: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  miktar: number;
  stokMiktar: number;
  tarih: string;
  durum: string;
  operatorOnay: boolean;
  notlar: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type BekleyenSatirDto = {
  siparisId: string;
  siparisNo: string;
  siparisKalemId: string;
  musteriId: string;
  musteriAd: string;
  urunId: string;
  urunKod: string;
  urunAd: string;
  siparisMiktar: number;
  sevkEdilenMiktar: number;
  acikSevkEmriMiktar: number;
  onayliSevkEmriMiktar: number;
  kalanMiktar: number;
  stokMiktar: number;
  terminTarihi: string | null;
};

// Stokta olup siparişi olmayan ürünler
export type SiparissizUrunDto = {
  urunId: string;
  urunKod: string;
  urunAd: string;
  stokMiktar: number;
  birim: string;
};
