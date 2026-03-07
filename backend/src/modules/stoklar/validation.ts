import { z } from 'zod';

const sortEnum = z.enum(['ad', 'kod', 'stok', 'kritik_stok']);
const orderEnum = z.enum(['asc', 'desc']);

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  kategori: z.enum(['urun', 'yarimamul', 'hammadde']).optional(),
  durum: z.enum(['yeterli', 'kritik', 'yetersiz']).optional(),
  kritikOnly: z.preprocess((value) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  }, z.boolean()).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('ad'),
  order: orderEnum.default('asc'),
});

export const adjustStockSchema = z.object({
  miktarDegisimi: z.coerce.number(),
  aciklama: z.string().trim().max(255).optional(),
});

export const yeterlilikQuerySchema = z.object({
  urunId: z.string().trim().min(1),
  miktar: z.coerce.number().min(0.0001),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type AdjustStockBody = z.infer<typeof adjustStockSchema>;
export type YeterlilikQuery = z.infer<typeof yeterlilikQuerySchema>;
