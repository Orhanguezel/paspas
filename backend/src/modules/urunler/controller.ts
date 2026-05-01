import { randomUUID } from 'node:crypto';

import type { FastifyReply, RouteHandler } from 'fastify';
import { and, eq, inArray } from 'drizzle-orm';

import { rowToDto, operasyonRowToDto, birimDonusumRowToDto, medyaRowToDto } from './schema';
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
  repoListMedya,
  repoSaveMedya,
  repoGetNextCode,
  repoGetDependentUrunIds,
} from './repository';
import {
  repoGetByUrunId as repoGetReceteByUrunId,
  repoCreate as repoCreateRecete,
  repoUpdate as repoUpdateRecete,
  repoDelete as repoDeleteRecete,
} from '@/modules/receteler/repository';
import { createSchema, createUrunFullSchema, listQuerySchema, patchSchema, operasyonPatchSchema, medyaSaveSchema } from './validation';
import type { PatchBody } from './validation';
import {
  createUrunWithYariMamuller,
  KategoriTutarsizligiError,
  OperasyonelYmTutarsizligiError,
  syncAsilUrunOperasyonlariFromRecete,
  syncBagliAsilUrunOperasyonlariFromYariMamul,
  syncYariMamulIsimleri,
} from './service';
import { z } from 'zod';
import { db } from '@/db/client';
import { categories } from '@/modules/categories/schema';
import { subCategories } from '@/modules/subCategories/schema';
import { urunler, urunOperasyonlari } from './schema';

function sendInternalError(reply: FastifyReply) {
  return reply.code(500).send({ error: { message: 'sunucu_hatasi' } });
}

import type { UrunOperasyonRow } from './schema';

async function enrichOperasyonlar(rows: UrunOperasyonRow[]) {
  const opIds = rows.map((r) => r.id);
  const makineMap = await repoListOperasyonMakineleri(opIds);
  return rows.map((r) => operasyonRowToDto(r, makineMap.get(r.id) ?? []));
}

async function normalizeUrunGrubuForKategori(kategoriKod: string, urunGrubu?: string | null) {
  const trimmedGroup = urunGrubu?.trim();
  const categoryRow = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.kod, kategoriKod))
    .limit(1);

  const categoryId = categoryRow[0]?.id;
  if (!categoryId) {
    return { error: 'gecersiz_kategori' as const };
  }

  if (!trimmedGroup) {
    return { normalized: undefined as string | undefined };
  }

  const groupRows = await db
    .select({ name: subCategories.name })
    .from(subCategories)
    .where(and(eq(subCategories.category_id, categoryId), eq(subCategories.is_active, true)));

  if (groupRows.length === 0) {
    return { normalized: undefined as string | undefined };
  }

  const matched = groupRows.find((row) => row.name.trim() === trimmedGroup);
  if (!matched) {
    return { error: 'gecersiz_urun_grubu' as const };
  }

  return { normalized: matched.name.trim() };
}

type CategoryBehavior = {
  id: string;
  productionFieldsEnabled: boolean;
  operationTypeRequired: boolean;
  defaultOperationType: string | null;
};

async function getCategoryBehavior(kategoriKod: string): Promise<CategoryBehavior | null> {
  const categoryRows = await db
    .select({
      id: categories.id,
      productionFieldsEnabled: categories.uretim_alanlari_aktif,
      operationTypeRequired: categories.operasyon_tipi_gerekli,
      defaultOperationType: categories.varsayilan_operasyon_tipi,
    })
    .from(categories)
    .where(eq(categories.kod, kategoriKod))
    .limit(1);

  return categoryRows[0] ?? null;
}

function isOperationEnabledForCategory(category: CategoryBehavior | null, tedarikTipi: string) {
  return Boolean(category?.productionFieldsEnabled) && tedarikTipi === 'uretim';
}

function isRecipeEnabledForCategory(category: CategoryBehavior | null) {
  return Boolean(category?.productionFieldsEnabled);
}

