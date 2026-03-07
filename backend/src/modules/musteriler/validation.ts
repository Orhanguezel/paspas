import { z } from 'zod';

const musteriTurEnum = z.enum(['musteri', 'tedarikci']);
const sortEnum = z.enum(['ad', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  tur: musteriTurEnum.optional(),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
});

export const createSchema = z.object({
  tur: musteriTurEnum.default('musteri'),
  kod: z.string().trim().min(1).max(32).optional(),
  ad: z.string().trim().min(1).max(255),
  ilgiliKisi: z.string().trim().max(255).optional(),
  telefon: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(255).optional(),
  adres: z.string().trim().max(500).optional(),
  cariKodu: z.string().trim().max(64).optional(),
  sevkiyatNotu: z.string().trim().max(500).optional(),
  iskonto: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const patchSchema = createSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'en_az_bir_alan_gonderilmeli' },
);

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
