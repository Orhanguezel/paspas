// =============================================================
// FILE: src/integrations/shared/erp/stoklar.types.ts
// Paspas ERP — Stoklar DTO & normalizers
// =============================================================

export interface BirimDonusumItem {
  hedefBirim: string;
  carpan: number;
}

export interface StokDto {
  urunId: string;
  urunKod: string;
  urunAd: string;
  kategori: string;
  tedarikTipi: "uretim" | "satin_alma" | "fason";
  birim: string;
  birimDonusumleri: BirimDonusumItem[];
  stok: number;
  kritikStok: number;
  rezerveStok: number;
  acikUretimIhtiyaci: number;
  serbestStok: number;
  durum: "yeterli" | "kritik" | "yetersiz";
  kritikAcik: number;
  isActive: boolean;
}

export interface StokListResponse {
  items: StokDto[];
  total: number;
}

export interface StokDuzeltmePayload {
  miktarDegisimi: number;
  aciklama?: string;
}

function toStr(v: unknown, d = ""): string {
  return typeof v === "string" ? v.trim() : d;
}
function toNum(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function toBool(v: unknown, d = true): boolean {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  return d;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function normalizeBirimDonusumItem(raw: unknown): BirimDonusumItem {
  const r = isRecord(raw) ? raw : {};
  return {
    hedefBirim: toStr(r.hedefBirim),
    carpan: toNum(r.carpan, 1),
  };
}

export function normalizeStok(raw: unknown): StokDto {
  const r = isRecord(raw) ? raw : {};
  const rawDonusumler = Array.isArray(r.birimDonusumleri) ? r.birimDonusumleri : [];
  return {
    urunId: toStr(r.urunId),
    urunKod: toStr(r.urunKod),
    urunAd: toStr(r.urunAd),
    kategori: toStr(r.kategori, "urun") as StokDto["kategori"],
    tedarikTipi: toStr(r.tedarikTipi, "uretim") as StokDto["tedarikTipi"],
    birim: toStr(r.birim, "kg"),
    birimDonusumleri: (rawDonusumler as unknown[]).map(normalizeBirimDonusumItem),
    stok: toNum(r.stok),
    kritikStok: toNum(r.kritikStok),
    rezerveStok: toNum(r.rezerveStok),
    acikUretimIhtiyaci: toNum(r.acikUretimIhtiyaci),
    serbestStok: toNum(r.serbestStok),
    durum: toStr(r.durum, "yeterli") as StokDto["durum"],
    kritikAcik: toNum(r.kritikAcik),
    isActive: toBool(r.isActive),
  };
}

export function normalizeStokList(res: unknown): StokListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeStok),
    total: toNum(r.total, rawItems.length),
  };
}

// --- Yeterlilik (Stock Sufficiency) ---

export interface YeterlilikKalemDto {
  malzemeId: string;
  malzemeKod: string;
  malzemeAd: string;
  malzemeGorselUrl: string | null;
  birim: string;
  gerekliMiktar: number;
  fireOrani: number;
  gerekliMiktarFireli: number;
  toplamStok: number;
  rezerveStok: number;
  mevcutStok: number;
  eksikMiktar: number;
  fark: number;
  yeterli: boolean;
}

export interface YeterlilikResponse {
  urunId: string;
  receteId: string;
  receteAd: string;
  hedefMiktar: number;
  istenilenMiktar: number;
  carpan: number;
  kalemler: YeterlilikKalemDto[];
  tumYeterli: boolean;
}

function normalizeYeterlilikKalem(raw: unknown): YeterlilikKalemDto {
  const r = isRecord(raw) ? raw : {};
  return {
    malzemeId: toStr(r.malzemeId),
    malzemeKod: toStr(r.malzemeKod),
    malzemeAd: toStr(r.malzemeAd),
    malzemeGorselUrl: r.malzemeGorselUrl != null ? toStr(r.malzemeGorselUrl) : null,
    birim: toStr(r.birim, "kg"),
    gerekliMiktar: toNum(r.gerekliMiktar),
    fireOrani: toNum(r.fireOrani),
    gerekliMiktarFireli: toNum(r.gerekliMiktarFireli),
    toplamStok: toNum(r.toplamStok),
    rezerveStok: toNum(r.rezerveStok),
    mevcutStok: toNum(r.mevcutStok),
    eksikMiktar: toNum(r.eksikMiktar),
    fark: toNum(r.fark),
    yeterli: typeof r.yeterli === "boolean" ? r.yeterli : true,
  };
}

export function normalizeYeterlilik(res: unknown): YeterlilikResponse {
  const r = isRecord(res) ? res : {};
  const rawKalemler = Array.isArray(r.kalemler) ? r.kalemler : [];
  return {
    urunId: toStr(r.urunId),
    receteId: toStr(r.receteId),
    receteAd: toStr(r.receteAd),
    hedefMiktar: toNum(r.hedefMiktar, 1),
    istenilenMiktar: toNum(r.istenilenMiktar),
    carpan: toNum(r.carpan, 1),
    kalemler: (rawKalemler as unknown[]).map(normalizeYeterlilikKalem),
    tumYeterli: typeof r.tumYeterli === "boolean" ? r.tumYeterli : true,
  };
}
