// =============================================================
// FILE: src/integrations/shared/erp/satis_siparisleri.types.ts
// Paspas ERP — Satış Siparişleri DTO & normalizers
// =============================================================

export type SiparisDurum = 'taslak' | 'planlandi' | 'onaylandi' | 'uretimde' | 'kismen_sevk' | 'tamamlandi' | 'kapali' | 'iptal';
export type UretimDurumu = 'beklemede' | 'planlandi' | 'uretimde' | 'tamamlandi';
export type SevkDurumu = 'sevk_edilmedi' | 'kismen_sevk' | 'tamamlandi';
export type KalemUretimDurumu = 'beklemede' | 'uretime_aktarildi' | 'makineye_atandi' | 'uretiliyor' | 'duraklatildi' | 'uretim_tamamlandi';

export interface SiparisKalemDto {
  id: string;
  urunId: string;
  urunAd: string | null;
  urunKod: string | null;
  kdvOrani: number;
  miktar: number;
  birimFiyat: number;
  uretilenMiktar: number;
  sevkEdilenMiktar: number;
  sira: number;
  uretimDurumu: KalemUretimDurumu;
}

export interface SiparisIslemSatiri {
  kalemId: string;
  siparisId: string;
  siparisNo: string;
  musteriId: string;
  musteriAd: string;
  urunId: string;
  urunAd: string;
  urunKod: string;
  miktar: number;
  birimFiyat: number;
  uretimDurumu: KalemUretimDurumu;
  sevkEdilenMiktar: number;
  uretimEmriId: string | null;
  planlananBitis: string | null;
  terminTarihi: string | null;
}

export interface SatisSiparisDto {
  id: string;
  siparisNo: string;
  musteriId: string;
  musteriAd: string | null;
  musteriIskonto: number;
  ekstraIndirimOrani: number;
  siparisTarihi: string;
  terminTarihi: string | null;
  durum: SiparisDurum;
  uretimDurumu: UretimDurumu;
  sevkDurumu: SevkDurumu;
  aciklama: string | null;
  isActive: boolean;
  kalemSayisi: number;
  toplamMiktar: number;
  toplamFiyat: number;
  uretimeAktarilanKalemSayisi: number;
  uretimPlanlananMiktar: number;
  uretimTamamlananMiktar: number;
  sevkEdilenMiktar: number;
  kilitli: boolean;
  createdAt: string;
  updatedAt: string;
  items?: SiparisKalemDto[];
}

export interface SatisSiparisListResponse {
  items: SatisSiparisDto[];
  total: number;
}

export interface SiparisKalemPayload {
  urunId: string;
  miktar: number;
  birimFiyat?: number;
  sira?: number;
}

export interface SatisSiparisCreatePayload {
  siparisNo: string;
  musteriId: string;
  siparisTarihi: string;
  terminTarihi?: string;
  durum?: SiparisDurum;
  aciklama?: string;
  ekstraIndirimOrani?: number;
  isActive?: boolean;
  items: SiparisKalemPayload[];
}

export interface SatisSiparisPatchPayload {
  siparisNo?: string;
  musteriId?: string;
  siparisTarihi?: string;
  terminTarihi?: string;
  durum?: SiparisDurum;
  aciklama?: string;
  ekstraIndirimOrani?: number;
  isActive?: boolean;
  items?: SiparisKalemPayload[];
}

export const SIPARIS_DURUM_LABELS: Record<SiparisDurum, string> = {
  taslak:       'Taslak',
  planlandi:    'Planlandı',
  onaylandi:    'Onaylandı',
  uretimde:     'Üretimde',
  kismen_sevk:  'Kısmen Sevk',
  tamamlandi:   'Tamamlandı',
  kapali:       'Kapalı',
  iptal:        'İptal',
};

export const SIPARIS_DURUM_COLORS: Record<SiparisDurum, string> = {
  taslak:       'secondary',
  planlandi:    'secondary',
  onaylandi:    'default',
  uretimde:     'default',
  kismen_sevk:  'secondary',
  tamamlandi:   'default',
  kapali:       'secondary',
  iptal:        'destructive',
};

export const URETIM_DURUMU_LABELS: Record<UretimDurumu, string> = {
  beklemede:  'Beklemede',
  planlandi:  'Üretim Planlandı',
  uretimde:   'Üretiliyor',
  tamamlandi: 'Üretim Tamamlandı',
};

export const URETIM_DURUMU_BADGE: Record<UretimDurumu, 'default' | 'secondary' | 'destructive'> = {
  beklemede:  'secondary',
  planlandi:  'secondary',
  uretimde:   'default',
  tamamlandi: 'default',
};

