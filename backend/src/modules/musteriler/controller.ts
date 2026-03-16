import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import { repoCreate, repoDelete, repoGetById, repoGetNextKod, repoList, repoUpdate } from './repository';
import { createSchema, listQuerySchema, nextKodQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listMusteriler: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          message: 'gecersiz_sorgu_parametreleri',
          issues: parsed.error.flatten(),
        },
      });
    }

    const { items, total } = await repoList(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send(items.map(rowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_musteriler_failed');
    return sendInternalError(reply);
  }
};

export const getNextKod: RouteHandler = async (req, reply) => {
  try {
    const parsed = nextKodQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          message: 'gecersiz_sorgu_parametreleri',
          issues: parsed.error.flatten(),
        },
      });
    }
    const kod = await repoGetNextKod(parsed.data.tur);
    return reply.send({ kod });
  } catch (error) {
    req.log.error({ error }, 'get_next_kod_failed');
    return sendInternalError(reply);
  }
};

export const getMusteri: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) {
      return reply.code(404).send({ error: { message: 'musteri_bulunamadi' } });
    }
    return reply.send(rowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_musteri_failed');
    return sendInternalError(reply);
  }
};

export const createMusteri: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          message: 'gecersiz_istek_govdesi',
          issues: parsed.error.flatten(),
        },
      });
    }

    const row = await repoCreate(parsed.data);
    return reply.code(201).send(rowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'create_musteri_failed');
    return sendInternalError(reply);
  }
};

export const updateMusteri: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          message: 'gecersiz_istek_govdesi',
          issues: parsed.error.flatten(),
        },
      });
    }

    const row = await repoUpdate(id, parsed.data);
    if (!row) {
      return reply.code(404).send({ error: { message: 'musteri_bulunamadi' } });
    }
    return reply.send(rowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'update_musteri_failed');
    return sendInternalError(reply);
  }
};

export const deleteMusteri: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error: any) {
    if (error?.message === 'musteri_bagimliligi_var') {
      return reply.code(409).send({
        error: {
          message: 'musteri_bagimliligi_var',
          blocking: error.blocking,
        },
      });
    }
    req.log.error({ error }, 'delete_musteri_failed');
    return sendInternalError(reply);
  }
};
