// =============================================================
// FILE: src/integrations/shared/erp/gantt.types.ts
// Paspas ERP — Gantt DTO & normalizers
// =============================================================

export interface GanttBarDto {
  kuyrukId: string;
  makineId: string;
  uretimEmriId: string;
  emirOperasyonId: string | null;
  emirNo: string;
  siparisNo: string | null;
  urunId: string;
  urunKod: string | null;
  urunAd: string | null;
  musteriOzet: string | null;
  operasyonAdi: string | null;
  montaj: boolean;
  sira: number;
  baslangicTarihi: string | null;
  bitisTarihi: string | null;
  planlananBaslangicTarihi: string | null;
  planlananBitisTarihi: string | null;
  terminTarihi: string | null;
  planlananMiktar: number;
  uretilenMiktar: number;
  durum: string;
  duraklatmaZamani: string | null;
}

export interface GanttBlockDto {
  id: string;
  tip: "tatil" | "hafta_sonu" | "durus";
  baslangicTarihi: string;
  bitisTarihi: string;
  etiket: string;
}

export interface GanttMachineDto {
  makineId: string;
  makineKod: string;
  makineAd: string;
  calisir24Saat: boolean;
  saatlikKapasite: number | null;
  gunlukCalismaSaati: number;
  blocks: GanttBlockDto[];
  items: GanttBarDto[];
}

export interface GanttListResponse {
  items: GanttMachineDto[];
  total: number;
}

function toStr(v: unknown, d = ""): string {
  return typeof v === "string" ? v.trim() : d;
}
function toNum(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === "1";
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function normalizeGanttBar(raw: unknown): GanttBarDto {
  const r = isRecord(raw) ? raw : {};
  return {
    kuyrukId: toStr(r.kuyrukId),
    makineId: toStr(r.makineId),
    uretimEmriId: toStr(r.uretimEmriId),
    emirOperasyonId: r.emirOperasyonId != null ? toStr(r.emirOperasyonId) : null,
    emirNo: toStr(r.emirNo),
    siparisNo: r.siparisNo != null ? toStr(r.siparisNo) : null,
    urunId: toStr(r.urunId),
    urunKod: r.urunKod != null ? toStr(r.urunKod) : null,
    urunAd: r.urunAd != null ? toStr(r.urunAd) : null,
    musteriOzet: r.musteriOzet != null ? toStr(r.musteriOzet) : null,
    operasyonAdi: r.operasyonAdi != null ? toStr(r.operasyonAdi) : null,
    montaj: toBool(r.montaj),
    sira: toNum(r.sira),
    baslangicTarihi: r.baslangicTarihi != null ? toStr(r.baslangicTarihi) : null,
    bitisTarihi: r.bitisTarihi != null ? toStr(r.bitisTarihi) : null,
    planlananBaslangicTarihi: r.planlananBaslangicTarihi != null ? toStr(r.planlananBaslangicTarihi) : null,
    planlananBitisTarihi: r.planlananBitisTarihi != null ? toStr(r.planlananBitisTarihi) : null,
    terminTarihi: r.terminTarihi != null ? toStr(r.terminTarihi) : null,
    planlananMiktar: toNum(r.planlananMiktar),
    uretilenMiktar: toNum(r.uretilenMiktar),
    durum: toStr(r.durum, "bekliyor"),
    duraklatmaZamani: r.duraklatmaZamani != null ? toStr(r.duraklatmaZamani) : null,
  };
}

export function normalizeGanttMachine(raw: unknown): GanttMachineDto {
  const r = isRecord(raw) ? raw : {};
  const rawItems = Array.isArray(r.items) ? r.items : [];
  const rawBlocks = Array.isArray(r.blocks) ? r.blocks : [];
  return {
    makineId: toStr(r.makineId),
    makineKod: toStr(r.makineKod),
    makineAd: toStr(r.makineAd),
    calisir24Saat: toBool(r.calisir24Saat),
    saatlikKapasite: r.saatlikKapasite != null ? toNum(r.saatlikKapasite) : null,
    gunlukCalismaSaati: toNum(r.gunlukCalismaSaati, 8),
    blocks: rawBlocks.map((block) => {
      const b = isRecord(block) ? block : {};
      return {
        id: toStr(b.id),
        tip: toStr(b.tip, "tatil") as "tatil" | "hafta_sonu" | "durus",
        baslangicTarihi: toStr(b.baslangicTarihi),
        bitisTarihi: toStr(b.bitisTarihi),
        etiket: toStr(b.etiket),
      };
    }),
    items: rawItems.map(normalizeGanttBar),
  };
}

export function normalizeGanttList(res: unknown): GanttListResponse {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(res) ? res : [];
  return {
    items: (rawItems as unknown[]).map(normalizeGanttMachine),
    total: toNum(r.total, rawItems.length),
  };
}
