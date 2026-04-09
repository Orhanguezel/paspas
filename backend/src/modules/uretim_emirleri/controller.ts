import type { FastifyReply, RouteHandler } from 'fastify';

import { rowToDto } from './schema';
import { repoCreate, repoDelete, repoGetById, repoGetHammaddeYeterlilik, repoGetNextEmirNo, repoGetOperasyonlar, repoGetUretimKarsilastirma, repoList, repoListAdaylar, repoUpdate } from './repository';
import { checkHammaddeYeterlilik } from './hammadde_service';
import { createSchema, listQuerySchema, patchSchema } from './validation';
import { getSiparisIdsByUretimEmriId, refreshSiparisDurum } from '@/modules/satis_siparisleri/repository';
import { repoKuyrukCikar } from '@/modules/makine_havuzu/repository';
import { db } from '@/db/client';
import { and, eq, sql } from 'drizzle-orm';
import { makineKuyrugu } from '@/modules/makine_havuzu/schema';
import { operatorGunlukKayitlari } from '@/modules/operator/schema';
import { uretimEmriOperasyonlari, uretimEmirleri } from './schema';

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
    const { row, hammaddeUyarilari } = await repoCreate(parsed.data);
    const dto = rowToDto(row);
    return reply.code(201).send({ ...dto, hammaddeUyarilari });
  } catch (error: unknown) {
    req.log.error({ error }, 'create_uretim_emri_failed');
    const err = error as { code?: string; message?: string; detail?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'emir_no_zaten_var' } });
    if (err.message === 'urun_uyumsuzlugu') return reply.code(400).send({ error: { message: err.message, detail: err.detail } });
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
    const err = error as { code?: string; message?: string; detail?: string };
    if (err.code === 'ER_DUP_ENTRY') return reply.code(409).send({ error: { message: 'emir_no_zaten_var' } });
    if (err.message === 'urun_uyumsuzlugu') return reply.code(400).send({ error: { message: err.message, detail: err.detail } });
    if (err.message === 'uretim_emri_tamamlandi') return reply.code(409).send({ error: { message: err.message, detail: err.detail } });
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

/** GET /admin/uretim-emirleri/:id/hammadde-kontrol */
export const checkHammadde: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const uyarilar = await checkHammaddeYeterlilik(id);
    return reply.send({ yeterli: uyarilar.length === 0, uyarilar });
  } catch (error) {
    req.log.error({ error }, 'check_hammadde_failed');
    return sendInternalError(reply);
  }
};

/** GET /admin/uretim-emirleri/:id/uretim-karsilastirma */
export const getUretimKarsilastirma: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const result = await repoGetUretimKarsilastirma(id);
    if (!result) return reply.code(404).send({ error: { message: 'uretim_emri_bulunamadi' } });
    return reply.send(result);
  } catch (error) {
    req.log.error({ error }, 'get_uretim_karsilastirma_failed');
    return sendInternalError(reply);
  }
};

/** GET /admin/uretim-emirleri/:id/hammadde-yeterlilik */
export const getHammaddeYeterlilik: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const result = await repoGetHammaddeYeterlilik(id);
    if (!result) return reply.code(404).send({ error: { message: 'uretim_emri_bulunamadi' } });
    return reply.send(result);
  } catch (error) {
    req.log.error({ error }, 'get_hammadde_yeterlilik_failed');
    return sendInternalError(reply);
  }
};

export const deleteUretimEmri: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    // Collect linked sipariş IDs before deletion (junction table will be cleared)
    const siparisIds = await getSiparisIdsByUretimEmriId(id);
    await repoDelete(id);
    // Refresh linked sipariş durums (unlocks if no more UE linked)
    for (const sid of siparisIds) {
      await refreshSiparisDurum(sid);
    }
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

/** POST /uretim-emirleri/:id/atama-geri-al — Tum makine atamalarini geri al */
export const atamaGeriAl: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const emir = await repoGetById(id);
    if (!emir) return reply.code(404).send({ error: { message: 'uretim_emri_bulunamadi' } });

    // Sadece planlandi veya makineye_atandi durumunda izin ver (uretim baslamamisken)
    if (!['planlandi', 'makineye_atandi', 'atanmamis'].includes(emir.durum)) {
      return reply.code(409).send({
        error: { message: 'atama_geri_alinamaz', detail: 'Üretim başlamış emirlerin ataması geri alınamaz.' },
      });
    }

    // Kuyruk kayitlarini bul ve cikar
    const kuyrukRows = await db
      .select({ id: makineKuyrugu.id, durum: makineKuyrugu.durum })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.uretim_emri_id, id));

    // Calisiyor veya duraklatildi durumundaki kuyruk kaydi varsa reddet
    const aktif = kuyrukRows.find((k) => k.durum === 'calisiyor' || k.durum === 'duraklatildi');
    if (aktif) {
      return reply.code(409).send({
        error: { message: 'aktif_uretim_var', detail: 'Üretim devam ediyor, önce durdurulmalı.' },
      });
    }

    for (const kq of kuyrukRows) {
      await repoKuyrukCikar(kq.id);
    }

    // Ghost start log'larini temizle: net_miktar=0 olan operator kayitlari (gercek uretim yok)
    await db
      .delete(operatorGunlukKayitlari)
      .where(
        and(
          eq(operatorGunlukKayitlari.uretim_emri_id, id),
          sql`${operatorGunlukKayitlari.net_miktar} = 0`,
          sql`${operatorGunlukKayitlari.ek_uretim_miktari} = 0`,
        ),
      );

    // Emir operasyonlarini sifirla: gercek_baslangic kalirsa delete guard "baslamis" sayar
    await db
      .update(uretimEmriOperasyonlari)
      .set({ durum: 'bekliyor', gercek_baslangic: null, gercek_bitis: null, makine_id: null })
      .where(
        and(
          eq(uretimEmriOperasyonlari.uretim_emri_id, id),
          sql`${uretimEmriOperasyonlari.uretilen_miktar} = 0`,
          sql`${uretimEmriOperasyonlari.fire_miktar} = 0`,
        ),
      );

    // Gercek uretim yoksa emir durumunu sifirla: 'uretimde' kalirsa delete guard bloklar
    await db
      .update(uretimEmirleri)
      .set({ durum: 'atanmamis', baslangic_tarihi: null })
      .where(
        and(
          eq(uretimEmirleri.id, id),
          sql`${uretimEmirleri.durum} = 'uretimde'`,
          // Sadece gercek uretim yoksa sifirla
          sql`NOT EXISTS (
            SELECT 1 FROM operator_gunluk_kayitlari ogk
            WHERE ogk.uretim_emri_id = ${uretimEmirleri.id}
              AND (ogk.net_miktar > 0 OR ogk.ek_uretim_miktari > 0)
          )`,
        ),
      );

    // Siparis durumlarini yenile
    const siparisIds = await getSiparisIdsByUretimEmriId(id);
    for (const sid of siparisIds) await refreshSiparisDurum(sid);

    return reply.send({ message: 'Atama geri alındı.', kuyruktanCikarilan: kuyrukRows.length });
  } catch (error) {
    req.log.error({ error }, 'atama_geri_al_failed');
    return sendInternalError(reply);
  }
};
