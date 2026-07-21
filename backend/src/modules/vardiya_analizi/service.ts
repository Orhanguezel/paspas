import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { makineler as makinelerTbl } from '@/modules/makine_havuzu/schema';
import { durusKayitlari, vardiyaKayitlari } from '@/modules/operator/schema';
import { durusNedenleri, kaliplar, vardiyalar as vardiyaTanimlari } from '@/modules/tanimlar/schema';

import {
  assignVardiya,
  buildShiftWindowForTime,
  calculateOee,
  calculateVerimlilik,
  clampDate,
  diffMinutes,
  fromLocal,
  inferVardiyaTipi,
  partitionByMakine,
  reduceOzet,
  resolveNet,
  toLocal,
  VARDIYA_TZ_OFFSET_DK,
  roundRatio,
  sonIkiCalisilanSlot,
  vardiyaSlotKey,
  type OperasyonKirilim,
  type UretimKaydi as CoreUretimKaydi,
  type UrunKirilim,
  type VardiyaSlot,
  type VardiyaTanimi,
  type VardiyaTipi,
} from './core';
import { fetchUretimKayitlari } from './repository';
import type { ListQuery, TrendQuery } from './validation';

export type { OperasyonKirilim, UrunKirilim };

export type MontajUretim = {
  netToplam: number;
  kayitSayisi: number;
  operasyonlar: OperasyonKirilim[];
};

export type VardiyaAnalizItem = {
  id: string;
  makineId: string;
  makineKod: string | null;
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
  duruslar: DurusOzet;
  oee: number | null;
  verimlilik: number | null;
  verimlilikNet: number | null;
  verimlilikVardiya: number | null;
  montajUretim: MontajUretim;
};

export type VardiyaAnalizOzet = {
  toplamUretim: number;
  toplamFire: number;
  toplamCalismaDk: number;
  toplamDurusDk: number;
  durusSayisi: number;
  durusOrani: number;
  arizaSayisi: number;
  kalipDegisimSayisi: number;
  aktifVardiyaSayisi: number;
  oee: number | null;
};

export type MakineRollup = {
  makineId: string;
  makineKod: string | null;
  makineAd: string;
  vardiyaSayisi: number;
  aktifVardiya: boolean;
  toplamUretim: number;
  fireToplam: number;
  calismaSuresiDk: number;
  durusToplamDk: number;
  durusSayisi: number;
  arizaSayisi: number;
  arizaDk: number;
  kalipDegisimSayisi: number;
  kalipDegisimDk: number;
  bakimDk: number;
  ortCevrimSaniye: number | null;
  teorikHedef: number | null;
  hedefGerceklesmeYuzde: number | null;
  operasyonKirilimi: OperasyonKirilim[];
  montajUretim: MontajUretim;
  oee: number | null;
  verimlilikNet: number | null;
  verimlilikVardiya: number | null;
};

export type UretimKaydiOzet = {
  id: string;
  vardiyaTipi: string;
  vardiyaBaslangic: string | null;
  vardiyaBitis: string | null;
  makineId: string | null;
  makineKod: string | null;
  makineAd: string | null;
  baslangic: string;
  bitis: string | null;
  urunAd: string;
  urunKod: string | null;
  operasyonAdi: string | null;
  montaj: boolean;
  ekUretimMiktari: number;
  netMiktar: number;
  fireMiktar: number;
  verimlilik: number | null;
  verimlilikNet: number | null;
  verimlilikVardiya: number | null;
  operatorAd: string | null;
  notlar: string | null;
};

export type DurusDetayOzet = {
  id: string;
  makineId: string;
  makineAd: string | null;
  baslangic: string;
  bitis: string | null;
  sureDk: number;
  neden: string;
  operatorAd: string | null;
};

