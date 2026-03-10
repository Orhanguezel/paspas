import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import { repoCreate, repoDelete, repoGetById, repoGetNextEmirNo, repoGetOperasyonlar, repoList, repoListAdaylar, repoUpdate } from './repository';
import { createSchema, listQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listUretimEmirleri: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    const { items, total } = await repoList(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send(items.map(rowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_uretim_emirleri_failed');
    return sendInternalError(reply);
  }
};

export const listUretimEmriAdaylari: RouteHandler = async (req, reply) => {
  try {
    const items = await repoListAdaylar();
    return reply.send(items);
  } catch (error) {
    req.log.error({ error }, 'list_uretim_emri_adaylari_failed');
    return sendInternalError(reply);
  }
};

export const getNextEmirNo: RouteHandler = async (req, reply) => {
  try {
    const nextNo = await repoGetNextEmirNo();
    return reply.send({ emirNo: nextNo });
  } catch (error) {
    req.log.error({ error }, 'get_next_emir_no_failed');
    return sendInternalError(reply);
  }
};

export const getUretimEmri: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: 'uretim_emri_bulunamadi' } });
    return reply.send(rowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_uretim_emri_failed');
    return sendInternalError(reply);
  }
};

export const createUretimEmri: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ body: req.body, issues: parsed.error.flatten() }, 'create_uretim_emri_validation_failed');
      return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    }
    const row = await repoCreate(parsed.data);
    return reply.code(201).send(rowToDto(row));
  } catch (error: unknown) {
    req.log.error({ error }, 'create_uretim_emri_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'emir_no_zaten_var' } });
    return sendInternalError(reply);
  }
};

export const updateUretimEmri: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ body: req.body, issues: parsed.error.flatten() }, 'update_uretim_emri_validation_failed');
      return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    }
    const row = await repoUpdate(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'uretim_emri_bulunamadi' } });
    return reply.send(rowToDto(row));
  } catch (error: unknown) {
    req.log.error({ error }, 'update_uretim_emri_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'emir_no_zaten_var' } });
    return sendInternalError(reply);
  }
};

/** GET /admin/uretim-emirleri/:id/operasyonlar */
export const listEmirOperasyonlari: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const items = await repoGetOperasyonlar(id);
    return reply.send(items);
  } catch (error) {
    req.log.error({ error }, 'list_emir_operasyonlari_failed');
    return sendInternalError(reply);
  }
};

export const deleteUretimEmri: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error: unknown) {
    req.log.error({ error }, 'delete_uretim_emri_failed');
    const err = error as { message?: string; detail?: string };
    if (err.message === 'uretim_emri_silinemez') {
      return reply.code(409).send({ error: { message: err.message, detail: err.detail ?? null } });
    }
    return sendInternalError(reply);
  }
};
