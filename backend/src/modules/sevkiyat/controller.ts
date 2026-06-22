import type { FastifyRequest, RouteHandler } from 'fastify';

import { bekleyenlerQuerySchema, sevkEmriCreateSchema, sevkEmriListQuerySchema, sevkEmriPatchSchema, siparissizQuerySchema } from './validation';
import { repoListBekleyenler, repoListSevkEmirleri, repoGetSevkEmriById, repoCreateSevkEmri, repoListSiparissizUrunler, repoPatchSevkEmri } from './repository';

function getUserRoles(req: FastifyRequest): string[] {
  const user = (req as { user?: { role?: unknown; roles?: unknown[]; is_admin?: boolean } }).user;
  const roles = new Set<string>();
  if (user?.is_admin) roles.add('admin');
  if (typeof user?.role === 'string') roles.add(user.role);
  if (Array.isArray(user?.roles)) {
    for (const role of user.roles) if (typeof role === 'string') roles.add(role);
  }
  return Array.from(roles);
}

function isAdminRequest(req: FastifyRequest): boolean {
  return getUserRoles(req).includes('admin');
}

function canPlanShipments(req: FastifyRequest): boolean {
  const roles = getUserRoles(req);
  return roles.includes('admin') || roles.includes('sevkiyatci');
}

function canPhysicallyShip(req: FastifyRequest): boolean {
  const roles = getUserRoles(req);
  return roles.includes('admin') || roles.includes('sevkiyatci') || roles.includes('nakliyeci');
}

/** GET /admin/sevkiyat/bekleyenler */
export const listBekleyenler: RouteHandler = async (req, reply) => {
  if (!canPlanShipments(req)) return reply.code(403).send({ error: { message: 'forbidden' } });
  const parsed = bekleyenlerQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
  }
  const { items, total } = await repoListBekleyenler(parsed.data);
  reply.header('x-total-count', String(total));
  return { items, total };
};

/** GET /admin/sevkiyat/siparissiz — stokta olup siparişi olmayan ürünler */
export const listSiparissizUrunler: RouteHandler = async (req, reply) => {
  if (!canPlanShipments(req)) return reply.code(403).send({ error: { message: 'forbidden' } });
  const parsed = siparissizQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
  }
  const { items, total } = await repoListSiparissizUrunler(parsed.data);
  reply.header('x-total-count', String(total));
  return { items, total };
};

/** GET /admin/sevkiyat/emirler */
export const listSevkEmirleri: RouteHandler = async (req, reply) => {
  const parsed = sevkEmriListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
  }
  const { items, total } = await repoListSevkEmirleri(parsed.data);
  reply.header('x-total-count', String(total));
  return { items, total };
};

/** GET /admin/sevkiyat/emirler/:id */
export const getSevkEmri: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const row = await repoGetSevkEmriById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return row;
};

/** POST /admin/sevkiyat/emri */
export const createSevkEmri: RouteHandler = async (req, reply) => {
  if (!isAdminRequest(req)) return reply.code(403).send({ error: { message: 'forbidden' } });
  const parsed = sevkEmriCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }
  const userId = (req.user as { id?: string })?.id ?? null;
  const row = await repoCreateSevkEmri(parsed.data, userId);
  return reply.code(201).send(row);
};

/** PATCH /admin/sevkiyat/emirler/:id — durum güncelle, sevk_edildi ise stok düş */
export const patchSevkEmri: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = sevkEmriPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }
  if (parsed.data.durum !== 'sevk_edildi' && !isAdminRequest(req)) {
    return reply.code(403).send({ error: { message: 'forbidden' } });
  }
  if (parsed.data.durum === 'sevk_edildi' && !canPhysicallyShip(req)) {
    return reply.code(403).send({ error: { message: 'forbidden' } });
  }
  if (parsed.data.durum === 'sevk_edildi' && !isAdminRequest(req)) {
    const existing = await repoGetSevkEmriById(id);
    if (!existing) return reply.code(404).send({ error: { message: 'not_found' } });
    if (existing.durum !== 'onaylandi') {
      return reply.code(409).send({ error: { message: 'sevk_emri_onay_bekliyor' } });
    }
  }
  const userId = (req.user as { id?: string })?.id ?? null;
  try {
    const row = await repoPatchSevkEmri(id, parsed.data, userId);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return row;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'stok_yetersiz') {
      const detail = error instanceof Error && 'detail' in error ? (error as Error & { detail?: string }).detail : undefined;
      return reply.code(409).send({ error: { message, detail: detail ?? 'Stok yetersiz. Yöneticinizle görüşün.' } });
    }
    if (message === 'sevk_emri_kilitli') {
      return reply.code(409).send({ error: { message } });
    }
    throw error;
  }
};
