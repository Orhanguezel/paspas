// =============================================================
// FILE: src/integrations/shared/erp/gantt.types.ts
// Paspas ERP — Gantt DTO & normalizers
// =============================================================

export interface GanttItemDto {
  uretimEmriId: string;
  emirNo: string;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  musteriOzet: string | null;
  montaj: boolean;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  terminTarihi: string | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  durum: string;
}

export interface GanttListResponse {
  items: GanttItemDto[];
  total: number;
}

function toStr(v: unknown, d = ''): string { return typeof v === 'string' ? v.trim() : d; }
function toNum(v: unknown, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function toBool(v: unknown): boolean { return v === 1 || v === true || v === '1'; }
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function normalizeGanttItem(raw: unknown): GanttItemDto {
  const r = isRecord(raw) ? raw : {};
  return {
    uretimEmriId:    toStr(r.uretimEmriId),
    emirNo:          toStr(r.emirNo),
    urunId:          toStr(r.urunId),
    urunKod:         r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd:          r.urunAd != null ? toStr(r.urunAd) : null,
    musteriOzet:     r.musteriOzet != null ? toStr(r.musteriOzet) : null,
    montaj:          toBool(r.montaj),
    baslangicTarihi: r.baslangicTarihi != null ? toStr(r.baslangicTarihi) : null,
    bitisTarihi:     r.bitisTarihi != null ? toStr(r.bitisTarihi) : null,
    terminTarihi:    r.terminTarihi != null ? toStr(r.terminTarihi) : null,
    planlananMiktar: toNum(r.planlananMiktar),
    uretilenMiktar:  toNum(r.uretilenMiktar),
    durum:           toStr(r.durum, 'planlandi'),
  };
}

export function normalizeGanttList(res: unknown): GanttListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeGanttItem),
    total: toNum(r.total, rawItems.length),
  };
}
