// =============================================================
// FILE: src/integrations/shared/erp/satin_alma.types.ts
// Paspas ERP — Satın Alma DTO & normalizers
// =============================================================

export type SatinAlmaDurum = 'taslak' | 'onaylandi' | 'siparis_verildi' | 'kismen_teslim' | 'tamamlandi' | 'iptal';

export interface SatinAlmaKalemDto {
  id: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  birim: string | null;
  miktar: number;
  birimFiyat: number;
  sira: number;
  kabulMiktar: number;
  kalanMiktar: number;
}

export interface SatinAlmaSiparisDto {
  id: string;
  siparisNo: string;
  tedarikciId: string;
  tedarikciAd: string | null;
  siparisTarihi: string;
  terminTarihi: string | null;
  durum: SatinAlmaDurum;
  aciklama: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: SatinAlmaKalemDto[];
}

export interface SatinAlmaListResponse {
  items: SatinAlmaSiparisDto[];
  total: number;
}

export interface SatinAlmaKalemPayload {
  urunId: string;
  miktar: number;
  birimFiyat?: number;
  sira?: number;
}

export interface SatinAlmaCreatePayload {
  siparisNo: string;
  tedarikciId: string;
  siparisTarihi: string;
  terminTarihi?: string;
  durum?: SatinAlmaDurum;
  aciklama?: string;
  items: SatinAlmaKalemPayload[];
}

export type SatinAlmaPatchPayload = Partial<Omit<SatinAlmaCreatePayload, 'items'>> & {
  items?: SatinAlmaKalemPayload[];
};

export const SATIN_ALMA_DURUM_LABELS: Record<SatinAlmaDurum, string> = {
  taslak:          'Taslak',
  onaylandi:       'Onaylandı',
  siparis_verildi: 'Sipariş Verildi',
  kismen_teslim:   'Kısmen Teslim',
  tamamlandi:      'Tamamlandı',
  iptal:           'İptal',
};

export const SATIN_ALMA_DURUM_BADGE: Record<SatinAlmaDurum, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  taslak:          'outline',
  onaylandi:       'default',
  siparis_verildi: 'secondary',
  kismen_teslim:   'secondary',
  tamamlandi:      'default',
  iptal:           'destructive',
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

export function normalizeSatinAlmaKalem(raw: unknown): SatinAlmaKalemDto {
  const r = isRecord(raw) ? raw : {};
  const miktar = toNum(r.miktar);
  const kabulMiktar = toNum(r.kabulMiktar);
  return {
    id:          toStr(r.id),
    urunId:      toStr(r.urunId),
    urunKod:     r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd:      r.urunAd != null ? toStr(r.urunAd) : null,
    birim:       r.birim != null ? toStr(r.birim) : null,
    miktar,
    birimFiyat:  toNum(r.birimFiyat),
    sira:        toNum(r.sira),
    kabulMiktar,
    kalanMiktar: r.kalanMiktar != null ? toNum(r.kalanMiktar) : Math.max(0, miktar - kabulMiktar),
  };
}

export function normalizeSatinAlmaSiparis(raw: unknown): SatinAlmaSiparisDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:            toStr(r.id),
    siparisNo:     toStr(r.siparisNo),
    tedarikciId:   toStr(r.tedarikciId),
    tedarikciAd:   r.tedarikciAd != null ? toStr(r.tedarikciAd) : null,
    siparisTarihi: toStr(r.siparisTarihi),
    terminTarihi:  r.terminTarihi != null ? toStr(r.terminTarihi) : null,
    durum:         (toStr(r.durum, 'taslak')) as SatinAlmaDurum,
    aciklama:      r.aciklama != null ? toStr(r.aciklama) : null,
    isActive:      toBool(r.isActive),
    createdAt:     toStr(r.createdAt),
    updatedAt:     toStr(r.updatedAt),
    items:         Array.isArray(r.items) ? (r.items as unknown[]).map(normalizeSatinAlmaKalem) : undefined,
  };
}

export function normalizeSatinAlmaList(res: unknown): SatinAlmaListResponse {
  const rawItems = Array.isArray(res) ? res : [];
  return {
    items: rawItems.map(normalizeSatinAlmaSiparis),
    total: rawItems.length,
  };
}
