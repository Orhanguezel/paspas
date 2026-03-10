import type { RouteHandler } from 'fastify';

import { bekleyenlerQuerySchema, sevkEmriCreateSchema, sevkEmriListQuerySchema, sevkEmriPatchSchema, siparissizQuerySchema } from './validation';
import { repoListBekleyenler, repoListSevkEmirleri, repoGetSevkEmriById, repoCreateSevkEmri, repoListSiparissizUrunler, repoPatchSevkEmri } from './repository';

/** GET /admin/sevkiyat/bekleyenler */
export const listBekleyenler: RouteHandler = async (req, reply) => {
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
  const userId = (req.user as { id?: string })?.id ?? null;
  const row = await repoPatchSevkEmri(id, parsed.data, userId);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return row;
};
