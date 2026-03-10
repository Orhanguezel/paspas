import { z } from 'zod';

const sortEnum = z.enum(['ad', 'kod', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const durumEnum = z.enum(['aktif', 'bakim', 'ariza', 'pasif']);

const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  durum: durumEnum.optional(),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
});

export const createSchema = z.object({
  kod: z.string().trim().min(1).max(64),
  ad: z.string().trim().min(1).max(255),
  tonaj: z.coerce.number().positive().optional(),
  saatlikKapasite: z.coerce.number().positive().optional(),
  calisir24Saat: z.boolean().optional(),
  kalipIds: z.array(z.string().min(1)).optional(),
  durum: durumEnum.default('aktif'),
  isActive: z.boolean().optional(),
});

export const patchSchema = createSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

// -- Kuyruk Yonetimi --

export const ataSchema = z.object({
  emirOperasyonId: z.string().min(1),
  makineId: z.string().min(1),
  montajMakineId: z.string().min(1).optional(),
});

export const kuyrukSiralaSchema = z.object({
  makineId: z.string().min(1),
  siralar: z.array(z.object({
    kuyruguId: z.string().min(1),
    sira: z.coerce.number().int().min(0),
  })).min(1),
});

export const capacityQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
export type AtaBody = z.infer<typeof ataSchema>;
export type KuyrukSiralaBody = z.infer<typeof kuyrukSiralaSchema>;
export type CapacityQuery = z.infer<typeof capacityQuerySchema>;
