import type { FastifyReply, FastifyRequest } from 'fastify';

export type AppRole = 'admin' | 'sevkiyatci' | 'operator' | 'satin_almaci';

const LEGACY_TO_ERP_ROLE: Record<string, AppRole> = {
  admin: 'admin',
  sevkiyatci: 'sevkiyatci',
  operator: 'operator',
  satin_almaci: 'satin_almaci',
  seller: 'sevkiyatci',
  moderator: 'satin_almaci',
  user: 'operator',
};

function normalizeRole(value: unknown): AppRole | undefined {
  if (typeof value !== 'string') return undefined;
  return LEGACY_TO_ERP_ROLE[value];
}

function getRoleBag(req: FastifyRequest): { role?: string; roles: string[]; isAdmin: boolean } {
  const user = (req as any)?.user ?? {};
  const normalizedRole = normalizeRole(user?.role);
  const normalizedRoles = Array.isArray(user?.roles)
    ? user.roles
        .map((r: unknown) => normalizeRole(r))
        .filter((r: AppRole | undefined): r is AppRole => Boolean(r))
    : [];

  return {
    role: normalizedRole,
    roles: normalizedRoles,
    isAdmin: user?.is_admin === true,
  };
}

export function hasAnyRole(req: FastifyRequest, allowed: AppRole[]): boolean {
  const bag = getRoleBag(req);
  if (bag.isAdmin && allowed.includes('admin')) return true;
  if (bag.role && allowed.includes(bag.role as AppRole)) return true;
  return bag.roles.some((r: string) => allowed.includes(r as AppRole));
}

export async function requireRoles(
  req: FastifyRequest,
  reply: FastifyReply,
  allowed: AppRole[],
) {
  if (hasAnyRole(req, allowed)) return;
  reply.code(403).send({ error: { message: 'forbidden' } });
  return;
}

/** Basit rol kontrolü; JWT payload içindeki `role` alanını bekler. */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin']);
}

/** Seller veya admin erişimine izin verir. */
export async function requireSellerOrAdmin(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin', 'sevkiyatci']);
}

/** Sevkiyatci veya admin erişimine izin verir. */
export async function requireSevkiyatciOrAdmin(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin', 'sevkiyatci']);
}

/** Operator veya admin erişimine izin verir. */
export async function requireOperatorOrAdmin(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin', 'operator']);
}

/** Satin almaci veya admin erişimine izin verir. */
export async function requireSatinAlmaciOrAdmin(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin', 'satin_almaci']);
}