function isOperasyonKaynagiKategori(kategoriKod: string) {
  return kategoriKod === 'operasyonel_ym' || kategoriKod === 'yarimamul';
}

function normalizeOperasyonTipiForKategori(
  categoryRow: CategoryBehavior,
  tedarikTipi: string,
  operasyonTipi?: string | null,
) {
  if (!isOperationEnabledForCategory(categoryRow, tedarikTipi) || !categoryRow.operationTypeRequired) {
    return { normalized: null as string | null };
  }

  if (operasyonTipi === 'tek_tarafli' || operasyonTipi === 'cift_tarafli') {
    return { normalized: operasyonTipi };
  }

  return {
    normalized:
      categoryRow.defaultOperationType === 'tek_tarafli' || categoryRow.defaultOperationType === 'cift_tarafli'
        ? categoryRow.defaultOperationType
        : 'tek_tarafli',
  };
}

async function validateReceteItems(items: Array<{ urunId: string }>, currentUrunId: string) {
  const itemIds = Array.from(new Set(items.map((item) => item.urunId).filter(Boolean)));
  if (itemIds.length === 0) return null;

  const rows = await db
    .select({
      id: urunler.id,
      kategori: urunler.kategori,
      recetedeKullanilabilir: categories.recetede_kullanilabilir,
    })
    .from(urunler)
    .leftJoin(categories, eq(categories.kod, urunler.kategori))
    .where(inArray(urunler.id, itemIds));

  if (rows.length !== itemIds.length) {
    return 'gecersiz_recete_malzeme';
  }

  const invalidItem = rows.find(
    (row) => row.id === currentUrunId || (row.kategori !== 'operasyonel_ym' && !row.recetedeKullanilabilir),
  );
  return invalidItem ? 'gecersiz_recete_malzeme' : null;
}

/** GET /admin/urunler/next-code?kategori=hammadde */
export const getNextCode: RouteHandler = async (req, reply) => {
  try {
    const query = req.query as { kategori?: string };
    const kategori = query.kategori ?? 'urun';
    const kod = await repoGetNextCode(kategori);
    return reply.send({ kod });
  } catch (error) {
    req.log.error({ error }, 'get_next_code_failed');
    return sendInternalError(reply);
  }
};

export const listUrunler: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_sorgu_parametreleri', issues: parsed.error.flatten() },
      });
    }

    const { items, total } = await repoList(parsed.data);
    const dependentIds = await repoGetDependentUrunIds(items.map((i) => i.id));
    reply.header('x-total-count', String(total));
    return reply.send(items.map((row) => ({ ...rowToDto(row), silinebilir: !dependentIds.has(row.id) })));
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

    const groupCheck = await normalizeUrunGrubuForKategori(parsed.data.kategori, parsed.data.urunGrubu);
    if (groupCheck.error) {
      return reply.code(400).send({ error: { message: groupCheck.error } });
    }

    const categoryBehavior = await getCategoryBehavior(parsed.data.kategori);
    if (!categoryBehavior?.id) {
      return reply.code(400).send({ error: { message: 'gecersiz_kategori' } });
    }

    const operationTypeCheck = normalizeOperasyonTipiForKategori(
      categoryBehavior,
      parsed.data.tedarikTipi,
      parsed.data.operasyonTipi,
    );

    if (
      !isOperationEnabledForCategory(categoryBehavior, parsed.data.tedarikTipi) &&
      parsed.data.operasyonlar &&
      parsed.data.operasyonlar.length > 0
    ) {
      return reply.code(400).send({ error: { message: 'urun_kategorisi_operasyon_desteklemiyor' } });
    }

    const row = await repoCreate({
      ...parsed.data,
      urunGrubu: groupCheck.normalized,
      operasyonTipi: operationTypeCheck.normalized as "tek_tarafli" | "cift_tarafli" | null | undefined,
    });

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
    const err = error as { code?: string; cause?: { code?: string } };
    if (err.code === 'ER_DUP_ENTRY' || err.cause?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'Bu ürün kodu zaten kullanılıyor.' } });
    }
    return sendInternalError(reply);
  }
};

