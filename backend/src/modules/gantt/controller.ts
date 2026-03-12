import type { FastifyReply, RouteHandler } from 'fastify';

import { repoGetById, repoList, repoUpdateById } from './repository';
import { listQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listGantt: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const { items, total } = await repoList(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send({ items, total });
  } catch (error) {
    req.log.error({ error }, 'list_gantt_failed');
    return sendInternalError(reply);
  }
};

export const getGanttItem: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: 'gantt_kaydi_bulunamadi' } });
    return reply.send(row);
  } catch (error) {
    req.log.error({ error }, 'get_gantt_item_failed');
    return sendInternalError(reply);
  }
};

export const updateGanttItem: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdateById(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'gantt_kaydi_bulunamadi' } });
    return reply.send(row);
  } catch (error) {
    req.log.error({ error }, 'update_gantt_item_failed');
    return sendInternalError(reply);
  }
};
