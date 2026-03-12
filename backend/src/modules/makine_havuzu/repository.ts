import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { kalipUyumluMakineler, kaliplar, tatiller, haftaSonuPlanlari } from '@/modules/tanimlar/schema';
import { repoGetHaftaSonuPlanByDate } from '@/modules/tanimlar/repository';
import { uretimEmirleri, uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { stokDus, stokGeriAl } from '@/modules/uretim_emirleri/hammadde_service';
import { ensureCriticalStockDrafts } from '@/modules/satin_alma/repository';
import { urunler } from '@/modules/urunler/schema';

import { durusKayitlari } from '@/modules/operator/schema';

import { makineler, makineKuyrugu, type MakineRow } from './schema';
import type { AtaBody, CreateBody, KuyrukSiralaBody, ListQuery, PatchBody } from './validation';

type ListResult = {
  items: MakineRow[];
  total: number;
};

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.q) conditions.push(or(like(makineler.ad, `%${query.q}%`), like(makineler.kod, `%${query.q}%`)) as SQL);
  if (query.durum) conditions.push(eq(makineler.durum, query.durum));
  if (typeof query.isActive === 'boolean') conditions.push(eq(makineler.is_active, query.isActive ? 1 : 0));
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function getOrderBy(query: ListQuery) {
  if (query.sort === 'ad') return query.order === 'asc' ? asc(makineler.ad) : desc(makineler.ad);
  if (query.sort === 'kod') return query.order === 'asc' ? asc(makineler.kod) : desc(makineler.kod);
  return query.order === 'asc' ? asc(makineler.created_at) : desc(makineler.created_at);
}

