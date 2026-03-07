// src/modules/userRoles/service.ts
import { db } from "@/db/client";
import { userRoles } from "./schema";
import { eq } from "drizzle-orm";

export type RoleName = "admin" | "sevkiyatci" | "operator" | "satin_almaci";

const LEGACY_ROLE_MAP: Record<string, RoleName> = {
  admin: "admin",
  operator: "operator",
  sevkiyatci: "sevkiyatci",
  satin_almaci: "satin_almaci",
  // legacy role -> ERP role
  seller: "sevkiyatci",
  moderator: "satin_almaci",
  user: "operator",
};

const ROLE_WEIGHT: Record<RoleName, number> = {
  admin: 4,
  satin_almaci: 3,
  sevkiyatci: 2,
  operator: 1,
};

/** Kullanıcının rollerini çekip en yüksek öncelikli olanı döndürür. */
export async function getPrimaryRole(userId: string): Promise<RoleName> {
  const rows = await db.select().from(userRoles).where(eq(userRoles.user_id, userId));
  if (!rows?.length) return "operator";
  let best: RoleName = "operator";
  let bestWeight = 0;
  for (const r of rows) {
    const normalized = LEGACY_ROLE_MAP[String(r.role)] ?? "operator";
    const w = ROLE_WEIGHT[normalized] ?? 0;
    if (w > bestWeight) {
      best = normalized;
      bestWeight = w;
    }
  }
  return best;
}
