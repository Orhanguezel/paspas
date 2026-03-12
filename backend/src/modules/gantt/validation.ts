import { z } from 'zod';

const durumEnum = z.enum(['bekliyor', 'calisiyor', 'duraklatildi', 'tamamlandi', 'iptal']);

export const listQuerySchema = z.object({
  baslangic: z.string().date().optional(),
  bitis: z.string().date().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  durum: durumEnum.optional(),
  q: z.string().max(100).optional(),
  makineId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(300),
  offset: z.coerce.number().int().min(0).default(0),
}).transform((value) => ({
  ...value,
  dateFrom: value.dateFrom ?? value.baslangic,
  dateTo: value.dateTo ?? value.bitis,
}));

export const patchSchema = z.object({
  baslangicTarihi: z.string().date().nullable().optional(),
  bitisTarihi: z.string().date().nullable().optional(),
  durum: durumEnum.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type PatchBody = z.infer<typeof patchSchema>;
