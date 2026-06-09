export interface MakineKapaliAralikDto {
  id: string;
  makineId: string;
  makineKod: string | null;
  makineAd: string | null;
  baslangicTarih: string;
  bitisTarih: string;
  aciklama: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MakineKapaliAralikListResponse {
  items: MakineKapaliAralikDto[];
  total: number;
}

export interface MakineKapaliAralikCreatePayload {
  makineId: string;
  baslangicTarih: string;
  bitisTarih: string;
  aciklama?: string | null;
}

export type MakineKapaliAralikPatchPayload = Partial<MakineKapaliAralikCreatePayload>;

function toStr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function toNullableStr(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

function toNum(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function normalizeMakineKapaliAralik(raw: unknown): MakineKapaliAralikDto {
  const r = isRecord(raw) ? raw : {};
  return {
    id: toStr(r.id),
    makineId: toStr(r.makineId),
    makineKod: toNullableStr(r.makineKod),
    makineAd: toNullableStr(r.makineAd),
    baslangicTarih: toStr(r.baslangicTarih),
    bitisTarih: toStr(r.bitisTarih),
    aciklama: toNullableStr(r.aciklama),
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  };
}

export function normalizeMakineKapaliAralikList(raw: unknown): MakineKapaliAralikListResponse {
  const r = isRecord(raw) ? raw : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(raw) ? raw : [];
  return {
    items: (rawItems as unknown[]).map(normalizeMakineKapaliAralik),
    total: toNum(r.total, rawItems.length),
  };
}
