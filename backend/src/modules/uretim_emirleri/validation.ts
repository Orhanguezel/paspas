import { z } from 'zod';

const sortEnum = z.enum(['emir_no', 'baslangic_tarihi', 'bitis_tarihi', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const durumEnum = z.enum(['atanmamis', 'planlandi', 'uretimde', 'montaj_bekliyor', 'tamamlandi', 'iptal']);
// char(36) — seed data may use non-standard UUID-like IDs (e.g. u0000001-...)
const uuidSchema = z.string().trim().min(1).max(36);

// Accepts a UUID string or empty string → undefined
const optionalUuidSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  uuidSchema.optional(),
);

// Accepts a date string (YYYY-MM-DD) or empty string → undefined
const optionalDateSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().date().optional(),
);

// Filters out empty strings from UUID arrays
const optionalUuidArraySchema = z.preprocess(
  (v) => {
    if (!Array.isArray(v)) return v;
    const filtered = v.filter((item) => typeof item === 'string' && item.trim() !== '');
    return filtered.length > 0 ? filtered : undefined;
  },
  z.array(uuidSchema).optional(),
);

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
  tamamlananlariGoster: z.coerce.boolean().default(false),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('bitis_tarihi'),
  order: orderEnum.default('asc'),
});

export const createSchema = z.object({
  emirNo: z.string().trim().min(1).max(64),
  siparisKalemIds: optionalUuidArraySchema,
  urunId: uuidSchema,
  receteId: optionalUuidSchema,
  musteriOzet: z.string().trim().max(255).optional(),
  musteriDetay: z.string().trim().max(1000).optional(),
  planlananMiktar: z.coerce.number().positive(),
  uretilenMiktar: z.coerce.number().min(0).default(0),
  baslangicTarihi: optionalDateSchema,
  bitisTarihi: optionalDateSchema,
  terminTarihi: optionalDateSchema,
  durum: durumEnum.default('atanmamis'),
  isActive: z.boolean().optional(),
});

export const patchSchema = createSchema
  .omit({ durum: true, uretilenMiktar: true })
  .partial()
  .extend({
    durum: durumEnum.optional(),
    uretilenMiktar: z.coerce.number().min(0).optional(),
  })
  .superRefine((value, ctx) => {
    const keys = Object.keys(value).filter((k) => (value as Record<string, unknown>)[k] !== undefined);
    if (keys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'en_az_bir_alan_gonderilmeli',
      });
    }
    if (value.durum !== undefined && value.durum !== 'iptal') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['durum'],
        message: 'manuel_durum_guncelleme_desteklenmiyor',
      });
    }
  });

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
