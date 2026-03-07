import { z } from 'zod';

const durumEnum = z.enum(['planlandi', 'hazirlaniyor', 'uretimde', 'tamamlandi', 'iptal']);

export const listQuerySchema = z.object({
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  durum: durumEnum.optional(),
  q: z.string().max(100).optional(),
  makineId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(300),
  offset: z.coerce.number().int().min(0).default(0),
});

export const patchSchema = z.object({
  baslangicTarihi: z.string().date().nullable().optional(),
  bitisTarihi: z.string().date().nullable().optional(),
  durum: durumEnum.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type PatchBody = z.infer<typeof patchSchema>;