/** POST /admin/urunler/full — asıl ürün + operasyonel YM(ler) + reçeteleri tek istekte oluşturur */
export const createUrunFull: RouteHandler = async (req, reply) => {
  try {
    const parsed = createUrunFullSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() },
      });
    }

    const groupCheck = await normalizeUrunGrubuForKategori('urun', parsed.data.urunGrubu);
    if (groupCheck.error) {
      return reply.code(400).send({ error: { message: groupCheck.error } });
    }

    const result = await createUrunWithYariMamuller({ ...parsed.data, urunGrubu: groupCheck.normalized ?? undefined });

    return reply.code(201).send({
      urun: rowToDto(result.urun),
      yariMamuller: result.yariMamuller.map(rowToDto),
      asilUrunReceteId: result.asilUrunReceteId,
      yariMamulReceteIds: result.yariMamulReceteIds,
    });
  } catch (error: unknown) {
    if (error instanceof KategoriTutarsizligiError) {
      return reply.code(400).send({ error: { message: error.code, detay: error.detay } });
    }
    const err = error as { code?: string; cause?: { code?: string } };
    if (err.code === 'ER_DUP_ENTRY' || err.cause?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'Bu ürün kodu veya operasyonel YM kodu zaten kullanılıyor.' } });
    }
    req.log.error({ error }, 'create_urun_full_failed');
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

    const existing = await repoGetById(id);
    if (!existing) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }

    const effectiveKategori = parsed.data.kategori ?? existing.kategori;
    const effectiveGroup =
      parsed.data.urunGrubu !== undefined ? parsed.data.urunGrubu : existing.urun_grubu ?? undefined;

    const groupCheck = await normalizeUrunGrubuForKategori(effectiveKategori, effectiveGroup);
    if (groupCheck.error) {
      return reply.code(400).send({ error: { message: groupCheck.error } });
    }

    const categoryBehavior = await getCategoryBehavior(effectiveKategori);
    if (!categoryBehavior?.id) {
      return reply.code(400).send({ error: { message: 'gecersiz_kategori' } });
    }

    const effectiveTedarikTipi = parsed.data.tedarikTipi ?? existing.tedarik_tipi;
    const effectiveOperasyonTipi =
      parsed.data.operasyonTipi !== undefined ? parsed.data.operasyonTipi : existing.operasyon_tipi;
    const operationTypeCheck = normalizeOperasyonTipiForKategori(
      categoryBehavior,
      effectiveTedarikTipi,
      effectiveOperasyonTipi,
    );

    if (
      !isOperationEnabledForCategory(categoryBehavior, effectiveTedarikTipi) &&
      parsed.data.operasyonlar &&
      parsed.data.operasyonlar.length > 0
    ) {
      return reply.code(400).send({ error: { message: 'urun_kategorisi_operasyon_desteklemiyor' } });
    }

    const patchBody: PatchBody = {
      ...parsed.data,
      urunGrubu: groupCheck.normalized,
      operasyonTipi: operationTypeCheck.normalized as "tek_tarafli" | "cift_tarafli" | null | undefined,
    };

    const row = await repoUpdate(id, patchBody);
    if (!row) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }

    // Asıl ürünün adı değiştiyse bağlı yarı mamul/operasyon/reçete adlarını senkronla
    if (row.kategori === 'urun' && parsed.data.ad !== undefined && parsed.data.ad !== existing.ad) {
      await syncYariMamulIsimleri(id, parsed.data.ad);
      const receteDetail = await repoGetReceteByUrunId(id);
      if (row.tedarik_tipi === 'uretim' && receteDetail) {
        await syncAsilUrunOperasyonlariFromRecete(
          id,
          receteDetail.items.map((item) => ({ urunId: item.urun_id, sira: item.sira })),
        );
      }
    }

    if (isOperasyonKaynagiKategori(row.kategori) && row.tedarik_tipi === 'uretim' && parsed.data.operasyonlar !== undefined) {
      await syncBagliAsilUrunOperasyonlariFromYariMamul(id);
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
    if (error instanceof OperasyonelYmTutarsizligiError) {
      return reply.code(400).send({ error: { message: error.code, detay: error.detay } });
    }
    const err = error as { code?: string; cause?: { code?: string } };
    if (err.code === 'ER_DUP_ENTRY' || err.cause?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'Bu ürün kodu zaten kullanılıyor.' } });
    }
    return sendInternalError(reply);
  }
};

