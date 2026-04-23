import type { FastifyReply, RouteHandler } from 'fastify';

import {
  listMakineKuyruguQuerySchema,
  uretimBaslatBodySchema,
  uretimBitirBodySchema,
  duraklatBodySchema,
  devamEtBodySchema,
  vardiyaBasiBodySchema,
  vardiyaSonuBodySchema,
  gunlukUretimBodySchema,
  sevkiyatBodySchema,
  malKabulBodySchema,
  listGunlukGirislerQuerySchema,
} from './validation';
import {
  repoListMakineKuyrugu,
  repoUretimBaslat,
  repoUretimBitir,
  repoDuraklat,
  repoDevamEt,
  repoVardiyaBasi,
  repoVardiyaSonu,
  repoGunlukUretimGir,
  repoGetAcikVardiyalar,
  repoSevkiyatOlustur,
  repoMalKabul,
  repoListGunlukGirisler,
  repoListDuruslar,
} from './repository';

function getOperatorUserId(req: unknown): string | null {
  const r = req as { user?: { sub?: string; id?: string } };
  return r.user?.sub ?? r.user?.id ?? null;
}

function sendError(reply: FastifyReply, code: number, message: string) {
  return reply.code(code).send({ error: { message } });
}

function extractError(error: unknown): { msg: string; stack?: string } {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  return { msg, stack };
}

// -- Makine Kuyrugu --

export const listMakineKuyrugu: RouteHandler = async (req, reply) => {
  try {
    const parsed = listMakineKuyruguQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_sorgu_parametreleri');
    const { items, total } = await repoListMakineKuyrugu(parsed.data);
    reply.header('x-total-count', String(total));
    return items;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'list_makine_kuyrugu_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};

// -- Uretim Baslat --

export const uretimBaslat: RouteHandler = async (req, reply) => {
  try {
    const parsed = uretimBaslatBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoUretimBaslat(parsed.data, getOperatorUserId(req));
    return result;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'uretim_baslat_failed');
    if (msg === 'kuyruk_kaydi_bulunamadi') return sendError(reply, 404, 'kuyruk_kaydi_bulunamadi');
    if (msg === 'kuyruk_zaten_baslatilmis') return sendError(reply, 409, 'kuyruk_zaten_baslatilmis');
    if (msg === 'sadece_bekliyor_baslatilabilir') return sendError(reply, 409, msg);
    if (msg === 'makinede_aktif_is_var') return sendError(reply, 409, msg);
    if (msg === 'makine_bugun_calismiyor') return sendError(reply, 409, 'makine_bugun_calismiyor');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Uretim Bitir --

export const uretimBitir: RouteHandler = async (req, reply) => {
  try {
    const parsed = uretimBitirBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoUretimBitir(parsed.data, getOperatorUserId(req));
    return result;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'uretim_bitir_failed');
    if (msg === 'kuyruk_kaydi_bulunamadi') return sendError(reply, 404, 'kuyruk_kaydi_bulunamadi');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Duraklat --

export const duraklat: RouteHandler = async (req, reply) => {
  try {
    const parsed = duraklatBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoDuraklat(parsed.data, getOperatorUserId(req));
    return result;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'duraklat_failed');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Devam Et --

export const devamEt: RouteHandler = async (req, reply) => {
  try {
    const parsed = devamEtBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoDevamEt(parsed.data, getOperatorUserId(req));
    return result;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'devam_et_failed');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Vardiya Basi --

export const vardiyaBasi: RouteHandler = async (req, reply) => {
  try {
    const parsed = vardiyaBasiBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoVardiyaBasi(parsed.data, getOperatorUserId(req));
    return reply.code(201).send(result);
  } catch (error) {
    const { msg, stack } = extractError(error);
    if (msg === 'vardiya_saati_gecersiz') return sendError(reply, 409, 'vardiya_saati_gecersiz');
    if (msg === 'acik_vardiya_zaten_var') return sendError(reply, 409, 'acik_vardiya_zaten_var');
    if (msg === 'makine_bugun_calismiyor') return sendError(reply, 409, 'makine_bugun_calismiyor');
    req.log.error({ error: msg, stack }, 'vardiya_basi_failed');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Acik Vardiyalar --

export const getAcikVardiyalar: RouteHandler = async (req, reply) => {
  try {
    const items = await repoGetAcikVardiyalar();
    return items;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'get_acik_vardiyalar_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};

// -- Vardiya Sonu --

export const vardiyaSonu: RouteHandler = async (req, reply) => {
  try {
    const parsed = vardiyaSonuBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoVardiyaSonu(parsed.data, getOperatorUserId(req));
    if (!result) return sendError(reply, 404, 'acik_vardiya_bulunamadi');
    return result;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'vardiya_sonu_failed');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Gunluk Uretim Girisi --

export const gunlukUretimGir: RouteHandler = async (req, reply) => {
  try {
    const parsed = gunlukUretimBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoGunlukUretimGir(parsed.data, getOperatorUserId(req));
    return reply.code(201).send(result);
  } catch (error) {
    const { msg, stack } = extractError(error);
    if (msg === 'aktif_uretim_bulunamadi') return sendError(reply, 404, msg);
    if (msg === 'makine_bugun_calismiyor') return sendError(reply, 409, msg);
    req.log.error({ error: msg, stack }, 'gunluk_uretim_gir_failed');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Sevkiyat --

export const sevkiyatOlustur: RouteHandler = async (req, reply) => {
  try {
    const parsed = sevkiyatBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoSevkiyatOlustur(parsed.data, getOperatorUserId(req));
    return reply.code(201).send(result);
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'sevkiyat_olustur_failed');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Mal Kabul --

export const malKabul: RouteHandler = async (req, reply) => {
  try {
    const parsed = malKabulBodySchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_istek_govdesi');
    const result = await repoMalKabul(parsed.data, getOperatorUserId(req));
    return reply.code(201).send(result);
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'mal_kabul_failed');
    return sendError(reply, 500, msg || 'sunucu_hatasi');
  }
};

// -- Gunluk Girisler --

export const listGunlukGirisler: RouteHandler = async (req, reply) => {
  try {
    const parsed = listGunlukGirislerQuerySchema.safeParse(req.query);
    if (!parsed.success) return sendError(reply, 400, 'gecersiz_sorgu_parametreleri');
    const { items, total } = await repoListGunlukGirisler(parsed.data);
    reply.header('x-total-count', String(total));
    return items;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'list_gunluk_girisler_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};

// -- Durus Listesi --

export const listDuruslar: RouteHandler = async (req, reply) => {
  try {
    const { makineId, limit, offset } = req.query as { makineId?: string; limit?: string; offset?: string };
    const { items, total } = await repoListDuruslar(makineId, Number(limit) || 50, Number(offset) || 0);
    reply.header('x-total-count', String(total));
    return items;
  } catch (error) {
    const { msg, stack } = extractError(error);
    req.log.error({ error: msg, stack }, 'list_duruslar_failed');
    return sendError(reply, 500, 'sunucu_hatasi');
  }
};
