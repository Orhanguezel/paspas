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
  repoListIslemler,
  repoUpdate,
} from './repository';
import { createSchema, islemlerQuerySchema, listQuerySchema, patchSchema, uretimeAktarSchema } from './validation';
import { repoCreate as ueRepoCreate, repoGetNextEmirNo } from '@/modules/uretim_emirleri/repository';
import { db } from '@/db/client';
import { siparisKalemleri } from './schema';
import { urunler } from '@/modules/urunler/schema';
import { musteriler } from '@/modules/musteriler/schema';
import { satisSiparisleri } from './schema';
import { eq, inArray } from 'drizzle-orm';

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
        toplamFiyat: 0,
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

export const listSiparisIslemleri: RouteHandler = async (req, reply) => {
  try {
    const parsed = islemlerQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() } });
    }
    const { items, total } = await repoListIslemler(parsed.data);
    reply.header('x-total-count', String(total));
    return reply.send(items);
  } catch (error) {
    req.log.error({ error }, 'list_siparis_islemleri_failed');
    return sendInternalError(reply);
  }
};

/** POST /satis-siparisleri/islemler/uretime-aktar */
export const uretimeAktar: RouteHandler = async (req, reply) => {
  try {
    const parsed = uretimeAktarSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'gecersiz_body', issues: parsed.error.flatten() } });
    }
    const { kalemIds, birlestir } = parsed.data;

    // Kalemleri al — urun, musteri bilgileriyle
    const kalemRows = await db
      .select({
        id: siparisKalemleri.id,
        urunId: siparisKalemleri.urun_id,
        miktar: siparisKalemleri.miktar,
        uretimDurumu: siparisKalemleri.uretim_durumu,
        siparisId: siparisKalemleri.siparis_id,
        musteriAd: musteriler.ad,
      })
      .from(siparisKalemleri)
      .innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
      .innerJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
      .where(inArray(siparisKalemleri.id, kalemIds));

    // Sadece beklemede olanlar aktarilabilir — digerleri sessizce atlanir
    const aktarilacaklar = kalemRows.filter((k) => k.uretimDurumu === 'beklemede');
    const atlananSayisi = kalemRows.length - aktarilacaklar.length;

    if (aktarilacaklar.length === 0) {
      return reply.code(409).send({
        error: { message: 'kalem_zaten_uretimde', detail: 'Seçili kalemlerin tamamı zaten üretime aktarılmış.' },
      });
    }

    const olusturulanEmirler: string[] = [];

    if (birlestir) {
      // Ayni urune sahip kalemleri grupla
      const gruplar = new Map<string, typeof aktarilacaklar>();
      for (const k of aktarilacaklar) {
        if (!gruplar.has(k.urunId)) gruplar.set(k.urunId, []);
        gruplar.get(k.urunId)!.push(k);
      }

      for (const [urunId, kalemleri] of gruplar) {
        const toplamMiktar = kalemleri.reduce((acc, k) => acc + Number(k.miktar), 0);
        const musteriAdlari = [...new Set(kalemleri.map((k) => k.musteriAd))];
        const emirNo = await repoGetNextEmirNo();
        const result = await ueRepoCreate({
          emirNo,
          urunId,
          planlananMiktar: toplamMiktar,
          uretilenMiktar: 0,
          durum: 'atanmamis',
          siparisKalemIds: kalemleri.map((k) => k.id),
          musteriOzet: musteriAdlari.length === 1 ? musteriAdlari[0] : `${musteriAdlari.length} müşteri`,
          musteriDetay: musteriAdlari.join(', '),
        });
        olusturulanEmirler.push(result.row.emir_no);
      }
    } else {
      // Her kalem icin ayri UE
      for (const k of aktarilacaklar) {
        const emirNo = await repoGetNextEmirNo();
        const result = await ueRepoCreate({
          emirNo,
          urunId: k.urunId,
          planlananMiktar: Number(k.miktar),
          uretilenMiktar: 0,
          durum: 'atanmamis',
          siparisKalemIds: [k.id],
          musteriOzet: k.musteriAd,
        });
        olusturulanEmirler.push(result.row.emir_no);
      }
    }

    const atlamaUyarisi = atlananSayisi > 0
      ? ` (${atlananSayisi} kalem zaten üretime aktarılmıştı, atlandı)`
      : '';

    return reply.code(201).send({
      message: `${olusturulanEmirler.length} üretim emri oluşturuldu.${atlamaUyarisi}`,
      emirler: olusturulanEmirler,
      atlananSayisi,
    });
  } catch (error) {
    req.log.error({ error }, 'uretime_aktar_failed');
    return sendInternalError(reply);
  }
};
