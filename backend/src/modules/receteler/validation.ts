import { z } from 'zod';

const sortEnum = z.enum(['ad', 'kod', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);

const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

const receteItemSchema = z.object({
  urunId: z.string().uuid(),
  miktar: z.coerce.number().positive(),
  fireOrani: z.coerce.number().min(0).max(100).default(0),
  aciklama: z.string().trim().max(500).optional(),
  sira: z.coerce.number().int().min(0).default(0),
});

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
});

export const createSchema = z.object({
  kod: z.string().trim().min(1).max(64),
  ad: z.string().trim().min(1).max(255),
  urunId: z.string().uuid().optional(),
  aciklama: z.string().trim().max(500).optional(),
  hedefMiktar: z.coerce.number().positive().default(1),
  isActive: z.boolean().optional(),
  items: z.array(receteItemSchema).min(1),
});

export const patchSchema = z.object({
  kod: z.string().trim().min(1).max(64).optional(),
  ad: z.string().trim().min(1).max(255).optional(),
  urunId: z.string().uuid().optional(),
  aciklama: z.string().trim().max(500).optional(),
  hedefMiktar: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional(),
  items: z.array(receteItemSchema).min(1).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
