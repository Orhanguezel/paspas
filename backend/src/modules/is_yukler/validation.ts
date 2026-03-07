import { z } from 'zod';

const durumEnum = z.enum(['bekliyor', 'hazirlaniyor', 'uretimde', 'tamamlandi', 'iptal']);

export const listQuerySchema = z.object({
  makineId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createSchema = z.object({
  makineId: z.string().min(1),
  uretimEmriId: z.string().min(1),
  sira: z.coerce.number().int().min(0).default(0),
  planlananSureDk: z.coerce.number().int().min(0).default(0),
  durum: durumEnum.default('bekliyor'),
});

export const patchSchema = z.object({
  makineId: z.string().min(1).optional(),
  uretimEmriId: z.string().min(1).optional(),
  sira: z.coerce.number().int().min(0).optional(),
  planlananSureDk: z.coerce.number().int().min(0).optional(),
  durum: durumEnum.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