export const SEVK_DURUMU_LABELS: Record<SevkDurumu, string> = {
  sevk_edilmedi: 'Sevk Edilmedi',
  kismen_sevk:   'Kısmen Sevk',
  tamamlandi:    'Tamamı Sevk Edildi',
};

export const SEVK_DURUMU_BADGE: Record<SevkDurumu, 'default' | 'secondary' | 'destructive'> = {
  sevk_edilmedi: 'secondary',
  kismen_sevk:   'secondary',
  tamamlandi:    'default',
};

export const KALEM_URETIM_DURUMU_LABELS: Record<KalemUretimDurumu, string> = {
  beklemede:          'Beklemede',
  uretime_aktarildi:  'Üretime Aktarıldı',
  makineye_atandi:    'Makineye Atandı',
  uretiliyor:         'Üretiliyor',
  duraklatildi:       'Duraklatıldı',
  uretim_tamamlandi:  'Üretim Tamamlandı',
};

export const KALEM_URETIM_DURUMU_BADGE: Record<KalemUretimDurumu, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  beklemede:          'secondary',
  uretime_aktarildi:  'secondary',
  makineye_atandi:    'outline',
  uretiliyor:         'default',
  duraklatildi:       'destructive',
  uretim_tamamlandi:  'default',
};

function toStr(v: unknown, d = ''): string { return typeof v === 'string' ? v.trim() : d; }
function toNum(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function toBool(v: unknown, d = true): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return d;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeSiparisKalem(raw: unknown): SiparisKalemDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:         toStr(r.id),
    urunId:     toStr(r.urunId),
    urunAd:     r.urunAd != null ? toStr(r.urunAd) : null,
    urunKod:    r.urunKod != null ? toStr(r.urunKod) : null,
    kdvOrani:   toNum(r.kdvOrani, 20),
    miktar:     toNum(r.miktar),
    birimFiyat: toNum(r.birimFiyat),
    uretilenMiktar: toNum(r.uretilenMiktar),
    sevkEdilenMiktar: toNum(r.sevkEdilenMiktar),
    sira:       toNum(r.sira),
    uretimDurumu: (toStr(r.uretimDurumu, 'beklemede')) as KalemUretimDurumu,
  };
}

export function normalizeSatisSiparis(raw: unknown): SatisSiparisDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:            toStr(r.id),
    siparisNo:     toStr(r.siparisNo),
    musteriId:     toStr(r.musteriId),
    musteriAd:     r.musteriAd != null ? toStr(r.musteriAd) : null,
    musteriIskonto: toNum(r.musteriIskonto),
    siparisTarihi: toStr(r.siparisTarihi),
    terminTarihi:  r.terminTarihi != null ? toStr(r.terminTarihi) : null,
    durum:         (toStr(r.durum, 'taslak')) as SiparisDurum,
    uretimDurumu:  (toStr(r.uretimDurumu, 'beklemede')) as UretimDurumu,
    sevkDurumu:    (toStr(r.sevkDurumu, 'sevk_edilmedi')) as SevkDurumu,
    aciklama:      r.aciklama != null ? toStr(r.aciklama) : null,
    ekstraIndirimOrani: toNum(r.ekstraIndirimOrani),
    isActive:      toBool(r.isActive),
    kalemSayisi:   toNum(r.kalemSayisi),
    toplamMiktar:  toNum(r.toplamMiktar),
    toplamFiyat:   toNum(r.toplamFiyat),
    uretimeAktarilanKalemSayisi: toNum(r.uretimeAktarilanKalemSayisi),
    uretimPlanlananMiktar: toNum(r.uretimPlanlananMiktar),
    uretimTamamlananMiktar: toNum(r.uretimTamamlananMiktar),
    sevkEdilenMiktar: toNum(r.sevkEdilenMiktar),
    kilitli:       toBool(r.kilitli, false),
    createdAt:     toStr(r.createdAt),
    updatedAt:     toStr(r.updatedAt),
    items:         Array.isArray(r.items) ? (r.items as unknown[]).map(normalizeSiparisKalem) : undefined,
  };
}

export function normalizeSatisSiparisList(res: unknown): SatisSiparisListResponse {
  // Backend array döndürüyor, total x-total-count header'ında
  const rawItems = Array.isArray(res) ? res : [];
  return {
    items: rawItems.map(normalizeSatisSiparis),
    total: rawItems.length,
  };
}
