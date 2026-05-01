// =============================================================
// FILE: src/integrations/shared/erp/musteriler.types.ts
// Paspas ERP — Müşteriler DTO & normalizers
// =============================================================

export type MusteriTur = 'musteri' | 'tedarikci';
export type BayiSegment = 'toptanci' | 'otomotiv' | 'kucuk_bayi' | 'ihracat' | 'kurumsal' | 'diger';
export type MusteriPortalStatus = 'not_invited' | 'invited' | 'active' | 'suspended';

export interface MusteriDto {
  id: string;
  tur: MusteriTur;
  kod: string;
  ad: string;
  ilgiliKisi: string | null;
  telefon: string | null;
  email: string | null;
  adres: string | null;
  cariKodu: string | null;
  sevkiyatNotu: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  bayiSegment: BayiSegment | null;
  krediLimit: number;
  mevcutBakiye: number;
  vadeGunu: number | null;
  portalEnabled: boolean;
  portalStatus: MusteriPortalStatus;
  publicVeriIzni: boolean;
  iskonto: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MusteriListResponse {
  items: MusteriDto[];
  total: number;
}

export interface MusteriCreatePayload {
  tur?: MusteriTur;
  kod?: string;
  ad: string;
  ilgiliKisi?: string;
  telefon?: string;
  email?: string;
  adres?: string;
  cariKodu?: string;
  sevkiyatNotu?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  bayiSegment?: BayiSegment;
  krediLimit?: number;
  mevcutBakiye?: number;
  vadeGunu?: number;
  portalEnabled?: boolean;
  portalStatus?: MusteriPortalStatus;
  publicVeriIzni?: boolean;
  iskonto?: number;
  isActive?: boolean;
}

export type MusteriUpdatePayload = Partial<MusteriCreatePayload>;

function toStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}
function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function toBool(v: unknown, fallback = true): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return fallback;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeMusteri(raw: unknown): MusteriDto {
  const r = isRecord(raw) ? raw : {};
  const tur = toStr(r.tur, 'musteri') as MusteriTur;
  return {
    id:       toStr(r.id),
    tur:      tur === 'tedarikci' ? 'tedarikci' : 'musteri',
    kod:      toStr(r.kod),
    ad:       toStr(r.ad),
    ilgiliKisi: r.ilgiliKisi != null ? toStr(r.ilgiliKisi) : null,
    telefon:  r.telefon != null ? toStr(r.telefon) : null,
    email:    r.email != null ? toStr(r.email) : null,
    adres:    r.adres != null ? toStr(r.adres) : null,
    cariKodu: r.cariKodu != null ? toStr(r.cariKodu) : null,
    sevkiyatNotu: r.sevkiyatNotu != null ? toStr(r.sevkiyatNotu) : null,
    websiteUrl: r.websiteUrl != null ? toStr(r.websiteUrl) : null,
    googleMapsUrl: r.googleMapsUrl != null ? toStr(r.googleMapsUrl) : null,
    instagramUrl: r.instagramUrl != null ? toStr(r.instagramUrl) : null,
    facebookUrl: r.facebookUrl != null ? toStr(r.facebookUrl) : null,
    bayiSegment: normalizeBayiSegment(r.bayiSegment),
    krediLimit: toNum(r.krediLimit),
    mevcutBakiye: toNum(r.mevcutBakiye),
    vadeGunu: r.vadeGunu != null ? toNum(r.vadeGunu) : null,
    portalEnabled: toBool(r.portalEnabled, false),
    portalStatus: normalizePortalStatus(r.portalStatus),
    publicVeriIzni: toBool(r.publicVeriIzni, false),
    iskonto:  toNum(r.iskonto),
    isActive: toBool(r.isActive),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

function normalizeBayiSegment(v: unknown): BayiSegment | null {
  const value = toStr(v);
  return ['toptanci', 'otomotiv', 'kucuk_bayi', 'ihracat', 'kurumsal', 'diger'].includes(value)
    ? value as BayiSegment
    : null;
}

function normalizePortalStatus(v: unknown): MusteriPortalStatus {
  const value = toStr(v, 'not_invited');
  return ['not_invited', 'invited', 'active', 'suspended'].includes(value)
    ? value as MusteriPortalStatus
    : 'not_invited';
}

export function normalizeMusteriList(res: unknown): MusteriListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeMusteri),
    total: toNum(r.total, rawItems.length),
  };
}
