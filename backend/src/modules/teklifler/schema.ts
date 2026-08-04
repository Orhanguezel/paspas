// =============================================================
// FILE: src/modules/teklifler/schema.ts
// Teklif Modülü — Drizzle tablo tanımları + rowToDto (camelCase)
// Şema kaynağı: db/seed/sql/220_teklifler_schema.sql
// =============================================================

import { sql } from 'drizzle-orm';
import { char, datetime, decimal, int, json, mysqlTable, smallint, text, tinyint, varchar } from 'drizzle-orm/mysql-core';

// ── Tablolar ─────────────────────────────────────────────────

export const teklifNoSayaclari = mysqlTable('teklif_no_sayaclari', {
  yil: smallint('yil', { unsigned: true }).primaryKey().notNull(),
  son_no: int('son_no', { unsigned: true }).notNull().default(0),
});

export const teklifTalepleri = mysqlTable('teklif_talepleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kaynak_sayfa: varchar('kaynak_sayfa', { length: 255 }),
  referrer: varchar('referrer', { length: 1000 }),
  dil: varchar('dil', { length: 8 }).notNull().default('tr'),
  ad: varchar('ad', { length: 160 }).notNull(),
  firma: varchar('firma', { length: 200 }),
  email: varchar('email', { length: 255 }),
  telefon: varchar('telefon', { length: 48 }),
  konu: varchar('konu', { length: 200 }),
  mesaj: text('mesaj'),
  form_detaylari: json('form_detaylari'),
  secili_urunler: json('secili_urunler'),
  utm: json('utm'),
  kvkk_onay: tinyint('kvkk_onay', { unsigned: true }).notNull().default(0),
  durum: varchar('durum', { length: 32 }).notNull().default('yeni'),
  atanan_user_id: char('atanan_user_id', { length: 36 }),
  musteri_id: char('musteri_id', { length: 36 }),
  teklif_id: char('teklif_id', { length: 36 }),
  ip_hash: varchar('ip_hash', { length: 64 }),
  idempotency_key: char('idempotency_key', { length: 36 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const teklifler = mysqlTable('teklifler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  teklif_no: varchar('teklif_no', { length: 32 }).notNull(),
  musteri_id: char('musteri_id', { length: 36 }).notNull(),
  talep_id: char('talep_id', { length: 36 }),
  durum: varchar('durum', { length: 32 }).notNull().default('taslak'),
  dil: varchar('dil', { length: 8 }).notNull().default('tr'),
  para_birimi: char('para_birimi', { length: 3 }).notNull().default('TRY'),
  ara_toplam: decimal('ara_toplam', { precision: 14, scale: 2 }).notNull().default('0.00'),
  iskonto_orani: decimal('iskonto_orani', { precision: 5, scale: 2 }).notNull().default('0.00'),
  iskonto_tutari: decimal('iskonto_tutari', { precision: 14, scale: 2 }).notNull().default('0.00'),
  iskonto_onaylandi: tinyint('iskonto_onaylandi', { unsigned: true }).notNull().default(0),
  iskonto_onaylayan_user_id: char('iskonto_onaylayan_user_id', { length: 36 }),
  iskonto_onay_at: datetime('iskonto_onay_at'),
  kdv_orani: decimal('kdv_orani', { precision: 5, scale: 2 }).notNull().default('20.00'),
  kdv_dahil: tinyint('kdv_dahil', { unsigned: true }).notNull().default(0),
  kdv_tutari: decimal('kdv_tutari', { precision: 14, scale: 2 }).notNull().default('0.00'),
  nakliye: decimal('nakliye', { precision: 14, scale: 2 }).notNull().default('0.00'),
  genel_toplam: decimal('genel_toplam', { precision: 14, scale: 2 }).notNull().default('0.00'),
  gecerlilik_tarihi: datetime('gecerlilik_tarihi'),
  odeme_kosullari: varchar('odeme_kosullari', { length: 500 }),
  teslim_kosullari: varchar('teslim_kosullari', { length: 500 }),
  aciklama: varchar('aciklama', { length: 1000 }),
  red_nedeni: varchar('red_nedeni', { length: 500 }),
  donusen_siparis_id: char('donusen_siparis_id', { length: 36 }),
  goruntuleme_token: char('goruntuleme_token', { length: 36 }),
  gonderim_at: datetime('gonderim_at'),
  ilk_goruntuleme_at: datetime('ilk_goruntuleme_at'),
  created_by: char('created_by', { length: 36 }),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const teklifKalemleri = mysqlTable('teklif_kalemleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  teklif_id: char('teklif_id', { length: 36 }).notNull(),
  urun_id: char('urun_id', { length: 36 }),
  urun_kod: varchar('urun_kod', { length: 64 }),
  urun_ad: varchar('urun_ad', { length: 255 }),
  aciklama: varchar('aciklama', { length: 500 }).notNull(),
  birim: varchar('birim', { length: 16 }).notNull().default('adet'),
  miktar: decimal('miktar', { precision: 12, scale: 4 }).notNull().default('1.0000'),
  birim_fiyat: decimal('birim_fiyat', { precision: 14, scale: 2 }).notNull().default('0.00'),
  iskonto_orani: decimal('iskonto_orani', { precision: 5, scale: 2 }).notNull().default('0.00'),
  satir_toplam: decimal('satir_toplam', { precision: 14, scale: 2 }).notNull().default('0.00'),
  sira: int('sira', { unsigned: true }).notNull().default(0),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const teklifRevizyonlari = mysqlTable('teklif_revizyonlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  teklif_id: char('teklif_id', { length: 36 }).notNull(),
  revizyon_no: int('revizyon_no', { unsigned: true }).notNull(),
  snapshot: json('snapshot').notNull(),
  neden: varchar('neden', { length: 500 }).notNull(),
  created_by: char('created_by', { length: 36 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const teklifGonderimleri = mysqlTable('teklif_gonderimleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  teklif_id: char('teklif_id', { length: 36 }).notNull(),
  kanal: varchar('kanal', { length: 24 }).notNull(),
  alici_email: varchar('alici_email', { length: 255 }),
  durum: varchar('durum', { length: 24 }).notNull().default('basarili'),
  hata_mesaji: varchar('hata_mesaji', { length: 1000 }),
  created_by: char('created_by', { length: 36 }),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const teklifSablonlari = mysqlTable('teklif_sablonlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  ad: varchar('ad', { length: 160 }).notNull(),
  dil: varchar('dil', { length: 8 }).notNull().default('tr'),
  logo_asset_id: char('logo_asset_id', { length: 36 }),
  ayarlar: json('ayarlar'),
  varsayilan: tinyint('varsayilan', { unsigned: true }).notNull().default(0),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type TeklifRow = typeof teklifler.$inferSelect;
export type TeklifKalemRow = typeof teklifKalemleri.$inferSelect;
export type TeklifTalepRow = typeof teklifTalepleri.$inferSelect;
export type TeklifGonderimRow = typeof teklifGonderimleri.$inferSelect;
export type TeklifRevizyonRow = typeof teklifRevizyonlari.$inferSelect;
export type TeklifSablonRow = typeof teklifSablonlari.$inferSelect;

// ── DTO dönüşümleri (camelCase, Paspas konvansiyonu) ─────────

function toDateStr(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function teklifKalemRowToDto(row: TeklifKalemRow) {
  return {
    id: row.id,
    teklifId: row.teklif_id,
    urunId: row.urun_id ?? null,
    urunKod: row.urun_kod ?? null,
    urunAd: row.urun_ad ?? null,
    aciklama: row.aciklama,
    birim: row.birim,
    miktar: Number(row.miktar),
    birimFiyat: Number(row.birim_fiyat),
    iskontoOrani: Number(row.iskonto_orani),
    satirToplam: Number(row.satir_toplam),
    sira: row.sira,
  };
}

export function teklifRevizyonRowToDto(row: TeklifRevizyonRow, includeSnapshot = false) {
  return {
    id: row.id,
    revizyonNo: row.revizyon_no,
    neden: row.neden,
    createdAt: row.created_at,
    ...(includeSnapshot ? { snapshot: row.snapshot } : {}),
  };
}

export function teklifGonderimRowToDto(row: TeklifGonderimRow) {
  return {
    id: row.id,
    kanal: row.kanal,
    aliciEmail: row.alici_email ?? null,
    durum: row.durum,
    hataMesaji: row.hata_mesaji ?? null,
    createdAt: row.created_at,
  };
}

export function teklifRowToDto(
  row: TeklifRow,
  extras?: {
    musteriAd?: string | null;
    ownerName?: string | null;
    revizyonNo?: number;
    kalemler?: ReturnType<typeof teklifKalemRowToDto>[];
    gonderimler?: ReturnType<typeof teklifGonderimRowToDto>[];
    revizyonlar?: ReturnType<typeof teklifRevizyonRowToDto>[];
  },
) {
  return {
    id: row.id,
    teklifNo: row.teklif_no,
    musteriId: row.musteri_id,
    musteriAd: extras?.musteriAd ?? null,
    ownerUserId: row.created_by ?? null,
    ownerName: extras?.ownerName ?? null,
    revizyonNo: extras?.revizyonNo ?? 0,
    talepId: row.talep_id ?? null,
    durum: row.durum,
    dil: row.dil,
    paraBirimi: row.para_birimi,
    araToplam: Number(row.ara_toplam),
    iskontoOrani: Number(row.iskonto_orani),
    iskontoTutari: Number(row.iskonto_tutari),
    iskontoOnaylandi: row.iskonto_onaylandi === 1,
    iskontoOnaylayanUserId: row.iskonto_onaylayan_user_id ?? null,
    iskontoOnayAt: row.iskonto_onay_at ?? null,
    kdvOrani: Number(row.kdv_orani),
    kdvDahil: row.kdv_dahil === 1,
    kdvTutari: Number(row.kdv_tutari),
    nakliye: Number(row.nakliye),
    genelToplam: Number(row.genel_toplam),
    gecerlilikTarihi: toDateStr(row.gecerlilik_tarihi),
    odemeKosullari: row.odeme_kosullari ?? null,
    teslimKosullari: row.teslim_kosullari ?? null,
    aciklama: row.aciklama ?? null,
    redNedeni: row.red_nedeni ?? null,
    donusenSiparisId: row.donusen_siparis_id ?? null,
    goruntulemeToken: row.goruntuleme_token ?? null,
    gonderimAt: row.gonderim_at ?? null,
    ilkGoruntulemeAt: row.ilk_goruntuleme_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    kalemler: extras?.kalemler ?? [],
    gonderimler: extras?.gonderimler ?? [],
    revizyonlar: extras?.revizyonlar ?? [],
  };
}

export function teklifTalepRowToDto(row: TeklifTalepRow) {
  return {
    id: row.id,
    kaynakSayfa: row.kaynak_sayfa ?? null,
    referrer: row.referrer ?? null,
    dil: row.dil,
    ad: row.ad,
    firma: row.firma ?? null,
    email: row.email ?? null,
    telefon: row.telefon ?? null,
    konu: row.konu ?? null,
    mesaj: row.mesaj ?? null,
    formDetaylari: (row.form_detaylari as Record<string, string> | null) ?? null,
    seciliUrunler: (row.secili_urunler as unknown[] | null) ?? [],
    utm: (row.utm as Record<string, unknown> | null) ?? null,
    kvkkOnay: row.kvkk_onay === 1,
    durum: row.durum,
    atananUserId: row.atanan_user_id ?? null,
    musteriId: row.musteri_id ?? null,
    teklifId: row.teklif_id ?? null,
    createdAt: row.created_at,
  };
}
