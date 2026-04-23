// =============================================================
// FILE: src/modules/subCategories/validation.ts
// =============================================================
import { z } from 'zod';

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema);

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

export const subCategoryCreateSchema = z.object({
  id: z.string().min(1).optional(),
  category_id: z.string().min(1, 'category_id_required'),
  name: z.string().min(1, 'name_required').max(255),
  slug: z.string().min(1, 'slug_required').max(255).optional(),
  description: emptyToNull(z.string().optional().nullable()),
  image_url: emptyToNull(z.string().url().optional().nullable()),
  alt: emptyToNull(z.string().max(255).optional().nullable()),
  icon: emptyToNull(z.string().max(100).optional().nullable()),
  is_active: boolLike.optional(),
  is_featured: boolLike.optional(),
  has_cart: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),
});

export const subCategoryUpdateSchema = subCategoryCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'no_fields_to_update',
  });

export const subCategorySetImageSchema = z
  .object({
    asset_id: z.string().min(1).nullable().optional(),
    alt: emptyToNull(z.string().max(255).optional().nullable()),
  })
  .strict();

export type SubCategoryCreateInput = z.infer<typeof subCategoryCreateSchema>;
export type SubCategoryUpdateInput = z.infer<typeof subCategoryUpdateSchema>;
export type SubCategorySetImageInput = z.infer<typeof subCategorySetImageSchema>;
