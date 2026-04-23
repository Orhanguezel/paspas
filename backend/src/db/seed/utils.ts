// src/db/seed/utils.ts

// SQL dosyasini yorum ve string sinirlarina zarar vermeden hazirla.
export function cleanSql(input: string): string {
  return input.replace(/^\uFEFF/, '');
}

function isLineCommentStart(sql: string, i: number) {
  const ch = sql[i];
  const next = sql[i + 1];
  const afterNext = sql[i + 2];
  if (ch === '#') return true;
  if (ch !== '-' || next !== '-') return false;
  return afterNext === undefined || /\s/.test(afterNext);
}

export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        current += ch;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (isLineCommentStart(sql, i)) {
        inLineComment = true;
        if (ch === '-') i += 1;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i += 1;
        continue;
      }
      if (ch === ';') {
        const stmt = current.trim();
        if (stmt) statements.push(stmt + ';');
        current = '';
        continue;
      }
    }

    current += ch;

    if (inSingle) {
      if (ch === '\\') {
        if (next !== undefined) {
          current += next;
          i += 1;
        }
        continue;
      }
      if (ch === "'" && next === "'") {
        current += next;
        i += 1;
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      if (ch === '\\') {
        if (next !== undefined) {
          current += next;
          i += 1;
        }
        continue;
      }
      if (ch === '"' && next === '"') {
        current += next;
        i += 1;
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }

    if (inBacktick) {
      if (ch === '`') inBacktick = false;
      continue;
    }

    if (ch === "'") inSingle = true;
    else if (ch === '"') inDouble = true;
    else if (ch === '`') inBacktick = true;
  }

  const tail = current.trim();
  if (tail) statements.push(tail.endsWith(';') ? tail : tail + ';');
  return statements;
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
