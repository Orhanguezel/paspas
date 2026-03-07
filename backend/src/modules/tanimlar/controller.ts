import type { FastifyReply, RouteHandler } from 'fastify';

import { kalipRowToDto, tatilRowToDto, vardiyaRowToDto, durusNedeniRowToDto } from './schema';
import {
  repoCreateKalip,
  repoCreateTatil,
  repoDeleteKalip,
  repoDeleteTatil,
  repoGetKalipById,
  repoGetTatilById,
  repoListKaliplar,
  repoListMakineler,
  repoListTatiller,
  repoListUyumluMakineler,
  repoSetUyumluMakineler,
  repoUpdateKalip,
  repoUpdateTatil,
  repoListVardiyalar,
  repoGetVardiyaById,
  repoCreateVardiya,
  repoUpdateVardiya,
  repoDeleteVardiya,
  repoListDurusNedenleri,
  repoGetDurusNedeniById,
  repoCreateDurusNedeni,
  repoUpdateDurusNedeni,
  repoDeleteDurusNedeni,
} from './repository';
import {
  createKalipSchema,
  createTatilSchema,
  patchKalipSchema,
  patchTatilSchema,
  setKalipUyumluMakinelerSchema,
  createVardiyaSchema,
  patchVardiyaSchema,
  createDurusNedeniSchema,
  patchDurusNedeniSchema,
} from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listMakinelerForTanim: RouteHandler = async (req, reply) => {
  try {
    const rows = await repoListMakineler();
    return reply.send(rows.map((row) => ({ id: row.id, kod: row.kod, ad: row.ad, durum: row.durum, isActive: row.is_active === 1 })));
  } catch (error) {
    req.log.error({ error }, 'list_makineler_for_tanim_failed');
    return sendInternalError(reply);
  }
};

export const listUyumluMakineler: RouteHandler = async (req, reply) => {
  try {
    const { kalipId } = req.params as { kalipId: string };
    const rows = await repoListUyumluMakineler(kalipId);
    return reply.send(rows);
  } catch (error) {
    req.log.error({ error }, 'list_uyumlu_makineler_failed');
    return sendInternalError(reply);
  }
};

export const setUyumluMakineler: RouteHandler = async (req, reply) => {
  try {
    const { kalipId } = req.params as { kalipId: string };
    const parsed = setKalipUyumluMakinelerSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const kalip = await repoGetKalipById(kalipId);
    if (!kalip) return reply.code(404).send({ error: { message: 'kalip_bulunamadi' } });
    return reply.send(await repoSetUyumluMakineler(kalipId, parsed.data));
  } catch (error) {
    req.log.error({ error }, 'set_uyumlu_makineler_failed');
    return sendInternalError(reply);
  }
};

export const listKaliplar: RouteHandler = async (req, reply) => {
  try {
    return reply.send((await repoListKaliplar()).map(kalipRowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_kaliplar_failed');
    return sendInternalError(reply);
  }
};

export const getKalip: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetKalipById(id);
    if (!row) return reply.code(404).send({ error: { message: 'kalip_bulunamadi' } });
    return reply.send(kalipRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_kalip_failed');
    return sendInternalError(reply);
  }
};

export const createKalip: RouteHandler = async (req, reply) => {
  try {
    const parsed = createKalipSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    return reply.code(201).send(kalipRowToDto(await repoCreateKalip(parsed.data)));
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'kalip_kodu_zaten_var' } });
    req.log.error({ error }, 'create_kalip_failed');
    return sendInternalError(reply);
  }
};

export const updateKalip: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchKalipSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdateKalip(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'kalip_bulunamadi' } });
    return reply.send(kalipRowToDto(row));
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'kalip_kodu_zaten_var' } });
    req.log.error({ error }, 'update_kalip_failed');
    return sendInternalError(reply);
  }
};

export const deleteKalip: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteKalip(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_kalip_failed');
    return sendInternalError(reply);
  }
};

