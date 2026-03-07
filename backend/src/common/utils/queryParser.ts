// ────────────────────────────────────────────────────────────────────────────────
// 8) src/common/utils/queryParser.ts — PostgREST-lite
// ────────────────────────────────────────────────────────────────────────────────
import { sql, like, and, gt, gte, lt, lte, eq, inArray } from 'drizzle-orm';


export type Filter = ReturnType<typeof and> | undefined;


export function parseFilters(qs: Record<string,string|undefined>, table: any): Filter {
const parts: any[] = [];
for (const [key, raw] of Object.entries(qs)) {
if (!raw) continue;
if (['select','order','limit','offset'].includes(key)) continue;
const v = String(raw);
if (v.startsWith('eq.')) parts.push(eq((table as any)[key], cast(v.slice(3))));
else if (v.startsWith('neq.')) parts.push(sql`${(table as any)[key]} <> ${cast(v.slice(4))}`);
else if (v.startsWith('gt.')) parts.push(gt((table as any)[key], cast(v.slice(3))));
else if (v.startsWith('gte.')) parts.push(gte((table as any)[key], cast(v.slice(4))));
else if (v.startsWith('lt.')) parts.push(lt((table as any)[key], cast(v.slice(3))));
else if (v.startsWith('lte.')) parts.push(lte((table as any)[key], cast(v.slice(4))));
else if (v.startsWith('ilike.')) parts.push(like((table as any)[key], v.slice(6)));
else if (v.startsWith('in.(') && v.endsWith(')')) {
const arr = v.slice(3, -1).split(',').map(s => cast(s.trim()));
parts.push(inArray((table as any)[key], arr));
}
}
return parts.length ? and(...parts) : undefined;
}


export function parseOrder(order?: string) {
if (!order) return undefined;
const [col, dir] = order.split('.');
return { col, dir: (dir === 'desc' ? 'desc' : 'asc') as 'asc'|'desc' };
}


export function parseLimitOffset(q: Record<string,string|undefined>) {
const limit = clampInt(q.limit, 100, 1, 500);
const offset = clampInt(q.offset, 0, 0, 1_000_000);
return { limit, offset };
}


function clampInt(val: string|undefined, def: number, min: number, max: number) {
const n = Number(val);
if (!Number.isFinite(n)) return def;
return Math.min(max, Math.max(min, Math.floor(n)));
}


function cast(v: string): any {
if (v === 'true') return true;
if (v === 'false') return false;
const n = Number(v);
if (!Number.isNaN(n) && v.trim() !== '') return n;
return v;
}