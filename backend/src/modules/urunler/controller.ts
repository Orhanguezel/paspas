import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto, operasyonRowToDto, birimDonusumRowToDto } from './schema';
import { receteRowToDto, receteKalemRowToDto } from '@/modules/receteler/schema';
import {
  repoCreate,
  repoDelete,
  repoGetById,
  repoList,
  repoUpdate,
  repoListOperasyonlar,
  repoListOperasyonMakineleri,
  repoPatchOperasyon,
  repoListBirimDonusumleri,
} from './repository';
import {
  repoGetByUrunId as repoGetReceteByUrunId,
  repoCreate as repoCreateRecete,
  repoUpdate as repoUpdateRecete,
  repoDelete as repoDeleteRecete,
} from '@/modules/receteler/repository';
import { createSchema, listQuerySchema, patchSchema, operasyonPatchSchema } from './validation';
import { z } from 'zod';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

import type { UrunOperasyonRow } from './schema';

async function enrichOperasyonlar(rows: UrunOperasyonRow[]) {
  const opIds = rows.map((r) => r.id);
  const makineMap = await repoListOperasyonMakineleri(opIds);
  return rows.map((r) => operasyonRowToDto(r, makineMap.get(r.id) ?? []));
}

export const listUrunler: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() },
      });
    }

    const { items, total } = await repoList(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send(items.map(rowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_urunler_failed');
    return sendInternalError(reply);
  }
};

export const getUrun: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }

    const [operasyonlar, birimDonusumleri] = await Promise.all([
      repoListOperasyonlar(id),
      repoListBirimDonusumleri(id),
    ]);

    return reply.send({
      ...rowToDto(row),
      operasyonlar: await enrichOperasyonlar(operasyonlar),
      birimDonusumleri: birimDonusumleri.map(birimDonusumRowToDto),
    });
  } catch (error) {
    req.log.error({ error }, 'get_urun_failed');
    return sendInternalError(reply);
  }
};

export const createUrun: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() },
      });
    }

    const row = await repoCreate(parsed.data);

    const [operasyonlar, birimDonusumleri] = await Promise.all([
      repoListOperasyonlar(row.id),
      repoListBirimDonusumleri(row.id),
    ]);

    return reply.code(201).send({
      ...rowToDto(row),
      operasyonlar: await enrichOperasyonlar(operasyonlar),
      birimDonusumleri: birimDonusumleri.map(birimDonusumRowToDto),
    });
  } catch (error: unknown) {
    req.log.error({ error }, 'create_urun_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'urun_kodu_zaten_var' } });
    }
    return sendInternalError(reply);
  }
};

export const updateUrun: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() },
      });
    }

    const row = await repoUpdate(id, parsed.data);
    if (!row) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }

    const [operasyonlar, birimDonusumleri] = await Promise.all([
      repoListOperasyonlar(id),
      repoListBirimDonusumleri(id),
    ]);

    return reply.send({
      ...rowToDto(row),
      operasyonlar: await enrichOperasyonlar(operasyonlar),
      birimDonusumleri: birimDonusumleri.map(birimDonusumRowToDto),
    });
  } catch (error: unknown) {
    req.log.error({ error }, 'update_urun_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'urun_kodu_zaten_var' } });
    }
    return sendInternalError(reply);
  }
};

export const deleteUrun: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_urun_failed');
    return sendInternalError(reply);
  }
};

// -- Operasyonlar --

export const listOperasyonlar: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const rows = await repoListOperasyonlar(id);
    return reply.send(await enrichOperasyonlar(rows));
  } catch (error) {
    req.log.error({ error }, 'list_operasyonlar_failed');
    return sendInternalError(reply);
  }
};

export const patchOperasyon: RouteHandler = async (req, reply) => {
  try {
    const { opId } = req.params as { opId: string };
    const parsed = operasyonPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() },
      });
    }

    const row = await repoPatchOperasyon(opId, parsed.data);
    if (!row) {
      return reply.code(404).send({ error: { message: 'operasyon_bulunamadi' } });
    }
    const enriched = await enrichOperasyonlar([row]);
    return reply.send(enriched[0]);
  } catch (error) {
    req.log.error({ error }, 'patch_operasyon_failed');
    return sendInternalError(reply);
  }
};

// -- Recete (ürün bazlı) --

const receteItemSchema = z.object({
  urunId: z.string().min(1),
  miktar: z.coerce.number().positive(),
  fireOrani: z.coerce.number().min(0).max(100).default(0),
  sira: z.coerce.number().int().min(0).default(0),
});

const saveReceteSchema = z.object({
  items: z.array(receteItemSchema).min(1),
});

export const getUrunRecete: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const detail = await repoGetReceteByUrunId(id);
    if (!detail) {
      return reply.send({ recete: null, items: [] });
    }

    const dto = receteRowToDto(detail.recete);
    dto.items = detail.items.map(receteKalemRowToDto);
    return reply.send(dto);
  } catch (error) {
    req.log.error({ error }, 'get_urun_recete_failed');
    return sendInternalError(reply);
  }
};

export const saveUrunRecete: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };

    // Verify product exists
    const urun = await repoGetById(id);
    if (!urun) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }

    const parsed = saveReceteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() },
      });
    }

    // Check if recete already exists for this product
    const existing = await repoGetReceteByUrunId(id);

    let detail;
    if (existing) {
      // Update existing recete
      detail = await repoUpdateRecete(existing.recete.id, {
        items: parsed.data.items,
      });
    } else {
      // Create new recete
      detail = await repoCreateRecete({
        kod: `RCT-${urun.kod}`,
        ad: `${urun.ad} Reçetesi`,
        urunId: id,
        hedefMiktar: 1,
        items: parsed.data.items,
      });
    }

    if (!detail) {
      return sendInternalError(reply);
    }

    const dto = receteRowToDto(detail.recete);
    dto.items = detail.items.map(receteKalemRowToDto);
    return reply.send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'save_urun_recete_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'recete_kodu_zaten_var' } });
    }
    return sendInternalError(reply);
  }
};

export const deleteUrunRecete: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const existing = await repoGetReceteByUrunId(id);
    if (!existing) {
      return reply.code(404).send({ error: { message: 'recete_bulunamadi' } });
    }
    await repoDeleteRecete(existing.recete.id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_urun_recete_failed');
    return sendInternalError(reply);
  }
};
