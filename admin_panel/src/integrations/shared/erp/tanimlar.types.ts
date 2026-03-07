// =============================================================
// FILE: src/integrations/shared/erp/tanimlar.types.ts
// Paspas ERP — Tanımlar (Kalıplar & Tatiller) DTO & normalizers
// =============================================================

export interface KalipDto {
  id: string;
  kod: string;
  ad: string;
  aciklama: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TatilDto {
  id: string;
  ad: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  aciklama: string | null;
  createdAt: string;
}

export interface KalipListResponse {
  items: KalipDto[];
  total: number;
}
export interface TatilListResponse {
  items: TatilDto[];
  total: number;
}

export interface KalipCreatePayload {
  kod: string;
  ad: string;
  aciklama?: string;
  isActive?: boolean;
}
export type KalipPatchPayload = Partial<KalipCreatePayload>;
export interface KalipUyumluMakinelerPayload {
  makineIds: string[];
}

export interface TatilCreatePayload {
  ad: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  aciklama?: string;
}
export type TatilPatchPayload = Partial<TatilCreatePayload>;

function toStr(v: unknown, d = ""): string {
  return typeof v === "string" ? v.trim() : d;
}
function toBool(v: unknown, d = true): boolean {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  return d;
}
function toNum(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function normalizeKalip(raw: unknown): KalipDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    kod: toStr(r.kod),
    ad: toStr(r.ad),
    aciklama: r.aciklama != null ? toStr(r.aciklama) : null,
    isActive: toBool(r.isActive),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

export function normalizeKalipList(res: unknown): KalipListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return { items: (rawItems as unknown[]).map(normalizeKalip), total: toNum(r.total, rawItems.length) };
}

export function normalizeTatil(raw: unknown): TatilDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    ad: toStr(r.ad),
    tarih: toStr(r.tarih),
    baslangicSaati: toStr(r.baslangicSaati),
    bitisSaati: toStr(r.bitisSaati),
    aciklama: r.aciklama != null ? toStr(r.aciklama) : null,
    createdAt: toStr(r.createdAt),
  };
}

export function normalizeTatilList(res: unknown): TatilListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return { items: (rawItems as unknown[]).map(normalizeTatil), total: toNum(r.total, rawItems.length) };
}

// ── Vardiyalar ──────────────────────────────────────────────────

export interface VardiyaDto {
  id: string;
  ad: string;
  baslangicSaati: string;
  bitisSaati: string;
  isActive: boolean;
  aciklama: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VardiyaListResponse {
  items: VardiyaDto[];
  total: number;
}

export interface VardiyaCreatePayload {
  ad: string;
  baslangicSaati: string;
  bitisSaati: string;
  aciklama?: string;
  isActive?: boolean;
}
export type VardiyaPatchPayload = Partial<VardiyaCreatePayload>;

export function normalizeVardiya(raw: unknown): VardiyaDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    ad: toStr(r.ad),
    baslangicSaati: toStr(r.baslangicSaati),
    bitisSaati: toStr(r.bitisSaati),
    isActive: toBool(r.isActive),
    aciklama: r.aciklama != null ? toStr(r.aciklama) : null,
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

export function normalizeVardiyaList(res: unknown): VardiyaListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return { items: (rawItems as unknown[]).map(normalizeVardiya), total: toNum(r.total, rawItems.length) };
}

// ── Duruş Nedenleri ───────────────────────────────────────────

export const DURUS_KATEGORILER = ['makine', 'malzeme', 'personel', 'planlama', 'diger'] as const;
export type DurusKategori = typeof DURUS_KATEGORILER[number];

export const DURUS_KATEGORI_LABELS: Record<DurusKategori, string> = {
  makine:   'Makine',
  malzeme:  'Malzeme',
  personel: 'Personel',
  planlama: 'Planlama',
  diger:    'Diğer',
};

export interface DurusNedeniDto {
  id: string;
  kod: string;
  ad: string;
  kategori: DurusKategori;
  isActive: boolean;
  aciklama: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DurusNedeniListResponse {
  items: DurusNedeniDto[];
  total: number;
}

export interface DurusNedeniCreatePayload {
  kod: string;
  ad: string;
  kategori?: DurusKategori;
  aciklama?: string;
  isActive?: boolean;
}
export type DurusNedeniPatchPayload = Partial<DurusNedeniCreatePayload>;

export function normalizeDurusNedeni(raw: unknown): DurusNedeniDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    kod: toStr(r.kod),
    ad: toStr(r.ad),
    kategori: (toStr(r.kategori, 'diger')) as DurusKategori,
    isActive: toBool(r.isActive),
    aciklama: r.aciklama != null ? toStr(r.aciklama) : null,
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

export function normalizeDurusNedeniList(res: unknown): DurusNedeniListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return { items: (rawItems as unknown[]).map(normalizeDurusNedeni), total: toNum(r.total, rawItems.length) };
}
