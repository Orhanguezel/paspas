import type { FastifyRequest, FastifyReply } from "fastify";
import "@fastify/jwt";
import "@fastify/cookie";

/** JWT payload’ın bizde aradığımız minimum alanları */
export interface JwtUser {
  sub?: string;
  email?: string;
  role?: string;
  roles?: string[];
  is_admin?: boolean;
  [k: string]: unknown;
}

function looksAdmin(u: JwtUser | undefined): boolean {
  if (!u) return false;
  if (u.is_admin === true) return true;
  if (u.role === "admin") return true;
  if (Array.isArray(u.roles) && u.roles.includes("admin")) return true;
  return false;
}

/**
 * Cookie-first + Header fallback
 * - Cookies: access_token | accessToken
 * - Header: Authorization: Bearer <token>
 * Doğrulama başarılıysa req.user’ı set eder.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const cookieToken = cookies.access_token ?? cookies.accessToken;

    if (cookieToken) {
      try {
        const payload = (await req.server.jwt.verify(cookieToken)) as JwtUser;
        (req as unknown as { user: JwtUser }).user = payload;
        return;
      } catch {
        // Cookie token expired or invalid — fall through to check Bearer header
      }
    }

    const auth = req.headers.authorization;
    if (typeof auth === "string" && auth.startsWith("Bearer ")) {
      await req.jwtVerify<JwtUser>();
      // fastify-jwt zaten req.user set eder; tip güvenliği için fallback:
      const u = (req as unknown as { user?: JwtUser }).user;
      if (!u) {
        return reply.code(401).send({ error: { message: "invalid_token" } });
      }
      return;
    }

    return reply.code(401).send({ error: { message: "no_token" } });
  } catch (err) {
    req.log.warn({ err }, "auth_failed");
    return reply.code(401).send({ error: { message: "invalid_token" } });
  }
}

/** Yalnızca admin erişimine izin verir. */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const u = (req as unknown as { user?: JwtUser }).user;
  if (!looksAdmin(u)) {
    return reply.code(403).send({ error: { message: "forbidden" } });
  }
}
