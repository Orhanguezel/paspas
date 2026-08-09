import { z } from 'zod';

const text = z.string().trim().max(255).nullable().optional();
export const customerCreateSchema = z.object({
  code: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(255),
  contactName: text, phone: text, mobile: text, email: z.string().trim().email().max(191).nullable().optional(),
  website: text, defaultDiscountPercent: z.number().min(0).max(100).default(0), address: z.string().trim().nullable().optional(),
  country: z.string().trim().max(120).nullable().optional(), city: z.string().trim().max(120).nullable().optional(),
  isForeign: z.boolean().default(true), isActive: z.boolean().default(true),
});
export const customerUpdateSchema = customerCreateSchema.partial().refine((value) => Object.keys(value).length > 0);
export const customerListSchema = z.object({ q: z.string().trim().max(120).optional(), limit: z.coerce.number().int().min(1).max(100).default(25), offset: z.coerce.number().int().min(0).default(0) });
export type CustomerCreate = z.infer<typeof customerCreateSchema>;
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;
