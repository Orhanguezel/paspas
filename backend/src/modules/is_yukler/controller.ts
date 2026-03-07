import type { FastifyReply, RouteHandler } from 'fastify';

import { repoCreate, repoDelete, repoGetById, repoList, repoUpdate } from './repository';
import { createSchema, listQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listIsYukleri: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    return reply.send(await repoList(parsed.data));
  } catch (error) {
    req.log.error({ error }, 'list_is_yukleri_failed');
    return sendInternalError(reply);
  }
};

export const getIsYuku: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: 'is_yuku_bulunamadi' } });
    return reply.send(row);
  } catch (error) {
    req.log.error({ error }, 'get_is_yuku_failed');
    return sendInternalError(reply);
  }
};

export const createIsYuku: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    return reply.code(201).send(await repoCreate(parsed.data));
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'makine_sira_cakismasi' } });
    }
    req.log.error({ error }, 'create_is_yuku_failed');
    return sendInternalError(reply);
  }
};

export const updateIsYuku: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdate(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'is_yuku_bulunamadi' } });
    return reply.send(row);
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'makine_sira_cakismasi' } });
    }
    req.log.error({ error }, 'update_is_yuku_failed');
    return sendInternalError(reply);
  }
};

export const deleteIsYuku: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_is_yuku_failed');
    return sendInternalError(reply);
  }
};
