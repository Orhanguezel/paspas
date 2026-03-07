import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import { repoCreate, repoList } from './repository';
import { createSchema, listQuerySchema } from './validation';

function getUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listHareketler: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const { items, total, summary } = await repoList(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send({ items: items.map(rowToDto), total, summary });
  } catch (error) {
    req.log.error({ error }, 'list_hareketler_failed');
    return sendInternalError(reply);
  }
};

export const createHareket: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoCreate(parsed.data, getUserId(req));
    return reply.code(201).send(rowToDto(row));
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'urun_bulunamadi') return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    if (err.message === 'negative_stock_not_allowed') return reply.code(409).send({ error: { message: 'stok_eksiye_dusurulemez' } });
    req.log.error({ error }, 'create_hareket_failed');
    return sendInternalError(reply);
  }
};
