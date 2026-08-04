// =============================================================
// FILE: src/modules/teklifler/validation.ts
// Teklif Modülü — Zod giriş şemaları
// =============================================================

import { z } from 'zod';

export const TEKLIF_DURUMLARI = [
  'taslak', 'onay_bekliyor', 'gonderildi', 'goruntulendi', 'revizyon', 'kabul', 'red', 'suresi_doldu',
] as const;

export const TALEP_DURUMLARI = [
  'yeni', 'inceleniyor', 'musteriye_donustu', 'teklife_donustu', 'istenmeyen', 'kapandi',
] as const;

const paraBirimiEnum = z.enum(['TRY', 'USD', 'EUR']);
const dilEnum = z.enum(['tr', 'en', 'de']);

// ── Teklif ───────────────────────────────────────────────────

export const teklifListQuerySchema = z.object({
  q: z.string().trim().optional(),
  durum: z.enum(TEKLIF_DURUMLARI).optional(),
  musteriId: z.string().uuid().optional(),
  ownerUserId: z.string().uuid().optional(),
  paraBirimi: paraBirimiEnum.optional(),
  dil: dilEnum.optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  gecerlilikFrom: z.string().date().optional(),
  gecerlilikTo: z.string().date().optional(),
  sort: z.enum(['created_at','updated_at','gecerlilik_tarihi','genel_toplam','teklif_no']).default('updated_at'),
  order: z.enum(['asc','desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
}).refine((v)=>!v.dateFrom||!v.dateTo||v.dateFrom<=v.dateTo,{message:'Geçersiz tarih aralığı'}).refine((v)=>!v.gecerlilikFrom||!v.gecerlilikTo||v.gecerlilikFrom<=v.gecerlilikTo,{message:'Geçersiz geçerlilik aralığı'});

// Mevcut müşteri seç VEYA satır içi yeni "aday müşteri" ekle
const yeniMusteriSchema = z.object({
  ad: z.string().trim().min(1, 'Ad zorunlu').max(255),
  telefon: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(255).optional(),
  adres: z.string().trim().max(500).optional(),
});

export const teklifCreateSchema = z.object({
  musteriId: z.string().uuid('Geçerli bir müşteri seçiniz').optional(),
  yeniMusteri: yeniMusteriSchema.optional(),
  paraBirimi: paraBirimiEnum.default('TRY'),
  dil: dilEnum.default('tr'),
  kdvOrani: z.coerce.number().min(0).max(100).default(20),
  kdvDahil: z.boolean().default(false),
  gecerlilikTarihi: z.string().optional(),
  talepId: z.string().uuid().optional(),
}).refine((v) => !!(v.musteriId || v.yeniMusteri), { message: 'Müşteri seçin veya yeni aday ekleyin' });

export const teklifPatchSchema = z.object({
  musteriId: z.string().uuid().optional(),
  paraBirimi: paraBirimiEnum.optional(),
  dil: dilEnum.optional(),
  kdvOrani: z.coerce.number().min(0).max(100).optional(),
  kdvDahil: z.boolean().optional(),
  iskontoOrani: z.coerce.number().min(0).max(100).optional(),
  nakliye: z.coerce.number().min(0).optional(),
  gecerlilikTarihi: z.string().optional().nullable(),
  odemeKosullari: z.string().trim().max(500).optional().nullable(),
  teslimKosullari: z.string().trim().max(500).optional().nullable(),
  aciklama: z.string().trim().max(1000).optional().nullable(),
}).refine((v) => Object.keys(v).length > 0, { message: 'En az bir alan güncellenmeli' });

export const teklifDurumSchema = z.object({
  durum: z.enum(TEKLIF_DURUMLARI),
  redNedeni: z.string().trim().max(500).optional(),
});

export const gonderSchema = z.object({
  kanal: z.enum(['email', 'whatsapp_link', 'manuel']),
  aliciEmail: z.string().trim().email().max(255).optional(),
}).refine((v) => v.kanal !== 'email' || !!v.aliciEmail, { message: 'E-posta gönderimi için alıcı e-posta zorunlu' });

export const onayReddetSchema = z.object({
  neden: z.string().trim().min(1, 'Red nedeni zorunlu').max(500),
});

export const revizyonSchema = z.object({
  neden: z.string().trim().min(1, 'Revizyon nedeni zorunlu').max(500),
});

// ── Teklif kalemi ────────────────────────────────────────────

export const kalemCreateSchema = z.object({
  urunId: z.string().uuid().optional().nullable(),
  aciklama: z.string().trim().min(1, 'Açıklama zorunlu').max(500),
  birim: z.string().trim().max(16).optional(),
  miktar: z.coerce.number().positive('Pozitif olmalı').max(99_999_999.9999),
  birimFiyat: z.coerce.number().min(0).max(999_999_999_999.99).default(0),
  iskontoOrani: z.coerce.number().min(0).max(100).default(0),
});

export const kalemPatchSchema = kalemCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0, { message: 'En az bir alan güncellenmeli' },
);

// ── Teklif talebi (web lead) ─────────────────────────────────

export const talepListQuerySchema = z.object({
  q: z.string().trim().optional(),
  musteriId: z.string().uuid().optional(),
  durum: z.enum(TALEP_DURUMLARI).optional(),
  durumGrubu: z.enum(['yeni', 'inceleniyor', 'donusturuldu', 'spam']).optional(),
  dil: z.string().trim().min(2).max(8).optional(),
  konu: z.string().trim().max(200).optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  ownerUserId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
}).refine((v) => !v.dateFrom || !v.dateTo || v.dateFrom <= v.dateTo, { message: 'Başlangıç tarihi bitişten sonra olamaz' });

export const talepPatchSchema = z.object({
  durum: z.enum(TALEP_DURUMLARI).optional(),
  atananUserId: z.string().uuid().optional().nullable(),
}).refine((v) => Object.keys(v).length > 0, { message: 'En az bir alan güncellenmeli' });

// Public web intake — spam/boyut korumalı
export const talepPublicSchema = z.object({
  kaynakSayfa: z.string().trim().max(255).optional(),
  referrer: z.string().trim().max(1000).optional(),
  dil: dilEnum.default('tr'),
  ad: z.string().trim().min(1, 'Ad zorunlu').max(160),
  firma: z.string().trim().max(200).optional(),
  email: z.string().trim().email('Geçerli e-posta giriniz').max(255).optional(),
  telefon: z.string().trim().max(48).optional(),
  konu: z.string().trim().max(200).optional(),
  mesaj: z.string().trim().max(4000).optional(),
  formDetaylari: z.object({
    ulke: z.string().trim().max(120).optional(),
    websiteUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    urunIlgisi: z.string().trim().max(255).optional(),
    miktar: z.string().trim().max(120).optional(),
  }).optional(),
  seciliUrunler: z.array(z.object({
    urunId: z.string().max(64).optional(),
    slug: z.string().max(200).optional(),
    ad: z.string().max(255).optional(),
  })).max(50).optional(),
  utm: z.record(z.string(), z.string().max(255)).optional(),
  kvkkOnay: z.boolean().default(false),
  // Honeypot — botlar doldurur, gerçek kullanıcı boş bırakır
  website: z.string().max(500).optional(),
}).refine((v) => !!(v.email || v.telefon), { message: 'E-posta veya telefon zorunlu' });

// Talebi müşteri + taslak teklife dönüştür
export const talepDonusturSchema = z.object({
  musteriId: z.string().uuid().optional(),      // mevcut müşteri
  yeniMusteri: z.object({                        // ya da yeni müşteri
    ad: z.string().trim().min(1).max(255),
    telefon: z.string().trim().max(32).optional(),
    email: z.string().trim().email().max(255).optional(),
    adres: z.string().trim().max(500).optional(),
  }).optional(),
  paraBirimi: paraBirimiEnum.default('TRY'),
}).refine((v) => !!(v.musteriId || v.yeniMusteri), { message: 'Mevcut veya yeni müşteri gerekli' });

export type TeklifListQuery = z.infer<typeof teklifListQuerySchema>;
export type TeklifCreateBody = z.infer<typeof teklifCreateSchema>;
export type TeklifPatchBody = z.infer<typeof teklifPatchSchema>;
export type KalemCreateBody = z.infer<typeof kalemCreateSchema>;
export type KalemPatchBody = z.infer<typeof kalemPatchSchema>;
export type TalepListQuery = z.infer<typeof talepListQuerySchema>;
export type TalepPatchBody = z.infer<typeof talepPatchSchema>;
export type TalepPublicBody = z.infer<typeof talepPublicSchema>;
export type TalepDonusturBody = z.infer<typeof talepDonusturSchema>;
