// src/modules/siteSettings/validation.ts

import { z } from 'zod';

/** JSON-like recursive schema (no-any) */
const jsonLiteral = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type JsonLiteral = z.infer<typeof jsonLiteral>;
export type JsonLike = JsonLiteral | JsonLike[] | { [k: string]: JsonLike };
export const jsonLike: z.ZodType<JsonLike> = z.lazy(() =>
  z.union([jsonLiteral, z.array(jsonLike), z.record(jsonLike)])
);

export const siteSettingUpsertSchema = z.object({
  key: z.string().min(1).max(100),
  value: jsonLike, // FE tarafı JSON.stringify edilmiş stringi parse edecek
});

export const siteSettingBulkUpsertSchema = z.object({
  items: z.array(siteSettingUpsertSchema).min(1),
});

export type SiteSettingUpsertInput = z.infer<typeof siteSettingUpsertSchema>;
export type SiteSettingBulkUpsertInput = z.infer<typeof siteSettingBulkUpsertSchema>;