export type DurusNedeniOzet = {
  neden: string;
  adet: number;
  toplamDk: number;
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
  uretimKayitlari: UretimKaydiOzet[];
  durusDetaylari: DurusDetayOzet[];
  durusOzeti: DurusNedeniOzet[];
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

type VardiyaRow = {
  id: string;
  makineId: string;
  makineKod: string | null;
  operatorUserId: string | null;
  vardiyaTipi: string;
  baslangic: Date;
  bitis: Date | null;
  makineAd: string;
  operatorAd: string | null;
};

type DurusRow = {
  id: string;
  makineId: string;
  makineAd: string | null;
  baslangic: Date;
  bitis: Date | null;
  sureDk: number | null;
  durusTipi: string;
  neden: string;
  nedenKod: string | null;
  operatorUserId: string | null;
  operatorAd: string | null;
};

type DurusOzet = {
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

function dateRange(query: ListQuery, now: Date): { baslangic: Date; bitis: Date; tarihLabel: string } {
  const dateAtLocal = (dateKey: string, clock: string): Date => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const [hour, minute] = clock.split(':').map(Number);
    return fromLocal(new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0)), VARDIYA_TZ_OFFSET_DK);
  };

  if (query.baslangicTarih && query.bitisTarih) {
    if (query.vardiyaCifti) {
      // Çalışılmayan hafta sonu/tatil aralıklarını aşabilmek için aday çalışma
      // slotlarını geniş bir üretim penceresinden al; aşağıda saf fonksiyon ikiye indirir.
      return {
        baslangic: new Date(now.getTime() - 31 * 24 * 60 * 60_000),
        bitis: now,
        tarihLabel: `${query.baslangicTarih} - ${query.bitisTarih}`,
      };
    }
    return {
      baslangic: dateAtLocal(query.baslangicTarih, '00:00'),
      bitis: dateAtLocal(query.bitisTarih, '23:59'),
      tarihLabel: `${query.baslangicTarih} - ${query.bitisTarih}`,
    };
  }
  const tarih = query.tarih ?? new Date().toISOString().slice(0, 10);
  const baslangic = dateAtLocal(tarih, '00:00');
  const [year, month, day] = tarih.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  const bitis = fromLocal(new Date(Date.UTC(nextDay.getUTCFullYear(), nextDay.getUTCMonth(), nextDay.getUTCDate(), 7, 30, 0, 0)), VARDIYA_TZ_OFFSET_DK);
  return { baslangic, bitis, tarihLabel: tarih };
}

/** makineId/vardiyaTipi tek değer (string) veya çoklu (string[]) gelebilir (validation union).
 *  İki dalı da tek listeye indirger; string dalı sessizce düşmez. */
function normalizeToList(raw: string | string[] | undefined): string[] | undefined {
  const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return arr.length > 0 ? arr : undefined;
}

function selectedMakineIds(query: ListQuery): string[] | undefined {
  return normalizeToList(query.makineId);
}

function selectedVardiyaTipleri(query: ListQuery): string[] | undefined {
  return normalizeToList(query.vardiyaTipi);
}

function machineCondition(query: ListQuery, column: any) {
  const ids = selectedMakineIds(query);
  return ids ? inArray(column, ids) : sql`1 = 1`;
}

