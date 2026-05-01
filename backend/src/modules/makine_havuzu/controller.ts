import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import { repoAtaOperasyon, repoCalculateCapacity, repoCreate, repoDelete, repoGetById, repoKuyrukCikar, repoKuyrukSirala, repoList, repoListAtanmamis, repoListKaliplarByMakineIds, repoListKuyruklar, repoUpdate } from './repository';
import { ataSchema, capacityQuerySchema, createSchema, kuyrukSiralaSchema, listQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listMakineler: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const { items, total } = await repoList(parsed.data);
    const kalipMap = await repoListKaliplarByMakineIds(items.map((item) => item.id));
    reply.header('x-total-count', String(total));
    return reply.send(items.map((item) => rowToDto(item, kalipMap[item.id] ?? [])));
  } catch (error) {
    req.log.error({ error }, 'list_makineler_failed');
    return sendInternalError(reply);
  }
};

export const getMakine: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: 'makine_bulunamadi' } });
    const kalipMap = await repoListKaliplarByMakineIds([id]);
    return reply.send(rowToDto(row, kalipMap[id] ?? []));
  } catch (error) {
    req.log.error({ error }, 'get_makine_failed');
    return sendInternalError(reply);
  }
};

export const createMakine: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoCreate(parsed.data);
    const kalipMap = await repoListKaliplarByMakineIds([row.id]);
    return reply.code(201).send(rowToDto(row, kalipMap[row.id] ?? []));
  } catch (error: unknown) {
    req.log.error({ error }, 'create_makine_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'makine_kodu_zaten_var' } });
    return sendInternalError(reply);
  }
};

export const updateMakine: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdate(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'makine_bulunamadi' } });
    const kalipMap = await repoListKaliplarByMakineIds([id]);
    return reply.send(rowToDto(row, kalipMap[id] ?? []));
  } catch (error: unknown) {
    req.log.error({ error }, 'update_makine_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'makine_kodu_zaten_var' } });
    return sendInternalError(reply);
  }
};

export const deleteMakine: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_makine_failed');
    return sendInternalError(reply);
  }
};

// =====================================================
// Kuyruk Yonetimi
// =====================================================

/** GET /admin/makine-havuzu/atanmamis */
export const listAtanmamis: RouteHandler = async (req, reply) => {
  try {
    const items = await repoListAtanmamis();
    return reply.send(items);
  } catch (error) {
    req.log.error({ error }, 'list_atanmamis_failed');
    return sendInternalError(reply);
  }
};

/** GET /admin/makine-havuzu/kuyruklar */
export const listKuyruklar: RouteHandler = async (req, reply) => {
  try {
    const items = await repoListKuyruklar();
    return reply.send(items);
  } catch (error) {
    req.log.error({ error }, 'list_kuyruklar_failed');
    return sendInternalError(reply);
  }
};

/** POST /admin/makine-havuzu/ata */
export const ataOperasyon: RouteHandler = async (req, reply) => {
  try {
    const parsed = ataSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    await repoAtaOperasyon(parsed.data);
    return reply.code(201).send({ ok: true });
  } catch (error: unknown) {
    req.log.error({ error }, 'ata_operasyon_failed');
    const msg = error instanceof Error ? error.message : 'sunucu_hatasi';
    if (msg === 'emir_operasyonu_bulunamadi') return reply.code(404).send({ error: { message: msg } });
    if (msg === 'kalip_makine_uyumsuz') return reply.code(400).send({ error: { message: msg } });
    return sendInternalError(reply);
  }
};

/** DELETE /admin/makine-havuzu/kuyruk/:id */
export const kuyrukCikar: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoKuyrukCikar(id);
    return reply.code(204).send();
  } catch (error: unknown) {
    req.log.error({ error }, 'kuyruk_cikar_failed');
    const msg = error instanceof Error ? error.message : 'sunucu_hatasi';
    if (msg === 'kuyruk_kaydi_bulunamadi') return reply.code(404).send({ error: { message: msg } });
    return sendInternalError(reply);
  }
};

/** PATCH /admin/makine-havuzu/kuyruk-sirala */
export const kuyrukSirala: RouteHandler = async (req, reply) => {
  try {
    const parsed = kuyrukSiralaSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    await repoKuyrukSirala(parsed.data);
    return reply.send({ ok: true });
  } catch (error) {
    req.log.error({ error }, 'kuyruk_sirala_failed');
    const msg = error instanceof Error ? error.message : 'sunucu_hatasi';
    if (msg === 'kuyruk_makine_uyumsuz') return reply.code(400).send({ error: { message: msg } });
    return sendInternalError(reply);
  }
};

// =====================================================
// Kapasite Hesaplama
// =====================================================

/** GET /admin/makine-havuzu/:id/capacity */
export const getCapacity: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = capacityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    }

    const { startDate: startDateStr, endDate: endDateStr, days } = parsed.data;

    let startDate: Date;
    let endDate: Date;

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      // Default: today + N days (default 30)
      const numDays = days ?? 30;
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000);
    }

    const result = await repoCalculateCapacity(id, startDate, endDate);
    if (!result) {
      return reply.code(404).send({ error: { message: 'makine_bulunamadi' } });
    }

    return reply.send(result);
  } catch (error) {
    req.log.error({ error }, 'get_capacity_failed');
    return sendInternalError(reply);
  }
};
