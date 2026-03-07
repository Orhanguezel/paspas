import { z } from 'zod';

const gunlukDurumEnum = z.enum(['devam_ediyor', 'yarim_kaldi', 'durdu', 'iptal_edildi', 'makine_arizasi', 'tamamlandi']);

// -- Makine kuyrugu listeleme (makine bazli) --
export const listMakineKuyruguQuerySchema = z.object({
  makineId: z.string().min(1).optional(),
  durum: z.enum(['bekliyor', 'calisiyor', 'duraklatildi', 'tamamlandi', 'iptal']).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// -- Uretim baslat (ilk siradaki isi baslat) --
export const uretimBaslatBodySchema = z.object({
  makineKuyrukId: z.string().min(1),
});

// -- Uretim bitir (uretilen + fire gir) --
export const uretimBitirBodySchema = z.object({
  makineKuyrukId: z.string().min(1),
  uretilenMiktar: z.coerce.number().min(0),
  fireMiktar: z.coerce.number().min(0).default(0),
  birimTipi: z.enum(['adet', 'takim']).default('adet'),
  notlar: z.string().trim().max(1000).optional(),
});

// -- Duraklat --
export const duraklatBodySchema = z.object({
  makineKuyrukId: z.string().min(1),
  neden: z.string().trim().min(1).max(255),
  makineArizasi: z.boolean().default(false),
});

// -- Devam et --
export const devamEtBodySchema = z.object({
  makineKuyrukId: z.string().min(1),
});

// -- Vardiya basi / sonu --
export const vardiyaBasiBodySchema = z.object({
  makineId: z.string().min(1),
  vardiyaTipi: z.enum(['gunduz', 'gece']).default('gunduz'),
  notlar: z.string().trim().max(500).optional(),
});

export const vardiyaSonuBodySchema = z.object({
  makineId: z.string().min(1),
  uretilenMiktar: z.coerce.number().min(0).optional(),
  fireMiktar: z.coerce.number().min(0).default(0),
  birimTipi: z.enum(['adet', 'takim']).default('adet'),
  notlar: z.string().trim().max(500).optional(),
});

// -- Sevkiyat --
export const sevkiyatBodySchema = z.object({
  kalemler: z.array(z.object({
    musteriId: z.string().min(1),
    siparisId: z.string().min(1).optional(),
    siparisKalemId: z.string().min(1).optional(),
    urunId: z.string().min(1),
    miktar: z.coerce.number().min(0.0001),
    birim: z.string().trim().max(16).default('adet'),
  })).min(1),
  notlar: z.string().trim().max(500).optional(),
});

// -- Mal Kabul --
export const malKabulBodySchema = z.object({
  satinAlmaSiparisId: z.string().min(1),
  satinAlmaKalemId: z.string().min(1),
  urunId: z.string().min(1),
  gelenMiktar: z.coerce.number().min(0.0001),
  notlar: z.string().trim().max(500).optional(),
});

// -- Gunluk giris listesi --
export const listGunlukGirislerQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListMakineKuyruguQuery = z.infer<typeof listMakineKuyruguQuerySchema>;
export type UretimBaslatBody = z.infer<typeof uretimBaslatBodySchema>;
export type UretimBitirBody = z.infer<typeof uretimBitirBodySchema>;
export type DuraklatBody = z.infer<typeof duraklatBodySchema>;
export type DevamEtBody = z.infer<typeof devamEtBodySchema>;
export type VardiyaBasiBody = z.infer<typeof vardiyaBasiBodySchema>;
export type VardiyaSonuBody = z.infer<typeof vardiyaSonuBodySchema>;
export type SevkiyatBody = z.infer<typeof sevkiyatBodySchema>;
export type MalKabulBody = z.infer<typeof malKabulBodySchema>;
export type ListGunlukGirislerQuery = z.infer<typeof listGunlukGirislerQuerySchema>;