export const deleteUrun: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    await repoDelete(id);
    return reply.code(204).send();
  } catch (error: any) {
    if (error?.message === 'urun_bagimliligi_var') {
      return reply.code(409).send({
        error: {
          message: 'urun_bagimliligi_var',
          blocking: error.blocking,
          reasons: error.reasons,
        },
      });
    }
    req.log.error({ error }, 'delete_urun_failed');
    return sendInternalError(reply);
  }
};

// -- Operasyonlar --

export const listOperasyonlar: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const urun = await repoGetById(id);
    if (!urun) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }
    const categoryBehavior = await getCategoryBehavior(urun.kategori);
    if (!isOperationEnabledForCategory(categoryBehavior, urun.tedarik_tipi)) {
      return reply.send([]);
    }
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

    const opRows = await db
      .select({
        urunId: urunler.id,
        urunKategori: urunler.kategori,
        urunTedarikTipi: urunler.tedarik_tipi,
      })
      .from(urunOperasyonlari)
      .innerJoin(urunler, eq(urunler.id, urunOperasyonlari.urun_id))
      .where(eq(urunOperasyonlari.id, opId))
      .limit(1);

    const opRow = opRows[0];
    if (!opRow) {
      return reply.code(404).send({ error: { message: 'operasyon_bulunamadi' } });
    }
    const categoryBehavior = await getCategoryBehavior(opRow.urunKategori);
    if (!isOperationEnabledForCategory(categoryBehavior, opRow.urunTedarikTipi)) {
      return reply.code(400).send({ error: { message: 'urun_kategorisi_operasyon_desteklemiyor' } });
    }

    const row = await repoPatchOperasyon(opId, parsed.data);
    if (!row) {
      return reply.code(404).send({ error: { message: 'operasyon_bulunamadi' } });
    }
    if (isOperasyonKaynagiKategori(opRow.urunKategori) && opRow.urunTedarikTipi === 'uretim') {
      await syncBagliAsilUrunOperasyonlariFromYariMamul(opRow.urunId);
    }
    const enriched = await enrichOperasyonlar([row]);
    return reply.send(enriched[0]);
  } catch (error) {
    req.log.error({ error }, 'patch_operasyon_failed');
    if (error instanceof OperasyonelYmTutarsizligiError) {
      return reply.code(400).send({ error: { message: error.code, detay: error.detay } });
    }
    return sendInternalError(reply);
  }
};

// -- Recete (ürün bazlı) --

const receteItemSchema = z.object({
  urunId: z.string().min(1),
  miktar: z.coerce.number().positive(),
  fireOrani: z.coerce.number().min(0).max(100).default(0),
  aciklama: z.string().trim().max(500).optional(),
  sira: z.coerce.number().int().min(0).default(0),
});

const saveReceteSchema = z.object({
  items: z.array(receteItemSchema).min(1),
});

