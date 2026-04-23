import { z } from 'zod';

const sortEnum = z.enum(['ad', 'kod', 'created_at', 'stok', 'kritik_stok']);
const orderEnum = z.enum(['asc', 'desc']);

export const kategoriEnum = z.enum(['urun', 'yarimamul', 'operasyonel_ym', 'hammadde']);
export type Kategori = z.infer<typeof kategoriEnum>;

const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  kategori: kategoriEnum.optional(),
  tedarikTipi: z.enum(['uretim', 'satin_alma', 'fason']).optional(),
  urunGrubu: z.string().trim().min(1).optional(),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('kod'),
  order: orderEnum.default('asc'),
});

const operasyonMakineSchema = z.object({
  makineId: z.string().trim().min(1).max(36),
  oncelikSira: z.coerce.number().int().min(1).default(1),
});

const operasyonItemSchema = z.object({
  operasyonAdi: z.string().trim().min(1).max(255),
  sira: z.coerce.number().int().min(1).default(1),
  kalipId: z.string().trim().max(36).optional(),
  hazirlikSuresiDk: z.coerce.number().int().min(0).default(60),
  cevrimSuresiSn: z.coerce.number().min(0).default(45),
  montaj: z.boolean().default(false),
  makineler: z.array(operasyonMakineSchema).optional(),
});

const birimDonusumItemSchema = z.object({
  hedefBirim: z.string().trim().min(1).max(32),
  carpan: z.coerce.number().min(0.0001),
});

const optionalUrl = z.preprocess(
  (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? undefined : v),
  z.string().trim().max(1024).optional(),
);

const optionalUuid = z.preprocess(
  (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? undefined : v),
  z.string().min(1).optional(),
);

const optionalTrimmedStr = (max: number) =>
  z.preprocess(
    (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const createSchema = z.object({
  kategori: kategoriEnum.default('urun'),
  tedarikTipi: z.enum(['uretim', 'satin_alma', 'fason']).default('uretim'),
  urunGrubu: z.string().trim().max(128).optional(),
  kod: z.string().trim().min(1).max(64),
  ad: z.string().trim().min(1).max(255),
  aciklama: z.string().trim().max(500).optional(),
  birim: z.string().trim().min(1).max(16).default('kg'),
  renk: z.string().trim().max(64).optional(),
  imageUrl: optionalUrl,
  storageAssetId: optionalUuid,
  imageAlt: optionalTrimmedStr(255),
  stok: z.coerce.number().min(0).default(0),
  kritikStok: z.coerce.number().min(0).default(0),
  birimFiyat: z.coerce.number().min(0).optional(),
  kdvOrani: z.coerce.number().min(0).max(100).default(20),
  operasyonTipi: z.enum(['tek_tarafli', 'cift_tarafli']).nullable().optional(),
  isActive: z.boolean().optional(),
  operasyonlar: z.array(operasyonItemSchema).optional(),
  birimDonusumleri: z.array(birimDonusumItemSchema).optional(),
});

export const patchSchema = createSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'en_az_bir_alan_gonderilmeli' },
);

export const operasyonPatchSchema = z.object({
  operasyonAdi: z.string().trim().min(1).max(255).optional(),
  sira: z.coerce.number().int().min(1).optional(),
  kalipId: z.string().trim().max(36).nullable().optional(),
  hazirlikSuresiDk: z.coerce.number().int().min(0).optional(),
  cevrimSuresiSn: z.coerce.number().min(0).optional(),
  montaj: z.boolean().optional(),
  isActive: z.boolean().optional(),
  makineler: z.array(operasyonMakineSchema).optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  { message: 'en_az_bir_alan_gonderilmeli' },
);

// -- Medya --
const medyaItemSchema = z.object({
  id: z.string().trim().max(36).optional(),
  tip: z.enum(['image', 'video', 'url', 'pdf']).default('image'),
  url: z.string().trim().min(1).max(1024),
  storageAssetId: optionalUuid,
  baslik: optionalTrimmedStr(255),
  sira: z.coerce.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

export const medyaSaveSchema = z.object({
  items: z.array(medyaItemSchema).min(0).max(50),
});

// -- Operasyonel YM içeren tam ürün oluşturma (asıl ürün + otomatik operasyonel YM(ler) + reçeteler) --

const receteKalemItemSchema = z.object({
  urunId: z.string().trim().min(1),
  miktar: z.coerce.number().positive(),
  fireOrani: z.coerce.number().min(0).max(100).default(0),
  sira: z.coerce.number().int().min(0).default(0),
});

export const createUrunFullSchema = z.object({
  kod: z.string().trim().min(1).max(64),
  ad: z.string().trim().min(1).max(255),
  urunGrubu: z.string().trim().max(128).optional(),
  aciklama: z.string().trim().max(500).optional(),
  birim: z.string().trim().min(1).max(16).default('takim'),
  renk: z.string().trim().max(64).optional(),
  imageUrl: optionalUrl,
  storageAssetId: optionalUuid,
  imageAlt: optionalTrimmedStr(255),
  stok: z.coerce.number().min(0).default(0),
  kritikStok: z.coerce.number().min(0).default(0),
  birimFiyat: z.coerce.number().min(0).optional(),
  kdvOrani: z.coerce.number().min(0).max(100).default(20),
  operasyonTipi: z.enum(['tek_tarafli', 'cift_tarafli']),
  hazirlikSuresiDk: z.coerce.number().int().min(0).default(60),
  cevrimSuresiSn: z.coerce.number().min(0).default(45),
  yariMamulHammaddeleri: z.array(receteKalemItemSchema).default([]),
  asilUrunMalzemeleri: z.array(receteKalemItemSchema).default([]),
});

export type CreateUrunFullBody = z.infer<typeof createUrunFullSchema>;
export type ReceteKalemItem = z.infer<typeof receteKalemItemSchema>;

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
export type OperasyonItem = z.infer<typeof operasyonItemSchema>;
export type BirimDonusumItem = z.infer<typeof birimDonusumItemSchema>;
export type OperasyonPatchBody = z.infer<typeof operasyonPatchSchema>;
export type OperasyonMakineItem = z.infer<typeof operasyonMakineSchema>;
export type MedyaItem = z.infer<typeof medyaItemSchema>;
export type MedyaSaveBody = z.infer<typeof medyaSaveSchema>;
