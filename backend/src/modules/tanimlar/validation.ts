import { z } from 'zod';

const saatSchema = z.string().regex(/^\d{2}:\d{2}$/, 'gecersiz_saat');

const tatilFieldsSchema = z.object({
  ad: z.string().trim().min(1).max(255),
  tarih: z.string().date(),
  baslangicSaati: saatSchema,
  bitisSaati: saatSchema,
  aciklama: z.string().trim().max(500).optional(),
});

export const createKalipSchema = z.object({
  kod: z.string().trim().min(1).max(64),
  ad: z.string().trim().min(1).max(255),
  aciklama: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const patchKalipSchema = createKalipSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'en_az_bir_alan_gonderilmeli',
});

export const setKalipUyumluMakinelerSchema = z.object({
  makineIds: z.array(z.string().min(1)).default([]),
});

export const createTatilSchema = tatilFieldsSchema.refine((value) => value.baslangicSaati < value.bitisSaati, {
  message: 'baslangic_bitis_once_olmali',
  path: ['bitisSaati'],
});

export const patchTatilSchema = tatilFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'en_az_bir_alan_gonderilmeli',
  })
  .refine(
    (value) => {
      if (!value.baslangicSaati || !value.bitisSaati) return true;
      return value.baslangicSaati < value.bitisSaati;
    },
    {
      message: 'baslangic_bitis_once_olmali',
      path: ['bitisSaati'],
    },
  );

export type CreateKalipBody = z.infer<typeof createKalipSchema>;
export type PatchKalipBody = z.infer<typeof patchKalipSchema>;
export type SetKalipUyumluMakinelerBody = z.infer<typeof setKalipUyumluMakinelerSchema>;
export type CreateTatilBody = z.infer<typeof createTatilSchema>;
export type PatchTatilBody = z.infer<typeof patchTatilSchema>;

// ── Vardiyalar ──────────────────────────────────────────────
const saatSchemaFull = z.string().regex(/^\d{2}:\d{2}$/, 'gecersiz_saat');

const vardiyaFieldsSchema = z.object({
  ad: z.string().trim().min(1).max(100),
  baslangicSaati: saatSchemaFull,
  bitisSaati: saatSchemaFull,
  aciklama: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const createVardiyaSchema = vardiyaFieldsSchema;

export const patchVardiyaSchema = vardiyaFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'en_az_bir_alan_gonderilmeli' });

export type CreateVardiyaBody = z.infer<typeof createVardiyaSchema>;
export type PatchVardiyaBody = z.infer<typeof patchVardiyaSchema>;

// ── Duruş Nedenleri ─────────────────────────────────────────
const DURUS_KATEGORILER = ['makine', 'malzeme', 'personel', 'planlama', 'diger'] as const;

const durusNedeniFieldsSchema = z.object({
  kod: z.string().trim().min(1).max(64),
  ad: z.string().trim().min(1).max(255),
  kategori: z.enum(DURUS_KATEGORILER).optional(),
  aciklama: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const createDurusNedeniSchema = durusNedeniFieldsSchema;

export const patchDurusNedeniSchema = durusNedeniFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'en_az_bir_alan_gonderilmeli' });

export type CreateDurusNedeniBody = z.infer<typeof createDurusNedeniSchema>;
export type PatchDurusNedeniBody = z.infer<typeof patchDurusNedeniSchema>;
