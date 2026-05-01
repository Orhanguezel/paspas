import { z } from 'zod';

const durumEnum = z.enum(['bekliyor', 'hazirlaniyor', 'uretimde', 'tamamlandi', 'iptal']);
const idSchema = z.string().trim().min(8).max(36);

export const listQuerySchema = z.object({
  makineId: idSchema.optional(),
  tamamlananlariGoster: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createSchema = z.object({
  makineId: idSchema,
  uretimEmriId: idSchema,
  sira: z.coerce.number().int().min(0).default(0),
  planlananSureDk: z.coerce.number().int().min(0).default(0),
  durum: durumEnum.default('bekliyor'),
});

export const patchSchema = z.object({
  makineId: idSchema.optional(),
  uretimEmriId: idSchema.optional(),
  sira: z.coerce.number().int().min(0).optional(),
  planlananSureDk: z.coerce.number().int().min(0).optional(),
  durum: durumEnum.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
