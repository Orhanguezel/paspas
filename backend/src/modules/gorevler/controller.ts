import type { FastifyReply, RouteHandler } from 'fastify';

import { repoCreate, repoDelete, repoGetById, repoList, repoUpdate } from './repository';
import { createSchema, listQuerySchema, updateSchema } from './validation';

function getUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

function getUserRole(req: unknown): string | null {
  const r = req as { user?: { role?: string; is_admin?: boolean } };
  if (r.user?.is_admin === true) return 'admin';
  return r.user?.role ?? null;
}

function isAdmin(req: unknown): boolean {
  const r = req as { user?: { role?: string; is_admin?: boolean } };
  return r.user?.is_admin === true || r.user?.role === 'admin';
}

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listGorevler: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    }
    const { items, total, summary } = await repoList(parsed.data, getUserId(req), getUserRole(req), isAdmin(req));
    reply.header('x-total-count', String(total));
    return reply.send({ items, total, summary });
  } catch (error) {
    req.log.error({ error }, 'list_gorevler_failed');
    return sendInternalError(reply);
  }
};

export const getGorev: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const item = await repoGetById(id);
    if (!item) return reply.code(404).send({ error: { message: 'gorev_bulunamadi' } });
    return reply.send(item);
  } catch (error) {
    req.log.error({ error }, 'get_gorev_failed');
    return sendInternalError(reply);
  }
};

export const createGorev: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    }
    const item = await repoCreate(parsed.data, getUserId(req));
    return reply.code(201).send(item);
  } catch (error) {
    req.log.error({ error }, 'create_gorev_failed');
    return sendInternalError(reply);
  }
};

export const updateGorev: RouteHandler = async (req, reply) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    }
    const { id } = req.params as { id: string };
    const item = await repoUpdate(id, parsed.data);
    if (!item) return reply.code(404).send({ error: { message: 'gorev_bulunamadi' } });
    return reply.send(item);
  } catch (error) {
    req.log.error({ error }, 'update_gorev_failed');
    return sendInternalError(reply);
  }
};

export const deleteGorev: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = await repoDelete(id);
    if (!deleted) return reply.code(404).send({ error: { message: 'gorev_bulunamadi' } });
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_gorev_failed');
    return sendInternalError(reply);
  }
};