export const getUrunRecete: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const urun = await repoGetById(id);
    if (!urun) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }
    const categoryBehavior = await getCategoryBehavior(urun.kategori);
    if (!isRecipeEnabledForCategory(categoryBehavior)) {
      return reply.send({ recete: null, items: [] });
    }
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
    const categoryBehavior = await getCategoryBehavior(urun.kategori);
    if (!isRecipeEnabledForCategory(categoryBehavior)) {
      return reply.code(400).send({ error: { message: 'urun_kategorisi_recete_desteklemiyor' } });
    }

    const parsed = saveReceteSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'gecersiz_istek_govdesi', issues: parsed.error.flatten() },
      });
    }

    const receteValidationError = await validateReceteItems(parsed.data.items, id);
    if (receteValidationError) {
      return reply.code(400).send({ error: { message: receteValidationError } });
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

    if (urun.kategori === 'urun' && urun.tedarik_tipi === 'uretim') {
      await syncAsilUrunOperasyonlariFromRecete(id, parsed.data.items);
    }

    const dto = receteRowToDto(detail.recete);
    dto.items = detail.items.map(receteKalemRowToDto);
    return reply.send(dto);
  } catch (error: unknown) {
    req.log.error({ error }, 'save_urun_recete_failed');
    if (error instanceof OperasyonelYmTutarsizligiError) {
      return reply.code(400).send({ error: { message: error.code, detay: error.detay } });
    }
    const err = error as { code?: string; cause?: { code?: string } };
    if (err.code === 'ER_DUP_ENTRY' || err.cause?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'recete_kodu_zaten_var' } });
    }
    return sendInternalError(reply);
  }
};

export const deleteUrunRecete: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const urun = await repoGetById(id);
    if (!urun) {
      return reply.code(404).send({ error: { message: 'urun_bulunamadi' } });
    }
    const categoryBehavior = await getCategoryBehavior(urun.kategori);
    if (!isRecipeEnabledForCategory(categoryBehavior)) {
      return reply.code(400).send({ error: { message: 'urun_kategorisi_recete_desteklemiyor' } });
    }
    const existing = await repoGetReceteByUrunId(id);
    if (!existing) {
      return reply.code(404).send({ error: { message: 'recete_bulunamadi' } });
    }
    await repoDeleteRecete(existing.recete.id);
    if (urun.kategori === 'urun' && urun.tedarik_tipi === 'uretim') {
      await syncAsilUrunOperasyonlariFromRecete(id, []);
    }
    return reply.code(204).send();
  } catch (error) {
    req.log.error({ error }, 'delete_urun_recete_failed');
    if (error instanceof OperasyonelYmTutarsizligiError) {
      return reply.code(400).send({ error: { message: error.code, detay: error.detay } });
    }
    return sendInternalError(reply);
  }
};

// ── Medya ────────────────────────────────────────────────────

/** GET /admin/urunler/:id/medya */
export const listUrunMedya: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const rows = await repoListMedya(id);

    // Fallback: if no medya rows but product has legacy image_url, return it as a virtual medya item
    if (rows.length === 0) {
      const urun = await repoGetById(id);
      if (urun?.image_url) {
        return [{
          id: randomUUID(),
          urunId: id,
          tip: 'image',
          url: urun.image_url,
          storageAssetId: urun.storage_asset_id ?? null,
          baslik: urun.image_alt ?? null,
          sira: 1,
          isCover: true,
          createdAt: urun.created_at,
        }];
      }
    }

    return rows.map(medyaRowToDto);
  } catch (error) {
    req.log.error({ error }, 'list_urun_medya_failed');
    return sendInternalError(reply);
  }
};

/** PUT /admin/urunler/:id/medya */
export const saveUrunMedya: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const urun = await repoGetById(id);
    if (!urun) return reply.code(404).send({ error: { message: 'not_found' } });

    const parsed = medyaSaveSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    }

    const rows = await repoSaveMedya(id, parsed.data.items);

    // Sync legacy image_url field with the cover image (keeps product list consistent)
    const cover = parsed.data.items.find((i) => i.isCover) ?? parsed.data.items[0];
    const newImageUrl = cover?.url ?? null;
    const newAssetId = cover?.storageAssetId ?? null;
    if (urun.image_url !== newImageUrl || urun.storage_asset_id !== newAssetId) {
      await repoUpdate(id, {
        imageUrl: newImageUrl ?? undefined,
        storageAssetId: newAssetId ?? undefined,
      } as PatchBody);
    }

    return rows.map(medyaRowToDto);
  } catch (error) {
    req.log.error({ error }, 'save_urun_medya_failed');
    return sendInternalError(reply);
  }
};
