import { sql } from 'drizzle-orm';
import { char, datetime, decimal, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const malKabulKayitlari = mysqlTable('mal_kabul_kayitlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kaynak_tipi: varchar('kaynak_tipi', { length: 32 }).notNull().default('satin_alma'),
  satin_alma_siparis_id: char('satin_alma_siparis_id', { length: 36 }),
  satin_alma_kalem_id: char('satin_alma_kalem_id', { length: 36 }),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  tedarikci_id: char('tedarikci_id', { length: 36 }),
  gelen_miktar: decimal('gelen_miktar', { precision: 12, scale: 4 }).notNull(),
  parti_no: varchar('parti_no', { length: 64 }),
  operator_user_id: char('operator_user_id', { length: 36 }),
  kabul_tarihi: datetime('kabul_tarihi').notNull().default(sql`CURRENT_TIMESTAMP`),
  notlar: varchar('notlar', { length: 500 }),
  kalite_durumu: varchar('kalite_durumu', { length: 32 }).notNull().default('kabul'),
  kalite_notu: varchar('kalite_notu', { length: 500 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type MalKabulRow = typeof malKabulKayitlari.$inferSelect;

type MalKabulLikeRow = MalKabulRow & {
  urun_kod?: string | null;
  urun_ad?: string | null;
  urun_birim?: string | null;
  tedarikci_ad?: string | null;
  operator_name?: string | null;
};

export type MalKabulDto = {
  id: string;
  kaynakTipi: string;
  satinAlmaSiparisId: string | null;
  satinAlmaKalemId: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  urunBirim: string | null;
  tedarikciId: string | null;
  tedarikciAd: string | null;
  gelenMiktar: number;
  partiNo: string | null;
  operatorUserId: string | null;
  operatorName: string | null;
  kabulTarihi: Date | string;
  notlar: string | null;
  kaliteDurumu: string;
  kaliteNotu: string | null;
  createdAt: Date | string;
};

export type MalKabulOzetDto = {
  toplamKayit: number;
  toplamMiktar: number;
  satinAlmaAdet: number;
  satinAlmaMiktar: number;
  fasonAdet: number;
  fasonMiktar: number;
  digerAdet: number;
  digerMiktar: number;
};

export function rowToDto(row: MalKabulLikeRow): MalKabulDto {
  return {
    id: row.id,
    kaynakTipi: row.kaynak_tipi,
    satinAlmaSiparisId: row.satin_alma_siparis_id ?? null,
    satinAlmaKalemId: row.satin_alma_kalem_id ?? null,
    urunId: row.urun_id,
    urunKod: row.urun_kod ?? null,
    urunAd: row.urun_ad ?? null,
    urunBirim: row.urun_birim ?? null,
    tedarikciId: row.tedarikci_id ?? null,
    tedarikciAd: row.tedarikci_ad ?? null,
    gelenMiktar: Number(row.gelen_miktar ?? 0),
    partiNo: row.parti_no ?? null,
    operatorUserId: row.operator_user_id ?? null,
    operatorName: row.operator_name ?? null,
    kabulTarihi: row.kabul_tarihi,
    notlar: row.notlar ?? null,
    kaliteDurumu: row.kalite_durumu,
    kaliteNotu: row.kalite_notu ?? null,
    createdAt: row.created_at,
  };
}
