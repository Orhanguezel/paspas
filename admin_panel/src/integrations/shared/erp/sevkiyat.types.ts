// =============================================================
// FILE: src/integrations/shared/erp/sevkiyat.types.ts
// Paspas ERP — Sevkiyat DTO & normalizers
// =============================================================

export interface BekleyenSatirDto {
  siparisId: string;
  siparisNo: string;
  siparisKalemId: string;
  musteriId: string;
  musteriAd: string;
  urunId: string;
  urunKod: string;
  urunAd: string;
  siparisMiktar: number;
  sevkEdilenMiktar: number;
  acikSevkEmriMiktar: number;
  onayliSevkEmriMiktar: number;
  kalanMiktar: number;
  stokMiktar: number;
  terminTarihi: string | null;
}

export interface BekleyenlerResponse {
  items: BekleyenSatirDto[];
  total: number;
}

export interface SevkEmriDto {
  id: string;
  sevkEmriNo: string;
  siparisId: string | null;
  siparisKalemId: string | null;
  musteriId: string;
  musteriAd: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  miktar: number;
  stokMiktar: number;
  tarih: string;
  durum: string;
  operatorOnay: boolean;
  notlar: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface SevkEmriListResponse {
  items: SevkEmriDto[];
  total: number;
}

export interface SiparissizUrunDto {
  urunId: string;
  urunKod: string;
  urunAd: string;
  stokMiktar: number;
  birim: string;
}

export interface SiparissizResponse {
  items: SiparissizUrunDto[];
  total: number;
}

export interface SevkEmriCreatePayload {
  siparisId?: string;
  siparisKalemId?: string;
  musteriId: string;
  urunId: string;
  miktar: number;
  tarih?: string;
  notlar?: string;
}

export interface SevkEmriPatchPayload {
  durum: 'bekliyor' | 'onaylandi' | 'sevk_edildi' | 'iptal';
}

export const SEVK_DURUM_LABELS: Record<string, string> = {
  bekliyor: 'Bekliyor',
  onaylandi: 'Onaylandı',
  sevk_edildi: 'Sevk Edildi',
  iptal: 'İptal',
};

export const SEVK_DURUM_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  bekliyor: 'outline',
  onaylandi: 'default',
  sevk_edildi: 'secondary',
  iptal: 'destructive',
};

// ─── Normalizers ───────────────────────────────────────────

function toStr(v: unknown, d = ''): string { return typeof v === 'string' ? v.trim() : d; }
function toNum(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function toBool(v: unknown): boolean { return v === 1 || v === true || v === '1'; }
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeBekleyenSatir(raw: unknown): BekleyenSatirDto {
  const r = isRecord(raw) ? raw : {};
  return {
    siparisId: toStr(r.siparisId),
    siparisNo: toStr(r.siparisNo),
    siparisKalemId: toStr(r.siparisKalemId),
    musteriId: toStr(r.musteriId),
    musteriAd: toStr(r.musteriAd),
    urunId: toStr(r.urunId),
    urunKod: toStr(r.urunKod),
    urunAd: toStr(r.urunAd),
    siparisMiktar: toNum(r.siparisMiktar),
    sevkEdilenMiktar: toNum(r.sevkEdilenMiktar),
    acikSevkEmriMiktar: toNum(r.acikSevkEmriMiktar),
    onayliSevkEmriMiktar: toNum(r.onayliSevkEmriMiktar),
    kalanMiktar: toNum(r.kalanMiktar),
    stokMiktar: toNum(r.stokMiktar),
    terminTarihi: r.terminTarihi != null ? toStr(r.terminTarihi) : null,
  };
}

export function normalizeBekleyenlerResponse(res: unknown): BekleyenlerResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : [];
  return {
    items: (rawItems as unknown[]).map(normalizeBekleyenSatir),
    total: toNum(r.total, rawItems.length),
  };
}

export function normalizeSevkEmri(raw: unknown): SevkEmriDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    sevkEmriNo: toStr(r.sevkEmriNo),
    siparisId: r.siparisId != null ? toStr(r.siparisId) : null,
    siparisKalemId: r.siparisKalemId != null ? toStr(r.siparisKalemId) : null,
    musteriId: toStr(r.musteriId),
    musteriAd: r.musteriAd != null ? toStr(r.musteriAd) : null,
    urunId: toStr(r.urunId),
    urunKod: r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd: r.urunAd != null ? toStr(r.urunAd) : null,
    miktar: toNum(r.miktar),
    stokMiktar: toNum(r.stokMiktar),
    tarih: toStr(r.tarih),
    durum: toStr(r.durum, 'bekliyor'),
    operatorOnay: toBool(r.operatorOnay),
    notlar: r.notlar != null ? toStr(r.notlar) : null,
    createdBy: r.createdBy != null ? toStr(r.createdBy) : null,
    createdAt: toStr(r.createdAt),
  };
}

export function normalizeSevkEmriList(res: unknown): SevkEmriListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : [];
  return {
    items: (rawItems as unknown[]).map(normalizeSevkEmri),
    total: toNum(r.total, rawItems.length),
  };
}

export function normalizeSiparissizUrun(raw: unknown): SiparissizUrunDto {
  const r = isRecord(raw) ? raw : {};
  return {
    urunId: toStr(r.urunId),
    urunKod: toStr(r.urunKod),
    urunAd: toStr(r.urunAd),
    stokMiktar: toNum(r.stokMiktar),
    birim: toStr(r.birim, 'adet'),
  };
}

export function normalizeSiparissizResponse(res: unknown): SiparissizResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : [];
  return {
    items: (rawItems as unknown[]).map(normalizeSiparissizUrun),
    total: toNum(r.total, rawItems.length),
  };
}
