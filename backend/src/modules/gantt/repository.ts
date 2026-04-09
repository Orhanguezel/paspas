import { and, asc, eq, gte, inArray, like, lte, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { makineKuyrugu, makineler } from '@/modules/makine_havuzu/schema';
import { musteriler } from '@/modules/musteriler/schema';
import { durusKayitlari } from '@/modules/operator/schema';
import { satisSiparisleri, siparisKalemleri } from '@/modules/satis_siparisleri/schema';
import { haftaSonuPlanlari, tatilMakineler, tatiller } from '@/modules/tanimlar/schema';
import { uretimEmirleri, uretimEmriOperasyonlari, uretimEmriSiparisKalemleri } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';

import type { GanttBarDto, GanttBlockDto, GanttMachineDto } from './schema';
import type { ListQuery, PatchBody } from './validation';

type QueryRow = {
  kuyrukId: string;
  makineId: string;
  makineKod: string;
  makineAd: string;
  uretimEmriId: string;
  emirOperasyonId: string | null;
  emir_no: string;
  urun_id: string;
  musteri_ozet: string | null;
  siparisNo: string | null;
  planlanan_miktar: string | null;
  uretilen_miktar: string | null;
  planlanan_baslangic: Date | null;
  planlanan_bitis: Date | null;
  gercek_baslangic: Date | null;
  gercek_bitis: Date | null;
  termin_tarihi: Date | null;
  durum: string;
  urunKod: string | null;
  urunAd: string | null;
  montaj: number | boolean | null;
  operasyonAdi: string | null;
  sira: number;
  duraklatmaZamani: Date | string | null;
};

function buildWhere(query: ListQuery): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.dateFrom) {
    const from = new Date(`${query.dateFrom}T00:00:00`);
    conditions.push(
      or(
        gte(makineKuyrugu.planlanan_bitis, from),
        gte(makineKuyrugu.gercek_bitis, from),
        // Active/paused with no real end — always include
        sql`${makineKuyrugu.gercek_bitis} IS NULL AND ${makineKuyrugu.durum} IN ('calisiyor', 'duraklatildi')`,
        // Queued items with no end date yet — always include (preceding job may be delayed)
        sql`${makineKuyrugu.durum} = 'bekliyor' AND ${makineKuyrugu.gercek_bitis} IS NULL`,
      ) as SQL,
    );
  }
  if (query.dateTo) {
    const to = new Date(`${query.dateTo}T23:59:59`);
    conditions.push(
      or(
        lte(makineKuyrugu.planlanan_baslangic, to),
        lte(makineKuyrugu.gercek_baslangic, to),
        // Queued items with no gercek_baslangic yet — include if planned start ≤ dateTo or no plan at all
        sql`${makineKuyrugu.durum} = 'bekliyor' AND ${makineKuyrugu.gercek_baslangic} IS NULL`,
      ) as SQL,
    );
  }
  if (query.durum) conditions.push(eq(makineKuyrugu.durum, query.durum));
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        like(uretimEmirleri.emir_no, pattern),
        like(satisSiparisleri.siparis_no, pattern),
        like(urunler.kod, pattern),
        like(urunler.ad, pattern),
        like(musteriler.ad, pattern),
        like(makineler.kod, pattern),
        like(makineler.ad, pattern),
        like(uretimEmriOperasyonlari.operasyon_adi, pattern),
      ) as SQL,
    );
  }
  if (query.makineId) conditions.push(eq(makineKuyrugu.makine_id, query.makineId));
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export async function repoList(query: ListQuery): Promise<{ items: GanttMachineDto[]; total: number }> {
  const where = buildWhere(query);
  const rangeStart = new Date(`${query.dateFrom ?? new Date().toISOString().slice(0, 10)}T00:00:00`);
  const rangeEnd = new Date(`${query.dateTo ?? new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)}T23:59:59`);
  const [rows, countResult, machineRows] = await Promise.all([
    db
      .select({
        kuyrukId: makineKuyrugu.id,
        makineId: makineler.id,
        makineKod: makineler.kod,
        makineAd: makineler.ad,
        uretimEmriId: uretimEmirleri.id,
        emirOperasyonId: makineKuyrugu.emir_operasyon_id,
        emir_no: uretimEmirleri.emir_no,
        urun_id: uretimEmirleri.urun_id,
        musteri_ozet: sql<string | null>`coalesce(group_concat(distinct ${musteriler.ad} order by ${musteriler.ad} separator ', '), ${uretimEmirleri.musteri_ozet})`,
        siparisNo: sql<string | null>`group_concat(distinct ${satisSiparisleri.siparis_no} order by ${satisSiparisleri.siparis_no} separator ', ')`,
        planlanan_miktar: uretimEmriOperasyonlari.planlanan_miktar,
        uretilen_miktar: uretimEmriOperasyonlari.uretilen_miktar,
        planlanan_baslangic: makineKuyrugu.planlanan_baslangic,
        planlanan_bitis: makineKuyrugu.planlanan_bitis,
        gercek_baslangic: makineKuyrugu.gercek_baslangic,
        gercek_bitis: makineKuyrugu.gercek_bitis,
        termin_tarihi: uretimEmirleri.termin_tarihi,
        durum: makineKuyrugu.durum,
        urunKod: urunler.kod,
        urunAd: urunler.ad,
        montaj: uretimEmriOperasyonlari.montaj,
        operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
        sira: makineKuyrugu.sira,
        duraklatmaZamani: sql<Date | string | null>`max(case when ${durusKayitlari.bitis} is null then ${durusKayitlari.baslangic} else null end)`,
      })
      .from(makineKuyrugu)
      .innerJoin(makineler, eq(makineKuyrugu.makine_id, makineler.id))
      .innerJoin(uretimEmirleri, eq(makineKuyrugu.uretim_emri_id, uretimEmirleri.id))
      .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .leftJoin(uretimEmriOperasyonlari, eq(makineKuyrugu.emir_operasyon_id, uretimEmriOperasyonlari.id))
      .leftJoin(uretimEmriSiparisKalemleri, eq(uretimEmirleri.id, uretimEmriSiparisKalemleri.uretim_emri_id))
      .leftJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
      .leftJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
      .leftJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
      .leftJoin(durusKayitlari, eq(durusKayitlari.makine_kuyruk_id, makineKuyrugu.id))
      .where(where)
      .orderBy(asc(makineler.kod), asc(makineKuyrugu.sira), asc(makineKuyrugu.planlanan_baslangic))
      .limit(query.limit)
      .offset(query.offset)
      .groupBy(
        makineKuyrugu.id,
        makineler.id,
        makineler.kod,
        makineler.ad,
        makineKuyrugu.emir_operasyon_id,
        uretimEmirleri.id,
        urunler.id,
        uretimEmriOperasyonlari.id,
      ),
    db
      .select({ count: sql<number>`count(distinct ${makineKuyrugu.id})` })
      .from(makineKuyrugu)
      .innerJoin(makineler, eq(makineKuyrugu.makine_id, makineler.id))
      .innerJoin(uretimEmirleri, eq(makineKuyrugu.uretim_emri_id, uretimEmirleri.id))
      .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
      .leftJoin(uretimEmriOperasyonlari, eq(makineKuyrugu.emir_operasyon_id, uretimEmriOperasyonlari.id))
      .leftJoin(uretimEmriSiparisKalemleri, eq(uretimEmirleri.id, uretimEmriSiparisKalemleri.uretim_emri_id))
      .leftJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
      .leftJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
      .leftJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
      .where(where),
    db
      .select({
        id: makineler.id,
        kod: makineler.kod,
        ad: makineler.ad,
        calisir24Saat: makineler.calisir_24_saat,
        saatlikKapasite: makineler.saatlik_kapasite,
      })
      .from(makineler)
      .where(
        query.makineId
          ? and(eq(makineler.id, query.makineId), eq(makineler.is_active, 1))
          : eq(makineler.is_active, 1),
      )
      .orderBy(asc(makineler.kod)),
  ]);

  const machineIds = machineRows.map((machine) => machine.id);
  const blocksByMachine = await loadMachineBlocks(machineIds, rangeStart, rangeEnd);

  const grouped = new Map<string, GanttMachineDto>();
  for (const machine of machineRows) {
    grouped.set(machine.id, {
      makineId: machine.id,
      makineKod: machine.kod,
      makineAd: machine.ad,
      calisir24Saat: machine.calisir24Saat === 1,
      saatlikKapasite: machine.saatlikKapasite != null ? Number(machine.saatlikKapasite) : null,
      gunlukCalismaSaati: machine.calisir24Saat === 1 ? 24 : 8,
      blocks: blocksByMachine.get(machine.id) ?? [],
      items: [],
    });
  }

  for (const row of rows) {
    const group = grouped.get(row.makineId);
    if (!group) continue;
    group.items.push(rowToDto(row));
  }

  return {
    items: Array.from(grouped.values()),
    total: Number(countResult[0]?.count ?? 0),
  };
}

