// apps/portal/lib/auth.ts
// Bayi auth: bcrypt + JWT + httpOnly cookie

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { portalUsers, portalAudit } from "@mat-erp/db/schema/portal";
import { customers } from "@mat-erp/db/schema/erp";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "portal_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 gün

if (!JWT_SECRET) throw new Error("JWT_SECRET env eksik");

export type Session = {
  userId: string;
  customerId: number;
  email: string;
  role: "dealer" | "dealer_admin";
};

export async function login(email: string, password: string, ip: string) {
  const user = await db.query.portalUsers.findFirst({
    where: and(
      eq(portalUsers.email, email.toLowerCase()),
      eq(portalUsers.isActive, true),
    ),
  });

  if (!user) {
    // Constant-time mismatch yapmak için yine de bcrypt karşılaştır
    await bcrypt.compare(password, "$2a$10$dummyhashdummyhashdummyhashdu");
    throw new Error("Geçersiz email veya şifre");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await db.insert(portalAudit).values({
      userId: user.id,
      customerId: user.customerId,
      action: "login_failed",
      ipAddress: ip,
    });
    throw new Error("Geçersiz email veya şifre");
  }

  // Müşteri hâlâ aktif mi?
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, user.customerId),
  });
  if (!customer || customer.status === "passive") {
    throw new Error("Hesabınız pasif durumda. Satış temsilcinizle görüşün.");
  }

  await db.update(portalUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(portalUsers.id, user.id));

  await db.insert(portalAudit).values({
    userId: user.id,
    customerId: user.customerId,
    action: "login_success",
    ipAddress: ip,
  });

  const session: Session = {
    userId: user.id,
    customerId: user.customerId,
    email: user.email,
    role: user.role as "dealer" | "dealer_admin",
  };

  const token = jwt.sign(session, JWT_SECRET, { expiresIn: SESSION_DURATION });

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return { session, mustChangePw: user.mustChangePw };
}

export async function logout() {
  const session = await getSession();
  if (session) {
    await db.insert(portalAudit).values({
      userId: session.userId,
      customerId: session.customerId,
      action: "logout",
    });
  }
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as Session;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session!;
}
