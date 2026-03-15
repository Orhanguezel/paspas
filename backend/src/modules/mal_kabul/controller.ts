import type { RouteHandler } from 'fastify';

import { listQuerySchema, createSchema, patchSchema } from './validation';
import { repoList, repoGetById, repoCreate, repoUpdate, repoDelete } from './repository';

function sendError(reply: { code: (c: number) => { send: (b: unknown) => unknown } }, code: number, message: string) {
  return reply.code(code).send({ error: { message } });
}

function getUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

/** GET /admin/mal-kabul */
export const listMalKabul: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_sorgu');

    const result = await repoList(parsed.data);
    reply.header('x-total-count', String(result.total));
    return { items: result.items, total: result.total, summary: result.summary };
  } catch (error) {
    req.log.error({ error }, 'mal_kabul_list_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};

/** GET /admin/mal-kabul/:id */
export const getMalKabul: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const result = await repoGetById(id);
    if (!result) return sendError(reply, 404, 'kayit_bulunamadi');
    return result;
  } catch (error) {
    req.log.error({ error }, 'mal_kabul_get_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};

/** POST /admin/mal-kabul */
export const createMalKabul: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });

    const result = await repoCreate(parsed.data, getUserId(req));
    return reply.code(201).send(result);
  } catch (error) {
    req.log.error({ error }, 'mal_kabul_create_failed');
    const msg = error instanceof Error ? error.message : 'sunucu_hatasi';
    return sendError(reply, 500, msg);
  }
};

/** PATCH /admin/mal-kabul/:id */
export const updateMalKabul: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });

    const userId = getUserId(req);
    const result = await repoUpdate(id, parsed.data, userId);
    if (!result) return sendError(reply, 404, 'kayit_bulunamadi');
    return result;
  } catch (error) {
    req.log.error({ error }, 'mal_kabul_update_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};

/** DELETE /admin/mal-kabul/:id */
export const deleteMalKabul: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = await repoDelete(id);
    if (!deleted) return sendError(reply, 404, 'kayit_bulunamadi');
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'mal_kabul_delete_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};
