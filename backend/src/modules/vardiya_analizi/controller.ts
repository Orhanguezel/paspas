import type { FastifyReply, RouteHandler } from 'fastify';

import { getTrend, getVardiyaAnalizi, getVardiyaAnaliziDetay } from './service';
import { detayQuerySchema, listQuerySchema, trendQuerySchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

/** GET /admin/vardiya-analizi?tarih=YYYY-MM-DD */
export const listVardiyaAnalizi: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() },
      });
    }
    const data = await getVardiyaAnalizi(parsed.data);
    return reply.send(data);
  } catch (error) {
    req.log.error({ error }, 'list_vardiya_analizi_failed');
    return sendInternalError(reply);
  }
};

/** GET /admin/vardiya-analizi/trend?gunSayisi=7|30 */
export const getVardiyaTrend: RouteHandler = async (req, reply) => {
  try {
    const parsed = trendQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() },
      });
    }
    const data = await getTrend(parsed.data);
    return reply.send(data);
  } catch (error) {
    req.log.error({ error }, 'get_vardiya_trend_failed');
    return sendInternalError(reply);
  }
};

/** GET /admin/vardiya-analizi/detay?vardiyaKayitId=...|makineId=...&tarih=... */
export const getVardiyaDetay: RouteHandler = async (req, reply) => {
  try {
    const parsed = detayQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() },
      });
    }
    const data = await getVardiyaAnaliziDetay(parsed.data);
    if (!data) return reply.code(404).send({ error: { message: 'detay_bulunamadi' } });
    return reply.send(data);
  } catch (error) {
    req.log.error({ error }, 'get_vardiya_detay_failed');
    return sendInternalError(reply);
  }
};
