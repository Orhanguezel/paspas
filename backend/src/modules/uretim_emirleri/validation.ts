import { z } from 'zod';

const sortEnum = z.enum(['emir_no', 'baslangic_tarihi', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const durumEnum = z.enum(['planlandi', 'hazirlaniyor', 'uretimde', 'tamamlandi', 'iptal']);
const uuidSchema = z.string().min(1);

const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  siparisId: uuidSchema.optional(),
  urunId: uuidSchema.optional(),
  durum: durumEnum.optional(),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
});

export const createSchema = z.object({
  emirNo: z.string().trim().min(1).max(64),
  siparisKalemIds: z.array(uuidSchema).optional(),
  urunId: uuidSchema,
  receteId: uuidSchema.optional(),
  musteriOzet: z.string().trim().max(255).optional(),
  musteriDetay: z.string().trim().max(1000).optional(),
  planlananMiktar: z.coerce.number().positive(),
  uretilenMiktar: z.coerce.number().min(0).default(0),
  baslangicTarihi: z.string().date().optional(),
  bitisTarihi: z.string().date().optional(),
  terminTarihi: z.string().date().optional(),
  durum: durumEnum.default('planlandi'),
  isActive: z.boolean().optional(),
});

export const patchSchema = createSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