function shiftTypeCondition(query: ListQuery, column: any) {
  const tipler = selectedVardiyaTipleri(query);
  return tipler ? inArray(column, tipler) : sql`1 = 1`;
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

function makineBaslik(kod: string | null, ad: string): string {
  return kod ? `${kod} — ${ad}` : ad;
}

function emptyDurusOzet(): DurusOzet {
  return {
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
}

function summarizeDuruslar(rows: DurusRow[]): DurusOzet {
  const d = emptyDurusOzet();
  for (const row of rows) {
    const sure = row.sureDk ?? (row.bitis ? diffMinutes(new Date(row.baslangic), new Date(row.bitis)) : 0);
    d.toplamDk += sure;
    const kod = row.nedenKod ?? row.durusTipi?.toUpperCase() ?? '';
    if (kod === 'ARIZ' || row.durusTipi === 'ariza') {
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
  return d;
}

function filterDuruslarForWindow(rows: DurusRow[], makineId: string, baslangic: Date, bitis: Date) {
  return rows.filter((row) => row.makineId === makineId && new Date(row.baslangic) >= baslangic && new Date(row.baslangic) <= bitis);
}

function montajFromOzet(ozet: ReturnType<typeof reduceOzet>): MontajUretim {
  return {
    netToplam: ozet.montajNet,
    kayitSayisi: ozet.montajKayitSayisi,
    operasyonlar: ozet.montajOperasyonKirilimi,
  };
}

function sameSlot(slot: VardiyaSlot, kayit: CoreUretimKaydi, tanimlar: VardiyaTanimi[]) {
  const kayitSlot = kayit.vardiyaSlotOverride ?? assignVardiya(kayit.kayitTarihi, tanimlar, VARDIYA_TZ_OFFSET_DK);
  return vardiyaSlotKey(kayitSlot, VARDIYA_TZ_OFFSET_DK) === vardiyaSlotKey(slot, VARDIYA_TZ_OFFSET_DK);
}

async function fetchDurusRows(query: ListQuery, baslangic: Date, bitis: Date): Promise<DurusRow[]> {
  return db
    .select({
      id: durusKayitlari.id,
      makineId: durusKayitlari.makine_id,
      makineAd: makinelerTbl.ad,
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
    .leftJoin(makinelerTbl, eq(durusKayitlari.makine_id, makinelerTbl.id))
    .leftJoin(users, eq(durusKayitlari.operator_user_id, users.id))
    .where(
      and(
        gte(durusKayitlari.baslangic, baslangic),
        lte(durusKayitlari.baslangic, bitis),
        machineCondition(query, durusKayitlari.makine_id),
      ),
    )
    .orderBy(asc(durusKayitlari.baslangic));
}

function slotForRealVardiya(row: VardiyaRow, tanimlar: VardiyaTanimi[]): VardiyaSlot {
  return assignVardiya(new Date(row.baslangic), tanimlar, VARDIYA_TZ_OFFSET_DK);
}

type SlotMeta = {
  id: string;
  makineId: string;
  makineKod: string | null;
  makineAd: string;
  operatorUserId: string | null;
  operatorAd: string | null;
  slot: VardiyaSlot;
  realBaslangic: Date | null;
  realBitis: Date | null;
};

function createSlotMetas(vardiyaRows: VardiyaRow[], kayitlar: CoreUretimKaydi[], tanimlar: VardiyaTanimi[], query: ListQuery) {
  const selectedTipler = selectedVardiyaTipleri(query);
  const metas = new Map<string, SlotMeta>();
  const keyOf = (makineId: string, slot: VardiyaSlot) => `${makineId}-${vardiyaSlotKey(slot)}`;

  for (const row of vardiyaRows) {
    const slot = slotForRealVardiya(row, tanimlar);
    if (selectedTipler && !selectedTipler.includes(slot.vardiyaTipi)) continue;
    metas.set(keyOf(row.makineId, slot), {
      id: row.id,
      makineId: row.makineId,
      makineKod: row.makineKod,
      makineAd: row.makineAd,
      operatorUserId: row.operatorUserId ?? null,
      operatorAd: row.operatorAd ?? null,
      slot,
      realBaslangic: new Date(row.baslangic),
      realBitis: row.bitis ? new Date(row.bitis) : null,
    });
  }

  for (const kayit of kayitlar) {
    const slot = kayit.vardiyaSlotOverride ?? assignVardiya(kayit.kayitTarihi, tanimlar, VARDIYA_TZ_OFFSET_DK);
    if (selectedTipler && !selectedTipler.includes(slot.vardiyaTipi)) continue;
    const key = keyOf(kayit.makineId, slot);
    if (metas.has(key)) continue;
    metas.set(key, {
      id: `synthetic-${key}`,
      makineId: kayit.makineId,
      makineKod: kayit.makineKod,
      makineAd: kayit.makineAd,
      operatorUserId: kayit.operatorUserId,
      operatorAd: kayit.operatorAd,
      slot,
      realBaslangic: null,
      realBitis: null,
    });
  }

  return Array.from(metas.values()).sort((a, b) => b.slot.baslangic.getTime() - a.slot.baslangic.getTime());
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
  montaj: boolean;
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
    const rows = await db.select({ ad: makinelerTbl.ad }).from(makinelerTbl).where(eq(makinelerTbl.id, params.makineId)).limit(1);
    if (!rows[0]) return null;
    makineId = params.makineId;
    makineAd = rows[0].ad;
    baslangic = new Date(`${params.baslangicTarih}T00:00:00`);
    bitis = new Date(`${params.bitisTarih}T23:59:59`);
  } else if (params.makineId && params.tarih) {
    const rows = await db.select({ ad: makinelerTbl.ad }).from(makinelerTbl).where(eq(makinelerTbl.id, params.makineId)).limit(1);
    if (!rows[0]) return null;
    makineId = params.makineId;
    makineAd = rows[0].ad;
    baslangic = new Date(`${params.tarih}T00:00:00`);
    bitis = new Date(`${params.tarih}T23:59:59`);
  } else {
    return null;
  }

  const durusRows = await fetchDurusRows({ makineId: [makineId] }, baslangic, bitis);
  const duruslar: DurusDetay[] = durusRows.map((r) => {
    const bitisDate = r.bitis ? new Date(r.bitis) : null;
    return {
      id: r.id,
      baslangic: r.baslangic.toISOString(),
      bitis: r.bitis ? r.bitis.toISOString() : null,
      sureDk: r.sureDk ?? (bitisDate ? diffMinutes(new Date(r.baslangic), bitisDate) : 0),
      durusTipi: r.durusTipi,
      neden: r.neden,
      nedenKod: r.nedenKod ?? null,
      operatorUserId: r.operatorUserId ?? null,
      operatorAd: r.operatorAd ?? null,
    };
  });

  const kayitlar = await fetchUretimKayitlari({ baslangic, bitis }, [makineId]);
  const uretimKayitlari: UretimKaydi[] = kayitlar.map((r) => ({
    id: r.id,
    kayitTarihi: r.kayitTarihi.toISOString(),
    urunId: r.urunId,
    urunAd: r.urunAd,
    urunKod: r.urunKod,
    netMiktar: r.net,
    fireMiktar: r.fire,
    montaj: r.montaj,
    operatorAd: r.operatorAd,
    notlar: r.notlar,
    operasyonAdi: r.operasyonAdi,
    operasyonTipi: r.operasyonTipi,
    kalipKod: r.kalipKod,
    kalipAd: r.kalipAd,
  }));

  const saatMap = new Map<string, number>();
  for (const k of kayitlar) {
    const saat = toLocal(k.kayitTarihi, VARDIYA_TZ_OFFSET_DK).getUTCHours().toString().padStart(2, '0');
    saatMap.set(saat, (saatMap.get(saat) ?? 0) + k.net);
  }
  const saatlikUretim: SaatlikUretim[] = Array.from({ length: 24 }, (_, i) => {
    const saat = i.toString().padStart(2, '0');
    return { saat: `${saat}:00`, miktar: saatMap.get(saat) ?? 0 };
  });

  const emirMap = new Map<string, BagliEmir>();
  for (const kayit of kayitlar) {
    if (!emirMap.has(kayit.uretimEmriId)) {
      emirMap.set(kayit.uretimEmriId, {
        emirId: kayit.uretimEmriId,
        emirNo: kayit.emirNo,
        urunAd: kayit.urunAd,
        planlanan: kayit.planlananMiktar,
        uretilen: kayit.uretilenMiktar,
      });
    }
  }

  return {
    makineId,
    makineAd,
    baslangic: baslangic.toISOString(),
    bitis: bitis.toISOString(),
    duruslar,
    uretimKayitlari,
    saatlikUretim,
    bagliEmirler: Array.from(emirMap.values()),
  };
}

export async function getVardiyaAnalizi(query: ListQuery): Promise<VardiyaAnalizResponse> {
  const now = new Date();
  const { baslangic, bitis, tarihLabel } = dateRange(query, now);
  const vardiyaTanimlariList = await listActiveVardiyaTanimlari();
  let kayitlar = await fetchUretimKayitlari({ baslangic, bitis }, selectedMakineIds(query));

  const vardiyaConditions = [
    sql`${vardiyaKayitlari.baslangic} <= ${bitis}`,
    sql`(
      (${vardiyaKayitlari.bitis} IS NOT NULL AND ${vardiyaKayitlari.bitis} >= ${baslangic})
      OR (${vardiyaKayitlari.bitis} IS NULL AND ${vardiyaKayitlari.baslangic} >= DATE_SUB(${baslangic}, INTERVAL 2 DAY))
    )`,
    machineCondition(query, vardiyaKayitlari.makine_id),
    shiftTypeCondition(query, vardiyaKayitlari.vardiya_tipi),
  ];

  const vardiyaRows: VardiyaRow[] = await db
    .select({
      id: vardiyaKayitlari.id,
      makineId: vardiyaKayitlari.makine_id,
      makineKod: makinelerTbl.kod,
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

  const durusRows = await fetchDurusRows(query, baslangic, bitis);
  let slotMetas = createSlotMetas(vardiyaRows, kayitlar, vardiyaTanimlariList, query);
  if (query.vardiyaCifti) {
    const allowed = new Set<string>();
    const makineIds = new Set(slotMetas.map((meta) => meta.makineId));
    for (const makineId of makineIds) {
      const makineMetas = slotMetas.filter((meta) => meta.makineId === makineId);
      for (const slot of sonIkiCalisilanSlot({ now, slotlar: makineMetas.map((meta) => meta.slot) })) {
        allowed.add(`${makineId}-${vardiyaSlotKey(slot)}`);
      }
    }
    slotMetas = slotMetas.filter((meta) => allowed.has(`${meta.makineId}-${vardiyaSlotKey(meta.slot)}`));
    kayitlar = kayitlar.filter((kayit) => {
      const slot = kayit.vardiyaSlotOverride ?? assignVardiya(kayit.kayitTarihi, vardiyaTanimlariList, VARDIYA_TZ_OFFSET_DK);
      return allowed.has(`${kayit.makineId}-${vardiyaSlotKey(slot)}`);
    });
  }
  const vardiyalar: VardiyaAnalizItem[] = [];

  for (const meta of slotMetas) {
    const effectiveBitis = clampDate(meta.realBitis ?? meta.slot.bitis, baslangic, bitis);
    const vBaslangic = clampDate(meta.realBaslangic ?? meta.slot.baslangic, baslangic, bitis);
    const slotKayitlari = kayitlar.filter((kayit) => kayit.makineId === meta.makineId && sameSlot(meta.slot, kayit, vardiyaTanimlariList));
    const ozet = reduceOzet(slotKayitlari);
    const duruslar = summarizeDuruslar(filterDuruslarForWindow(durusRows, meta.makineId, vBaslangic, effectiveBitis));
    const planlananSureDk = diffMinutes(vBaslangic, effectiveBitis);
    const calismaSuresiDk = Math.max(0, planlananSureDk - duruslar.toplamDk);
    const oee = calculateOee({
      planlananSureDk,
      calismaSuresiDk,
      net: ozet.baskiNet,
      fire: ozet.baskiFire,
      idealCalismaSn: ozet.idealCalismaSn,
      hasCycle: ozet.hasCycle,
    });
    const verimlilik = calculateVerimlilik({ net: ozet.baskiNet, sureDk: calismaSuresiDk, cevrimSn: ozet.ortCevrimSn });
    const verimlilikVardiya = calculateVerimlilik({ net: ozet.baskiNet, sureDk: planlananSureDk, cevrimSn: ozet.ortCevrimSn });

    vardiyalar.push({
      id: meta.id,
      makineId: meta.makineId,
      makineKod: meta.makineKod,
      makineAd: makineBaslik(meta.makineKod, meta.makineAd),
      operatorUserId: meta.operatorUserId,
      operatorAd: meta.operatorAd,
      vardiyaTipi: meta.slot.vardiyaTipi,
      baslangic: meta.slot.baslangic.toISOString(),
      bitis: meta.realBitis ? meta.realBitis.toISOString() : meta.slot.bitis.toISOString(),
      aktif: meta.realBaslangic !== null && meta.realBitis === null,
      planlananSureDk,
      calismaSuresiDk,
      durusToplamDk: duruslar.toplamDk,
      uretim: {
        toplamMiktar: ozet.net,
        netToplam: ozet.net,
        fireToplam: ozet.fire,
        urunKirilimi: ozet.urunKirilimi,
        operasyonKirilimi: ozet.operasyonKirilimi,
      },
      duruslar,
      oee,
      verimlilik,
      verimlilikNet: verimlilik,
      verimlilikVardiya,
      montajUretim: montajFromOzet(ozet),
    });
  }

  const ozet: VardiyaAnalizOzet = {
    toplamUretim: vardiyalar.reduce((s, v) => s + v.uretim.toplamMiktar, 0),
    toplamFire: vardiyalar.reduce((s, v) => s + v.uretim.fireToplam, 0),
    toplamCalismaDk: vardiyalar.reduce((s, v) => s + v.calismaSuresiDk, 0),
    toplamDurusDk: vardiyalar.reduce((s, v) => s + v.durusToplamDk, 0),
    durusSayisi: vardiyalar.reduce((s, v) => s + v.duruslar.arizaSayisi + v.duruslar.kalipDegisimSayisi + v.duruslar.bakimSayisi + v.duruslar.digerSayisi, 0),
    durusOrani: 0,
    arizaSayisi: vardiyalar.reduce((s, v) => s + v.duruslar.arizaSayisi, 0),
    kalipDegisimSayisi: vardiyalar.reduce((s, v) => s + v.duruslar.kalipDegisimSayisi, 0),
    aktifVardiyaSayisi: vardiyalar.filter((v) => v.aktif).length,
    oee: null,
  };
  const toplamSure = ozet.toplamCalismaDk + ozet.toplamDurusDk;
  ozet.durusOrani = toplamSure > 0 ? Number((ozet.toplamDurusDk / toplamSure).toFixed(3)) : 0;
  const oeeValues = vardiyalar.map((v) => v.oee).filter((value): value is number => value !== null);
  ozet.oee = oeeValues.length ? roundRatio(oeeValues.reduce((s, value) => s + value, 0) / oeeValues.length) : null;

  const makineMap = partitionByMakine(kayitlar);
  const makineIds = new Set<string>([...makineMap.keys(), ...vardiyalar.map((v) => v.makineId)]);
  const makineler: MakineRollup[] = Array.from(makineIds).map((makineId) => {
    const makineKayitlari = makineMap.get(makineId) ?? [];
    const prod = reduceOzet(makineKayitlari);
    const makineVardiyalari = vardiyalar.filter((v) => v.makineId === makineId);
    const calismaSuresiDk = makineVardiyalari.reduce((sum, v) => sum + v.calismaSuresiDk, 0);
    const durusToplamDk = makineVardiyalari.reduce((sum, v) => sum + v.durusToplamDk, 0);
    const planlananSureDk = calismaSuresiDk + durusToplamDk;
    const teorikHedef = prod.ortCevrimSn && calismaSuresiDk > 0 ? Math.floor((calismaSuresiDk * 60) / prod.ortCevrimSn) : null;
    const first = makineKayitlari[0];
    const firstVardiya = makineVardiyalari[0];
    const makineKod = first?.makineKod ?? firstVardiya?.makineKod ?? null;
    const makineAd = first ? first.makineAd : (firstVardiya?.makineAd ?? 'Makine').split(' — ').pop() ?? 'Makine';
    return {
      makineId,
      makineKod,
      makineAd: makineBaslik(makineKod, makineAd),
      vardiyaSayisi: makineVardiyalari.length,
      aktifVardiya: makineVardiyalari.some((v) => v.aktif),
      toplamUretim: prod.net,
      fireToplam: prod.fire,
      calismaSuresiDk,
      durusToplamDk,
      durusSayisi: makineVardiyalari.reduce((s, v) => s + v.duruslar.arizaSayisi + v.duruslar.kalipDegisimSayisi + v.duruslar.bakimSayisi + v.duruslar.digerSayisi, 0),
      arizaSayisi: makineVardiyalari.reduce((s, v) => s + v.duruslar.arizaSayisi, 0),
      arizaDk: makineVardiyalari.reduce((s, v) => s + v.duruslar.arizaDk, 0),
      kalipDegisimSayisi: makineVardiyalari.reduce((s, v) => s + v.duruslar.kalipDegisimSayisi, 0),
      kalipDegisimDk: makineVardiyalari.reduce((s, v) => s + v.duruslar.kalipDegisimDk, 0),
      bakimDk: makineVardiyalari.reduce((s, v) => s + v.duruslar.bakimDk, 0),
      ortCevrimSaniye: prod.ortCevrimSn ? Number(prod.ortCevrimSn.toFixed(2)) : null,
      teorikHedef,
      hedefGerceklesmeYuzde: teorikHedef && teorikHedef > 0 ? Number(((prod.baskiNet / teorikHedef) * 100).toFixed(1)) : null,
      operasyonKirilimi: prod.operasyonKirilimi,
      montajUretim: montajFromOzet(prod),
      oee: calculateOee({
        planlananSureDk,
        calismaSuresiDk,
        net: prod.baskiNet,
        fire: prod.baskiFire,
        idealCalismaSn: prod.idealCalismaSn,
        hasCycle: prod.hasCycle,
      }),
      verimlilikNet: calculateVerimlilik({ net: prod.baskiNet, sureDk: calismaSuresiDk, cevrimSn: prod.ortCevrimSn }),
      verimlilikVardiya: calculateVerimlilik({ net: prod.baskiNet, sureDk: planlananSureDk, cevrimSn: prod.ortCevrimSn }),
    };
  }).sort((a, b) => a.makineAd.localeCompare(b.makineAd, 'tr'));

  const toplamKalipDegisim = vardiyalar.reduce((s, v) => s + v.duruslar.kalipDegisimSayisi, 0);
  const kalipMap = new Map<string, KalipRollup & { _makineSet: Set<string>; _urunSet: Set<string> }>();
  for (const kayit of kayitlar) {
    // V20/R2 — kalıbı olan montaj kaydı fiziksel olarak baskı yapıyor, kalıp
    // istatistiğine dahil edilir. Kalıpsız montaj zaten bu koşulda eleniyor.
    if (!kayit.kalipId || !kayit.kalipKod || !kayit.kalipAd) continue;
    const sureDk = kayit.cevrimSn && kayit.cevrimSn > 0 ? (kayit.net * kayit.cevrimSn) / 60 : 0;
    const existing = kalipMap.get(kayit.kalipId);
    if (existing) {
      existing.toplamUretim += kayit.net;
      existing.calismaDk += sureDk;
      existing._makineSet.add(makineBaslik(kayit.makineKod, kayit.makineAd));
      existing._urunSet.add(kayit.urunAd);
    } else {
      kalipMap.set(kayit.kalipId, {
        kalipId: kayit.kalipId,
        kalipKod: kayit.kalipKod,
        kalipAd: kayit.kalipAd,
        toplamUretim: kayit.net,
        calismaDk: sureDk,
        makineSayisi: 0,
        makineler: [],
        urunSayisi: 0,
        urunler: [],
        kalipDegisimSayisi: 0,
        _makineSet: new Set([makineBaslik(kayit.makineKod, kayit.makineAd)]),
        _urunSet: new Set([kayit.urunAd]),
      });
    }
  }
  const kalipListesi: KalipRollup[] = Array.from(kalipMap.values()).map((entry) => ({
    kalipId: entry.kalipId,
    kalipKod: entry.kalipKod,
    kalipAd: entry.kalipAd,
    toplamUretim: entry.toplamUretim,
    calismaDk: Math.round(entry.calismaDk),
    makineSayisi: entry._makineSet.size,
    makineler: Array.from(entry._makineSet).sort((a, b) => a.localeCompare(b, 'tr')),
    urunSayisi: entry._urunSet.size,
    urunler: Array.from(entry._urunSet).sort((a, b) => a.localeCompare(b, 'tr')),
    kalipDegisimSayisi: kalipMap.size > 0 ? Math.round(toplamKalipDegisim / kalipMap.size) : 0,
  })).sort((a, b) => b.toplamUretim - a.toplamUretim);

  // V20/R6 — Kaydı vardiyasına slot-key ile eşleştir (makineId + gün + vardiyaTipi).
  // Eskiden `v.baslangic === slot.baslangic.toISOString()` ile ISO-string tam eşleşmesi
  // yapılıyordu; ama `vardiyaSlotOverride` gerçek vardiya açılış zamanını taşırken
  // `v.baslangic` teorik slot başlangıcını taşıyor → ISO eşleşmiyor → vardiya çifti
  // modunda TÜM kayıtlar eleniyor (uretimKayitlari boş → ekran boş). Sistemin geri
  // kalanı (kayıt filtresi, slotMeta üretimi) zaten vardiyaSlotKey kullanıyor.
  const vardiyaByKey = new Map<string, VardiyaAnalizItem>();
  for (const meta of slotMetas) {
    const v = vardiyalar.find((item) => item.id === meta.id);
    if (v) vardiyaByKey.set(`${meta.makineId}-${vardiyaSlotKey(meta.slot)}`, v);
  }
  const vardiyaByRecord = (kayit: CoreUretimKaydi) => {
    const slot = kayit.vardiyaSlotOverride ?? assignVardiya(kayit.kayitTarihi, vardiyaTanimlariList, VARDIYA_TZ_OFFSET_DK);
    return vardiyaByKey.get(`${kayit.makineId}-${vardiyaSlotKey(slot)}`) ?? null;
  };

  const TAM_VARDIYA_SURE_DK = 12 * 60;
  const uretimKayitlari = kayitlar
    .map((kayit): UretimKaydiOzet | null => {
      const vardiya = vardiyaByRecord(kayit);
      if (query.vardiyaCifti && !vardiya) return null;
      if (selectedVardiyaTipleri(query) && (!vardiya || !selectedVardiyaTipleri(query)!.includes(vardiya.vardiyaTipi))) return null;
      const sureDk = kayit.operasyonBaslangic && kayit.operasyonBitis ? diffMinutes(kayit.operasyonBaslangic, kayit.operasyonBitis) : 0;
      const verimlilikNet = kayit.montaj ? null : calculateVerimlilik({ net: kayit.net, sureDk, cevrimSn: kayit.cevrimSn });
      const verimlilikVardiya = kayit.montaj ? null : calculateVerimlilik({ net: kayit.net, sureDk: TAM_VARDIYA_SURE_DK, cevrimSn: kayit.cevrimSn });
      return {
        id: kayit.id,
        vardiyaTipi: vardiya?.vardiyaTipi ?? (kayit.vardiyaSlotOverride ?? assignVardiya(kayit.kayitTarihi, vardiyaTanimlariList, VARDIYA_TZ_OFFSET_DK)).vardiyaTipi,
        vardiyaBaslangic: vardiya?.baslangic ?? kayit.vardiyaSlotOverride?.baslangic.toISOString() ?? null,
        vardiyaBitis: vardiya?.bitis ?? kayit.vardiyaSlotOverride?.bitis.toISOString() ?? null,
        makineId: kayit.makineId,
        makineKod: kayit.makineKod,
        makineAd: makineBaslik(kayit.makineKod, kayit.makineAd),
        baslangic: kayit.kayitTarihi.toISOString(),
        bitis: null,
        urunAd: kayit.urunAd,
        urunKod: kayit.urunKod,
        operasyonAdi: kayit.operasyonAdi,
        montaj: kayit.montaj,
        ekUretimMiktari: kayit.ek,
        netMiktar: kayit.net,
        fireMiktar: kayit.fire,
        verimlilik: verimlilikNet,
        verimlilikNet,
        verimlilikVardiya,
        operatorAd: kayit.operatorAd,
        notlar: kayit.notlar,
      };
    })
    .filter((row): row is UretimKaydiOzet => row !== null)
    .sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime());

  const durusDetaylari: DurusDetayOzet[] = durusRows
    .map((row) => {
      const slot = vardiyalar.find((v) => {
        if (v.makineId !== row.makineId) return false;
        const start = new Date(v.baslangic);
        const end = v.bitis ? new Date(v.bitis) : bitis;
        return row.baslangic >= start && row.baslangic <= end;
      });
      if (query.vardiyaCifti && !slot) return null;
      if (selectedVardiyaTipleri(query) && (!slot || !selectedVardiyaTipleri(query)!.includes(slot.vardiyaTipi))) return null;
      return {
        id: row.id,
        makineId: row.makineId,
        makineAd: row.makineAd ? makineBaslik(null, row.makineAd) : null,
        baslangic: row.baslangic.toISOString(),
        bitis: row.bitis ? row.bitis.toISOString() : null,
        sureDk: row.sureDk ?? (row.bitis ? diffMinutes(new Date(row.baslangic), new Date(row.bitis)) : 0),
        neden: row.neden,
        operatorAd: row.operatorAd ?? null,
      };
    })
    .filter((row): row is DurusDetayOzet => row !== null);

  const durusOzetiMap = new Map<string, DurusNedeniOzet>();
  for (const row of durusDetaylari) {
    const key = row.neden || 'Diğer';
    const existing = durusOzetiMap.get(key);
    if (existing) {
      existing.adet += 1;
      existing.toplamDk += row.sureDk;
    } else {
      durusOzetiMap.set(key, { neden: key, adet: 1, toplamDk: row.sureDk });
    }
  }
  const durusOzeti = Array.from(durusOzetiMap.values()).sort((a, b) => b.toplamDk - a.toplamDk);

  return { tarih: tarihLabel, vardiyalar, makineler, kaliplar: kalipListesi, uretimKayitlari, durusDetaylari, durusOzeti, ozet };
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
  const start = new Date();
  start.setDate(start.getDate() - (query.gunSayisi - 1));
  start.setHours(0, 0, 0, 0);

  const gunler: TrendGun[] = [];
  for (let i = 0; i < query.gunSayisi; i++) {
    const gun = new Date(start);
    gun.setDate(start.getDate() + i);
    const tarih = gun.toISOString().slice(0, 10);
    const analiz = await getVardiyaAnalizi({ tarih, makineId: query.makineId ? [query.makineId] : undefined });
    gunler.push({
      tarih,
      toplamUretim: analiz.ozet.toplamUretim,
      toplamCalismaDk: analiz.ozet.toplamCalismaDk,
      toplamDurusDk: analiz.ozet.toplamDurusDk,
      arizaSayisi: analiz.ozet.arizaSayisi,
      kalipDegisimSayisi: analiz.ozet.kalipDegisimSayisi,
      oee: analiz.ozet.oee ?? 0,
    });
  }
  return { gunSayisi: query.gunSayisi, gunler };
}
