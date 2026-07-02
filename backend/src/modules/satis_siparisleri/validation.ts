import { z } from 'zod';

const sortEnum = z.enum(['siparis_tarihi', 'siparis_no', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const durumEnum = z.enum(['taslak', 'planlandi', 'onaylandi', 'uretimde', 'kismen_sevk', 'tamamlandi', 'kapali', 'iptal']);

const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

// DB: miktar decimal(12,4) → maks 99.999.999,9999 · birim_fiyat decimal(12,2) → maks 9.999.999.999,99
const siparisKalemSchema = z.object({
  urunId: z.string().uuid(),
  miktar: z.coerce.number().positive().max(99_999_999.9999, 'Miktar çok büyük (en fazla 99.999.999)'),
  birimFiyat: z.coerce.number().min(0).max(9_999_999_999.99, 'Birim fiyat çok büyük').default(0),
  sira: z.coerce.number().int().min(0).default(0),
});

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  musteriId: z.string().uuid().optional(),
  durum: durumEnum.optional(),
  isActive: isActiveQuerySchema.optional(),
  tamamlananlariGoster: z.preprocess((v) => v === 'true' || v === '1', z.boolean()).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
});

export const createSchema = z.object({
  siparisNo: z.string().trim().min(1).max(64),
  musteriId: z.string().uuid(),
  siparisTarihi: z.string().date(),
  terminTarihi: z.string().date().optional(),
  durum: durumEnum.default('taslak'),
  aciklama: z.string().trim().max(500).optional(),
  ekstraIndirimOrani: z.coerce.number().min(0).max(100).default(0),
  isActive: z.boolean().optional(),
  items: z.array(siparisKalemSchema).min(1),
});

export const patchSchema = z.object({
  siparisNo: z.string().trim().min(1).max(64).optional(),
  musteriId: z.string().uuid().optional(),
  siparisTarihi: z.string().date().optional(),
  terminTarihi: z.string().date().optional(),
  durum: durumEnum.optional(),
  aciklama: z.string().trim().max(500).optional(),
  ekstraIndirimOrani: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  items: z.array(siparisKalemSchema).min(1).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

// Siparis Islemleri (kalem bazli) sorgu schemasi
const kalemUretimDurumEnum = z.enum(['beklemede', 'uretime_aktarildi', 'makineye_atandi', 'uretiliyor', 'duraklatildi', 'uretim_tamamlandi']);
const gorunumEnum = z.enum(['duz', 'musteri', 'urun', 'alt_grup', 'siparis']);

export const islemlerQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  musteriId: z.string().uuid().optional(),
  urunId: z.string().uuid().optional(),
  uretimDurumu: kalemUretimDurumEnum.optional(),
  gorunum: gorunumEnum.default('duz'),
  gizleTamamlanan: z.preprocess((v) => v === 'true' || v === '1' || v === true, z.boolean()).default(true),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['siparis_tarihi', 'urun_ad', 'musteri_ad', 'created_at']).default('created_at'),
  order: orderEnum.default('desc'),
});

export const uretimeAktarSchema = z.object({
  kalemIds: z.array(z.string().min(1)).optional(),
  kalemler: z.array(z.object({
    kalemId: z.string().min(1),
    miktar: z.coerce.number().positive(),
  })).optional(),
  manuelEmirler: z.array(z.object({
    urunId: z.string().min(1),
    miktar: z.coerce.number().positive(),
    musteriOzet: z.string().trim().max(255).optional(),
  })).optional(),
  birlestir: z.boolean().default(false),
}).refine((value) =>
  (value.kalemler?.length ?? 0) > 0 ||
  (value.kalemIds?.length ?? 0) > 0 ||
  (value.manuelEmirler?.length ?? 0) > 0,
{
  message: 'kalem_secimi_zorunlu',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type IslemlerQuery = z.infer<typeof islemlerQuerySchema>;
export type UretimeAktarBody = z.infer<typeof uretimeAktarSchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
