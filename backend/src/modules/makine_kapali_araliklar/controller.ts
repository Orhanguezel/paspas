import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import {
  createMakineKapaliAralikSchema,
  listMakineKapaliAraliklarQuerySchema,
  patchMakineKapaliAralikSchema,
} from './validation';
import { repoCreate, repoDelete, repoGetById, repoList, repoUpdate } from './repository';

function getAdminUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

function sendKnownError(reply: FastifyReply, error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === 'cakisan_aralik') {
    return reply.code(409).send({
      error: { message: msg, detail: 'Bu makine için seçilen tarih aralığı başka bir kapalı aralıkla çakışıyor.' },
    });
  }
  if (msg === 'bitis_tarihi_baslangictan_once_olamaz') {
    return reply.code(400).send({ error: { message: msg } });
  }
  return null;
}

export const listMakineKapaliAraliklar: RouteHandler = async (req, reply) => {
  try {
    const parsed = listMakineKapaliAraliklarQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    }
    const rows = await repoList(parsed.data);
    return reply.send({ items: rows.map(rowToDto), total: rows.length });
  } catch (error) {
    req.log.error({ error }, 'list_makine_kapali_araliklar_failed');
    return sendInternalError(reply);
  }
};

export const getMakineKapaliAralik: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: 'kapali_aralik_bulunamadi' } });
    return reply.send(rowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_makine_kapali_aralik_failed');
    return sendInternalError(reply);
  }
};

export const createMakineKapaliAralik: RouteHandler = async (req, reply) => {
  try {
    const parsed = createMakineKapaliAralikSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoCreate(parsed.data, getAdminUserId(req));
    return reply.code(201).send(rowToDto(row));
  } catch (error) {
    const known = sendKnownError(reply, error);
    if (known) return known;
    req.log.error({ error }, 'create_makine_kapali_aralik_failed');
    return sendInternalError(reply);
  }
};

export const updateMakineKapaliAralik: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchMakineKapaliAralikSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdate(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'kapali_aralik_bulunamadi' } });
    return reply.send(rowToDto(row));
  } catch (error) {
    const known = sendKnownError(reply, error);
    if (known) return known;
    req.log.error({ error }, 'update_makine_kapali_aralik_failed');
    return sendInternalError(reply);
  }
};

export const deleteMakineKapaliAralik: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_makine_kapali_aralik_failed');
    return sendInternalError(reply);
  }
};
