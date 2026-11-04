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

/** Kullanıcının bütün rollerini öncelik sırasıyla döndürür. */
export async function getAssignedRoles(userId: string): Promise<RoleName[]> {
  const rows = await db.select().from(userRoles).where(eq(userRoles.user_id, userId));
  if (!rows.length) return ["operator"];
  return [...new Set(rows.map((r) => LEGACY_ROLE_MAP[String(r.role)] ?? "operator"))]
    .sort((a, b) => ROLE_WEIGHT[b] - ROLE_WEIGHT[a]);
}

/** Eski tek-rol tüketicileri için birincil rol. */
export async function getPrimaryRole(userId: string): Promise<RoleName> {
  return (await getAssignedRoles(userId))[0] ?? "operator";
}
