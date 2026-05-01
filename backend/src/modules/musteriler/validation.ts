import { z } from 'zod';

const musteriTurEnum = z.enum(['musteri', 'tedarikci']);
const sortEnum = z.enum(['ad', 'created_at']);
const orderEnum = z.enum(['asc', 'desc']);
const bayiSegmentEnum = z.enum(['toptanci', 'otomotiv', 'kucuk_bayi', 'ihracat', 'kurumsal', 'diger']);
const portalStatusEnum = z.enum(['not_invited', 'invited', 'active', 'suspended']);
const isActiveQuerySchema = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());
const optionalText = (max: number) => z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().max(max).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().url().max(500).optional(),
);

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  tur: musteriTurEnum.optional(),
  isActive: isActiveQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('created_at'),
  order: orderEnum.default('desc'),
});

export const nextKodQuerySchema = z.object({
  tur: musteriTurEnum.default('musteri'),
});

export const createSchema = z.object({
  tur: musteriTurEnum.default('musteri'),
  kod: z.string().trim().min(1).max(32).optional(),
  ad: z.string().trim().min(1).max(255),
  ilgiliKisi: optionalText(255),
  telefon: optionalText(32),
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().email().max(255).optional(),
  ),
  adres: optionalText(500),
  cariKodu: optionalText(64),
  sevkiyatNotu: optionalText(500),
  websiteUrl: optionalUrl,
  googleMapsUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  bayiSegment: bayiSegmentEnum.optional(),
  krediLimit: z.coerce.number().min(0).max(9999999999.99).optional(),
  mevcutBakiye: z.coerce.number().min(-9999999999.99).max(9999999999.99).optional(),
  vadeGunu: z.coerce.number().int().min(0).max(365).optional(),
  portalEnabled: z.boolean().optional(),
  portalStatus: portalStatusEnum.optional(),
  publicVeriIzni: z.boolean().optional(),
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
