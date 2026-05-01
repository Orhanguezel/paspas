import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { makineler as makinelerTbl } from '@/modules/makine_havuzu/schema';
import { durusKayitlari, operatorGunlukKayitlari, vardiyaKayitlari } from '@/modules/operator/schema';
import { durusNedenleri, kaliplar, vardiyalar as vardiyaTanimlari } from '@/modules/tanimlar/schema';
import { uretimEmirleri, uretimEmriOperasyonlari } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';

import type { ListQuery, TrendQuery } from './validation';

export type UrunKirilim = { urunId: string; urunAd: string; urunKod: string | null; miktar: number };

export type OperasyonKirilim = {
  operasyonId: string | null;
  operasyonAdi: string;
  operasyonTipi: string | null;
  kalipId: string | null;
  kalipKod: string | null;
  kalipAd: string | null;
  miktar: number;
};

export type VardiyaAnalizItem = {
  id: string;
  makineId: string;
  makineAd: string;
  operatorUserId: string | null;
  operatorAd: string | null;
  vardiyaTipi: string;
  baslangic: string;
  bitis: string | null;
  aktif: boolean;
  planlananSureDk: number;
  calismaSuresiDk: number;
  durusToplamDk: number;
  uretim: {
    toplamMiktar: number;
    netToplam: number;
    fireToplam: number;
    urunKirilimi: UrunKirilim[];
    operasyonKirilimi: OperasyonKirilim[];
  };
  duruslar: {
    toplamDk: number;
    arizaSayisi: number;
    arizaDk: number;
    kalipDegisimSayisi: number;
    kalipDegisimDk: number;
    bakimSayisi: number;
    bakimDk: number;
    digerSayisi: number;
    digerDk: number;
  };
  oee: number;
};

export type VardiyaAnalizOzet = {
  toplamUretim: number;
  toplamCalismaDk: number;
  toplamDurusDk: number;
  durusOrani: number;
  arizaSayisi: number;
  kalipDegisimSayisi: number;
  aktifVardiyaSayisi: number;
  oee: number;
};

export type MakineRollup = {
  makineId: string;
  makineAd: string;
  vardiyaSayisi: number;
  aktifVardiya: boolean;
  toplamUretim: number;
  calismaSuresiDk: number;
  durusToplamDk: number;
  arizaSayisi: number;
  arizaDk: number;
  kalipDegisimSayisi: number;
  kalipDegisimDk: number;
  bakimDk: number;
  ortCevrimSaniye: number | null;
  teorikHedef: number | null;
  hedefGerceklesmeYuzde: number | null;
  operasyonKirilimi: OperasyonKirilim[];
  oee: number;
};

export type KalipRollup = {
  kalipId: string;
  kalipKod: string;
  kalipAd: string;
  toplamUretim: number;
  calismaDk: number;
  makineSayisi: number;
  makineler: string[];
  urunSayisi: number;
  urunler: string[];
  kalipDegisimSayisi: number;
};

export type VardiyaAnalizResponse = {
  tarih: string;
  vardiyalar: VardiyaAnalizItem[];
  makineler: MakineRollup[];
  kaliplar: KalipRollup[];
  ozet: VardiyaAnalizOzet;
};

export type UretimKirilimAggregateRow = {
  urunId: string;
  urunAd: string;
  urunKod: string | null;
  netMiktar: number | string | null;
  fireMiktar: number | string | null;
};

export function buildUretimKirilimSummary(rows: UretimKirilimAggregateRow[]) {
  const byProduct = new Map<string, UrunKirilim>();
  let fireToplam = 0;

  for (const row of rows) {
    const miktar = Number(row.netMiktar ?? 0);
    const existing = byProduct.get(row.urunId);
    if (existing) {
      existing.miktar += miktar;
    } else {
      byProduct.set(row.urunId, {
        urunId: row.urunId,
        urunAd: row.urunAd,
        urunKod: row.urunKod,
        miktar,
      });
    }
    fireToplam += Number(row.fireMiktar ?? 0);
  }

  const urunKirilimi = Array.from(byProduct.values());
  return {
    urunKirilimi,
    uretimToplam: urunKirilimi.reduce((sum, item) => sum + item.miktar, 0),
    fireToplam,
  };
}

const DEFAULT_VARDIYA_SAATLERI = {
  gunduz: { baslangic: '07:30', bitis: '19:30' },
  gece: { baslangic: '19:30', bitis: '07:30' },
} as const;

type VardiyaTipi = keyof typeof DEFAULT_VARDIYA_SAATLERI;
type VardiyaTanimi = {
  vardiyaTipi: VardiyaTipi;
  ad: string;
  baslangicSaati: string;
  bitisSaati: string;
};

type VardiyaRow = {
  id: string;
  makineId: string;
  operatorUserId: string | null;
  vardiyaTipi: string;
  baslangic: Date;
  bitis: Date | null;
  makineAd: string;
  operatorAd: string | null;
};

function dateRange(query: ListQuery): { baslangic: Date; bitis: Date; tarihLabel: string } {
  if (query.baslangicTarih && query.bitisTarih) {
    return {
      baslangic: new Date(`${query.baslangicTarih}T00:00:00`),
      bitis: new Date(`${query.bitisTarih}T23:59:59`),
      tarihLabel: `${query.baslangicTarih} - ${query.bitisTarih}`,
    };
  }
  const tarih = query.tarih ?? new Date().toISOString().slice(0, 10);
  return {
    baslangic: new Date(`${tarih}T00:00:00`),
    bitis: new Date(`${tarih}T23:59:59`),
    tarihLabel: tarih,
  };
}

