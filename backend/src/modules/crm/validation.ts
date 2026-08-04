import { z } from 'zod';

const status = z.enum(['open', 'won', 'lost', 'on_hold', 'cancelled']);
const currency = z.enum(['TRY', 'USD', 'EUR', 'GBP']);

export const dealListSchema = z.object({
  q: z.string().trim().optional(), pipelineId: z.string().uuid().optional(), stageId: z.string().uuid().optional(),
  musteriId: z.string().uuid().optional(), ownerUserId: z.string().uuid().optional(), status: status.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100), offset: z.coerce.number().int().min(0).default(0),
});
export const dealCreateSchema = z.object({
  pipelineId: z.string().uuid().optional(), stageId: z.string().uuid().optional(), musteriId: z.string().uuid().optional().nullable(),
  talepId: z.string().uuid().optional().nullable(), title: z.string().trim().min(1).max(255), amount: z.coerce.number().min(0).default(0),
  currency: currency.default('TRY'), probability: z.coerce.number().int().min(0).max(100).optional().nullable(),
  expectedCloseDate: z.string().date().optional().nullable(), ownerUserId: z.string().uuid().optional().nullable(), source: z.string().max(64).optional().nullable(),
});
export const dealPatchSchema = dealCreateSchema.omit({ pipelineId: true, stageId: true, talepId: true }).partial()
  .extend({ status: status.optional(), lostReason: z.string().trim().max(500).optional().nullable() })
  .refine((v) => Object.keys(v).length > 0, 'En az bir alan gerekli');
export const dealMoveSchema = z.object({ stageId: z.string().uuid(), lostReason: z.string().trim().max(500).optional() });
export const talepToDealSchema = z.object({
  musteriId: z.string().uuid().optional(),
  yeniMusteri: z.object({ ad: z.string().trim().min(1).max(255), telefon: z.string().max(32).optional(), email: z.string().email().max(255).optional(), adres: z.string().max(500).optional() }).optional(),
  title: z.string().trim().min(1).max(255).optional(), ownerUserId: z.string().uuid().optional(), amount: z.coerce.number().min(0).default(0), currency: currency.default('TRY'),
}).refine((v) => Boolean(v.musteriId || v.yeniMusteri), 'Mevcut veya yeni müşteri gerekli');

export type DealList = z.infer<typeof dealListSchema>;
export type DealCreate = z.infer<typeof dealCreateSchema>;
export type DealPatch = z.infer<typeof dealPatchSchema>;
export type TalepToDeal = z.infer<typeof talepToDealSchema>;
