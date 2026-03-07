// =============================================================
// FILE: src/integrations/shared/erp/is_yukler.types.ts
// Paspas ERP — İş Yükleri DTO & normalizers
// =============================================================

export interface IsYukuDto {
  kuyrukId: string;
  makineId: string;
  makineKod: string;
  makineAd: string;
  uretimEmriId: string;
  emirNo: string;
  urunKod: string | null;
  urunAd: string | null;
  operasyonAdi: string | null;
  musteriAd: string | null;
  sira: number;
  planlananSureDk: number;
  hazirlikSuresiDk: number;
  planlananMiktar: number;
  uretilenMiktar: number;
  fireMiktar: number;
  montaj: boolean;
  terminTarihi: string | null;
  planlananBaslangic: string | null;
  planlananBitis: string | null;
  durum: string;
}

export interface IsYukuPatchPayload {
  makineId?: string;
  sira?: number;
  planlananSureDk?: number;
  durum?: string;
}

export interface IsYukuListResponse {
  items: IsYukuDto[];
  total: number;
}

export const IS_YUKU_DURUM_LABELS: Record<string, string> = {
  bekliyor: "Bekliyor",
  devam_ediyor: "Devam Ediyor",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

export const IS_YUKU_DURUM_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bekliyor: "outline",
  devam_ediyor: "default",
  tamamlandi: "default",
  iptal: "destructive",
};

function toStr(v: unknown, d = ""): string {
  return typeof v === "string" ? v.trim() : d;
}
function toNum(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function normalizeIsYuku(raw: unknown): IsYukuDto {
  const r = isRecord(raw) ? raw : {};
  return {
    kuyrukId: toStr(r.kuyrukId),
    makineId: toStr(r.makineId),
    makineKod: toStr(r.makineKod),
    makineAd: toStr(r.makineAd),
    uretimEmriId: toStr(r.uretimEmriId),
    emirNo: toStr(r.emirNo),
    urunKod: r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd: r.urunAd != null ? toStr(r.urunAd) : null,
    operasyonAdi: r.operasyonAdi != null ? toStr(r.operasyonAdi) : null,
    musteriAd: r.musteriAd != null ? toStr(r.musteriAd) : null,
    sira: toNum(r.sira),
    planlananSureDk: toNum(r.planlananSureDk),
    hazirlikSuresiDk: toNum(r.hazirlikSuresiDk),
    planlananMiktar: toNum(r.planlananMiktar),
    uretilenMiktar: toNum(r.uretilenMiktar),
    fireMiktar: toNum(r.fireMiktar),
    montaj: typeof r.montaj === "boolean" ? r.montaj : r.montaj === 1 || r.montaj === "1",
    terminTarihi: r.terminTarihi != null ? toStr(r.terminTarihi) : null,
    planlananBaslangic: r.planlananBaslangic != null ? toStr(r.planlananBaslangic) : null,
    planlananBitis: r.planlananBitis != null ? toStr(r.planlananBitis) : null,
    durum: toStr(r.durum, "bekliyor"),
  };
}

export function normalizeIsYukuList(res: unknown): IsYukuListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeIsYuku),
    total: toNum(r.total, rawItems.length),
  };
}
