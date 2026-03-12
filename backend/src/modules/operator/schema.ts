import { sql } from 'drizzle-orm';
import { char, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';

// -- Operator Gunluk Kayitlari (genisletilmis) --
export const operatorGunlukKayitlari = mysqlTable('operator_gunluk_kayitlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  uretim_emri_id: char('uretim_emri_id', { length: 36 }).notNull(),
  makine_id: char('makine_id', { length: 36 }),
  emir_operasyon_id: char('emir_operasyon_id', { length: 36 }),
  operator_user_id: char('operator_user_id', { length: 36 }),
  gunluk_durum: varchar('gunluk_durum', { length: 32 }).notNull().default('devam_ediyor'),
  ek_uretim_miktari: decimal('ek_uretim_miktari', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  fire_miktari: decimal('fire_miktari', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  net_miktar: decimal('net_miktar', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  birim_tipi: varchar('birim_tipi', { length: 16 }).notNull().default('adet'),
  makine_arizasi: tinyint('makine_arizasi', { unsigned: true }).notNull().default(0),
  durus_nedeni: varchar('durus_nedeni', { length: 255 }),
  notlar: varchar('notlar', { length: 1000 }),
  kayit_tarihi: datetime('kayit_tarihi').notNull().default(sql`CURRENT_TIMESTAMP`),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// -- Vardiya Kayitlari --
export const vardiyaKayitlari = mysqlTable('vardiya_kayitlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  makine_id: char('makine_id', { length: 36 }).notNull(),
  operator_user_id: char('operator_user_id', { length: 36 }),
  vardiya_tipi: varchar('vardiya_tipi', { length: 16 }).notNull().default('gunduz'),
  baslangic: datetime('baslangic').notNull(),
  bitis: datetime('bitis'),
  notlar: varchar('notlar', { length: 500 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// -- Durus Kayitlari --
export const durusKayitlari = mysqlTable('durus_kayitlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  makine_id: char('makine_id', { length: 36 }).notNull(),
  makine_kuyruk_id: char('makine_kuyruk_id', { length: 36 }),
  operator_user_id: char('operator_user_id', { length: 36 }),
  durus_nedeni_id: char('durus_nedeni_id', { length: 36 }),
  durus_tipi: varchar('durus_tipi', { length: 32 }).notNull().default('ariza'),
  neden: varchar('neden', { length: 255 }).notNull(),
  anlik_uretim_miktari: decimal('anlik_uretim_miktari', { precision: 12, scale: 4 }),
  baslangic: datetime('baslangic').notNull(),
  bitis: datetime('bitis'),
  sure_dk: int('sure_dk', { unsigned: true }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// -- Sevkiyatlar --
export const sevkiyatlar = mysqlTable('sevkiyatlar', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  sevk_no: varchar('sevk_no', { length: 64 }).notNull(),
  operator_user_id: char('operator_user_id', { length: 36 }),
  sevk_tarihi: datetime('sevk_tarihi').notNull().default(sql`CURRENT_TIMESTAMP`),
  notlar: varchar('notlar', { length: 500 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sevkiyatKalemleri = mysqlTable('sevkiyat_kalemleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  sevkiyat_id: char('sevkiyat_id', { length: 36 }).notNull(),
  musteri_id: char('musteri_id', { length: 36 }).notNull(),
  siparis_id: char('siparis_id', { length: 36 }),
  siparis_kalem_id: char('siparis_kalem_id', { length: 36 }),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  miktar: decimal('miktar', { precision: 12, scale: 4 }).notNull(),
  birim: varchar('birim', { length: 16 }).notNull().default('adet'),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// -- Mal Kabul Kayitlari --
// Not: Canonical schema is in @/modules/mal_kabul/schema.ts
// This is kept for backward compat with operator module imports
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

// ============================================================
// Types & DTOs
// ============================================================

export type OperatorGunlukDurum =
  | 'devam_ediyor'
  | 'yarim_kaldi'
  | 'durdu'
  | 'iptal_edildi'
  | 'makine_arizasi'
  | 'tamamlandi';

export type OperatorGunlukGirisRow = typeof operatorGunlukKayitlari.$inferSelect;
export type VardiyaKayitRow = typeof vardiyaKayitlari.$inferSelect;
export type DurusKayitRow = typeof durusKayitlari.$inferSelect;
export type SevkiyatRow = typeof sevkiyatlar.$inferSelect;
export type SevkiyatKalemRow = typeof sevkiyatKalemleri.$inferSelect;
export type MalKabulRow = typeof malKabulKayitlari.$inferSelect;

const toStr = (v: Date | string | null | undefined): string | null => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
};

// -- Gunluk Giris DTO --

export type OperatorGunlukGirisDto = {
  id: string;
  uretimEmriId: string;
  makineId: string | null;
  emirOperasyonId: string | null;
  operatorUserId: string | null;
  gunlukDurum: OperatorGunlukDurum;
  ekUretimMiktari: number;
  fireMiktari: number;
  netMiktar: number;
  birimTipi: string;
  makineArizasi: boolean;
  durusNedeni: string | null;
  notlar: string | null;
  kayitTarihi: string;
  createdAt: string;
};

export function rowToGunlukGirisDto(row: OperatorGunlukGirisRow): OperatorGunlukGirisDto {
  return {
    id: row.id,
    uretimEmriId: row.uretim_emri_id,
    makineId: row.makine_id ?? null,
    emirOperasyonId: row.emir_operasyon_id ?? null,
    operatorUserId: row.operator_user_id ?? null,
    gunlukDurum: row.gunluk_durum as OperatorGunlukDurum,
    ekUretimMiktari: Number(row.ek_uretim_miktari ?? 0),
    fireMiktari: Number(row.fire_miktari ?? 0),
    netMiktar: Number(row.net_miktar ?? 0),
    birimTipi: row.birim_tipi,
    makineArizasi: row.makine_arizasi === 1,
    durusNedeni: row.durus_nedeni ?? null,
    notlar: row.notlar ?? null,
    kayitTarihi: toStr(row.kayit_tarihi) ?? new Date().toISOString(),
    createdAt: toStr(row.created_at) ?? new Date().toISOString(),
  };
}

// -- Vardiya DTO --

export type VardiyaKayitDto = {
  id: string;
  makineId: string;
  operatorUserId: string | null;
  vardiyaTipi: string;
  baslangic: string;
  bitis: string | null;
  notlar: string | null;
};

export function vardiyaRowToDto(row: VardiyaKayitRow): VardiyaKayitDto {
  return {
    id: row.id,
    makineId: row.makine_id,
    operatorUserId: row.operator_user_id ?? null,
    vardiyaTipi: row.vardiya_tipi,
    baslangic: toStr(row.baslangic) ?? new Date().toISOString(),
    bitis: toStr(row.bitis),
    notlar: row.notlar ?? null,
  };
}

// -- Durus DTO --

export type DurusKayitDto = {
  id: string;
  makineId: string;
  makineKuyrukId: string | null;
  operatorUserId: string | null;
  durusNedeniId: string | null;
  durusTipi: string;
  neden: string;
  anlikUretimMiktari: number | null;
  baslangic: string;
  bitis: string | null;
  sureDk: number | null;
};

export function durusRowToDto(row: DurusKayitRow): DurusKayitDto {
  return {
    id: row.id,
    makineId: row.makine_id,
    makineKuyrukId: row.makine_kuyruk_id ?? null,
    operatorUserId: row.operator_user_id ?? null,
    durusNedeniId: row.durus_nedeni_id ?? null,
    durusTipi: row.durus_tipi,
    neden: row.neden,
    anlikUretimMiktari: row.anlik_uretim_miktari ? Number(row.anlik_uretim_miktari) : null,
    baslangic: toStr(row.baslangic) ?? new Date().toISOString(),
    bitis: toStr(row.bitis),
    sureDk: row.sure_dk ?? null,
  };
}

// -- Mal Kabul DTO --

export type MalKabulDto = {
  id: string;
  kaynakTipi: string;
  satinAlmaSiparisId: string | null;
  satinAlmaKalemId: string | null;
  urunId: string;
  gelenMiktar: number;
  operatorUserId: string | null;
  kabulTarihi: string;
  notlar: string | null;
};

export function malKabulRowToDto(row: MalKabulRow): MalKabulDto {
  return {
    id: row.id,
    kaynakTipi: row.kaynak_tipi,
    satinAlmaSiparisId: row.satin_alma_siparis_id ?? null,
    satinAlmaKalemId: row.satin_alma_kalem_id ?? null,
    urunId: row.urun_id,
    gelenMiktar: Number(row.gelen_miktar),
    operatorUserId: row.operator_user_id ?? null,
    kabulTarihi: toStr(row.kabul_tarihi) ?? new Date().toISOString(),
    notlar: row.notlar ?? null,
  };
}

// -- Sevkiyat DTO --

export type SevkiyatDto = {
  id: string;
  sevkNo: string;
  operatorUserId: string | null;
  sevkTarihi: string;
  notlar: string | null;
};

export function sevkiyatRowToDto(row: SevkiyatRow): SevkiyatDto {
  return {
    id: row.id,
    sevkNo: row.sevk_no,
    operatorUserId: row.operator_user_id ?? null,
    sevkTarihi: toStr(row.sevk_tarihi) ?? new Date().toISOString(),
    notlar: row.notlar ?? null,
  };
}

export type SevkiyatKalemDto = {
  id: string;
  sevkiyatId: string;
  musteriId: string;
  siparisId: string | null;
  siparisKalemId: string | null;
  urunId: string;
  miktar: number;
  birim: string;
};

export function sevkiyatKalemRowToDto(row: SevkiyatKalemRow): SevkiyatKalemDto {
  return {
    id: row.id,
    sevkiyatId: row.sevkiyat_id,
    musteriId: row.musteri_id,
    siparisId: row.siparis_id ?? null,
    siparisKalemId: row.siparis_kalem_id ?? null,
    urunId: row.urun_id,
    miktar: Number(row.miktar),
    birim: row.birim,
  };
}
