import { z } from 'zod';

const jsonLiteral = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type JsonLiteral = z.infer<typeof jsonLiteral>;

export type JsonLike = JsonLiteral | JsonLike[] | { [k: string]: JsonLike };

export const jsonLike: z.ZodType<JsonLike> = z.lazy(() =>
  z.union([jsonLiteral, z.array(jsonLike), z.record(jsonLike)]),
);

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  prefix: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const upsertSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: jsonLike,
});

export const updateSchema = z.object({
  value: jsonLike,
});

export const bulkUpsertSchema = z.object({
  items: z.array(upsertSchema).min(1).max(500),
});

export const deleteManyQuerySchema = z.object({
  key: z.string().trim().min(1).optional(),
  keyNe: z.string().trim().min(1).optional(),
  prefix: z.string().trim().min(1).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type UpsertBody = z.infer<typeof upsertSchema>;
export type UpdateBody = z.infer<typeof updateSchema>;
export type BulkUpsertBody = z.infer<typeof bulkUpsertSchema>;
export type DeleteManyQuery = z.infer<typeof deleteManyQuerySchema>;
