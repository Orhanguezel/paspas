import { sql } from 'drizzle-orm';
import { char, datetime, decimal, int, mysqlTable, tinyint, varchar } from 'drizzle-orm/mysql-core';
import { storageAssets } from '@/modules/storage/schema';

export const urunler = mysqlTable('urunler', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  kategori: varchar('kategori', { length: 32 }).notNull().default('urun'),
  tedarik_tipi: varchar('tedarik_tipi', { length: 32 }).notNull().default('uretim'),
  kod: varchar('kod', { length: 64 }).notNull(),
  ad: varchar('ad', { length: 255 }).notNull(),
  aciklama: varchar('aciklama', { length: 500 }),
  birim: varchar('birim', { length: 16 }).notNull().default('kg'),
  renk: varchar('renk', { length: 64 }),
  image_url: varchar('image_url', { length: 1024 }),
  storage_asset_id: char('storage_asset_id', { length: 36 }).references(() => storageAssets.id, { onDelete: 'set null' }),
  image_alt: varchar('image_alt', { length: 255 }),
  stok: decimal('stok', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  kritik_stok: decimal('kritik_stok', { precision: 12, scale: 4 }).notNull().default('0.0000'),
  birim_fiyat: decimal('birim_fiyat', { precision: 12, scale: 2 }),
  kdv_orani: decimal('kdv_orani', { precision: 5, scale: 2 }).notNull().default('20.00'),
  operasyon_tipi: varchar('operasyon_tipi', { length: 32 }).notNull().default('tek_tarafli'),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type UrunRow = typeof urunler.$inferSelect;

export type UrunDto = {
  id: string;
  kategori: string;
  tedarikTipi: string;
  kod: string;
  ad: string;
  aciklama: string | null;
  birim: string;
  renk: string | null;
  imageUrl: string | null;
  storageAssetId: string | null;
  imageAlt: string | null;
  stok: number;
  kritikStok: number;
  birimFiyat: number | null;
  kdvOrani: number;
  operasyonTipi: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function rowToDto(row: UrunRow): UrunDto {
  return {
    id: row.id,
    kategori: row.kategori,
    tedarikTipi: row.tedarik_tipi,
    kod: row.kod,
    ad: row.ad,
    aciklama: row.aciklama ?? null,
    birim: row.birim,
    renk: row.renk ?? null,
    imageUrl: row.image_url ?? null,
    storageAssetId: row.storage_asset_id ?? null,
    imageAlt: row.image_alt ?? null,
    stok: Number(row.stok ?? 0),
    kritikStok: Number(row.kritik_stok ?? 0),
    birimFiyat: row.birim_fiyat ? Number(row.birim_fiyat) : null,
    kdvOrani: Number(row.kdv_orani ?? 20),
    operasyonTipi: row.operasyon_tipi,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// -- Urun Operasyonlari --
export const urunOperasyonlari = mysqlTable('urun_operasyonlari', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  sira: tinyint('sira', { unsigned: true }).notNull().default(1),
  operasyon_adi: varchar('operasyon_adi', { length: 255 }).notNull(),
  kalip_id: char('kalip_id', { length: 36 }),
  hazirlik_suresi_dk: int('hazirlik_suresi_dk', { unsigned: true }).notNull().default(60),
  cevrim_suresi_sn: decimal('cevrim_suresi_sn', { precision: 10, scale: 2 }).notNull().default('45.00'),
  montaj: tinyint('montaj', { unsigned: true }).notNull().default(0),
  is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export type UrunOperasyonRow = typeof urunOperasyonlari.$inferSelect;

export type UrunOperasyonDto = {
  id: string;
  urunId: string;
  sira: number;
  operasyonAdi: string;
  kalipId: string | null;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  montaj: boolean;
  isActive: boolean;
  makineler: UrunOperasyonMakineDto[];
};

export function operasyonRowToDto(row: UrunOperasyonRow, makineler: UrunOperasyonMakineDto[] = []): UrunOperasyonDto {
  return {
    id: row.id,
    urunId: row.urun_id,
    sira: row.sira,
    operasyonAdi: row.operasyon_adi,
    kalipId: row.kalip_id ?? null,
    hazirlikSuresiDk: row.hazirlik_suresi_dk,
    cevrimSuresiSn: Number(row.cevrim_suresi_sn),
    montaj: row.montaj === 1,
    isActive: row.is_active === 1,
    makineler,
  };
}

// -- Urun Operasyon Makineleri (junction) --
export const urunOperasyonMakineleri = mysqlTable('urun_operasyon_makineleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  urun_operasyon_id: char('urun_operasyon_id', { length: 36 }).notNull(),
  makine_id: char('makine_id', { length: 36 }).notNull(),
  oncelik_sira: tinyint('oncelik_sira', { unsigned: true }).notNull().default(1),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type UrunOperasyonMakineRow = typeof urunOperasyonMakineleri.$inferSelect;

export type UrunOperasyonMakineDto = {
  id: string;
  urunOperasyonId: string;
  makineId: string;
  oncelikSira: number;
};

export function operasyonMakineRowToDto(row: UrunOperasyonMakineRow): UrunOperasyonMakineDto {
  return {
    id: row.id,
    urunOperasyonId: row.urun_operasyon_id,
    makineId: row.makine_id,
    oncelikSira: row.oncelik_sira,
  };
}

// -- Urun Birim Donusumleri --
export const urunBirimDonusumleri = mysqlTable('urun_birim_donusumleri', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  urun_id: char('urun_id', { length: 36 }).notNull(),
  hedef_birim: varchar('hedef_birim', { length: 32 }).notNull(),
  carpan: decimal('carpan', { precision: 12, scale: 4 }).notNull(),
  created_at: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type BirimDonusumRow = typeof urunBirimDonusumleri.$inferSelect;

export type BirimDonusumDto = {
  id: string;
  urunId: string;
  hedefBirim: string;
  carpan: number;
};

export function birimDonusumRowToDto(row: BirimDonusumRow): BirimDonusumDto {
  return {
    id: row.id,
    urunId: row.urun_id,
    hedefBirim: row.hedef_birim,
    carpan: Number(row.carpan),
  };
}
