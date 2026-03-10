import { z } from 'zod';

export const bekleyenlerQuerySchema = z.object({
  q: z.string().trim().optional(),
  musteriId: z.string().trim().optional(),
  stokFiltre: z.enum(['stoklu', 'tumu']).default('stoklu'),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

// Stokta olup siparişi olmayan ürünler (siparişsiz sevk için)
export const siparissizQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const sevkEmriCreateSchema = z.object({
  siparisId: z.string().trim().optional(),
  siparisKalemId: z.string().trim().optional(),
  musteriId: z.string().trim().min(1),
  urunId: z.string().trim().min(1),
  miktar: z.coerce.number().min(0.0001),
  tarih: z.string().trim().optional(), // default: bugün
  notlar: z.string().trim().max(500).optional(),
});

export const sevkEmriPatchSchema = z.object({
  durum: z.enum(['bekliyor', 'onaylandi', 'sevk_edildi', 'iptal']),
});

export const sevkEmriListQuerySchema = z.object({
  q: z.string().trim().optional(),
  durum: z.enum(['bekliyor', 'onaylandi', 'sevk_edildi', 'iptal']).optional(),
  musteriId: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['tarih', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type BekleyenlerQuery = z.infer<typeof bekleyenlerQuerySchema>;
export type SiparissizQuery = z.infer<typeof siparissizQuerySchema>;
export type SevkEmriCreate = z.infer<typeof sevkEmriCreateSchema>;
export type SevkEmriPatch = z.infer<typeof sevkEmriPatchSchema>;
export type SevkEmriListQuery = z.infer<typeof sevkEmriListQuerySchema>;
