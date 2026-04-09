import { sql } from 'drizzle-orm';
import { char, date, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

const toDateString = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const toDateTimeString = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

export const uretimEmirleri = mysqlTable('uretim_emirleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  emir_no: varchar('emir_no', { length: 64 }).notNull(),
  siparis_id: char('siparis_id', { length: 36 }),
  siparis_kalem_id: char('siparis_kalem_id', { length: 36 }),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  recete_id: char('recete_id', { length: 36 }),
  musteri_ozet: varchar('musteri_ozet', { length: 255 }),
  musteri_detay: varchar('musteri_detay', { length: 1000 }),
  planlanan_miktar: decimal('planlanan_miktar', { precision: 12, scale: 4 }).notNull(),
  uretilen_miktar: decimal('uretilen_miktar', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  baslangic_tarihi: date('baslangic_tarihi'),
  bitis_tarihi: date('bitis_tarihi'),
  termin_tarihi: date('termin_tarihi'),
  durum: varchar('durum', { length: 32 }).notNull().default('atanmamis'),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type UretimEmriRow = typeof uretimEmirleri.$inferSelect;

export type UretimEmriDto = {
  id: string;
  emirNo: string;
  siparisKalemIds: string[];
  siparisNo: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  receteId: string | null;
  receteAd: string | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  terminTarihi: string | null;
  planlananBitisTarihi: string | null;
  musteriAd: string | null;
  musteriDetay: string | null;
  musteriOzetTipi: 'manuel' | 'tekil' | 'toplam';
  terminRiski: boolean;
  makineAtamaSayisi: number;
  makineAdlari: string | null;
  silinebilir: boolean;
  silmeNedeni: string | null;
  durum: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type UretimEmriDtoRow = UretimEmriRow & {
  siparisKalemIds?: string[];
  siparisNo?: string | null;
  urunKod?: string | null;
  urunAd?: string | null;
  receteAd?: string | null;
  etkinTerminTarihi?: Date | string | null;
  planlanan_bitis_tarihi?: Date | string | null;
  musteriAd?: string | null;
  musteriDetay?: string | null;
  musteriOzetTipi?: 'manuel' | 'tekil' | 'toplam' | null;
  terminRiski?: boolean | number | null;
  makineAtamaSayisi?: number | string | null;
  makineAdlari?: string | null;
  silinebilir?: boolean | number | null;
  silmeNedeni?: string | null;
};

export function rowToDto(row: UretimEmriDtoRow): UretimEmriDto {
  const kalemIds = row.siparisKalemIds ?? [];
  const hasSiparis = kalemIds.length > 0;
  return {
    id: row.id,
    emirNo: row.emir_no,
    siparisKalemIds: kalemIds,
    siparisNo: row.siparisNo ?? null,
    urunId: row.urun_id,
    urunKod: row.urunKod ?? null,
    urunAd: row.urunAd ?? null,
    receteId: row.recete_id ?? null,
    receteAd: row.receteAd ?? null,
    planlananMiktar: Number(row.planlanan_miktar ?? 0),
    uretilenMiktar: Number(row.uretilen_miktar ?? 0),
    baslangicTarihi: toDateString(row.baslangic_tarihi),
    bitisTarihi: toDateString(row.bitis_tarihi),
    terminTarihi: toDateString(row.etkinTerminTarihi ?? row.termin_tarihi),
    planlananBitisTarihi: toDateTimeString(row.planlanan_bitis_tarihi) ?? toDateString(row.bitis_tarihi),
    musteriAd: row.musteriAd ?? row.musteri_ozet ?? (hasSiparis ? null : 'Manuel üretim'),
    musteriDetay: row.musteriDetay ?? row.musteri_detay ?? null,
    musteriOzetTipi: row.musteriOzetTipi ?? (hasSiparis ? 'tekil' : 'manuel'),
    terminRiski: Boolean(row.terminRiski),
    makineAtamaSayisi: Number(row.makineAtamaSayisi ?? 0),
    makineAdlari: row.makineAdlari ?? null,
    silinebilir: Boolean(row.silinebilir ?? true),
    silmeNedeni: row.silmeNedeni ?? null,
    durum: row.durum,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type UretimEmriAdayDto = {
  siparisKalemId: string;
  siparisNo: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  musteriAd: string;
  miktar: number;
  terminTarihi: string | null;
};

// -- Uretim Emri <-> Siparis Kalemleri junction --
export const uretimEmriSiparisKalemleri = mysqlTable('uretim_emri_siparis_kalemleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  uretim_emri_id: char('uretim_emri_id', { length: 36 }).notNull(),
  siparis_kalem_id: char('siparis_kalem_id', { length: 36 }).notNull(),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type UretimEmriSiparisKalemRow = typeof uretimEmriSiparisKalemleri.$inferSelect;

// -- Uretim Emri Operasyonlari --
export const uretimEmriOperasyonlari = mysqlTable('uretim_emri_operasyonlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  uretim_emri_id: char('uretim_emri_id', { length: 36 }).notNull(),
  urun_operasyon_id: char('urun_operasyon_id', { length: 36 }),
  sira: tinyint('sira', { unsigned: true }).notNull().default(1),
  operasyon_adi: varchar('operasyon_adi', { length: 255 }).notNull(),
  kalip_id: char('kalip_id', { length: 36 }),
  makine_id: char('makine_id', { length: 36 }),
  hazirlik_suresi_dk: int('hazirlik_suresi_dk', { unsigned: true }).notNull().default(60),
  cevrim_suresi_sn: decimal('cevrim_suresi_sn', { precision: 10, scale: 2 }).notNull().default('45.00'),
  planlanan_miktar: decimal('planlanan_miktar', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  uretilen_miktar: decimal('uretilen_miktar', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  fire_miktar: decimal('fire_miktar', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  montaj: tinyint('montaj', { unsigned: true }).notNull().default(0),
  montaj_makine_id: char('montaj_makine_id', { length: 36 }),
  planlanan_baslangic: datetime('planlanan_baslangic'),
  planlanan_bitis: datetime('planlanan_bitis'),
  gercek_baslangic: datetime('gercek_baslangic'),
  gercek_bitis: datetime('gercek_bitis'),
  durum: varchar('durum', { length: 32 }).notNull().default('bekliyor'),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type EmirOperasyonRow = typeof uretimEmriOperasyonlari.$inferSelect;

export type EmirOperasyonDto = {
  id: string;
  uretimEmriId: string;
  urunOperasyonId: string | null;
  sira: number;
  operasyonAdi: string;
  kalipId: string | null;
  makineId: string | null;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananMiktar: number;
  uretilenMiktar: number;
  fireMiktar: number;
  montaj: boolean;
  montajMakineId: string | null;
  planlananBaslangic: string | null;
  planlananBitis: string | null;
  gercekBaslangic: string | null;
  gercekBitis: string | null;
  durum: string;
};

export function emirOperasyonRowToDto(row: EmirOperasyonRow): EmirOperasyonDto {
  return {
    id: row.id,
    uretimEmriId: row.uretim_emri_id,
    urunOperasyonId: row.urun_operasyon_id ?? null,
    sira: row.sira,
    operasyonAdi: row.operasyon_adi,
    kalipId: row.kalip_id ?? null,
    makineId: row.makine_id ?? null,
    hazirlikSuresiDk: row.hazirlik_suresi_dk,
    cevrimSuresiSn: Number(row.cevrim_suresi_sn),
    planlananMiktar: Number(row.planlanan_miktar ?? 0),
    uretilenMiktar: Number(row.uretilen_miktar ?? 0),
    fireMiktar: Number(row.fire_miktar ?? 0),
    montaj: row.montaj === 1,
    montajMakineId: row.montaj_makine_id ?? null,
    planlananBaslangic: toDateTimeString(row.planlanan_baslangic),
    planlananBitis: toDateTimeString(row.planlanan_bitis),
    gercekBaslangic: toDateTimeString(row.gercek_baslangic),
    gercekBitis: toDateTimeString(row.gercek_bitis),
    durum: row.durum,
  };
}
