import type { FastifyReply, RouteHandler } from 'fastify';

import { kalemRowToDto, siparisRowToDto } from './schema';
import { ensureCriticalStockDrafts, repoCreate, repoDelete, repoGetById, repoList, repoNextSiparisNo, repoUpdate } from './repository';
import { createSchema, listQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listSatinAlmaSiparisleri: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const { items, total } = await repoList(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send(items.map((item) => {
      const dto = siparisRowToDto(item);
      dto.items = (item.items ?? []).map(kalemRowToDto);
      return dto;
    }));
  } catch (error) {
    req.log.error({ error }, 'list_satin_alma_siparisleri_failed');
    return sendInternalError(reply);
  }
};

export const getSatinAlmaSiparisi: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const detail = await repoGetById(id);
    if (!detail) return reply.code(404).send({ error: { message: 'satin_alma_siparisi_bulunamadi' } });
    const dto = siparisRowToDto(detail.siparis);
    dto.items = detail.items.map(kalemRowToDto);
    return reply.send(dto);
  } catch (error) {
    req.log.error({ error }, 'get_satin_alma_siparisi_failed');
    return sendInternalError(reply);
  }
};

export const createSatinAlmaSiparisi: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const detail = await repoCreate(parsed.data);
    const dto = siparisRowToDto(detail.siparis);
    dto.items = detail.items.map(kalemRowToDto);
    return reply.code(201).send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'create_satin_alma_siparisi_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'siparis_no_zaten_var' } });
    return sendInternalError(reply);
  }
};

export const updateSatinAlmaSiparisi: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const detail = await repoUpdate(id, parsed.data);
    if (!detail) return reply.code(404).send({ error: { message: 'satin_alma_siparisi_bulunamadi' } });
    const dto = siparisRowToDto(detail.siparis);
    dto.items = detail.items.map(kalemRowToDto);
    return reply.send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'update_satin_alma_siparisi_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'siparis_no_zaten_var' } });
    return sendInternalError(reply);
  }
};

export const deleteSatinAlmaSiparisi: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_satin_alma_siparisi_failed');
    return sendInternalError(reply);
  }
};

export const checkCriticalStock: RouteHandler = async (req, reply) => {
  try {
    await ensureCriticalStockDrafts();
    return reply.send({ ok: true });
  } catch (error) {
    req.log.error({ error }, 'check_critical_stock_failed');
    return sendInternalError(reply);
  }
};

export const getNextSiparisNo: RouteHandler = async (req, reply) => {
  try {
    const siparisNo = await repoNextSiparisNo();
    return reply.send({ siparisNo });
  } catch (error) {
    req.log.error({ error }, 'get_next_siparis_no_failed');
    return sendInternalError(reply);
  }
};