async function loadMachineBlocks(machineIds: string[], rangeStart: Date, rangeEnd: Date): Promise<Map<string, GanttBlockDto[]>> {
  const map = new Map<string, GanttBlockDto[]>();
  if (machineIds.length === 0) return map;

  const holidayRows = await db
    .select({
      id: tatiller.id,
      ad: tatiller.ad,
      tarih: tatiller.tarih,
      baslangicSaati: tatiller.baslangic_saati,
      bitisSaati: tatiller.bitis_saati,
      makineId: tatilMakineler.makine_id,
    })
    .from(tatiller)
    .leftJoin(tatilMakineler, eq(tatiller.id, tatilMakineler.tatil_id))
    .where(
      and(
        gte(tatiller.tarih, rangeStart),
        lte(tatiller.tarih, rangeEnd),
      ),
    );

  const downtimeRows = await db
    .select({
      id: durusKayitlari.id,
      makineId: durusKayitlari.makine_id,
      neden: durusKayitlari.neden,
      baslangic: durusKayitlari.baslangic,
      bitis: durusKayitlari.bitis,
    })
    .from(durusKayitlari)
    .where(
      and(
        inArray(durusKayitlari.makine_id, machineIds),
        lte(durusKayitlari.baslangic, rangeEnd),
        sql`${durusKayitlari.bitis} IS NULL OR ${durusKayitlari.bitis} >= ${rangeStart}`,
      ),
    );

  // hafta_baslangic = Monday; Saturday = Monday+5, Sunday = Monday+6
  // Expand query range: Monday could be up to 6 days before rangeStart
  const weekendQueryStart = new Date(rangeStart.getTime() - 6 * 86_400_000);
  const weekendPlanRows = await db
    .select({
      haftaBaslangic: haftaSonuPlanlari.hafta_baslangic,
      makineId: haftaSonuPlanlari.makine_id,
      cumartesiCalisir: haftaSonuPlanlari.cumartesi_calisir,
      pazarCalisir: haftaSonuPlanlari.pazar_calisir,
    })
    .from(haftaSonuPlanlari)
    .where(
      and(
        gte(haftaSonuPlanlari.hafta_baslangic, weekendQueryStart),
        lte(haftaSonuPlanlari.hafta_baslangic, rangeEnd),
      ),
    );

  const pushBlock = (machineId: string, block: GanttBlockDto) => {
    map.set(machineId, [...(map.get(machineId) ?? []), block]);
  };

  // Timezone-safe local date formatter (avoids toISOString UTC shift)
  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // hafta_baslangic may be Monday (seed) or actual weekend date (UI-created)
  // Key format: "machineId:YYYY-MM-DD" or "*:YYYY-MM-DD" for global plans
  const workingWeekendSet = new Set<string>();
  for (const row of weekendPlanRows) {
    const baseDate = row.haftaBaslangic instanceof Date ? row.haftaBaslangic : new Date(String(row.haftaBaslangic));
    const dow = baseDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const machineKey = row.makineId ?? '*';
    if (row.cumartesiCalisir) {
      // If baseDate is already Saturday (6), use it; if Monday (1), add 5; otherwise find next Saturday
      const daysToSat = dow === 6 ? 0 : (6 - dow + 7) % 7;
      const saturday = new Date(baseDate.getTime() + daysToSat * 86_400_000);
      workingWeekendSet.add(`${machineKey}:${toLocalDateStr(saturday)}`);
    }
    if (row.pazarCalisir) {
      // If baseDate is already Sunday (0), use it; if Monday (1), add 6; otherwise find next Sunday
      const daysToSun = dow === 0 ? 0 : (7 - dow);
      const sunday = new Date(baseDate.getTime() + daysToSun * 86_400_000);
      workingWeekendSet.add(`${machineKey}:${toLocalDateStr(sunday)}`);
    }
  }

  for (const machineId of machineIds) {
    let cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      const dayStart = new Date(cursor);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(23, 59, 59, 999);
      const localDate = toLocalDateStr(dayStart);
      const isWeekend = dayStart.getDay() === 0 || dayStart.getDay() === 6;
      if (isWeekend) {
        const calisiyor = workingWeekendSet.has(`${machineId}:${localDate}`) || workingWeekendSet.has(`*:${localDate}`);
        if (!calisiyor) {
          pushBlock(machineId, {
            id: `weekend-${machineId}-${localDate}`,
            tip: 'hafta_sonu',
            baslangicTarihi: `${localDate}T00:00:00`,
            bitisTarihi: `${localDate}T23:59:59.999`,
            etiket: 'Hafta sonu',
          });
        }
      }
      cursor = new Date(cursor.getTime() + 86_400_000);
    }
  }

  for (const row of holidayRows) {
    const targetMachineIds = row.makineId ? [row.makineId] : machineIds;
    const day = row.tarih instanceof Date ? toLocalDateStr(row.tarih) : String(row.tarih).slice(0, 10);
    const startIso = `${day}T${row.baslangicSaati}:00`;
    const endIso = `${day}T${row.bitisSaati}:00`;
    for (const machineId of targetMachineIds) {
      pushBlock(machineId, {
        id: `holiday-${row.id}-${machineId}`,
        tip: 'tatil',
        baslangicTarihi: startIso,
        bitisTarihi: endIso,
        etiket: row.ad,
      });
    }
  }

  for (const row of downtimeRows) {
    pushBlock(row.makineId, {
      id: row.id,
      tip: 'durus',
      baslangicTarihi: row.baslangic instanceof Date ? row.baslangic.toISOString() : String(row.baslangic),
      bitisTarihi: row.bitis instanceof Date ? row.bitis.toISOString() : row.bitis ? String(row.bitis) : rangeEnd.toISOString(),
      etiket: row.neden,
      acik: !row.bitis, // bitis=NULL → devam eden arıza
    });
  }

  return new Map(
    Array.from(map.entries()).map(([machineId, blocks]) => [
      machineId,
      blocks.sort((a, b) => a.baslangicTarihi.localeCompare(b.baslangicTarihi)),
    ]),
  );
}

