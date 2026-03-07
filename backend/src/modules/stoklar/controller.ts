import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import { repoAdjustStock, repoCheckYeterlilik, repoGetAcikUretimIhtiyaciMap, repoGetById, repoList, repoListBirimDonusumleri } from './repository';
import { adjustStockSchema, listQuerySchema, yeterlilikQuerySchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

function getUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

export const listStoklar: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const { items, total } = await repoList(parsed.data);
    const [birimMap, ihtiyacMap] = await Promise.all([
      repoListBirimDonusumleri(items.map((i) => i.id)),
      repoGetAcikUretimIhtiyaciMap(items.map((i) => i.id)),
    ]);
    reply.header('x-total-count', String(total));
    return reply.send(items.map((item) => rowToDto(item, birimMap.get(item.id) ?? [], ihtiyacMap.get(item.id) ?? 0)));
  } catch (error) {
    req.log.error({ error }, 'list_stoklar_failed');
    return sendInternalError(reply);
  }
};

export const getStok: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: 'stok_kaydi_bulunamadi' } });
    const [birimMap, ihtiyacMap] = await Promise.all([
      repoListBirimDonusumleri([id]),
      repoGetAcikUretimIhtiyaciMap([id]),
    ]);
    return reply.send(rowToDto(row, birimMap.get(id) ?? [], ihtiyacMap.get(id) ?? 0));
  } catch (error) {
    req.log.error({ error }, 'get_stok_failed');
    return sendInternalError(reply);
  }
};

export const adjustStok: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = adjustStockSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoAdjustStock(id, parsed.data, getUserId(req));
    if (!row) return reply.code(404).send({ error: { message: 'stok_kaydi_bulunamadi' } });
    const [birimMap, ihtiyacMap] = await Promise.all([
      repoListBirimDonusumleri([id]),
      repoGetAcikUretimIhtiyaciMap([id]),
    ]);
    return reply.send(rowToDto(row, birimMap.get(id) ?? [], ihtiyacMap.get(id) ?? 0));
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === 'negative_stock_not_allowed') {
      return reply.code(409).send({ error: { message: 'stok_eksiye_dusurulemez' } });
    }
    req.log.error({ error }, 'adjust_stok_failed');
    return sendInternalError(reply);
  }
};

/** GET /admin/stoklar/yeterlilik?urunId=X&miktar=Y */
export const checkYeterlilik: RouteHandler = async (req, reply) => {
  try {
    const parsed = yeterlilikQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });

    const result = await repoCheckYeterlilik(parsed.data);
    if (!result) return reply.code(404).send({ error: { message: 'recete_bulunamadi' } });

    return reply.send(result);
  } catch (error) {
    req.log.error({ error }, 'check_yeterlilik_failed');
    return sendInternalError(reply);
  }
};
