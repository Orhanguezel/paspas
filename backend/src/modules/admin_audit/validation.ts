import { z } from 'zod';

const methodEnum = z.enum(['POST', 'PUT', 'PATCH', 'DELETE']);
const orderEnum = z.enum(['asc', 'desc']);
const moduleEnum = z.enum([
  'dashboard',
  'musteriler',
  'urunler',
  'satis_siparisleri',
  'uretim_emirleri',
  'makine_havuzu',
  'is_yukler',
  'gantt',
  'stoklar',
  'satin_alma',
  'hareketler',
  'operator',
  'tanimlar',
  'tedarikci',
  'kullanicilar',
  'site_ayarlari',
  'medyalar',
  'veritabani',
  'audit',
  'diger',
]);
const entityIdSchema = z.string().trim().min(1);

export const listAuditQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  actorUserId: entityIdSchema.optional(),
  method: methodEnum.optional(),
  moduleKey: moduleEnum.optional(),
  resource: z.string().trim().min(1).optional(),
  statusCode: z.coerce.number().int().min(100).max(599).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  order: orderEnum.default('desc'),
});

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
