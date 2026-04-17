import type { FastifyReply, RouteHandler } from 'fastify';

import { receteKalemRowToDto, receteRowToDto } from './schema';
import { repoCreate, repoDelete, repoGetById, repoList, repoUpdate } from './repository';
import { assertReceteKategoriTutarliligi } from './service';
import { createSchema, listQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listReceteler: RouteHandler = async (req, reply) => {
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
    return reply.send(items.map(receteRowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_receteler_failed');
    return sendInternalError(reply);
  }
};

export const getRecete: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const detail = await repoGetById(id);
    if (!detail) {
      return reply.code(404).send({ error: { message: 'recete_bulunamadi' } });
    }

    const dto = receteRowToDto(detail.recete);
    dto.items = detail.items.map(receteKalemRowToDto);
    return reply.send(dto);
  } catch (error) {
    req.log.error({ error }, 'get_recete_failed');
    return sendInternalError(reply);
  }
};

export const createRecete: RouteHandler = async (req, reply) => {
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

    const kategoriCheck = await assertReceteKategoriTutarliligi(parsed.data.urunId, parsed.data.items);
    if (!kategoriCheck.ok) {
      return reply.code(400).send({ error: { message: kategoriCheck.code, detay: kategoriCheck.detay } });
    }

    const detail = await repoCreate(parsed.data);
    const dto = receteRowToDto(detail.recete);
    dto.items = detail.items.map(receteKalemRowToDto);
    return reply.code(201).send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'create_recete_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'recete_kodu_zaten_var' } });
    }
    return sendInternalError(reply);
  }
};

export const updateRecete: RouteHandler = async (req, reply) => {
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

    if (parsed.data.items || parsed.data.urunId !== undefined) {
      const current = await repoGetById(id);
      if (!current) {
        return reply.code(404).send({ error: { message: 'recete_bulunamadi' } });
      }
      const hedefUrunId = parsed.data.urunId !== undefined ? parsed.data.urunId : current.recete.urun_id;
      const itemsToCheck = parsed.data.items ?? current.items.map((i) => ({ urunId: i.urun_id }));
      const kategoriCheck = await assertReceteKategoriTutarliligi(hedefUrunId, itemsToCheck);
      if (!kategoriCheck.ok) {
        return reply.code(400).send({ error: { message: kategoriCheck.code, detay: kategoriCheck.detay } });
      }
    }

    const detail = await repoUpdate(id, parsed.data);
    if (!detail) {
      return reply.code(404).send({ error: { message: 'recete_bulunamadi' } });
    }

    const dto = receteRowToDto(detail.recete);
    dto.items = detail.items.map(receteKalemRowToDto);
    return reply.send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'update_recete_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'recete_kodu_zaten_var' } });
    }
    return sendInternalError(reply);
  }
};

export const deleteRecete: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_recete_failed');
    return sendInternalError(reply);
  }
};
