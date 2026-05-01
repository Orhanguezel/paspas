import { z } from 'zod';

const sortEnum = z.enum(['siparis_tarihi', 'siparis_no', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const durumEnum = z.enum(['taslak', 'onaylandi', 'siparis_verildi', 'kismen_teslim', 'tamamlandi', 'iptal']);

const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

const kalemSchema = z.object({
  urunId: z.string().uuid(),
  miktar: z.coerce.number().positive(),
  birimFiyat: z.coerce.number().min(0).default(0),
  sira: z.coerce.number().int().min(0).default(0),
});

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  tedarikciId: z.string().uuid().optional(),
  durum: durumEnum.optional(),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
});

export const createSchema = z.object({
  siparisNo: z.string().trim().min(1).max(64),
  tedarikciId: z.string().uuid(),
  siparisTarihi: z.string().date(),
  terminTarihi: z.string().date().optional(),
  durum: durumEnum.default('taslak'),
  aciklama: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  items: z.array(kalemSchema).default([]),
});

export const patchSchema = z.object({
  siparisNo: z.string().trim().min(1).max(64).optional(),
  tedarikciId: z.string().uuid().optional(),
  siparisTarihi: z.string().date().optional(),
  terminTarihi: z.string().date().optional(),
  durum: durumEnum.optional(),
  aciklama: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  items: z.array(kalemSchema).min(1).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
