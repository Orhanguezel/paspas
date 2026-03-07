// src/db/seed/utils.ts

// Yorumları temizle + güvenli split
export function cleanSql(input: string): string {
  // -- satır sonuna kadar ve /* ... */ blok yorumlarını temizle
  return input
    .replace(/--.*?(\r?\n|$)/g, '$1')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

// ; ile biten cümleleri ayrıştır (stringlerin içinde ; varsa bu basit split bozulabilir
// fakat tipik schema/seed dosyalarında sorun çıkmaz)
export function splitStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.endsWith(';') ? s : s + ';');
}

export function logStep(msg: string) {
  const ts = new Date().toISOString().replace('T',' ').replace('Z','');
  console.log(`[${ts}] ${msg}`);
}


export function projectColumns(selectParam: unknown, allowed: string[]): string {
  const allow = new Set(allowed);
  if (typeof selectParam !== "string" || !selectParam.trim() || selectParam === "*") {
    return allowed.join(", ");
  }
  const cols = selectParam
    .split(",")
    .map((s) => s.trim())
    .filter((c) => allow.has(c));
  return (cols.length ? cols : allowed).join(", ");
}

export function parseOrder(
  orderParam: unknown,
  allowedCols: string[],
  defaultCol = "created_at",
  defaultDir: "desc" | "asc" = "desc"
) {
  const s = typeof orderParam === "string" ? orderParam : "";
  const [c, d] = s.split(".");
  const col = allowedCols.includes(c || "") ? c! : defaultCol;
  const dir = d?.toLowerCase() === "asc" ? "ASC" : defaultDir.toUpperCase();
  return { col, dir };
}

export function toNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}
