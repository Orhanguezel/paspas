import { z } from 'zod';

const gunlukDurumEnum = z.enum(['devam_ediyor', 'yarim_kaldi', 'durdu', 'iptal_edildi', 'makine_arizasi', 'tamamlandi']);
const emirDurumEnum = z.enum(['hazirlaniyor', 'uretimde', 'tamamlandi', 'iptal']);

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
  vardiyaKayitId: z.string().min(1).optional(),
  uretilenMiktar: z.coerce.number().min(0),
  fireMiktar: z.coerce.number().min(0).default(0),
  birimTipi: z.enum(['adet', 'takim']).default('adet'),
  notlar: z.string().trim().max(1000).optional(),
});

// -- Duraklat --
export const duraklatBodySchema = z.object({
  makineKuyrukId: z.string().min(1),
  durusNedeniId: z.string().min(1),
  neden: z.string().trim().min(1).max(255),
  anlikUretimMiktari: z.coerce.number().min(0).optional(),
});

// -- Devam et --
export const devamEtBodySchema = z.object({
  makineKuyrukId: z.string().min(1),
  vardiyaKayitId: z.string().min(1).optional(),
  uretilenMiktar: z.coerce.number().min(0).optional(),
  fireMiktar: z.coerce.number().min(0).default(0),
  birimTipi: z.enum(['adet', 'takim']).default('adet'),
  notlar: z.string().trim().max(500).optional(),
});

// -- Vardiya basi / sonu --
export const vardiyaBasiBodySchema = z.object({
  makineId: z.string().min(1),
  vardiyaTipi: z.enum(['gunduz', 'gece']).default('gunduz'),
  notlar: z.string().trim().max(500).optional(),
});

export const vardiyaSonuBodySchema = z.object({
  makineId: z.string().min(1),
  vardiyaKayitId: z.string().min(1).optional(),
  uretilenMiktar: z.coerce.number().min(0).optional(),
  fireMiktar: z.coerce.number().min(0).default(0),
  birimTipi: z.enum(['adet', 'takim']).default('adet'),
  notlar: z.string().trim().max(500).optional(),
});

export const gunlukUretimBodySchema = z.object({
  makineId: z.string().min(1),
  vardiyaKayitId: z.string().min(1).optional(),
  vardiyaTipi: z.enum(['gunduz', 'gece']).optional(),
  uretilenMiktar: z.coerce.number().min(0.0001),
  fireMiktar: z.coerce.number().min(0).default(0),
  birimTipi: z.enum(['adet', 'takim']).default('adet'),
  notlar: z.string().trim().max(500).optional(),
});

export const gunlukUretimPatchBodySchema = z.object({
  ekUretimMiktari: z.coerce.number().min(0).optional(),
  fireMiktari: z.coerce.number().min(0).optional(),
  netMiktar: z.coerce.number().min(0).optional(),
  notlar: z.string().trim().max(1000).nullable().optional(),
}).superRefine((value, ctx) => {
  const keys = Object.keys(value).filter((key) => (value as Record<string, unknown>)[key] !== undefined);
  if (keys.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'en_az_bir_alan_gonderilmeli',
    });
  }
  if (
    value.ekUretimMiktari !== undefined &&
    value.fireMiktari !== undefined &&
    value.netMiktar !== undefined &&
    Math.abs((value.ekUretimMiktari - value.fireMiktari) - value.netMiktar) > 0.0001
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['netMiktar'],
      message: 'net_miktar_uretim_eksi_fire_olmali',
    });
  }
});

export const kalipDegisimBaslatBodySchema = z.object({
  makineId: z.string().min(1),
  makineKuyrukId: z.string().min(1).optional(),
  notlar: z.string().trim().max(500).optional(),
});

export const kalipDegisimBitirBodySchema = z.object({
  durusKayitId: z.string().min(1),
  notlar: z.string().trim().max(500).optional(),
});

// Eski controller testleri ve entegrasyonlar bu isimleri import ediyor.
export const listQuerySchema = z.object({
  makineId: z.string().min(1).optional(),
  durum: emirDurumEnum.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const finishBodySchema = z.object({
  uretilenMiktar: z.coerce.number().min(0),
  durum: emirDurumEnum.default('tamamlandi'),
});

export const createGunlukGirisBodySchema = z.object({
  ekUretimMiktari: z.coerce.number().min(0).optional(),
  gunlukDurum: gunlukDurumEnum.optional(),
  makineArizasi: z.boolean().optional(),
  durusNedeni: z.string().trim().max(255).optional(),
  notlar: z.string().trim().max(500).optional(),
  emirDurumu: emirDurumEnum.optional(),
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
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListMakineKuyruguQuery = z.infer<typeof listMakineKuyruguQuerySchema>;
export type UretimBaslatBody = z.infer<typeof uretimBaslatBodySchema>;
export type UretimBitirBody = z.infer<typeof uretimBitirBodySchema>;
export type DuraklatBody = z.infer<typeof duraklatBodySchema>;
export type DevamEtBody = z.infer<typeof devamEtBodySchema>;
export type VardiyaBasiBody = z.infer<typeof vardiyaBasiBodySchema>;
export type VardiyaSonuBody = z.infer<typeof vardiyaSonuBodySchema>;
export type GunlukUretimBody = z.infer<typeof gunlukUretimBodySchema>;
export type GunlukUretimPatchBody = z.infer<typeof gunlukUretimPatchBodySchema>;
export type KalipDegisimBaslatBody = z.infer<typeof kalipDegisimBaslatBodySchema>;
export type KalipDegisimBitirBody = z.infer<typeof kalipDegisimBitirBodySchema>;
export type SevkiyatBody = z.infer<typeof sevkiyatBodySchema>;
export type MalKabulBody = z.infer<typeof malKabulBodySchema>;
export type ListGunlukGirislerQuery = z.infer<typeof listGunlukGirislerQuerySchema>;
