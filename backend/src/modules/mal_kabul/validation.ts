import { z } from 'zod';

export const kaynakTipiEnum = z.enum([
  'satin_alma',
  'fason',
  'hammadde',
  'yari_mamul',
  'iade',
  'diger',
]);

export const kaliteDurumuEnum = z.enum(['bekliyor', 'kabul', 'red', 'kosullu']);

export const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  kaynakTipi: kaynakTipiEnum.optional(),
  urunId: z.string().min(1).optional(),
  tedarikciId: z.string().min(1).optional(),
  kaliteDurumu: kaliteDurumuEnum.optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['kabul_tarihi', 'gelen_miktar']).default('kabul_tarihi'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createSchema = z
  .object({
    kaynakTipi: kaynakTipiEnum.default('satin_alma'),
    satinAlmaSiparisId: z.string().min(1).optional(),
    satinAlmaKalemId: z.string().min(1).optional(),
    urunId: z.string().min(1),
    tedarikciId: z.string().min(1).optional(),
    gelenMiktar: z.coerce.number().min(0.0001),
    partiNo: z.string().trim().max(64).optional(),
    notlar: z.string().trim().max(500).optional(),
    kaliteDurumu: kaliteDurumuEnum.default('bekliyor'),
    kaliteNotu: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    // satin_alma requires SA fields
    if (data.kaynakTipi === 'satin_alma') {
      if (!data.satinAlmaSiparisId) {
        ctx.addIssue({ code: 'custom', path: ['satinAlmaSiparisId'], message: 'Satın alma kaynağı için sipariş ID zorunlu' });
      }
      if (!data.satinAlmaKalemId) {
        ctx.addIssue({ code: 'custom', path: ['satinAlmaKalemId'], message: 'Satın alma kaynağı için kalem ID zorunlu' });
      }
    }
    // fason requires tedarikci
    if (data.kaynakTipi === 'fason' && !data.tedarikciId) {
      ctx.addIssue({ code: 'custom', path: ['tedarikciId'], message: 'Fason kaynağı için tedarikçi zorunlu' });
    }
  });

export const patchSchema = z.object({
  notlar: z.string().trim().max(500).optional(),
  kaliteDurumu: kaliteDurumuEnum.optional(),
  kaliteNotu: z.string().trim().max(500).optional(),
  partiNo: z.string().trim().max(64).optional(),
  gelenMiktar: z.coerce.number().min(0).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type PatchBody = z.infer<typeof patchSchema>;
