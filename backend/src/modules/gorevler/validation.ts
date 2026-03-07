import { z } from 'zod';

const durumEnum = z.enum(['acik', 'devam_ediyor', 'beklemede', 'tamamlandi', 'iptal']);
const oncelikEnum = z.enum(['dusuk', 'normal', 'yuksek', 'kritik']);
const tipEnum = z.enum(['manuel', 'kritik_stok', 'satin_alma', 'uretim', 'sevkiyat', 'audit', 'genel']);
const roleEnum = z.enum(['admin', 'operator', 'sevkiyatci', 'satin_almaci']);
const sortEnum = z.enum(['created_at', 'termin_tarihi', 'oncelik', 'durum']);
const orderEnum = z.enum(['asc', 'desc']);
const idSchema = z.string().trim().min(1).max(36);

export const listQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  durum: durumEnum.optional(),
  oncelik: oncelikEnum.optional(),
  modul: z.string().trim().min(1).max(64).optional(),
  atananKullaniciId: idSchema.optional(),
  atananRol: roleEnum.optional(),
  sadeceBenim: z.preprocess((value) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  }, z.boolean()).optional(),
  gecikenOnly: z.preprocess((value) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  }, z.boolean()).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: sortEnum.default('termin_tarihi'),
  order: orderEnum.default('asc'),
});

export const createSchema = z.object({
  baslik: z.string().trim().min(1).max(255),
  aciklama: z.string().trim().max(4000).optional(),
  tip: tipEnum.default('manuel'),
  modul: z.string().trim().min(1).max(64).optional(),
  ilgiliKayitId: idSchema.optional(),
  atananKullaniciId: idSchema.optional(),
  atananRol: roleEnum.optional(),
  durum: durumEnum.default('acik'),
  oncelik: oncelikEnum.default('normal'),
  terminTarihi: z.coerce.date().optional(),
});

export const updateSchema = createSchema.partial().extend({
  durum: durumEnum.optional(),
  oncelik: oncelikEnum.optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateGorevBody = z.infer<typeof createSchema>;
export type UpdateGorevBody = z.infer<typeof updateSchema>;
