import { z } from 'zod';

export const quoteCreateSchema = z.object({
  customerId: z.string().uuid(), currency: z.enum(['USD', 'EUR', 'TRY']),
  deliveryMethod: z.enum(['EXW', 'FOB', 'CIF']).default('EXW'), loadingType: z.enum(['loose', 'palletized']).default('palletized'),
  freight: z.number().nonnegative().default(0), extraDiscountPercent: z.number().min(0).max(100).default(0),
  deliveryTime: z.string().trim().min(1).max(120).default('3-4 Weeks'), destination: z.string().trim().max(255).nullable().optional(),
  lines: z.array(z.object({ productId: z.string().uuid(), amount: z.number().int().positive(), unit: z.enum(['set', 'carton', 'pallet']), unitPricePerSet: z.number().nonnegative().optional() })).min(1),
});
export type QuoteCreate = z.infer<typeof quoteCreateSchema>;