function mapCreateInput(data: CreateBody): typeof makineler.$inferInsert {
  return {
    id: randomUUID(),
    kod: data.kod,
    ad: data.ad,
    tonaj: typeof data.tonaj === 'number' ? data.tonaj.toFixed(2) : undefined,
    saatlik_kapasite: typeof data.saatlikKapasite === 'number' ? data.saatlikKapasite.toFixed(2) : undefined,
    calisir_24_saat: typeof data.calisir24Saat === 'boolean' ? (data.calisir24Saat ? 1 : 0) : undefined,
    durum: data.durum,
    is_active: typeof data.isActive === 'boolean' ? (data.isActive ? 1 : 0) : undefined,
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof makineler.$inferInsert> {
  const payload: Partial<typeof makineler.$inferInsert> = {};
  if (data.kod !== undefined) payload.kod = data.kod;
  if (data.ad !== undefined) payload.ad = data.ad;
  if (data.tonaj !== undefined) payload.tonaj = data.tonaj.toFixed(2);
  if (data.saatlikKapasite !== undefined) payload.saatlik_kapasite = data.saatlikKapasite.toFixed(2);
  if (data.calisir24Saat !== undefined) payload.calisir_24_saat = data.calisir24Saat ? 1 : 0;
  if (data.durum !== undefined) payload.durum = data.durum;
  if (data.isActive !== undefined) payload.is_active = data.isActive ? 1 : 0;
  return payload;
}

export async function repoListKaliplarByMakineIds(makineIds: string[]) {
  if (!makineIds.length) return {};
  const rows = await db
    .select({
      makineId: kalipUyumluMakineler.makine_id,
      kalipId: kaliplar.id,
      kalipKod: kaliplar.kod,
      kalipAd: kaliplar.ad,
    })
    .from(kalipUyumluMakineler)
    .innerJoin(kaliplar, eq(kalipUyumluMakineler.kalip_id, kaliplar.id))
    .where(inArray(kalipUyumluMakineler.makine_id, makineIds));

  return rows.reduce<Record<string, Array<{ id: string; kod: string; ad: string }>>>((acc, row) => {
    const item = { id: row.kalipId, kod: row.kalipKod, ad: row.kalipAd };
    acc[row.makineId] = [...(acc[row.makineId] ?? []), item];
    return acc;
  }, {});
}

export async function repoList(query: ListQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = getOrderBy(query);
  const [items, countResult] = await Promise.all([
    db.select().from(makineler).where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(makineler).where(where),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function repoGetById(id: string): Promise<MakineRow | null> {
  const rows = await db.select().from(makineler).where(eq(makineler.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function repoCreate(data: CreateBody): Promise<MakineRow> {
  const payload = mapCreateInput(data);
  await db.transaction(async (tx) => {
    await tx.insert(makineler).values(payload);
    if (data.kalipIds?.length) {
      await tx.insert(kalipUyumluMakineler).values(
        data.kalipIds.map((kalipId) => ({
          id: randomUUID(),
          makine_id: payload.id,
          kalip_id: kalipId,
        })),
      );
    }
  });
  const row = await repoGetById(payload.id);
  if (!row) throw new Error('insert_failed');
  return row;
}

export async function repoUpdate(id: string, patch: PatchBody): Promise<MakineRow | null> {
  const payload = mapPatchInput(patch);
  await db.transaction(async (tx) => {
    if (Object.keys(payload).length > 0) {
      await tx.update(makineler).set(payload).where(eq(makineler.id, id));
    }
    if (patch.kalipIds !== undefined) {
      await tx.delete(kalipUyumluMakineler).where(eq(kalipUyumluMakineler.makine_id, id));
      if (patch.kalipIds.length) {
        await tx.insert(kalipUyumluMakineler).values(
          patch.kalipIds.map((kalipId) => ({
            id: randomUUID(),
            makine_id: id,
            kalip_id: kalipId,
          })),
        );
      }
    }
  });
  return repoGetById(id);
}

export async function repoDelete(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(kalipUyumluMakineler).where(eq(kalipUyumluMakineler.makine_id, id));
    await tx.delete(makineler).where(eq(makineler.id, id));
  });
}

// =====================================================
// Kuyruk Yonetimi
// =====================================================

export type AtanmamisOperasyonDto = {
  id: string;
  uretimEmriId: string;
  emirNo: string;
  urunKod: string;
  urunAd: string;
  operasyonAdi: string;
  sira: number;
  kalipId: string | null;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananMiktar: number;
  montaj: boolean;
  terminTarihi: string | null;
};

/** Makineye atanmamis emir operasyonlari */
export async function repoListAtanmamis(): Promise<AtanmamisOperasyonDto[]> {
  const rows = await db
    .select({
      id: uretimEmriOperasyonlari.id,
      uretimEmriId: uretimEmriOperasyonlari.uretim_emri_id,
      emirNo: uretimEmirleri.emir_no,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
      sira: uretimEmriOperasyonlari.sira,
      kalipId: uretimEmriOperasyonlari.kalip_id,
      hazirlikSuresiDk: uretimEmriOperasyonlari.hazirlik_suresi_dk,
      cevrimSuresiSn: uretimEmriOperasyonlari.cevrim_suresi_sn,
      planlananMiktar: uretimEmriOperasyonlari.planlanan_miktar,
      montaj: uretimEmriOperasyonlari.montaj,
      terminTarihi: uretimEmirleri.termin_tarihi,
    })
    .from(uretimEmriOperasyonlari)
    .innerJoin(uretimEmirleri, eq(uretimEmriOperasyonlari.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .where(
      and(
        isNull(uretimEmriOperasyonlari.makine_id),
        eq(uretimEmriOperasyonlari.durum, 'bekliyor'),
        eq(uretimEmirleri.is_active, 1),
      ),
    )
    .orderBy(asc(uretimEmirleri.termin_tarihi), asc(uretimEmriOperasyonlari.sira));

  return rows.map((r) => ({
    id: r.id,
    uretimEmriId: r.uretimEmriId,
    emirNo: r.emirNo,
    urunKod: r.urunKod,
    urunAd: r.urunAd,
    operasyonAdi: r.operasyonAdi,
    sira: r.sira,
    kalipId: r.kalipId ?? null,
    hazirlikSuresiDk: r.hazirlikSuresiDk,
    cevrimSuresiSn: Number(r.cevrimSuresiSn),
    planlananMiktar: Number(r.planlananMiktar),
    montaj: r.montaj === 1,
    terminTarihi: r.terminTarihi ? String(r.terminTarihi).slice(0, 10) : null,
  }));
}

export type KuyrukItemDto = {
  id: string;
  makineId: string;
  uretimEmriId: string;
  emirOperasyonId: string | null;
  emirNo: string;
  urunKod: string;
  urunAd: string;
  operasyonAdi: string;
  sira: number;
  planlananSureDk: number;
  hazirlikSuresiDk: number;
  cevrimSuresiSn: number;
  planlananMiktar: number;
  uretilenMiktar: number;
  fireMiktar: number;
  montaj: boolean;
  terminTarihi: string | null;
  musteriOzet: string | null;
  planlananBaslangic: string | null;
  planlananBitis: string | null;
  gercekBaslangic: string | null;
  gercekBitis: string | null;
  durum: string;
};

export type KuyrukGrubuDto = {
  makineId: string;
  makineKod: string;
  makineAd: string;
  kuyruk: KuyrukItemDto[];
};

/** Her makine icin atanmis kuyruk listesi */
export async function repoListKuyruklar(): Promise<KuyrukGrubuDto[]> {
  const rows = await db
    .select({
      id: makineKuyrugu.id,
      makineId: makineKuyrugu.makine_id,
      uretimEmriId: makineKuyrugu.uretim_emri_id,
      emirOperasyonId: makineKuyrugu.emir_operasyon_id,
      sira: makineKuyrugu.sira,
      planlananSureDk: makineKuyrugu.planlanan_sure_dk,
      hazirlikSuresiDk: makineKuyrugu.hazirlik_suresi_dk,
      planlananBaslangic: makineKuyrugu.planlanan_baslangic,
      planlananBitis: makineKuyrugu.planlanan_bitis,
      gercekBaslangic: makineKuyrugu.gercek_baslangic,
      gercekBitis: makineKuyrugu.gercek_bitis,
      durum: makineKuyrugu.durum,
      emirNo: uretimEmirleri.emir_no,
      terminTarihi: uretimEmirleri.termin_tarihi,
      musteriOzet: uretimEmirleri.musteri_ozet,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
      planlananMiktar: uretimEmriOperasyonlari.planlanan_miktar,
      uretilenMiktar: uretimEmriOperasyonlari.uretilen_miktar,
      fireMiktar: uretimEmriOperasyonlari.fire_miktar,
      cevrimSuresiSn: uretimEmriOperasyonlari.cevrim_suresi_sn,
      montaj: uretimEmriOperasyonlari.montaj,
    })
    .from(makineKuyrugu)
    .innerJoin(uretimEmirleri, eq(makineKuyrugu.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .leftJoin(uretimEmriOperasyonlari, eq(makineKuyrugu.emir_operasyon_id, uretimEmriOperasyonlari.id))
    .where(inArray(makineKuyrugu.durum, ['bekliyor', 'calisiyor']))
    .orderBy(asc(makineKuyrugu.makine_id), asc(makineKuyrugu.sira));

  // Makine bilgileri
  const makineIds = [...new Set(rows.map((r) => r.makineId))];
  if (makineIds.length === 0) return [];

  const makineRows = await db
    .select({ id: makineler.id, kod: makineler.kod, ad: makineler.ad })
    .from(makineler)
    .where(inArray(makineler.id, makineIds));
  const makineMap = new Map(makineRows.map((m) => [m.id, m]));

  // Grupla
  const grouped = new Map<string, KuyrukItemDto[]>();
  for (const r of rows) {
    const items = grouped.get(r.makineId) ?? [];
    const toDateStr = (v: Date | string | null | undefined): string | null => {
      if (!v) return null;
      if (v instanceof Date) return v.toISOString();
      return String(v);
    };
    items.push({
      id: r.id,
      makineId: r.makineId,
      uretimEmriId: r.uretimEmriId,
      emirOperasyonId: r.emirOperasyonId ?? null,
      emirNo: r.emirNo,
      urunKod: r.urunKod,
      urunAd: r.urunAd,
      operasyonAdi: r.operasyonAdi ?? '',
      sira: r.sira,
      planlananSureDk: r.planlananSureDk,
      hazirlikSuresiDk: r.hazirlikSuresiDk,
      cevrimSuresiSn: Number(r.cevrimSuresiSn ?? 0),
      planlananMiktar: Number(r.planlananMiktar ?? 0),
      uretilenMiktar: Number(r.uretilenMiktar ?? 0),
      fireMiktar: Number(r.fireMiktar ?? 0),
      montaj: (r.montaj ?? 0) === 1,
      terminTarihi: r.terminTarihi ? String(r.terminTarihi).slice(0, 10) : null,
      musteriOzet: r.musteriOzet ?? null,
      planlananBaslangic: toDateStr(r.planlananBaslangic),
      planlananBitis: toDateStr(r.planlananBitis),
      gercekBaslangic: toDateStr(r.gercekBaslangic),
      gercekBitis: toDateStr(r.gercekBitis),
      durum: r.durum,
    });
    grouped.set(r.makineId, items);
  }

  return Array.from(grouped.entries()).map(([makineId, kuyruk]) => {
    const m = makineMap.get(makineId);
    return {
      makineId,
      makineKod: m?.kod ?? '',
      makineAd: m?.ad ?? '',
      kuyruk,
    };
  });
}

/**
 * Belirli bir tarihte makine calisabilir mi kontrolu (tatil ve hafta sonu planlari).
 * Varsayilan olarak hafta sonu (Cumartesi/Pazar) calisma yok, hafta_sonu_planlari tablosundan override.
 */
async function isMakineWorkingDay(makineId: string, date: Date): Promise<boolean> {
  const dayOfWeek = date.getDay(); // 0=Pazar, 6=Cumartesi

  // Hafta ici (1-5) = calisma gunu
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    return true;
  }

  // Hafta sonu: hafta_sonu_planlari tablosuna bak
  // Once makine bazli plan var mi kontrol et, yoksa genel plan (makine_id=NULL)
  const plan = await repoGetHaftaSonuPlanByDate(date, makineId);
  if (plan) return plan.calisiyor;

  // Plan yoksa varsayilan: hafta sonu calisma yok
  return false;
}

/**
 * Bir tarihi ileriye tasir, tatil ve hafta sonu kontrolu yapar.
 * Tatil veya calisma disinda ise bir sonraki calisma gunune atar.
 */
async function skipToNextWorkingDay(date: Date, makineId: string): Promise<Date> {
  const maxIterations = 30; // sonsuz donguyu engellemek icin
  let current = new Date(date);
  
  for (let i = 0; i < maxIterations; i++) {
    const isWorking = await isMakineWorkingDay(makineId, current);
    if (isWorking) {
      // Tatil kontrolu
      const dateStr = current.toISOString().slice(0, 10);
      const [tatil] = await db
        .select({ id: tatiller.id })
        .from(tatiller)
        .where(sql`${tatiller.tarih} = ${dateStr}`)
        .limit(1);

      if (!tatil) {
        return current; // Calisma gunu ve tatil yok
      }
    }

    // Sonraki gune gec (gun basinda)
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 8, 0, 0);
  }

  return current;
}

/**
 * Kuyruk sirasina gore planlanan baslangic/bitis tarihlerini hesapla ve guncelle.
 * - calisiyor durumundaki is: gercek_baslangic varsa onu kullan, yoksa simdiyi
 * - bekliyor durumundaki is: onceki isin planlanan_bitis'inden devam
 * - sure = hazirlik_suresi_dk + planlanan_sure_dk (dakika)
 * - Tatil ve hafta sonu calisma planlarini dikkate alir
 */
async function recalcMakineKuyrukTarihleri(makineId: string): Promise<void> {
  const items = await db
    .select({
      id: makineKuyrugu.id,
      sira: makineKuyrugu.sira,
      planlananSureDk: makineKuyrugu.planlanan_sure_dk,
      hazirlikSuresiDk: makineKuyrugu.hazirlik_suresi_dk,
      durum: makineKuyrugu.durum,
      gercekBaslangic: makineKuyrugu.gercek_baslangic,
      gercekBitis: makineKuyrugu.gercek_bitis,
      emirOperasyonId: makineKuyrugu.emir_operasyon_id,
    })
    .from(makineKuyrugu)
    .where(
      and(
        eq(makineKuyrugu.makine_id, makineId),
        inArray(makineKuyrugu.durum, ['bekliyor', 'calisiyor']),
      ),
    )
    .orderBy(asc(makineKuyrugu.sira));

  if (items.length === 0) return;

  let cursor = await skipToNextWorkingDay(new Date(), makineId); // baslangic noktasi: simdi (calisma gunu)

  for (const item of items) {
    const totalDk = item.hazirlikSuresiDk + item.planlananSureDk;

    let baslangic: Date;
    let bitis: Date;

    if (item.durum === 'calisiyor') {
      // Calisan is: gercek baslangic varsa onu kullan
      baslangic = item.gercekBaslangic ? new Date(item.gercekBaslangic) : cursor;
      bitis = new Date(baslangic.getTime() + totalDk * 60_000);
    } else {
      // Bekleyen is: onceki isin bitis zamanindan basla, calisma gunu kontrolu yap
      baslangic = await skipToNextWorkingDay(cursor, makineId);
      bitis = new Date(baslangic.getTime() + totalDk * 60_000);
    }

    // Kuyruk kaydini guncelle
    await db
      .update(makineKuyrugu)
      .set({
        planlanan_baslangic: baslangic,
        planlanan_bitis: bitis,
      })
      .where(eq(makineKuyrugu.id, item.id));

    // Emir operasyonunu da guncelle
    if (item.emirOperasyonId) {
      await db
        .update(uretimEmriOperasyonlari)
        .set({
          planlanan_baslangic: baslangic,
          planlanan_bitis: bitis,
        })
        .where(eq(uretimEmriOperasyonlari.id, item.emirOperasyonId));
    }

    cursor = bitis; // sonraki is bu isin bitisinden baslar
  }
}

/** Operasyonu makineye ata */
export async function repoAtaOperasyon(data: AtaBody): Promise<void> {
  const { emirOperasyonId, makineId, montajMakineId } = data;

  // Emir operasyonunu bul
  const [opRow] = await db
    .select()
    .from(uretimEmriOperasyonlari)
    .where(eq(uretimEmriOperasyonlari.id, emirOperasyonId))
    .limit(1);
  if (!opRow) throw new Error('emir_operasyonu_bulunamadi');

  if (opRow.kalip_id) {
    const [uyumluMakine] = await db
      .select({ makineId: kalipUyumluMakineler.makine_id })
      .from(kalipUyumluMakineler)
      .where(and(eq(kalipUyumluMakineler.kalip_id, opRow.kalip_id), eq(kalipUyumluMakineler.makine_id, makineId)))
      .limit(1);

    const [kalipUyumlulukKaydi] = await db
      .select({ kalipId: kalipUyumluMakineler.kalip_id })
      .from(kalipUyumluMakineler)
      .where(eq(kalipUyumluMakineler.kalip_id, opRow.kalip_id))
      .limit(1);

    if (kalipUyumlulukKaydi && !uyumluMakine) {
      throw new Error('kalip_makine_uyumsuz');
    }
  }

  // Cevrim suresinden planlanan sure hesapla (dk)
  const cevrimSn = Number(opRow.cevrim_suresi_sn ?? 45);
  const miktar = Number(opRow.planlanan_miktar ?? 0);
  const planlananSureDk = Math.ceil((cevrimSn * miktar) / 60);

  // Ayni emrin baska operasyonu bu makinede var mi? (cift tarafli urun)
  // Varsa hemen arkasina yerlestir, yoksa kuyrugun sonuna ekle
  const [kardesKuyruk] = await db
    .select({ sira: makineKuyrugu.sira })
    .from(makineKuyrugu)
    .where(
      and(
        eq(makineKuyrugu.makine_id, makineId),
        eq(makineKuyrugu.uretim_emri_id, opRow.uretim_emri_id),
      ),
    )
    .orderBy(desc(makineKuyrugu.sira))
    .limit(1);

  let insertSira: number;
  if (kardesKuyruk) {
    // Kardes operasyonun hemen arkasina yerlestir
    insertSira = kardesKuyruk.sira + 1;
  } else {
    // Kuyrugun sonuna ekle
    const [maxRow] = await db
      .select({ maxSira: sql<number>`COALESCE(MAX(${makineKuyrugu.sira}), 0)` })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.makine_id, makineId));
    insertSira = (maxRow?.maxSira ?? 0) + 1;
  }

  let ilkAtama = false;

  await db.transaction(async (tx) => {
    // 0. Kardes varsa sonraki siralari kaydir
    if (kardesKuyruk) {
      await tx.execute(
        sql`UPDATE ${makineKuyrugu}
            SET ${makineKuyrugu.sira} = ${makineKuyrugu.sira} + 1
            WHERE ${makineKuyrugu.makine_id} = ${makineId}
              AND ${makineKuyrugu.sira} >= ${insertSira}
            ORDER BY ${makineKuyrugu.sira} DESC`,
      );
    }

    // 1. Emir operasyonunda makine_id guncelle
    const updatePayload: Partial<typeof uretimEmriOperasyonlari.$inferInsert> = {
      makine_id: makineId,
    };
    if (montajMakineId) {
      updatePayload.montaj_makine_id = montajMakineId;
    }
    await tx
      .update(uretimEmriOperasyonlari)
      .set(updatePayload)
      .where(eq(uretimEmriOperasyonlari.id, emirOperasyonId));

    // 2. Makine kuyruguna ekle
    await tx.insert(makineKuyrugu).values({
      id: randomUUID(),
      makine_id: makineId,
      uretim_emri_id: opRow.uretim_emri_id,
      emir_operasyon_id: emirOperasyonId,
      sira: insertSira,
      planlanan_sure_dk: planlananSureDk,
      hazirlik_suresi_dk: opRow.hazirlik_suresi_dk,
      durum: 'bekliyor',
    });

    // 3. Auto-derive: atanmamis → planlandi
    const [emirRow] = await tx
      .select({ durum: uretimEmirleri.durum })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, opRow.uretim_emri_id))
      .limit(1);
    if (emirRow?.durum === 'atanmamis') {
      ilkAtama = true;
      await tx
        .update(uretimEmirleri)
        .set({ durum: 'planlandi' })
        .where(eq(uretimEmirleri.id, opRow.uretim_emri_id));
    }
  });

  // İlk makine atamasında hammadde stoktan düş (rezerve → gerçek tüketim)
  // Stok negatife düşerse otomatik satın alma taslağı oluştur
  if (ilkAtama) {
    const [emirInfo] = await db
      .select({ emirNo: uretimEmirleri.emir_no })
      .from(uretimEmirleri)
      .where(eq(uretimEmirleri.id, opRow.uretim_emri_id))
      .limit(1);
    await stokDus(opRow.uretim_emri_id);
    await ensureCriticalStockDrafts(
      emirInfo?.emirNo ? `Üretim emri ${emirInfo.emirNo} için hammadde eksikliği` : undefined,
    );
  }

  // Tarih hesapla
  await recalcMakineKuyrukTarihleri(makineId);
}

/** Kuyruktan cikar */
export async function repoKuyrukCikar(kuyruguId: string): Promise<void> {
  // Once kuyruk kaydini bul
  const [row] = await db
    .select()
    .from(makineKuyrugu)
    .where(eq(makineKuyrugu.id, kuyruguId))
    .limit(1);
  if (!row) throw new Error('kuyruk_kaydi_bulunamadi');

  const affectedMakineId = row.makine_id;

  const affectedEmriId = row.uretim_emri_id;

  await db.transaction(async (tx) => {
    // Emir operasyonunda makine_id ve plan tarihlerini temizle
    if (row.emir_operasyon_id) {
      await tx
        .update(uretimEmriOperasyonlari)
        .set({ makine_id: null, planlanan_baslangic: null, planlanan_bitis: null })
        .where(eq(uretimEmriOperasyonlari.id, row.emir_operasyon_id));
    }
    // Kuyruk kaydini sil
    await tx.delete(makineKuyrugu).where(eq(makineKuyrugu.id, kuyruguId));

    // Auto-derive: planlandi → atanmamis (if no remaining kuyruk entries)
    if (affectedEmriId) {
      const [remaining] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(makineKuyrugu)
        .where(eq(makineKuyrugu.uretim_emri_id, affectedEmriId));
      if (Number(remaining?.count ?? 0) === 0) {
        const [emirRow] = await tx
          .select({ durum: uretimEmirleri.durum })
          .from(uretimEmirleri)
          .where(eq(uretimEmirleri.id, affectedEmriId))
          .limit(1);
        if (emirRow?.durum === 'planlandi') {
          await tx
            .update(uretimEmirleri)
            .set({ durum: 'atanmamis' })
            .where(eq(uretimEmirleri.id, affectedEmriId));
        }
      }
    }
  });

  // Tüm atamalar kaldırıldıysa tüketilen hammadde stoku geri al (rezerveye döner)
  if (affectedEmriId) {
    const [check] = await db
      .select({ count: sql<number>`count(*)` })
      .from(makineKuyrugu)
      .where(eq(makineKuyrugu.uretim_emri_id, affectedEmriId));
    if (Number(check?.count ?? 0) === 0) {
      await stokGeriAl(affectedEmriId);
    }
  }

  // Kalan kuyruk icin tarihleri yeniden hesapla
  await recalcMakineKuyrukTarihleri(affectedMakineId);
}

/** Kuyruk siralarini guncelle */
export async function repoKuyrukSirala(data: KuyrukSiralaBody): Promise<void> {
  // Unique constraint (makine_id, sira) oldugu icin once tum siralari yuksek offset'e tasi
  const offset = 10_000;
  for (const item of data.siralar) {
    await db
      .update(makineKuyrugu)
      .set({ sira: item.sira + offset })
      .where(and(eq(makineKuyrugu.id, item.kuyruguId), eq(makineKuyrugu.makine_id, data.makineId)));
  }
  // Sonra gercek siralara guncelle
  for (const item of data.siralar) {
    await db
      .update(makineKuyrugu)
      .set({ sira: item.sira })
      .where(and(eq(makineKuyrugu.id, item.kuyruguId), eq(makineKuyrugu.makine_id, data.makineId)));
  }

  // Tarihleri yeniden hesapla
  await recalcMakineKuyrukTarihleri(data.makineId);
}

// =====================================================
// Kapasite Hesaplama
// =====================================================

export type KapasiteHesabiDto = {
  makineId: string;
  makineKod: string;
  makineAd: string;
  calisir24Saat: boolean;
  saatlikKapasite: number | null;
  gunlukCalismaSaati: number;
  toplamCalismaGunu: number;
  toplamCalismaSaati: number;
  toplamDurusSaati: number;
  netCalismaSaati: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  gunler: Array<{
    tarih: string;
    gunAdi: string;
    calisiyor: boolean;
    tatilMi: boolean;
    haftaSonuMu: boolean;
    durusSaati: number;
  }>;
};

const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * Bir makine için belirli tarih aralığında dinamik kapasite hesapla.
 * - Tatil günlerini hariç tutar.
 * - Hafta sonu çalışma planlarını dikkate alır.
 * - 24 saat çalışan makineler için günde 24 saat, diğerleri için 8 saat hesaplar.
 */
export async function repoCalculateCapacity(
  makineId: string,
  startDate: Date,
  endDate: Date,
): Promise<KapasiteHesabiDto | null> {
  const makine = await repoGetById(makineId);
  if (!makine) return null;

  const gunlukSaat = makine.calisir_24_saat === 1 ? 24 : 8;
  const gunler: KapasiteHesabiDto['gunler'] = [];

  // Duruş kayıtlarını tarih aralığı için toplu çek
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const durusRows = await db
    .select({
      baslangic: durusKayitlari.baslangic,
      bitis: durusKayitlari.bitis,
    })
    .from(durusKayitlari)
    .where(
      and(
        eq(durusKayitlari.makine_id, makineId),
        sql`${durusKayitlari.baslangic} <= ${endStr + ' 23:59:59'}`,
        sql`(${durusKayitlari.bitis} IS NULL OR ${durusKayitlari.bitis} >= ${startStr + ' 00:00:00'})`,
      ),
    );

  // Her gün için duruş saatlerini hesapla
  function calcDurusHoursForDate(dateStr: string): number {
    const dayStart = new Date(`${dateStr}T00:00:00`);
    const dayEnd = new Date(`${dateStr}T23:59:59`);
    let totalMinutes = 0;

    for (const row of durusRows) {
      const dStart = new Date(row.baslangic);
      const dEnd = row.bitis ? new Date(row.bitis) : new Date(); // devam eden duruş → şu an
      const overlapStart = dStart > dayStart ? dStart : dayStart;
      const overlapEnd = dEnd < dayEnd ? dEnd : dayEnd;
      if (overlapStart < overlapEnd) {
        totalMinutes += (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
      }
    }

    return Math.round((totalMinutes / 60) * 100) / 100; // 2 ondalık saat
  }

  let totalWorkingDays = 0;
  let totalDurusHours = 0;
  let current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = current.toISOString().slice(0, 10);

    // Tatil kontrolü
    const [tatil] = await db
      .select({ id: tatiller.id })
      .from(tatiller)
      .where(sql`${tatiller.tarih} = ${dateStr}`)
      .limit(1);
    const isTatil = !!tatil;

    // Çalışılabilir gün kontrolü
    let calisiyor = false;
    if (!isTatil) {
      calisiyor = await isMakineWorkingDay(makineId, current);
    }

    const durusSaati = calisiyor ? calcDurusHoursForDate(dateStr) : 0;
    totalDurusHours += durusSaati;

    gunler.push({
      tarih: dateStr,
      gunAdi: GUN_ADLARI[dayOfWeek],
      calisiyor,
      tatilMi: isTatil,
      haftaSonuMu: isWeekend,
      durusSaati,
    });

    if (calisiyor) {
      totalWorkingDays++;
    }

    // Sonraki güne geç
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  const toplamCalismaSaati = totalWorkingDays * gunlukSaat;
  const toplamDurusSaati = Math.round(totalDurusHours * 100) / 100;

  return {
    makineId: makine.id,
    makineKod: makine.kod,
    makineAd: makine.ad,
    calisir24Saat: makine.calisir_24_saat === 1,
    saatlikKapasite: makine.saatlik_kapasite ? Number(makine.saatlik_kapasite) : null,
    gunlukCalismaSaati: gunlukSaat,
    toplamCalismaGunu: totalWorkingDays,
    toplamCalismaSaati: toplamCalismaSaati,
    toplamDurusSaati,
    netCalismaSaati: Math.round((toplamCalismaSaati - toplamDurusSaati) * 100) / 100,
    baslangicTarihi: startStr,
    bitisTarihi: endStr,
    gunler,
  };
}
