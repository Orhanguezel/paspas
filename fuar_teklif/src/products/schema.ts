import { z } from 'zod';

const optionalText = z.string().trim().max(255).nullable().optional();
const optionalNumber = z.number().nonnegative().nullable().optional();

export const productCreateSchema = z.object({
  code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255),
  category: optionalText, supplyType: optionalText, unit: z.enum(['set', 'carton', 'pallet']).default('set'),
  productGroup: optionalText, productSubgroup: optionalText, description: z.string().trim().nullable().optional(),
  priceTry: optionalNumber, priceUsd: optionalNumber, priceEur: optionalNumber, vatRate: z.number().min(0).max(100).default(0),
  setsPerCarton: z.number().int().positive(), cartonsPerPallet: z.number().int().positive(),
  moqAmount: z.number().int().positive(), moqUnit: z.enum(['set', 'carton', 'pallet']),
  cartonWidthCm: optionalNumber, cartonLengthCm: optionalNumber, cartonHeightCm: optionalNumber,
  palletWidthCm: optionalNumber, palletLengthCm: optionalNumber, palletHeightCm: optionalNumber,
  netWeightPerSetKg: optionalNumber, grossWeightPerCartonKg: optionalNumber, palletTareKg: optionalNumber,
  hsCode: z.string().trim().max(32).nullable().optional(), originCountry: z.string().trim().min(1).max(80).default('Türkiye'),
  isActive: z.boolean().default(true),
});

export const productUpdateSchema = productCreateSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'at_least_one_field_required' });
export const productListSchema = z.object({
  q: z.string().trim().max(120).optional(), limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0), active: z.enum(['true', 'false']).optional(),
});
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
