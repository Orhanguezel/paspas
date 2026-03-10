import type { FastifyReply, RouteHandler } from 'fastify';

import { computeSevkDurumu, computeUretimDurumu, siparisKalemRowToDto, siparisRowToDto } from './schema';
import {
  repoCreate,
  repoDelete,
  repoGetById,
  repoGetKalemSevkMiktarlari,
  repoGetKalemUretilenMiktarlari,
  repoGetNextSiparisNo,
  repoGetSiparisOzetleri,
  repoList,
  repoUpdate,
} from './repository';
import { createSchema, listQuerySchema, patchSchema } from './validation';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

export const listSatisSiparisleri: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    }
    const { items, total } = await repoList(parsed.data);
    const ozetler = await repoGetSiparisOzetleri(items.map((item) => item.id));
    reply.header('x-total-count', String(total));
    return reply.send(items.map((item) => {
      const ozet = ozetler.get(item.id) ?? {
        kalemSayisi: 0,
        toplamMiktar: 0,
        uretimeAktarilanKalemSayisi: 0,
        uretimPlanlananMiktar: 0,
        uretimTamamlananMiktar: 0,
        sevkEdilenMiktar: 0,
        kilitli: false,
      };
      return {
        ...siparisRowToDto(item),
        ...ozet,
        uretimDurumu: computeUretimDurumu(ozet),
        sevkDurumu: computeSevkDurumu(ozet),
      };
    }));
  } catch (error) {
    req.log.error({ error }, 'list_satis_siparisleri_failed');
    return sendInternalError(reply);
  }
};

export const getSatisSiparisi: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const detail = await repoGetById(id);
    if (!detail) return reply.code(404).send({ error: { message: 'satis_siparisi_bulunamadi' } });
    const dto = siparisRowToDto(detail.siparis);
    const ozet = (await repoGetSiparisOzetleri([id])).get(id) ?? {
      kalemSayisi: 0, toplamMiktar: 0, uretimeAktarilanKalemSayisi: 0,
      uretimPlanlananMiktar: 0, uretimTamamlananMiktar: 0, sevkEdilenMiktar: 0, kilitli: false,
    };
    Object.assign(dto, ozet, {
      uretimDurumu: computeUretimDurumu(ozet),
      sevkDurumu: computeSevkDurumu(ozet),
    });
    const [kalemSevkMap, kalemUretilenMap] = await Promise.all([
      repoGetKalemSevkMiktarlari(id),
      repoGetKalemUretilenMiktarlari(id),
    ]);
    dto.items = detail.items.map((item) => ({
      ...siparisKalemRowToDto(item),
      sevkEdilenMiktar: kalemSevkMap.get(item.id) ?? 0,
      uretilenMiktar: kalemUretilenMap.get(item.id) ?? 0,
    }));
    return reply.send(dto);
  } catch (error) {
    req.log.error({ error }, 'get_satis_siparisi_failed');
    return sendInternalError(reply);
  }
};

export const getNextSiparisNo: RouteHandler = async (req, reply) => {
  try {
    const nextNo = await repoGetNextSiparisNo();
    return reply.send({ siparisNo: nextNo });
  } catch (error) {
    req.log.error({ error }, 'get_next_siparis_no_failed');
    return sendInternalError(reply);
  }
};

export const createSatisSiparisi: RouteHandler = async (req, reply) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    }
    const detail = await repoCreate(parsed.data);
    const dto = siparisRowToDto(detail.siparis);
    const ozet = (await repoGetSiparisOzetleri([dto.id])).get(dto.id) ?? {
      kalemSayisi: 0, toplamMiktar: 0, uretimeAktarilanKalemSayisi: 0,
      uretimPlanlananMiktar: 0, uretimTamamlananMiktar: 0, sevkEdilenMiktar: 0, kilitli: false,
    };
    Object.assign(dto, ozet, {
      uretimDurumu: computeUretimDurumu(ozet),
      sevkDurumu: computeSevkDurumu(ozet),
    });
    dto.items = detail.items.map((item) => ({ ...siparisKalemRowToDto(item), sevkEdilenMiktar: 0 }));
    return reply.code(201).send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'create_satis_siparisi_failed');
    const err = error as { code?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'siparis_no_zaten_var' } });
    return sendInternalError(reply);
  }
};

export const updateSatisSiparisi: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() } });
    }
    const detail = await repoUpdate(id, parsed.data);
    if (!detail) return reply.code(404).send({ error: { message: 'satis_siparisi_bulunamadi' } });
    const dto = siparisRowToDto(detail.siparis);
    const ozet = (await repoGetSiparisOzetleri([dto.id])).get(dto.id) ?? {
      kalemSayisi: 0, toplamMiktar: 0, uretimeAktarilanKalemSayisi: 0,
      uretimPlanlananMiktar: 0, uretimTamamlananMiktar: 0, sevkEdilenMiktar: 0, kilitli: false,
    };
    Object.assign(dto, ozet, {
      uretimDurumu: computeUretimDurumu(ozet),
      sevkDurumu: computeSevkDurumu(ozet),
    });
    const kalemSevkMap = await repoGetKalemSevkMiktarlari(dto.id);
    dto.items = detail.items.map((item) => ({
      ...siparisKalemRowToDto(item),
      sevkEdilenMiktar: kalemSevkMap.get(item.id) ?? 0,
    }));
    return reply.send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'update_satis_siparisi_failed');
    const err = error as { code?: string; message?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'siparis_no_zaten_var' } });
    if (err.message === 'siparis_kilitli') return reply.code(409).send({ error: { message: 'siparis_kilitli' } });
    return sendInternalError(reply);
  }
};

export const deleteSatisSiparisi: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_satis_siparisi_failed');
    const err = error as { message?: string };
    if (err.message === 'siparis_kilitli') return reply.code(409).send({ error: { message: 'siparis_kilitli' } });
    return sendInternalError(reply);
  }
};
