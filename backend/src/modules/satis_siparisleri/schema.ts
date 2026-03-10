import { sql } from 'drizzle-orm';
import { char, date, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

export const satisSiparisleri = mysqlTable('satis_siparisleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  siparis_no: varchar('siparis_no', { length: 64 }).notNull(),
  musteri_id: char('musteri_id', { length: 36 }).notNull(),
  siparis_tarihi: date('siparis_tarihi').notNull(),
  termin_tarihi: date('termin_tarihi'),
  durum: varchar('durum', { length: 32 }).notNull().default('taslak'),
  aciklama: varchar('aciklama', { length: 500 }),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const siparisKalemleri = mysqlTable('siparis_kalemleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  siparis_id: char('siparis_id', { length: 36 }).notNull(),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  miktar: decimal('miktar', { precision: 12, scale: 4 }).notNull(),
  birim_fiyat: decimal('birim_fiyat', { precision: 12, scale: 2 }).notNull().default('0.00'),
  sira: int('sira', { unsigned: true }).notNull().default(0),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type SatisSiparisRow = typeof satisSiparisleri.$inferSelect;
export type SiparisKalemRow = typeof siparisKalemleri.$inferSelect;
export type EnrichedSatisSiparisRow = SatisSiparisRow & {
  musteri_ad?: string | null;
  musteri_iskonto?: string | null;
};

export type EnrichedSiparisKalemRow = SiparisKalemRow & {
  urun_ad?: string | null;
  urun_kod?: string | null;
  kdv_orani?: string | null;
};

export type SiparisKalemDto = {
  id: string;
  urunId: string;
  urunAd: string | null;
  urunKod: string | null;
  kdvOrani: number;
  miktar: number;
  birimFiyat: number;
  sevkEdilenMiktar: number;
  sira: number;
};

export type UretimDurumu = 'beklemede' | 'planlandi' | 'uretimde' | 'tamamlandi';
export type SevkDurumu = 'sevk_edilmedi' | 'kismen_sevk' | 'tamamlandi';

export type SatisSiparisDto = {
  id: string;
  siparisNo: string;
  musteriId: string;
  musteriAd: string | null;
  musteriIskonto: number;
  siparisTarihi: string;
  terminTarihi: string | null;
  durum: string;
  uretimDurumu: UretimDurumu;
  sevkDurumu: SevkDurumu;
  aciklama: string | null;
  isActive: boolean;
  kalemSayisi: number;
  toplamMiktar: number;
  uretimeAktarilanKalemSayisi: number;
  uretimPlanlananMiktar: number;
  uretimTamamlananMiktar: number;
  sevkEdilenMiktar: number;
  kilitli: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: SiparisKalemDto[];
};

export function computeUretimDurumu(o: { uretimeAktarilanKalemSayisi: number; uretimPlanlananMiktar: number; uretimTamamlananMiktar: number }): UretimDurumu {
  if (o.uretimeAktarilanKalemSayisi === 0) return 'beklemede';
  if (o.uretimPlanlananMiktar > 0 && o.uretimTamamlananMiktar >= o.uretimPlanlananMiktar) return 'tamamlandi';
  if (o.uretimTamamlananMiktar > 0) return 'uretimde';
  return 'planlandi';
}

export function computeSevkDurumu(o: { toplamMiktar: number; sevkEdilenMiktar: number }): SevkDurumu {
  if (o.toplamMiktar > 0 && o.sevkEdilenMiktar >= o.toplamMiktar) return 'tamamlandi';
  if (o.sevkEdilenMiktar > 0) return 'kismen_sevk';
  return 'sevk_edilmedi';
}

export function siparisRowToDto(row: EnrichedSatisSiparisRow): SatisSiparisDto {
  const toDateString = (value: Date | string | null | undefined): string | null => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  };

  return {
    id: row.id,
    siparisNo: row.siparis_no,
    musteriId: row.musteri_id,
    musteriAd: row.musteri_ad ?? null,
    musteriIskonto: Number(row.musteri_iskonto ?? 0),
    siparisTarihi: toDateString(row.siparis_tarihi) ?? '',
    terminTarihi: toDateString(row.termin_tarihi),
    durum: row.durum,
    uretimDurumu: 'beklemede' as UretimDurumu,
    sevkDurumu: 'sevk_edilmedi' as SevkDurumu,
    aciklama: row.aciklama ?? null,
    isActive: row.is_active === 1,
    kalemSayisi: 0,
    toplamMiktar: 0,
    uretimeAktarilanKalemSayisi: 0,
    uretimPlanlananMiktar: 0,
    uretimTamamlananMiktar: 0,
    sevkEdilenMiktar: 0,
    kilitli: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function siparisKalemRowToDto(row: EnrichedSiparisKalemRow): SiparisKalemDto {
  return {
    id: row.id,
    urunId: row.urun_id,
    urunAd: row.urun_ad ?? null,
    urunKod: row.urun_kod ?? null,
    kdvOrani: Number(row.kdv_orani ?? 20),
    miktar: Number(row.miktar ?? 0),
    birimFiyat: Number(row.birim_fiyat ?? 0),
    sevkEdilenMiktar: 0,
    sira: row.sira,
  };
}
