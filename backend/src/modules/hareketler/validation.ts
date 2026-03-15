import { z } from 'zod';

const hareketTipiEnum = z.enum(['giris', 'cikis', 'duzeltme']);
const kaynakTipiEnum = z.enum(['sevkiyat', 'mal_kabul', 'stok_duzeltme', 'manuel', 'uretim', 'fire']);
const sortEnum = z.enum(['created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const periodEnum = z.enum(['today', 'week', 'custom']);
const entityIdSchema = z.string().trim().min(1);

export const listQuerySchema = z.object({
  urunId: entityIdSchema.optional(),
  q: z.string().trim().min(1).optional(),
  hareketTipi: hareketTipiEnum.optional(),
  kaynakTipi: kaynakTipiEnum.optional(),
  period: periodEnum.optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
}).superRefine((value, ctx) => {
  if (value.period === 'custom') {
    if (!value.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['startDate'], message: 'baslangic_tarihi_zorunlu' });
    }
    if (!value.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'bitis_tarihi_zorunlu' });
    }
  }
});

export const createSchema = z.object({
  urunId: entityIdSchema,
  hareketTipi: hareketTipiEnum,
  referansTipi: z.enum(['manuel', 'stok_duzeltme', 'uretim', 'fire']).default('manuel'),
  referansId: entityIdSchema.optional(),
  miktar: z.coerce.number().positive(),
  aciklama: z.string().trim().max(500).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
