// =============================================================
// FILE: src/modules/_shared/normalizers.ts
// Ortak normalizer / dönüştürücü yardımcılar
// =============================================================

export const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

export const boolToTinyint = (v: unknown): 0 | 1 => (toBool(v) ? 1 : 0);

export const dec6orNull = (v: number | string | null | undefined): string | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(6) : null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6) : null;
};

export const dec2orNull = (v: number | string | null | undefined): string | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v.toFixed(2) : null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : null;
};

export const trimOrUndef = (v: unknown): string | undefined =>
  typeof v === "string" ? v.trim() : undefined;

export const trimOrNull = (v: unknown): string | null | undefined => {
  if (typeof v === "undefined") return undefined;
  if (v === null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
  }
  return null;
};

export const intOrNull = (v: unknown): number | null | undefined => {
  if (typeof v === "undefined") return undefined;
  if (v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export const cleanStringArrayOrNull = (v: unknown): string[] | null | undefined => {
  if (typeof v === "undefined") return undefined;
  if (v === null) return null;
  if (!Array.isArray(v)) return null;
  const out = v
    .map((x) => (typeof x === "string" ? x.trim() : String(x).trim()))
    .filter(Boolean);
  return out.length ? out : [];
};

export const safeSpecsObjectOrNull = (v: unknown): Record<string, unknown> | null => {
  if (v == null) return null;
  if (typeof v !== "object") return null;
  if (Array.isArray(v)) return null;
  return v as Record<string, unknown>;
};

export function buildGeocodeQuery(address: string, district: string, city: string): string {
  const parts = [address, district, city].map((s) => String(s || "").trim()).filter(Boolean);
  return parts.join(", ");
}

/** Parses value to finite number or 0 */
export function toNum(x: unknown): number {
  if (typeof x === "number") return Number.isFinite(x) ? x : 0;
  const n = Number(x as unknown);
  return Number.isFinite(n) ? n : 0;
}

/** Generic JSON parser */
export function parseJson<T>(s?: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** Converts Date to ISO string safely */
export function iso(d?: Date | string | null): string | undefined {
  if (!d) return undefined;
  const dt = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString();
}

/** Returns null if string is empty, otherwise returns value */
export function nullIfEmpty(v: unknown): any | null {
  if (v === "" || v === null || v === undefined) return null;
  return v;
}
