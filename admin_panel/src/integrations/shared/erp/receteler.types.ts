// =============================================================
// FILE: src/integrations/shared/erp/receteler.types.ts
// Paspas ERP — Reçeteler DTO & normalizers
// =============================================================

export interface ReceteKalemDto {
  id: string;
  urunId: string;
  miktar: number;
  fireOrani: number;
  sira: number;
}

export interface ReceteDto {
  id: string;
  kod: string;
  ad: string;
  urunId: string | null;
  aciklama: string | null;
  hedefMiktar: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items?: ReceteKalemDto[];
}

export interface ReceteListResponse {
  items: ReceteDto[];
  total: number;
}

export interface ReceteCreatePayload {
  kod: string;
  ad: string;
  urunId?: string;
  aciklama?: string;
  hedefMiktar?: number;
  isActive?: boolean;
}

export type ReceteUpdatePayload = Partial<ReceteCreatePayload>;

export interface ReceteKalemCreatePayload {
  urunId: string;
  miktar: number;
  fireOrani?: number;
  sira?: number;
}

export type ReceteKalemUpdatePayload = Partial<ReceteKalemCreatePayload>;

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

export function normalizeReceteKalem(raw: unknown): ReceteKalemDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:        toStr(r.id),
    urunId:    toStr(r.urunId),
    miktar:    toNum(r.miktar),
    fireOrani: toNum(r.fireOrani),
    sira:      toNum(r.sira),
  };
}

export function normalizeRecete(raw: unknown): ReceteDto {
  const r = isRecord(raw) ? raw : {};
  const items = Array.isArray(r.items)
    ? (r.items as unknown[]).map(normalizeReceteKalem)
    : undefined;
  return {
    id:          toStr(r.id),
    kod:         toStr(r.kod),
    ad:          toStr(r.ad),
    urunId:      r.urunId != null ? toStr(r.urunId) : null,
    aciklama:    r.aciklama != null ? toStr(r.aciklama) : null,
    hedefMiktar: toNum(r.hedefMiktar, 1),
    isActive:    toBool(r.isActive),
    createdAt:   toStr(r.createdAt),
    updatedAt:   toStr(r.updatedAt),
    items,
  };
}

export function normalizeReceteList(res: unknown): ReceteListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeRecete),
    total: toNum(r.total, rawItems.length),
  };
}
