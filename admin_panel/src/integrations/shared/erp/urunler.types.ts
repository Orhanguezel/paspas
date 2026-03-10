// =============================================================
// FILE: src/integrations/shared/erp/urunler.types.ts
// Paspas ERP — Ürünler DTO & normalizers
// =============================================================

export type UrunKategori = string;
export type TedarikTipi = "uretim" | "satin_alma" | "fason";
export type OperasyonTipi = "tek_tarafli" | "cift_tarafli";

export interface OperasyonMakineDto {
  id: string;
  urunOperasyonId: string;
  makineId: string;
  oncelikSira: number;
}

export interface UrunOperasyonDto {
  id: string;
  urunId: string;
  sira: number;
  operasyonAdi: string;
  kalipId: string | null;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  montaj: boolean;
  isActive: boolean;
  makineler: OperasyonMakineDto[];
}

export interface BirimDonusumDto {
  id: string;
  urunId: string;
  hedefBirim: string;
  carpan: number;
}

export interface UrunDto {
  id: string;
  kategori: UrunKategori;
  tedarikTipi: TedarikTipi;
  urunGrubu: string | null;
  kod: string;
  ad: string;
  aciklama: string | null;
  birim: string;
  renk: string | null;
  imageUrl: string | null;
  storageAssetId: string | null;
  imageAlt: string | null;
  stok: number;
  kritikStok: number;
  birimFiyat: number | null;
  kdvOrani: number;
  operasyonTipi: OperasyonTipi | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  operasyonlar?: UrunOperasyonDto[];
  birimDonusumleri?: BirimDonusumDto[];
}

export interface UrunListItem extends UrunDto {}

export interface UrunListResponse {
  items: UrunListItem[];
  total: number;
}

export interface OperasyonMakinePayload {
  makineId: string;
  oncelikSira: number;
}

export interface OperasyonPayload {
  operasyonAdi: string;
  sira: number;
  kalipId?: string;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  montaj: boolean;
  makineler?: OperasyonMakinePayload[];
}

export interface BirimDonusumPayload {
  hedefBirim: string;
  carpan: number;
}

export interface UrunCreatePayload {
  kategori: UrunKategori;
  tedarikTipi: TedarikTipi;
  urunGrubu?: string;
  kod: string;
  ad: string;
  aciklama?: string;
  birim: string;
  renk?: string;
  imageUrl?: string;
  storageAssetId?: string;
  imageAlt?: string;
  stok?: number;
  kritikStok?: number;
  birimFiyat?: number;
  kdvOrani?: number;
  operasyonTipi?: OperasyonTipi | null;
  isActive?: boolean;
  operasyonlar?: OperasyonPayload[];
  birimDonusumleri?: BirimDonusumPayload[];
}

export type UrunUpdatePayload = Partial<UrunCreatePayload>;

function toStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}
function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function toBool(v: unknown, fallback = true): boolean {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  return fallback;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function normalizeOperasyonMakine(raw: unknown): OperasyonMakineDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    urunOperasyonId: toStr(r.urunOperasyonId),
    makineId: toStr(r.makineId),
    oncelikSira: toNum(r.oncelikSira, 1),
  };
}

export function normalizeOperasyon(raw: unknown): UrunOperasyonDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    urunId: toStr(r.urunId),
    sira: toNum(r.sira, 1),
    operasyonAdi: toStr(r.operasyonAdi),
    kalipId: r.kalipId != null ? toStr(r.kalipId) : null,
    hazirlikSuresiDk: toNum(r.hazirlikSuresiDk, 60),
    cevrimSuresiSn: toNum(r.cevrimSuresiSn, 45),
    montaj: toBool(r.montaj, false),
    isActive: toBool(r.isActive),
    makineler: Array.isArray(r.makineler) ? (r.makineler as unknown[]).map(normalizeOperasyonMakine) : [],
  };
}

export function normalizeBirimDonusum(raw: unknown): BirimDonusumDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    urunId: toStr(r.urunId),
    hedefBirim: toStr(r.hedefBirim),
    carpan: toNum(r.carpan, 1),
  };
}

export function normalizeUrun(raw: unknown): UrunDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    kategori: toStr(r.kategori, "urun") as UrunKategori,
    tedarikTipi: toStr(r.tedarikTipi, "uretim") as TedarikTipi,
    urunGrubu: r.urunGrubu != null ? toStr(r.urunGrubu) : null,
    kod: toStr(r.kod),
    ad: toStr(r.ad),
    aciklama: r.aciklama != null ? toStr(r.aciklama) : null,
    birim: toStr(r.birim, "kg"),
    renk: r.renk != null ? toStr(r.renk) : null,
    imageUrl: r.imageUrl != null ? toStr(r.imageUrl) : null,
    storageAssetId: r.storageAssetId != null ? toStr(r.storageAssetId) : null,
    imageAlt: r.imageAlt != null ? toStr(r.imageAlt) : null,
    stok: toNum(r.stok),
    kritikStok: toNum(r.kritikStok),
    birimFiyat: r.birimFiyat != null ? toNum(r.birimFiyat) : null,
    kdvOrani: toNum(r.kdvOrani, 20),
    operasyonTipi: r.operasyonTipi != null ? (toStr(r.operasyonTipi) as OperasyonTipi) : null,
    isActive: toBool(r.isActive),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
    operasyonlar: Array.isArray(r.operasyonlar) ? (r.operasyonlar as unknown[]).map(normalizeOperasyon) : undefined,
    birimDonusumleri: Array.isArray(r.birimDonusumleri)
      ? (r.birimDonusumleri as unknown[]).map(normalizeBirimDonusum)
      : undefined,
  };
}

// -- Medya --

export type MedyaTip = 'image' | 'video' | 'url';

export interface UrunMedyaDto {
  id: string;
  urunId: string;
  tip: MedyaTip;
  url: string;
  storageAssetId: string | null;
  baslik: string | null;
  sira: number;
  isCover: boolean;
  createdAt: string;
}

export interface UrunMedyaPayload {
  id?: string;
  tip: MedyaTip;
  url: string;
  storageAssetId?: string;
  baslik?: string;
  sira: number;
  isCover: boolean;
}

export function normalizeUrunMedya(raw: unknown): UrunMedyaDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    urunId: toStr(r.urunId),
    tip: (toStr(r.tip, 'image') as MedyaTip),
    url: toStr(r.url),
    storageAssetId: r.storageAssetId != null ? toStr(r.storageAssetId) : null,
    baslik: r.baslik != null ? toStr(r.baslik) : null,
    sira: toNum(r.sira),
    isCover: toBool(r.isCover, false),
    createdAt: toStr(r.createdAt),
  };
}

export function normalizeUrunMedyaList(raw: unknown): UrunMedyaDto[] {
  if (Array.isArray(raw)) return (raw as unknown[]).map(normalizeUrunMedya);
  return [];
}

export function normalizeUrunList(res: unknown): UrunListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeUrun),
    total: toNum(r.total, rawItems.length),
  };
}
