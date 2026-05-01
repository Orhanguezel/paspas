import type { FastifyRequest, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import {
  repoCreate,
  repoDelete,
  repoGetById,
  repoList,
  repoStats,
  repoUpdate,
} from './repository';
import { createSchema, listQuerySchema, patchSchema } from './validation';

type AuthedUser = { sub?: string; id?: string };

function getUserId(req: FastifyRequest): string | null {
  const u = (req as unknown as { user?: AuthedUser }).user;
  return u?.sub ?? u?.id ?? null;
}

/** GET /admin/proje-teklifi-notlari */
export const listProjeTeklifiNotlari: RouteHandler = async (req, reply) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_query', issues: parsed.error.flatten() },
    });
  }

  const { items, total } = await repoList(parsed.data);
  reply.header('x-total-count', String(total));
  return {
    items: items.map(rowToDto),
    total,
  };
};

/** GET /admin/proje-teklifi-notlari/stats */
export const statsProjeTeklifiNotlari: RouteHandler = async () => {
  return repoStats();
};

/** GET /admin/proje-teklifi-notlari/:id */
export const getProjeTeklifiNotu: RouteHandler = async (req, reply) => {
  const id = String((req.params as { id?: string }).id || '');
  if (!id) return reply.code(400).send({ error: { message: 'missing_id' } });
  const row = await repoGetById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return rowToDto(row);
};

/** POST /admin/proje-teklifi-notlari */
export const createProjeTeklifiNotu: RouteHandler = async (req, reply) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.flatten() },
    });
  }

  const userId = getUserId(req);
  const row = await repoCreate(parsed.data, userId);
  return reply.code(201).send(rowToDto(row));
};

/** PATCH /admin/proje-teklifi-notlari/:id */
export const updateProjeTeklifiNotu: RouteHandler = async (req, reply) => {
  const id = String((req.params as { id?: string }).id || '');
  if (!id) return reply.code(400).send({ error: { message: 'missing_id' } });

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.flatten() },
    });
  }

  const userId = getUserId(req);
  const row = await repoUpdate(id, parsed.data, userId);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return rowToDto(row);
};

/** DELETE /admin/proje-teklifi-notlari/:id */
export const deleteProjeTeklifiNotu: RouteHandler = async (req, reply) => {
  const id = String((req.params as { id?: string }).id || '');
  if (!id) return reply.code(400).send({ error: { message: 'missing_id' } });
  const existing = await repoGetById(id);
  if (!existing) return reply.code(404).send({ error: { message: 'not_found' } });
  await repoDelete(id);
  return reply.code(204).send();
};