function rowToDto(row: QueryRow): GanttBarDto {
  const toDateTimeString = (value: Date | string | null | undefined): string | null => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    return String(value);
  };

  const toDateString = (value: Date | string | null | undefined): string | null => {
    const raw = toDateTimeString(value);
    return raw ? raw.slice(0, 10) : null;
  };

  return {
    kuyrukId: row.kuyrukId,
    makineId: row.makineId,
    uretimEmriId: row.uretimEmriId,
    emirOperasyonId: row.emirOperasyonId ?? null,
    emirNo: row.emir_no,
    siparisNo: row.siparisNo ?? null,
    urunId: row.urun_id,
    urunKod: row.urunKod ?? null,
    urunAd: row.urunAd ?? null,
    musteriOzet: row.musteri_ozet ?? null,
    operasyonAdi: row.operasyonAdi ?? null,
    montaj: Number(row.montaj ?? 0) > 0,
    sira: Number(row.sira ?? 0),
    ...(() => {
      const now = new Date();
      // Active/paused: extend bar to now (real end unknown)
      if (!row.gercek_bitis && (row.durum === 'calisiyor' || row.durum === 'duraklatildi')) {
        return {
          baslangicTarihi: toDateTimeString(row.gercek_baslangic ?? row.planlanan_baslangic),
          bitisTarihi: now.toISOString(),
          acikDurus: true,
        };
      }
      // Bekliyor: if planned start is in the past (preceding job delayed), push bar to now
      if (row.durum === 'bekliyor' && !row.gercek_baslangic && row.planlanan_baslangic) {
        const plannedStart = row.planlanan_baslangic instanceof Date ? row.planlanan_baslangic : new Date(String(row.planlanan_baslangic));
        if (plannedStart < now) {
          const plannedEnd = row.planlanan_bitis instanceof Date ? row.planlanan_bitis : (row.planlanan_bitis ? new Date(String(row.planlanan_bitis)) : null);
          const durationMs = plannedEnd ? plannedEnd.getTime() - plannedStart.getTime() : 4 * 3_600_000; // fallback 4h
          return {
            baslangicTarihi: now.toISOString(),
            bitisTarihi: new Date(now.getTime() + durationMs).toISOString(),
            acikDurus: false,
          };
        }
      }
      return {
        baslangicTarihi: toDateTimeString(row.gercek_baslangic ?? row.planlanan_baslangic),
        bitisTarihi: toDateTimeString(row.gercek_bitis ?? row.planlanan_bitis),
        acikDurus: false,
      };
    })(),
    planlananBaslangicTarihi: toDateTimeString(row.planlanan_baslangic),
    planlananBitisTarihi: toDateTimeString(row.planlanan_bitis),
    terminTarihi: toDateString(row.termin_tarihi),
    planlananMiktar: Number(row.planlanan_miktar ?? 0),
    uretilenMiktar: Number(row.uretilen_miktar ?? 0),
    durum: row.durum,
    duraklatmaZamani: toDateTimeString(row.duraklatmaZamani),
  };
}

