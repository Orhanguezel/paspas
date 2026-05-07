import { z } from 'zod';

export const targetListQuerySchema = z.object({
  q:        z.string().trim().optional(),
  category: z.string().optional(),
  status:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(500).default(100),
  offset:   z.coerce.number().int().min(0).default(0),
  sort:     z.enum(['name', 'created_at', 'churn_risk_score']).default('created_at'),
  order:    z.enum(['asc', 'desc']).default('desc'),
});

export const targetCreateSchema = z.object({
  name:            z.string().trim().min(1).max(255),
  category:        z.string().default('dealer'),
  status:          z.string().default('active'),
  website:         z.string().url().optional(),
  phone:           z.string().trim().max(50).optional(),
  email:           z.string().email().optional(),
  contact_name:    z.string().trim().max(255).optional(),
  city:            z.string().trim().max(100).optional(),
  district:        z.string().trim().max(100).optional(),
  instagram_url:   z.string().url().optional(),
  google_maps_url: z.string().url().optional(),
  notes:           z.string().optional(),
});

export const targetPatchSchema = targetCreateSchema.partial();

export const leadListQuerySchema = z.object({
  q:        z.string().trim().optional(),
  status:   z.string().optional(),
  priority: z.string().optional(),
  source:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(500).default(100),
  offset:   z.coerce.number().int().min(0).default(0),
  sort:     z.enum(['name', 'created_at', 'score', 'priority']).default('created_at'),
  order:    z.enum(['asc', 'desc']).default('desc'),
});

export const leadCreateSchema = z.object({
  name:         z.string().trim().min(1).max(255),
  category:     z.string().trim().max(100).optional(),
  source:       z.string().default('manual'),
  status:       z.string().default('new'),
  priority:     z.string().default('medium'),
  website:      z.string().url().optional(),
  phone:        z.string().trim().max(50).optional(),
  email:        z.string().email().optional(),
  contact_name: z.string().trim().max(255).optional(),
  city:         z.string().trim().max(100).optional(),
  district:     z.string().trim().max(100).optional(),
  notes:        z.string().optional(),
  assigned_to:  z.string().trim().max(255).optional(),
});

export const leadPatchSchema = leadCreateSchema.partial();

export const signalListQuerySchema = z.object({
  target_id:   z.string().optional(),
  lead_id:     z.string().optional(),
  severity:    z.string().optional(),
  is_reviewed: z.union([z.boolean(), z.undefined()]).optional(),
  limit:       z.coerce.number().int().min(1).max(500).default(100),
  offset:      z.coerce.number().int().min(0).default(0),
});

export const signalCreateSchema = z.object({
  target_id:   z.string().optional(),
  lead_id:     z.string().optional(),
  signal_type: z.string().default('manual'),
  severity:    z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  title:       z.string().trim().min(1).max(500),
  description: z.string().optional(),
  source_url:  z.string().url().optional(),
});

export const signalReviewSchema = z.object({
  id: z.string(),
});

export const paspasExternalListQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const CATEGORY_ALIAS: Record<string, string> = {
  müşteri: 'musteri', musteri: 'musteri',
  bayi: 'dealer', distribütör: 'distributor', dağıtıcı: 'distributor', distributor: 'distributor',
  prospect: 'prospect',
};

const bulkImportRowSchema = z.object({
  name:         z.string().trim().min(1).max(255),
  category:     z.string().trim().max(50).optional().transform(v =>
    v ? (CATEGORY_ALIAS[v.toLowerCase()] ?? v) : 'prospect',
  ),
  website:      z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  phone:        z.string().trim().max(50).optional(),
  email:        z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  contact_name: z.string().trim().max(255).optional(),
  city:         z.string().trim().max(100).optional(),
  district:     z.string().trim().max(100).optional(),
  notes:        z.string().optional(),
});

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

export const bulkImportSchema = z.object({
  rows:        z.array(bulkImportRowSchema).min(1).max(500),
  dry_run:     z.boolean().default(false),
  on_conflict: z.enum(['skip', 'update']).default('skip'),
});

export const paspasSyncSchema = z.object({
  mode: z.enum(['all', 'customers', 'dealers']).default('all'),
});
