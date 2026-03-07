// src/modules/_shared/json.ts
export const packJson = (v: unknown) => JSON.stringify(v);
export const unpackArray = (s?: string | null): string[] =>
  !s ? [] : (JSON.parse(s) as string[]);
export const parseJsonArrayString = (s?: string | null): string[] => {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
};
export const extractHtmlFromJson = (s?: string | null): string => {
  if (!s) return "";
  try {
    const obj = JSON.parse(s) as any;
    return typeof obj?.html === "string" ? obj.html : "";
  } catch { return ""; }
};
export const packContent = (htmlOrJson: string) => {
  try {
    const parsed = JSON.parse(htmlOrJson) as any;
    if (parsed && typeof parsed.html === "string") return JSON.stringify({ html: parsed.html });
  } catch {}
  return JSON.stringify({ html: htmlOrJson });
};
