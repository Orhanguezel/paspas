// =============================================================
// FILE: src/integrations/shared/erp/tedarikci.types.ts
// Paspas ERP — Tedarikçiler DTO & normalizers
// =============================================================

export interface TedarikciDto {
  id: string;
  kod: string;
  ad: string;
  ilgiliKisi: string | null;
  telefon: string | null;
  email: string | null;
  adres: string | null;
  iskonto: number;
  toplamSiparis: number;
  acikSiparis: number;
  sonSiparisTarihi: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TedarikciListResponse {
  items: TedarikciDto[];
  total: number;
}

export interface TedarikciCreatePayload {
  kod: string;
  ad: string;
  ilgiliKisi?: string;
  telefon?: string;
  email?: string;
  adres?: string;
  iskonto?: number;
  isActive?: boolean;
}

export type TedarikciUpdatePayload = Partial<TedarikciCreatePayload>;

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

export function normalizeTedarikci(raw: unknown): TedarikciDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id:        toStr(r.id),
    kod:       toStr(r.kod),
    ad:        toStr(r.ad),
    ilgiliKisi: r.ilgiliKisi != null ? toStr(r.ilgiliKisi) : null,
    telefon:   r.telefon != null ? toStr(r.telefon) : null,
    email:     r.email != null ? toStr(r.email) : null,
    adres:     r.adres != null ? toStr(r.adres) : null,
    iskonto:   toNum(r.iskonto),
    toplamSiparis: toNum(r.toplamSiparis),
    acikSiparis: toNum(r.acikSiparis),
    sonSiparisTarihi: r.sonSiparisTarihi != null ? toStr(r.sonSiparisTarihi) : null,
    isActive:  toBool(r.isActive),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

export function normalizeTedarikciList(res: unknown): TedarikciListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeTedarikci),
    total: toNum(r.total, rawItems.length),
  };
}