function diffMinutes(a: Date, b: Date): number {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 60000));
}

function parseClockToMinutes(clock: string): number {
  const [hour, minute] = clock.split(':').map(Number);
  return (hour * 60) + minute;
}

function normalizeShiftName(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function inferVardiyaTipi(ad: string, baslangicSaati: string, bitisSaati: string): VardiyaTipi {
  const normalizedName = normalizeShiftName(ad);
  if (normalizedName.includes('gece')) return 'gece';
  if (normalizedName.includes('gunduz')) return 'gunduz';

  const baslangic = parseClockToMinutes(baslangicSaati);
  const bitis = parseClockToMinutes(bitisSaati);
  if (baslangic > bitis) return 'gece';
  return baslangic >= (12 * 60) ? 'gece' : 'gunduz';
}

function createDateForClock(reference: Date, clock: string): Date {
  const [hour, minute] = clock.split(':').map(Number);
  const date = new Date(reference);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function buildShiftWindowForTime(time: Date, tanim: VardiyaTanimi): { baslangic: Date; bitis: Date } {
  const baslangicMinutes = parseClockToMinutes(tanim.baslangicSaati);
  const bitisMinutes = parseClockToMinutes(tanim.bitisSaati);
  const currentMinutes = (time.getHours() * 60) + time.getMinutes();
  const overnight = baslangicMinutes >= bitisMinutes;

  const baslangic = createDateForClock(time, tanim.baslangicSaati);
  const bitis = createDateForClock(time, tanim.bitisSaati);

  if (overnight) {
    if (currentMinutes >= baslangicMinutes) {
      bitis.setDate(bitis.getDate() + 1);
    } else {
      baslangic.setDate(baslangic.getDate() - 1);
    }
  }

  return { baslangic, bitis };
}

async function listActiveVardiyaTanimlari(): Promise<VardiyaTanimi[]> {
  const rows = await db
    .select({
      ad: vardiyaTanimlari.ad,
      baslangicSaati: vardiyaTanimlari.baslangic_saati,
      bitisSaati: vardiyaTanimlari.bitis_saati,
    })
    .from(vardiyaTanimlari)
    .where(eq(vardiyaTanimlari.is_active, 1))
    .orderBy(asc(vardiyaTanimlari.baslangic_saati), asc(vardiyaTanimlari.ad));

  if (rows.length === 0) {
    return (Object.entries(DEFAULT_VARDIYA_SAATLERI) as [VardiyaTipi, { baslangic: string; bitis: string }][]).map(([vardiyaTipi, saatler]) => ({
      vardiyaTipi,
      ad: vardiyaTipi,
      baslangicSaati: saatler.baslangic,
      bitisSaati: saatler.bitis,
    }));
  }

  return rows.map((row) => ({
    vardiyaTipi: inferVardiyaTipi(row.ad, row.baslangicSaati, row.bitisSaati),
    ad: row.ad,
    baslangicSaati: row.baslangicSaati,
    bitisSaati: row.bitisSaati,
  }));
}

function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

function mergeOperasyonKirilimi(target: OperasyonKirilim[], source: OperasyonKirilim[]) {
  for (const item of source) {
    const key = `${item.operasyonId ?? 'null'}-${item.kalipId ?? 'null'}-${item.operasyonTipi ?? 'null'}`;
    const existing = target.find((current) => `${current.operasyonId ?? 'null'}-${current.kalipId ?? 'null'}-${current.operasyonTipi ?? 'null'}` === key);
    if (existing) {
      existing.miktar += item.miktar;
    } else {
      target.push({ ...item });
    }
  }
  target.sort((a, b) => b.miktar - a.miktar || a.operasyonAdi.localeCompare(b.operasyonAdi, 'tr'));
}

export type DurusDetay = {
  id: string;
  baslangic: string;
  bitis: string | null;
  sureDk: number;
  durusTipi: string;
  neden: string;
  nedenKod: string | null;
  operatorUserId: string | null;
  operatorAd: string | null;
};

export type UretimKaydi = {
  id: string;
  kayitTarihi: string;
  urunId: string;
  urunAd: string;
  urunKod: string | null;
  netMiktar: number;
  fireMiktar: number;
  operatorAd: string | null;
  notlar: string | null;
  operasyonAdi: string | null;
  operasyonTipi: string | null;
  kalipKod: string | null;
  kalipAd: string | null;
};

export type SaatlikUretim = { saat: string; miktar: number };

export type BagliEmir = {
  emirId: string;
  emirNo: string;
  urunAd: string;
  planlanan: number;
  uretilen: number;
};

export type VardiyaDetayResponse = {
  makineId: string;
  makineAd: string;
  baslangic: string;
  bitis: string;
  duruslar: DurusDetay[];
  uretimKayitlari: UretimKaydi[];
  saatlikUretim: SaatlikUretim[];
  bagliEmirler: BagliEmir[];
};

export async function getVardiyaAnaliziDetay(params: {
  vardiyaKayitId?: string;
  makineId?: string;
  tarih?: string;
  baslangicTarih?: string;
  bitisTarih?: string;
}): Promise<VardiyaDetayResponse | null> {
  // Aralık ve makine tespit et
  let makineId: string;
  let makineAd: string;
  let baslangic: Date;
  let bitis: Date;

  if (params.vardiyaKayitId) {
    const rows = await db
      .select({
        id: vardiyaKayitlari.id,
        makineId: vardiyaKayitlari.makine_id,
        makineAd: makinelerTbl.ad,
        baslangic: vardiyaKayitlari.baslangic,
        bitis: vardiyaKayitlari.bitis,
      })
      .from(vardiyaKayitlari)
      .innerJoin(makinelerTbl, eq(vardiyaKayitlari.makine_id, makinelerTbl.id))
      .where(eq(vardiyaKayitlari.id, params.vardiyaKayitId))
      .limit(1);
    if (!rows[0]) return null;
    makineId = rows[0].makineId;
    makineAd = rows[0].makineAd;
    baslangic = new Date(rows[0].baslangic);
    bitis = rows[0].bitis ? new Date(rows[0].bitis) : new Date();
  } else if (params.makineId && params.baslangicTarih && params.bitisTarih) {
    const rows = await db
      .select({ ad: makinelerTbl.ad })
      .from(makinelerTbl)
      .where(eq(makinelerTbl.id, params.makineId))
      .limit(1);
    if (!rows[0]) return null;
    makineId = params.makineId;
    makineAd = rows[0].ad;
    baslangic = new Date(`${params.baslangicTarih}T00:00:00`);
    bitis = new Date(`${params.bitisTarih}T23:59:59`);
  } else if (params.makineId && params.tarih) {
    const rows = await db
      .select({ ad: makinelerTbl.ad })
      .from(makinelerTbl)
      .where(eq(makinelerTbl.id, params.makineId))
      .limit(1);
    if (!rows[0]) return null;
    makineId = params.makineId;
    makineAd = rows[0].ad;
    baslangic = new Date(`${params.tarih}T00:00:00`);
    bitis = new Date(`${params.tarih}T23:59:59`);
  } else {
    return null;
  }

  // Duruş detayları
  const durusRows = await db
    .select({
      id: durusKayitlari.id,
      baslangic: durusKayitlari.baslangic,
      bitis: durusKayitlari.bitis,
      sureDk: durusKayitlari.sure_dk,
      durusTipi: durusKayitlari.durus_tipi,
      neden: durusKayitlari.neden,
      nedenKod: durusNedenleri.kod,
      operatorUserId: durusKayitlari.operator_user_id,
      operatorAd: users.full_name,
    })
    .from(durusKayitlari)
    .leftJoin(durusNedenleri, eq(durusKayitlari.durus_nedeni_id, durusNedenleri.id))
    .leftJoin(users, eq(durusKayitlari.operator_user_id, users.id))
    .where(
      and(
        eq(durusKayitlari.makine_id, makineId),
        gte(durusKayitlari.baslangic, baslangic),
        lte(durusKayitlari.baslangic, bitis),
      ),
    )
    .orderBy(desc(durusKayitlari.baslangic));

  const duruslar: DurusDetay[] = durusRows.map((r) => {
    const bitisDate = r.bitis ? new Date(r.bitis) : null;
    const sure = r.sureDk ?? (bitisDate ? diffMinutes(new Date(r.baslangic), bitisDate) : 0);
    return {
      id: r.id,
      baslangic: r.baslangic instanceof Date ? r.baslangic.toISOString() : String(r.baslangic),
      bitis: r.bitis ? (r.bitis instanceof Date ? r.bitis.toISOString() : String(r.bitis)) : null,
      sureDk: sure,
      durusTipi: r.durusTipi,
      neden: r.neden,
      nedenKod: r.nedenKod ?? null,
      operatorUserId: r.operatorUserId ?? null,
      operatorAd: r.operatorAd ?? null,
    };
  });

  // Üretim kayıtları
  const kayitlar = await db
    .select({
      id: operatorGunlukKayitlari.id,
      kayitTarihi: operatorGunlukKayitlari.kayit_tarihi,
      urunId: urunler.id,
      urunAd: urunler.ad,
      urunKod: urunler.kod,
      netMiktar: operatorGunlukKayitlari.net_miktar,
      ekMiktar: operatorGunlukKayitlari.ek_uretim_miktari,
      fireMiktar: operatorGunlukKayitlari.fire_miktari,
      notlar: operatorGunlukKayitlari.notlar,
      operatorAd: users.full_name,
      operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
      operasyonTipi: urunler.operasyon_tipi,
      kalipKod: kaliplar.kod,
      kalipAd: kaliplar.ad,
    })
    .from(operatorGunlukKayitlari)
    .innerJoin(uretimEmirleri, eq(operatorGunlukKayitlari.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .leftJoin(uretimEmriOperasyonlari, eq(operatorGunlukKayitlari.emir_operasyon_id, uretimEmriOperasyonlari.id))
    .leftJoin(kaliplar, eq(uretimEmriOperasyonlari.kalip_id, kaliplar.id))
    .leftJoin(users, eq(operatorGunlukKayitlari.operator_user_id, users.id))
    .where(
      and(
        eq(operatorGunlukKayitlari.makine_id, makineId),
        gte(operatorGunlukKayitlari.kayit_tarihi, baslangic),
        lte(operatorGunlukKayitlari.kayit_tarihi, bitis),
        sql`(${operatorGunlukKayitlari.emir_operasyon_id} IS NULL OR COALESCE(${uretimEmriOperasyonlari.montaj}, 0) = 0)`,
      ),
    )
    .orderBy(desc(operatorGunlukKayitlari.kayit_tarihi));

  const uretimKayitlari: UretimKaydi[] = kayitlar.map((r) => ({
    id: r.id,
    kayitTarihi: r.kayitTarihi instanceof Date ? r.kayitTarihi.toISOString() : String(r.kayitTarihi),
    urunId: r.urunId,
    urunAd: r.urunAd,
    urunKod: r.urunKod,
    netMiktar: Number(r.netMiktar ?? 0),
    fireMiktar: Number(r.fireMiktar ?? 0),
    operatorAd: r.operatorAd ?? null,
    notlar: r.notlar ?? null,
    operasyonAdi: r.operasyonAdi ?? null,
    operasyonTipi: r.operasyonTipi ?? null,
    kalipKod: r.kalipKod ?? null,
    kalipAd: r.kalipAd ?? null,
  }));

  // Saatlik üretim
  const saatMap = new Map<string, number>();
  for (const k of uretimKayitlari) {
    const saat = new Date(k.kayitTarihi).getHours().toString().padStart(2, '0');
    saatMap.set(saat, (saatMap.get(saat) ?? 0) + k.netMiktar);
  }
  const saatlikUretim: SaatlikUretim[] = Array.from({ length: 24 }, (_, i) => {
    const saat = i.toString().padStart(2, '0');
    return { saat: `${saat}:00`, miktar: saatMap.get(saat) ?? 0 };
  });

  // Bağlı üretim emirleri
  const emirRows = await db
    .selectDistinct({
      emirId: uretimEmirleri.id,
      emirNo: uretimEmirleri.emir_no,
      urunAd: urunler.ad,
      planlanan: uretimEmirleri.planlanan_miktar,
      uretilen: uretimEmirleri.uretilen_miktar,
    })
    .from(operatorGunlukKayitlari)
    .innerJoin(uretimEmirleri, eq(operatorGunlukKayitlari.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .leftJoin(uretimEmriOperasyonlari, eq(operatorGunlukKayitlari.emir_operasyon_id, uretimEmriOperasyonlari.id))
    .where(
      and(
        eq(operatorGunlukKayitlari.makine_id, makineId),
        gte(operatorGunlukKayitlari.kayit_tarihi, baslangic),
        lte(operatorGunlukKayitlari.kayit_tarihi, bitis),
        sql`(${operatorGunlukKayitlari.emir_operasyon_id} IS NULL OR COALESCE(${uretimEmriOperasyonlari.montaj}, 0) = 0)`,
      ),
    );

  const bagliEmirler: BagliEmir[] = emirRows.map((r) => ({
    emirId: r.emirId,
    emirNo: r.emirNo,
    urunAd: r.urunAd,
    planlanan: Number(r.planlanan ?? 0),
    uretilen: Number(r.uretilen ?? 0),
  }));

  return {
    makineId,
    makineAd,
    baslangic: baslangic.toISOString(),
    bitis: bitis.toISOString(),
    duruslar,
    uretimKayitlari,
    saatlikUretim,
    bagliEmirler,
  };
}

export async function getVardiyaAnalizi(query: ListQuery): Promise<VardiyaAnalizResponse> {
  const { baslangic, bitis, tarihLabel } = dateRange(query);

  const vardiyaConditions = [
    sql`${vardiyaKayitlari.baslangic} <= ${bitis}`,
    sql`COALESCE(${vardiyaKayitlari.bitis}, ${bitis}) >= ${baslangic}`,
  ];
  if (query.makineId) vardiyaConditions.push(eq(vardiyaKayitlari.makine_id, query.makineId));

  const vardiyaRows: VardiyaRow[] = await db
    .select({
      id: vardiyaKayitlari.id,
      makineId: vardiyaKayitlari.makine_id,
      operatorUserId: vardiyaKayitlari.operator_user_id,
      vardiyaTipi: vardiyaKayitlari.vardiya_tipi,
      baslangic: vardiyaKayitlari.baslangic,
      bitis: vardiyaKayitlari.bitis,
      makineAd: makinelerTbl.ad,
      operatorAd: users.full_name,
    })
    .from(vardiyaKayitlari)
    .innerJoin(makinelerTbl, eq(vardiyaKayitlari.makine_id, makinelerTbl.id))
    .leftJoin(users, eq(vardiyaKayitlari.operator_user_id, users.id))
    .where(and(...vardiyaConditions))
    .orderBy(desc(vardiyaKayitlari.baslangic));

  const vardiyaTanimlari = await listActiveVardiyaTanimlari();
  const productionRows = await db
    .select({
      makineId: operatorGunlukKayitlari.makine_id,
      makineAd: makinelerTbl.ad,
      operatorUserId: operatorGunlukKayitlari.operator_user_id,
      operatorAd: users.full_name,
      kayitTarihi: operatorGunlukKayitlari.kayit_tarihi,
    })
    .from(operatorGunlukKayitlari)
    .innerJoin(makinelerTbl, eq(operatorGunlukKayitlari.makine_id, makinelerTbl.id))
    .leftJoin(uretimEmriOperasyonlari, eq(operatorGunlukKayitlari.emir_operasyon_id, uretimEmriOperasyonlari.id))
    .leftJoin(users, eq(operatorGunlukKayitlari.operator_user_id, users.id))
    .where(
      and(
        gte(operatorGunlukKayitlari.kayit_tarihi, baslangic),
        lte(operatorGunlukKayitlari.kayit_tarihi, bitis),
        query.makineId ? eq(operatorGunlukKayitlari.makine_id, query.makineId) : sql`1 = 1`,
        sql`${operatorGunlukKayitlari.net_miktar} != 0`,
        sql`(${operatorGunlukKayitlari.emir_operasyon_id} IS NULL OR COALESCE(${uretimEmriOperasyonlari.montaj}, 0) = 0)`,
      ),
    )
    .orderBy(desc(operatorGunlukKayitlari.kayit_tarihi));

  const knownShiftKeys = new Set(vardiyaRows.map((v) => `${v.makineId}-${new Date(v.baslangic).toISOString()}`));
  for (const kayit of productionRows) {
    if (!kayit.makineId || !kayit.makineAd) continue;
    const kayitTarihi = new Date(kayit.kayitTarihi);
    const tanim = vardiyaTanimlari
      .map((item) => ({ item, pencere: buildShiftWindowForTime(kayitTarihi, item) }))
      .find(({ pencere }) => kayitTarihi >= pencere.baslangic && kayitTarihi < pencere.bitis);
    if (!tanim) continue;

    const syntheticKey = `${kayit.makineId}-${tanim.pencere.baslangic.toISOString()}`;
    if (knownShiftKeys.has(syntheticKey)) continue;

    const hasRealCoveringShift = vardiyaRows.some((v) => {
      if (v.makineId !== kayit.makineId) return false;
      const realStart = new Date(v.baslangic);
      const realEnd = v.bitis ? new Date(v.bitis) : bitis;
      return kayitTarihi >= realStart && kayitTarihi <= realEnd;
    });
    if (hasRealCoveringShift) continue;

    knownShiftKeys.add(syntheticKey);
    vardiyaRows.push({
      id: `synthetic-${syntheticKey}`,
      makineId: kayit.makineId,
      operatorUserId: kayit.operatorUserId ?? null,
      vardiyaTipi: tanim.item.vardiyaTipi,
      baslangic: tanim.pencere.baslangic,
      bitis: tanim.pencere.bitis,
      makineAd: kayit.makineAd,
      operatorAd: kayit.operatorAd ?? null,
    });
  }

  const vardiyalar: VardiyaAnalizItem[] = [];
  for (const v of vardiyaRows) {
    const effectiveBitis = clampDate(v.bitis ? new Date(v.bitis) : new Date(), baslangic, bitis);
    const vBaslangic = clampDate(new Date(v.baslangic), baslangic, bitis);
    const planlananSureDk = diffMinutes(vBaslangic, effectiveBitis);

    // Üretim kırılımı: vardiya aralığında gerçekleşen operator_gunluk_kayitlari
    const uretimRows = await db
      .select({
        urunId: urunler.id,
        urunAd: urunler.ad,
        urunKod: urunler.kod,
        netMiktar: sql<number>`coalesce(sum(${operatorGunlukKayitlari.net_miktar}), 0)`,
        fireMiktar: sql<number>`coalesce(sum(${operatorGunlukKayitlari.fire_miktari}), 0)`,
        ekMiktar: sql<number>`coalesce(sum(${operatorGunlukKayitlari.ek_uretim_miktari}), 0)`,
      })
      .from(operatorGunlukKayitlari)
      .innerJoin(uretimEmirleri, eq(operatorGunlukKayitlari.uretim_emri_id, uretimEmirleri.id))
      .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .leftJoin(uretimEmriOperasyonlari, eq(operatorGunlukKayitlari.emir_operasyon_id, uretimEmriOperasyonlari.id))
      .where(
        and(
          eq(operatorGunlukKayitlari.makine_id, v.makineId),
          gte(operatorGunlukKayitlari.kayit_tarihi, vBaslangic),
          lte(operatorGunlukKayitlari.kayit_tarihi, effectiveBitis),
          sql`(${operatorGunlukKayitlari.emir_operasyon_id} IS NULL OR COALESCE(${uretimEmriOperasyonlari.montaj}, 0) = 0)`,
        ),
      )
      .groupBy(urunler.id, urunler.ad, urunler.kod);

    const operasyonRows = await db
      .select({
        operasyonId: uretimEmriOperasyonlari.id,
        operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
        operasyonTipi: urunler.operasyon_tipi,
        kalipId: kaliplar.id,
        kalipKod: kaliplar.kod,
        kalipAd: kaliplar.ad,
        netMiktar: sql<number>`coalesce(sum(${operatorGunlukKayitlari.net_miktar}), 0)`,
      })
      .from(operatorGunlukKayitlari)
      .innerJoin(uretimEmirleri, eq(operatorGunlukKayitlari.uretim_emri_id, uretimEmirleri.id))
      .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .leftJoin(uretimEmriOperasyonlari, eq(operatorGunlukKayitlari.emir_operasyon_id, uretimEmriOperasyonlari.id))
      .leftJoin(kaliplar, eq(uretimEmriOperasyonlari.kalip_id, kaliplar.id))
      .where(
        and(
          eq(operatorGunlukKayitlari.makine_id, v.makineId),
          gte(operatorGunlukKayitlari.kayit_tarihi, vBaslangic),
          lte(operatorGunlukKayitlari.kayit_tarihi, effectiveBitis),
          sql`(${operatorGunlukKayitlari.emir_operasyon_id} IS NULL OR COALESCE(${uretimEmriOperasyonlari.montaj}, 0) = 0)`,
        ),
      )
      .groupBy(
        uretimEmriOperasyonlari.id,
        uretimEmriOperasyonlari.operasyon_adi,
        urunler.operasyon_tipi,
        kaliplar.id,
        kaliplar.kod,
        kaliplar.ad,
      );

    const { urunKirilimi, uretimToplam, fireToplam } = buildUretimKirilimSummary(uretimRows);
    const operasyonKirilimi: OperasyonKirilim[] = operasyonRows
      .map((r) => ({
        operasyonId: r.operasyonId ?? null,
        operasyonAdi: r.operasyonAdi ?? 'Baskı',
        operasyonTipi: r.operasyonTipi ?? null,
        kalipId: r.kalipId ?? null,
        kalipKod: r.kalipKod ?? null,
        kalipAd: r.kalipAd ?? null,
        miktar: Number(r.netMiktar ?? 0),
      }))
      .sort((a, b) => b.miktar - a.miktar || a.operasyonAdi.localeCompare(b.operasyonAdi, 'tr'));

    // Duruş analizi
    const durusRows = await db
      .select({
        sure_dk: durusKayitlari.sure_dk,
        baslangic: durusKayitlari.baslangic,
        bitis: durusKayitlari.bitis,
        durus_tipi: durusKayitlari.durus_tipi,
        neden: durusKayitlari.neden,
        neden_kod: durusNedenleri.kod,
      })
      .from(durusKayitlari)
      .leftJoin(durusNedenleri, eq(durusKayitlari.durus_nedeni_id, durusNedenleri.id))
      .where(
        and(
          eq(durusKayitlari.makine_id, v.makineId),
          gte(durusKayitlari.baslangic, vBaslangic),
          lte(durusKayitlari.baslangic, effectiveBitis),
        ),
      );

    const d = {
      toplamDk: 0,
      arizaSayisi: 0,
      arizaDk: 0,
      kalipDegisimSayisi: 0,
      kalipDegisimDk: 0,
      bakimSayisi: 0,
      bakimDk: 0,
      digerSayisi: 0,
      digerDk: 0,
    };
    for (const row of durusRows) {
      const sure = row.sure_dk ?? (row.bitis ? diffMinutes(new Date(row.baslangic), new Date(row.bitis)) : 0);
      d.toplamDk += sure;
      const kod = row.neden_kod ?? row.durus_tipi?.toUpperCase() ?? '';
      if (kod === 'ARIZ' || row.durus_tipi === 'ariza') {
        d.arizaSayisi++;
        d.arizaDk += sure;
      } else if (kod === 'KALIP') {
        d.kalipDegisimSayisi++;
        d.kalipDegisimDk += sure;
      } else if (kod === 'BAKIM') {
        d.bakimSayisi++;
        d.bakimDk += sure;
      } else {
        d.digerSayisi++;
        d.digerDk += sure;
      }
    }

    const calismaSuresiDk = Math.max(0, planlananSureDk - d.toplamDk);
    // Basitleştirilmiş OEE: Availability × 0.95 (performance & quality varsayım)
    const availability = planlananSureDk > 0 ? calismaSuresiDk / planlananSureDk : 0;
    const oee = availability * 0.95;

    vardiyalar.push({
      id: v.id,
      makineId: v.makineId,
      makineAd: v.makineAd,
      operatorUserId: v.operatorUserId ?? null,
      operatorAd: v.operatorAd ?? null,
      vardiyaTipi: v.vardiyaTipi,
      baslangic: v.baslangic instanceof Date ? v.baslangic.toISOString() : String(v.baslangic),
      bitis: v.bitis ? (v.bitis instanceof Date ? v.bitis.toISOString() : String(v.bitis)) : null,
      aktif: !v.bitis,
      planlananSureDk,
      calismaSuresiDk,
      durusToplamDk: d.toplamDk,
      uretim: {
        toplamMiktar: uretimToplam,
        netToplam: uretimToplam,
        fireToplam,
        urunKirilimi,
        operasyonKirilimi,
      },
      duruslar: d,
      oee: Number(oee.toFixed(3)),
    });
  }

  const ozet: VardiyaAnalizOzet = {
    toplamUretim: vardiyalar.reduce((s, v) => s + v.uretim.toplamMiktar, 0),
    toplamCalismaDk: vardiyalar.reduce((s, v) => s + v.calismaSuresiDk, 0),
    toplamDurusDk: vardiyalar.reduce((s, v) => s + v.durusToplamDk, 0),
    durusOrani: 0,
    arizaSayisi: vardiyalar.reduce((s, v) => s + v.duruslar.arizaSayisi, 0),
    kalipDegisimSayisi: vardiyalar.reduce((s, v) => s + v.duruslar.kalipDegisimSayisi, 0),
    aktifVardiyaSayisi: vardiyalar.filter((v) => v.aktif).length,
    oee: vardiyalar.length ? vardiyalar.reduce((s, v) => s + v.oee, 0) / vardiyalar.length : 0,
  };
  const toplamSure = ozet.toplamCalismaDk + ozet.toplamDurusDk;
  ozet.durusOrani = toplamSure > 0 ? Number((ozet.toplamDurusDk / toplamSure).toFixed(3)) : 0;
  ozet.oee = Number(ozet.oee.toFixed(3));

  // Makine bazlı rollup — vardiyaları makine_id'ye göre topla
  const makineRollupMap = new Map<string, MakineRollup>();
  for (const v of vardiyalar) {
    const existing = makineRollupMap.get(v.makineId);
    if (existing) {
      existing.vardiyaSayisi += 1;
      existing.aktifVardiya = existing.aktifVardiya || v.aktif;
      existing.toplamUretim += v.uretim.toplamMiktar;
      existing.calismaSuresiDk += v.calismaSuresiDk;
      existing.durusToplamDk += v.durusToplamDk;
      existing.arizaSayisi += v.duruslar.arizaSayisi;
      existing.arizaDk += v.duruslar.arizaDk;
      existing.kalipDegisimSayisi += v.duruslar.kalipDegisimSayisi;
      existing.kalipDegisimDk += v.duruslar.kalipDegisimDk;
      existing.bakimDk += v.duruslar.bakimDk;
      mergeOperasyonKirilimi(existing.operasyonKirilimi, v.uretim.operasyonKirilimi);
    } else {
      makineRollupMap.set(v.makineId, {
        makineId: v.makineId,
        makineAd: v.makineAd,
        vardiyaSayisi: 1,
        aktifVardiya: v.aktif,
        toplamUretim: v.uretim.toplamMiktar,
        calismaSuresiDk: v.calismaSuresiDk,
        durusToplamDk: v.durusToplamDk,
        arizaSayisi: v.duruslar.arizaSayisi,
        arizaDk: v.duruslar.arizaDk,
        kalipDegisimSayisi: v.duruslar.kalipDegisimSayisi,
        kalipDegisimDk: v.duruslar.kalipDegisimDk,
        bakimDk: v.duruslar.bakimDk,
        ortCevrimSaniye: null,
        teorikHedef: null,
        hedefGerceklesmeYuzde: null,
        operasyonKirilimi: v.uretim.operasyonKirilimi.map((item) => ({ ...item })),
        oee: 0,
      });
    }
  }

  // Her makine için teorik hedef hesabı:
  // O tarih aralığında o makinede çalışan üretim emri operasyonlarının
  // ağırlıklı ortalama çevrim süresi × çalışma_dk × 60 / ortCevrim = teorikHedef
  for (const m of makineRollupMap.values()) {
    const cevrimRows = await db
      .select({
        cevrim: uretimEmriOperasyonlari.cevrim_suresi_sn,
        planlanan: uretimEmriOperasyonlari.planlanan_miktar,
      })
      .from(uretimEmriOperasyonlari)
      .innerJoin(uretimEmirleri, eq(uretimEmirleri.id, uretimEmriOperasyonlari.uretim_emri_id))
      .where(
        and(
          // Makinede çalışan operasyonları bulmak için operator_gunluk_kayitlari üzerinden tur
          sql`${uretimEmriOperasyonlari.id} IN (
            SELECT DISTINCT ${operatorGunlukKayitlari.emir_operasyon_id}
            FROM ${operatorGunlukKayitlari}
            WHERE ${operatorGunlukKayitlari.makine_id} = ${m.makineId}
              AND ${operatorGunlukKayitlari.kayit_tarihi} >= ${baslangic}
              AND ${operatorGunlukKayitlari.kayit_tarihi} <= ${bitis}
          )`,
        ),
      );

    if (cevrimRows.length > 0) {
      // Ağırlıklı ortalama (planlanan miktara göre)
      let totalCevrimWeighted = 0;
      let totalWeight = 0;
      for (const row of cevrimRows) {
        const c = Number(row.cevrim ?? 0);
        const w = Number(row.planlanan ?? 1) || 1;
        if (c > 0) {
          totalCevrimWeighted += c * w;
          totalWeight += w;
        }
      }
      if (totalWeight > 0) {
        const avgCevrim = totalCevrimWeighted / totalWeight;
        m.ortCevrimSaniye = Number(avgCevrim.toFixed(2));
        if (m.calismaSuresiDk > 0 && avgCevrim > 0) {
          m.teorikHedef = Math.floor((m.calismaSuresiDk * 60) / avgCevrim);
          m.hedefGerceklesmeYuzde = m.teorikHedef > 0
            ? Number(((m.toplamUretim / m.teorikHedef) * 100).toFixed(1))
            : null;
        }
      }
    }

    // OEE: makine için basitleştirilmiş availability × 0.95
    const planlananSure = m.calismaSuresiDk + m.durusToplamDk;
    const availability = planlananSure > 0 ? m.calismaSuresiDk / planlananSure : 0;
    m.oee = Number((availability * 0.95).toFixed(3));
  }

  const makineler = Array.from(makineRollupMap.values()).sort((a, b) =>
    a.makineAd.localeCompare(b.makineAd, 'tr'),
  );

  // Kalıp bazlı rollup: operator_gunluk_kayitlari → uretim_emri_operasyonlari → kaliplar
  const kalipRows = await db
    .select({
      kalipId: kaliplar.id,
      kalipKod: kaliplar.kod,
      kalipAd: kaliplar.ad,
      makineId: operatorGunlukKayitlari.makine_id,
      makineAd: makinelerTbl.ad,
      urunId: urunler.id,
      urunAd: urunler.ad,
      netMiktar: operatorGunlukKayitlari.net_miktar,
      ekMiktar: operatorGunlukKayitlari.ek_uretim_miktari,
      cevrimSn: uretimEmriOperasyonlari.cevrim_suresi_sn,
    })
    .from(operatorGunlukKayitlari)
    .innerJoin(uretimEmriOperasyonlari, eq(operatorGunlukKayitlari.emir_operasyon_id, uretimEmriOperasyonlari.id))
    .innerJoin(kaliplar, eq(uretimEmriOperasyonlari.kalip_id, kaliplar.id))
    .innerJoin(uretimEmirleri, eq(uretimEmriOperasyonlari.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .leftJoin(makinelerTbl, eq(operatorGunlukKayitlari.makine_id, makinelerTbl.id))
    .where(
      and(
        gte(operatorGunlukKayitlari.kayit_tarihi, baslangic),
        lte(operatorGunlukKayitlari.kayit_tarihi, bitis),
        query.makineId ? eq(operatorGunlukKayitlari.makine_id, query.makineId) : sql`1 = 1`,
        eq(uretimEmriOperasyonlari.montaj, 0),
      ),
    );

  const kalipMap = new Map<string, KalipRollup & { _makineSet: Set<string>; _urunSet: Set<string> }>();
  for (const r of kalipRows) {
    if (!r.kalipId) continue;
    const miktar = Number(r.netMiktar ?? 0);
    const cevrimSn = Number(r.cevrimSn ?? 0);
    const sureDk = cevrimSn > 0 ? (miktar * cevrimSn) / 60 : 0;
    const entry = kalipMap.get(r.kalipId);
    if (entry) {
      entry.toplamUretim += miktar;
      entry.calismaDk += sureDk;
      if (r.makineAd) entry._makineSet.add(r.makineAd);
      if (r.urunAd) entry._urunSet.add(r.urunAd);
    } else {
      const mSet = new Set<string>();
      const uSet = new Set<string>();
      if (r.makineAd) mSet.add(r.makineAd);
      if (r.urunAd) uSet.add(r.urunAd);
      kalipMap.set(r.kalipId, {
        kalipId: r.kalipId,
        kalipKod: r.kalipKod,
        kalipAd: r.kalipAd,
        toplamUretim: miktar,
        calismaDk: sureDk,
        makineSayisi: 0,
        makineler: [],
        urunSayisi: 0,
        urunler: [],
        kalipDegisimSayisi: 0,
        _makineSet: mSet,
        _urunSet: uSet,
      });
    }
  }

  // Makinedeki kalıp değişim sayısı toplamdan yaklaşık değer — kalıp bazlı tam bilgi yok
  const toplamKalipDegisim = vardiyalar.reduce((s, v) => s + v.duruslar.kalipDegisimSayisi, 0);
  const kalipListesi: KalipRollup[] = Array.from(kalipMap.values())
    .map((e) => ({
      kalipId: e.kalipId,
      kalipKod: e.kalipKod,
      kalipAd: e.kalipAd,
      toplamUretim: e.toplamUretim,
      calismaDk: Math.round(e.calismaDk),
      makineSayisi: e._makineSet.size,
      makineler: Array.from(e._makineSet).sort((a, b) => a.localeCompare(b, 'tr')),
      urunSayisi: e._urunSet.size,
      urunler: Array.from(e._urunSet).sort((a, b) => a.localeCompare(b, 'tr')),
      // Toplam kalıp değişim makine bazında sayılıyor, kalıp bazına paylaştır yaklaşık
      kalipDegisimSayisi: kalipMap.size > 0 ? Math.round(toplamKalipDegisim / kalipMap.size) : 0,
    }))
    .sort((a, b) => b.toplamUretim - a.toplamUretim);

  return { tarih: tarihLabel, vardiyalar, makineler, kaliplar: kalipListesi, ozet };
}

export type TrendGun = {
  tarih: string;
  toplamUretim: number;
  toplamCalismaDk: number;
  toplamDurusDk: number;
  arizaSayisi: number;
  kalipDegisimSayisi: number;
  oee: number;
};

export type TrendResponse = {
  gunSayisi: number;
  gunler: TrendGun[];
};

export async function getTrend(query: TrendQuery): Promise<TrendResponse> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - (query.gunSayisi - 1));
  start.setHours(0, 0, 0, 0);

  // Her gün için tek tek getVardiyaAnalizi çağrısı pahalı olur; tek sorguda aggregate et
  // Basit yaklaşım: her gün için küçük bir analiz
  const gunler: TrendGun[] = [];
  for (let i = 0; i < query.gunSayisi; i++) {
    const gun = new Date(start);
    gun.setDate(start.getDate() + i);
    const tarih = gun.toISOString().slice(0, 10);
    const analiz = await getVardiyaAnalizi({ tarih, makineId: query.makineId });
    gunler.push({
      tarih,
      toplamUretim: analiz.ozet.toplamUretim,
      toplamCalismaDk: analiz.ozet.toplamCalismaDk,
      toplamDurusDk: analiz.ozet.toplamDurusDk,
      arizaSayisi: analiz.ozet.arizaSayisi,
      kalipDegisimSayisi: analiz.ozet.kalipDegisimSayisi,
      oee: analiz.ozet.oee,
    });
  }
  return { gunSayisi: query.gunSayisi, gunler };
}