function mapPatchInput(data: PatchBody): Partial<typeof makineKuyrugu.$inferInsert> {
  const payload: Partial<typeof makineKuyrugu.$inferInsert> = {};
  if (data.baslangicTarihi !== undefined) {
    payload.planlanan_baslangic = data.baslangicTarihi ? new Date(`${data.baslangicTarihi}T00:00:00`) : null;
  }
  if (data.bitisTarihi !== undefined) {
    payload.planlanan_bitis = data.bitisTarihi ? new Date(`${data.bitisTarihi}T23:59:59`) : null;
  }
  if (data.durum !== undefined) payload.durum = data.durum;
  return payload;
}

export async function repoGetById(id: string): Promise<GanttBarDto | null> {
  const rows = await db
    .select({
      kuyrukId: makineKuyrugu.id,
      makineId: makineler.id,
      makineKod: makineler.kod,
      makineAd: makineler.ad,
      uretimEmriId: uretimEmirleri.id,
      emirOperasyonId: makineKuyrugu.emir_operasyon_id,
      emir_no: uretimEmirleri.emir_no,
      urun_id: uretimEmirleri.urun_id,
      musteri_ozet: sql<string | null>`coalesce(group_concat(distinct ${musteriler.ad} order by ${musteriler.ad} separator ', '), ${uretimEmirleri.musteri_ozet})`,
      siparisNo: sql<string | null>`group_concat(distinct ${satisSiparisleri.siparis_no} order by ${satisSiparisleri.siparis_no} separator ', ')`,
      planlanan_miktar: uretimEmriOperasyonlari.planlanan_miktar,
      uretilen_miktar: uretimEmriOperasyonlari.uretilen_miktar,
      planlanan_baslangic: makineKuyrugu.planlanan_baslangic,
      planlanan_bitis: makineKuyrugu.planlanan_bitis,
      gercek_baslangic: makineKuyrugu.gercek_baslangic,
      gercek_bitis: makineKuyrugu.gercek_bitis,
      termin_tarihi: uretimEmirleri.termin_tarihi,
      durum: makineKuyrugu.durum,
      urunKod: urunler.kod,
      urunAd: urunler.ad,
      montaj: uretimEmriOperasyonlari.montaj,
      operasyonAdi: uretimEmriOperasyonlari.operasyon_adi,
      sira: makineKuyrugu.sira,
    })
    .from(makineKuyrugu)
    .innerJoin(makineler, eq(makineKuyrugu.makine_id, makineler.id))
    .innerJoin(uretimEmirleri, eq(makineKuyrugu.uretim_emri_id, uretimEmirleri.id))
    .innerJoin(urunler, eq(uretimEmirleri.urun_id, urunler.id))
    .leftJoin(uretimEmriOperasyonlari, eq(makineKuyrugu.emir_operasyon_id, uretimEmriOperasyonlari.id))
    .leftJoin(uretimEmriSiparisKalemleri, eq(uretimEmirleri.id, uretimEmriSiparisKalemleri.uretim_emri_id))
    .leftJoin(siparisKalemleri, eq(uretimEmriSiparisKalemleri.siparis_kalem_id, siparisKalemleri.id))
    .leftJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id))
    .leftJoin(musteriler, eq(satisSiparisleri.musteri_id, musteriler.id))
    .where(eq(makineKuyrugu.id, id))
    .groupBy(
      makineKuyrugu.id,
      makineler.id,
      makineler.kod,
      makineler.ad,
      makineKuyrugu.emir_operasyon_id,
      uretimEmirleri.id,
      urunler.id,
      uretimEmriOperasyonlari.id,
    )
    .limit(1) as QueryRow[];
  return rows[0] ? rowToDto(rows[0]) : null;
}

export async function repoUpdateById(id: string, patch: PatchBody): Promise<GanttBarDto | null> {
  const payload = mapPatchInput(patch);
  await db.update(makineKuyrugu).set(payload).where(eq(makineKuyrugu.id, id));
  return repoGetById(id);
}
