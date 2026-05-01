import { z } from 'zod';

export const NOT_TIPI = ['note', 'todo', 'bug', 'idea', 'question'] as const;
export const ONCELIK = ['low', 'normal', 'high', 'urgent'] as const;
export const DURUM = ['open', 'in_progress', 'done', 'wontfix'] as const;

export const listQuerySchema = z.object({
  dokumanKey: z.string().trim().min(1).max(64).optional(),
  notTipi: z.enum(NOT_TIPI).optional(),
  oncelik: z.enum(ONCELIK).optional(),
  durum: z.enum(DURUM).optional(),
  q: z.string().trim().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'oncelik']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createSchema = z.object({
  dokumanKey: z.string().trim().min(1).max(64),
  dokumanBaslik: z.string().trim().max(255).optional().nullable(),
  notTipi: z.enum(NOT_TIPI).default('note'),
  baslik: z.string().trim().max(255).optional().nullable(),
  icerik: z.string().trim().min(1),
  etiketler: z.array(z.string().trim().min(1).max(64)).max(20).optional().nullable(),
  oncelik: z.enum(ONCELIK).default('normal'),
  durum: z.enum(DURUM).default('open'),
});

export const patchSchema = createSchema.partial().extend({
  dokumanKey: z.string().trim().min(1).max(64).optional(),
  icerik: z.string().trim().min(1).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