export const listTatiller: RouteHandler = async (req, reply) => {
  try {
    return reply.send((await repoListTatiller()).map(tatilRowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_tatiller_failed');
    return sendInternalError(reply);
  }
};

export const getTatil: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetTatilById(id);
    if (!row) return reply.code(404).send({ error: { message: 'tatil_bulunamadi' } });
    return reply.send(tatilRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_tatil_failed');
    return sendInternalError(reply);
  }
};

export const createTatil: RouteHandler = async (req, reply) => {
  try {
    const parsed = createTatilSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    return reply.code(201).send(tatilRowToDto(await repoCreateTatil(parsed.data)));
  } catch (error) {
    req.log.error({ error }, 'create_tatil_failed');
    return sendInternalError(reply);
  }
};

export const updateTatil: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchTatilSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdateTatil(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'tatil_bulunamadi' } });
    return reply.send(tatilRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'update_tatil_failed');
    return sendInternalError(reply);
  }
};

export const deleteTatil: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteTatil(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_tatil_failed');
    return sendInternalError(reply);
  }
};

// ── Vardiyalar ────────────────────────────────────────────────────────

export const listVardiyalar: RouteHandler = async (req, reply) => {
  try {
    return reply.send((await repoListVardiyalar()).map(vardiyaRowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_vardiyalar_failed');
    return sendInternalError(reply);
  }
};

export const getVardiya: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetVardiyaById(id);
    if (!row) return reply.code(404).send({ error: { message: 'vardiya_bulunamadi' } });
    return reply.send(vardiyaRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_vardiya_failed');
    return sendInternalError(reply);
  }
};

export const createVardiya: RouteHandler = async (req, reply) => {
  try {
    const parsed = createVardiyaSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    return reply.code(201).send(vardiyaRowToDto(await repoCreateVardiya(parsed.data)));
  } catch (error) {
    req.log.error({ error }, 'create_vardiya_failed');
    return sendInternalError(reply);
  }
};

export const updateVardiya: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchVardiyaSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdateVardiya(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'vardiya_bulunamadi' } });
    return reply.send(vardiyaRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'update_vardiya_failed');
    return sendInternalError(reply);
  }
};

export const deleteVardiya: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteVardiya(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_vardiya_failed');
    return sendInternalError(reply);
  }
};

// ── Duruş Nedenleri ─────────────────────────────────────────────────

export const listDurusNedenleri: RouteHandler = async (req, reply) => {
  try {
    return reply.send((await repoListDurusNedenleri()).map(durusNedeniRowToDto));
  } catch (error) {
    req.log.error({ error }, 'list_durus_nedenleri_failed');
    return sendInternalError(reply);
  }
};

export const getDurusNedeni: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetDurusNedeniById(id);
    if (!row) return reply.code(404).send({ error: { message: 'durus_nedeni_bulunamadi' } });
    return reply.send(durusNedeniRowToDto(row));
  } catch (error) {
    req.log.error({ error }, 'get_durus_nedeni_failed');
    return sendInternalError(reply);
  }
};

export const createDurusNedeni: RouteHandler = async (req, reply) => {
  try {
    const parsed = createDurusNedeniSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    return reply.code(201).send(durusNedeniRowToDto(await repoCreateDurusNedeni(parsed.data)));
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'durus_nedeni_kodu_zaten_var' } });
    req.log.error({ error }, 'create_durus_nedeni_failed');
    return sendInternalError(reply);
  }
};

export const updateDurusNedeni: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchDurusNedeniSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    const row = await repoUpdateDurusNedeni(id, parsed.data);
    if (!row) return reply.code(404).send({ error: { message: 'durus_nedeni_bulunamadi' } });
    return reply.send(durusNedeniRowToDto(row));
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'durus_nedeni_kodu_zaten_var' } });
    req.log.error({ error }, 'update_durus_nedeni_failed');
    return sendInternalError(reply);
  }
};

export const deleteDurusNedeni: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteDurusNedeni(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_durus_nedeni_failed');
    return sendInternalError(reply);
  }
};
