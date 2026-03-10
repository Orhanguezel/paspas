import { and, eq, gte, inArray, isNotNull, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { AnyMySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';

import { db } from '@/db/client';
import { gorevler } from '@/modules/gorevler/schema';
import { hareketler } from '@/modules/hareketler/schema';
import { makineKuyrugu, makineler } from '@/modules/makine_havuzu/schema';
import { musteriler } from '@/modules/musteriler/schema';
import { sevkiyatKalemleri, sevkiyatlar } from '@/modules/operator/schema';
import { receteler } from '@/modules/receteler/schema';
import { satinAlmaSiparisleri } from '@/modules/satin_alma/schema';
import { satisSiparisleri, siparisKalemleri } from '@/modules/satis_siparisleri/schema';
import { sevkEmirleri } from '@/modules/sevkiyat/schema';
import { kaliplar, tatiller } from '@/modules/tanimlar/schema';
import { uretimEmirleri } from '@/modules/uretim_emirleri/schema';
import { urunler } from '@/modules/urunler/schema';

export type DashboardItem = {
  key: string;
  label: string;
  count: number;
};

export type DashboardKpi = {
  activeProductionOrders: number;
  completionRatePercent: number;
  activeMachineRatePercent: number;
  lowStockProductCount: number;
  purchaseOpenCount: number;
  salesOpenCount: number;
  pendingShipmentLineCount: number;
  pendingShipmentApprovalCount: number;
  pendingPhysicalShipmentCount: number;
  shippedTodayCount: number;
  shippedTodayAmount: number;
  openShipmentTaskCount: number;
};

type TrendPoint = {
  date: string;
  productionOrders: number;
  salesOrders: number;
  purchaseOrders: number;
  stockMovements: number;
};

type DayCountRow = {
  day: string;
  count: number;
};

async function countAll<TTable extends MySqlTable>(table: TTable, where?: SQL): Promise<number> {
  const rows = await db.select({ count: sql<number>`count(*)` }).from(table).where(where);
  return Number(rows[0]?.count ?? 0);
}

function asDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getDateSeries(days: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result: string[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    result.push(asDateOnly(d));
  }
  return result;
}

async function getDailyCounts(column: AnyMySqlColumn, table: MySqlTable, days: number): Promise<DayCountRow[]> {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  const rows = await db
    .select({
      day: sql<string>`DATE(${column})`,
      count: sql<number>`count(*)`,
    })
    .from(table)
    .where(gte(column, startDate))
    .groupBy(sql`DATE(${column})`)
    .orderBy(sql`DATE(${column})`);

  return rows.map((row) => ({
    day: row.day,
    count: Number(row.count ?? 0),
  }));
}

export async function getDashboardSummary(): Promise<{ items: DashboardItem[] }> {
  const [
    urunCount,
    receteCount,
    musteriCount,
    satisSiparisCount,
    uretimEmriCount,
    makineCount,
    isYukuCount,
    ganttCount,
    stokCount,
    satinAlmaCount,
    hareketCount,
    operatorCount,
    kalipCount,
    tatilCount,
  ] = await Promise.all([
    countAll(urunler),
    countAll(receteler),
    countAll(musteriler),
    countAll(satisSiparisleri),
    countAll(uretimEmirleri),
    countAll(makineler),
    countAll(makineKuyrugu),
    countAll(uretimEmirleri, or(isNotNull(uretimEmirleri.baslangic_tarihi), isNotNull(uretimEmirleri.bitis_tarihi))),
    countAll(urunler, and(eq(urunler.is_active, 1), sql`${urunler.stok} > 0.0000`)),
    countAll(satinAlmaSiparisleri),
    countAll(hareketler),
    countAll(uretimEmirleri, inArray(uretimEmirleri.durum, ['planlandi', 'uretimde'])),
    countAll(kaliplar),
    countAll(tatiller),
  ]);

  return {
    items: [
      { key: 'urunler', label: 'Ürünler', count: urunCount },
      { key: 'receteler', label: 'Reçeteler', count: receteCount },
      { key: 'musteriler', label: 'Müşteriler', count: musteriCount },
      { key: 'satis_siparisleri', label: 'Satış Siparişleri', count: satisSiparisCount },
      { key: 'uretim_emirleri', label: 'Üretim Emirleri', count: uretimEmriCount },
      { key: 'makine_havuzu', label: 'Makine Havuzu', count: makineCount },
      { key: 'is_yukler', label: 'Makine İş Yükleri', count: isYukuCount },
      { key: 'gantt', label: 'Gantt Planı', count: ganttCount },
      { key: 'stoklar', label: 'Malzeme Stokları', count: stokCount },
      { key: 'satin_alma', label: 'Satın Alma', count: satinAlmaCount },
      { key: 'hareketler', label: 'Hareketler', count: hareketCount },
      { key: 'operator', label: 'Operatör Ekranı', count: operatorCount },
      { key: 'tanimlar', label: 'Tanımlar', count: kalipCount + tatilCount },
    ],
  };
}

export async function getDashboardKpi(userId: string | null, role: string): Promise<DashboardKpi> {
  const pendingShipmentLineWhere = and(
    or(
      eq(satisSiparisleri.durum, 'taslak'),
      eq(satisSiparisleri.durum, 'onaylandi'),
      eq(satisSiparisleri.durum, 'uretimde'),
      eq(satisSiparisleri.durum, 'kismen_sevk'),
    ) as SQL,
    eq(urunler.kategori, 'urun'),
    sql`(${siparisKalemleri.miktar} - COALESCE((
      SELECT SUM(sk.miktar)
      FROM sevkiyat_kalemleri sk
      WHERE sk.siparis_kalem_id = ${siparisKalemleri.id}
    ), 0)) > 0`,
  );

  const shipmentTaskConditions: SQL[] = [
    eq(gorevler.tip, 'sevkiyat'),
    eq(gorevler.modul, 'sevkiyat'),
    inArray(gorevler.durum, ['acik', 'devam_ediyor', 'beklemede']),
  ];

  if (role !== 'admin') {
    const scopes: SQL[] = [];
    if (userId) scopes.push(eq(gorevler.atanan_kullanici_id, userId));
    if (role) scopes.push(eq(gorevler.atanan_rol, role));
    if (scopes.length > 0) shipmentTaskConditions.push(or(...scopes) as SQL);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalProduction, completedProduction, activeProduction, totalMachines, activeMachines, lowStockProducts, openPurchases, openSales, pendingShipmentApprovalCount, pendingPhysicalShipmentCount, openShipmentTaskCount, shippedTodayCountRows, shippedTodayAmountRows, pendingShipmentLineRows] = await Promise.all([
    countAll(uretimEmirleri),
    countAll(uretimEmirleri, eq(uretimEmirleri.durum, 'tamamlandi')),
    countAll(uretimEmirleri, inArray(uretimEmirleri.durum, ['planlandi', 'uretimde'])),
    countAll(makineler),
    countAll(makineler, and(eq(makineler.is_active, 1), eq(makineler.durum, 'aktif'))),
    countAll(urunler, and(eq(urunler.is_active, 1), sql`${urunler.stok} < 5.0000`)),
    countAll(satinAlmaSiparisleri, inArray(satinAlmaSiparisleri.durum, ['taslak', 'onaylandi', 'kismi_teslim'])),
    countAll(satisSiparisleri, inArray(satisSiparisleri.durum, ['taslak', 'planlandi', 'onaylandi', 'uretimde', 'kismen_sevk'])),
    countAll(sevkEmirleri, eq(sevkEmirleri.durum, 'bekliyor')),
    countAll(sevkEmirleri, eq(sevkEmirleri.durum, 'onaylandi')),
    countAll(gorevler, and(...shipmentTaskConditions)),
    db.select({ count: sql<number>`count(distinct ${sevkiyatlar.id})` }).from(sevkiyatlar).where(gte(sevkiyatlar.sevk_tarihi, todayStart)),
    db.select({ amount: sql<number>`coalesce(sum(${sevkiyatKalemleri.miktar}), 0)` }).from(sevkiyatKalemleri).innerJoin(sevkiyatlar, eq(sevkiyatKalemleri.sevkiyat_id, sevkiyatlar.id)).where(gte(sevkiyatlar.sevk_tarihi, todayStart)),
    db.select({ count: sql<number>`count(*)` }).from(siparisKalemleri).innerJoin(satisSiparisleri, eq(siparisKalemleri.siparis_id, satisSiparisleri.id)).innerJoin(urunler, eq(siparisKalemleri.urun_id, urunler.id)).where(pendingShipmentLineWhere),
  ]);

  const completionRatePercent = totalProduction > 0 ? Number(((completedProduction / totalProduction) * 100).toFixed(2)) : 0;
  const activeMachineRatePercent = totalMachines > 0 ? Number(((activeMachines / totalMachines) * 100).toFixed(2)) : 0;

  return {
    activeProductionOrders: activeProduction,
    completionRatePercent,
    activeMachineRatePercent,
    lowStockProductCount: lowStockProducts,
    purchaseOpenCount: openPurchases,
    salesOpenCount: openSales,
    pendingShipmentLineCount: Number(pendingShipmentLineRows[0]?.count ?? 0),
    pendingShipmentApprovalCount,
    pendingPhysicalShipmentCount,
    shippedTodayCount: Number(shippedTodayCountRows[0]?.count ?? 0),
    shippedTodayAmount: Number(shippedTodayAmountRows[0]?.amount ?? 0),
    openShipmentTaskCount,
  };
}

export type ActionItem = {
  id: string;
  type: 'overdue_production' | 'overdue_sales' | 'overdue_purchase' | 'overdue_task' | 'critical_stock' | 'pending_purchase' | 'shipment_approval' | 'physical_shipment';
  severity: 'critical' | 'warning';
  title: string;
  subtitle: string;
  href: string;
  date: string | null;
};

export type ActionCenterResult = {
  items: ActionItem[];
  counts: { critical: number; warning: number };
};

export async function getDashboardActionCenter(userId: string | null, role: string): Promise<ActionCenterResult> {
  const todayStr = asDateOnly(new Date());
  const items: ActionItem[] = [];

  // Overdue production orders
  const overdueProduction = await db
    .select({ id: uretimEmirleri.id, emirNo: uretimEmirleri.emir_no, terminTarihi: uretimEmirleri.termin_tarihi, durum: uretimEmirleri.durum })
    .from(uretimEmirleri)
    .where(and(inArray(uretimEmirleri.durum, ['atanmamis', 'planlandi', 'uretimde']), sql`${uretimEmirleri.termin_tarihi} < ${todayStr}`))
    .limit(10);

  for (const row of overdueProduction) {
    items.push({
      id: row.id, type: 'overdue_production', severity: 'critical',
      title: `Üretim emri ${row.emirNo} termin aşımı`, subtitle: `Durum: ${row.durum}`,
      href: `/admin/uretim-emirleri/${row.id}`, date: row.terminTarihi ? asDateOnly(row.terminTarihi) : null,
    });
  }

  // Overdue sales orders
  const overdueSales = await db
    .select({ id: satisSiparisleri.id, siparisNo: satisSiparisleri.siparis_no, terminTarihi: satisSiparisleri.termin_tarihi, durum: satisSiparisleri.durum })
    .from(satisSiparisleri)
    .where(and(inArray(satisSiparisleri.durum, ['taslak', 'planlandi', 'onaylandi', 'uretimde', 'kismen_sevk']), sql`${satisSiparisleri.termin_tarihi} < ${todayStr}`))
    .limit(10);

  for (const row of overdueSales) {
    items.push({
      id: row.id, type: 'overdue_sales', severity: 'critical',
      title: `Satış siparişi ${row.siparisNo} termin aşımı`, subtitle: `Durum: ${row.durum}`,
      href: `/admin/satis-siparisleri/${row.id}`, date: row.terminTarihi ? asDateOnly(row.terminTarihi) : null,
    });
  }

  // Overdue purchase orders
  const overduePurchase = await db
    .select({ id: satinAlmaSiparisleri.id, siparisNo: satinAlmaSiparisleri.siparis_no, terminTarihi: satinAlmaSiparisleri.termin_tarihi, durum: satinAlmaSiparisleri.durum })
    .from(satinAlmaSiparisleri)
    .where(and(inArray(satinAlmaSiparisleri.durum, ['onaylandi', 'kismi_teslim']), sql`${satinAlmaSiparisleri.termin_tarihi} < ${todayStr}`))
    .limit(10);

  for (const row of overduePurchase) {
    items.push({
      id: row.id, type: 'overdue_purchase', severity: 'critical',
      title: `Satın alma ${row.siparisNo} termin aşımı`, subtitle: `Durum: ${row.durum}`,
      href: `/admin/satin-alma/${row.id}`, date: row.terminTarihi ? asDateOnly(row.terminTarihi) : null,
    });
  }

  // Pending purchase approvals
  const pendingPurchase = await db
    .select({ id: satinAlmaSiparisleri.id, siparisNo: satinAlmaSiparisleri.siparis_no, terminTarihi: satinAlmaSiparisleri.termin_tarihi })
    .from(satinAlmaSiparisleri)
    .where(eq(satinAlmaSiparisleri.durum, 'taslak'))
    .limit(10);

  for (const row of pendingPurchase) {
    items.push({
      id: `pending-${row.id}`, type: 'pending_purchase', severity: 'warning',
      title: `Satın alma ${row.siparisNo} onay bekliyor`, subtitle: 'Taslak durumunda',
      href: `/admin/satin-alma/${row.id}`, date: row.terminTarihi ? asDateOnly(row.terminTarihi) : null,
    });
  }

  if (role === 'admin') {
    const pendingShipmentApprovals = await db
      .select({
        id: sevkEmirleri.id,
        sevkEmriNo: sevkEmirleri.sevk_emri_no,
        tarih: sevkEmirleri.tarih,
        musteriAd: musteriler.ad,
      })
      .from(sevkEmirleri)
      .leftJoin(musteriler, eq(sevkEmirleri.musteri_id, musteriler.id))
      .where(eq(sevkEmirleri.durum, 'bekliyor'))
      .limit(10);

    for (const row of pendingShipmentApprovals) {
      items.push({
        id: `shipment-approval-${row.id}`,
        type: 'shipment_approval',
        severity: 'warning',
        title: `Sevk emri ${row.sevkEmriNo} admin onayi bekliyor`,
        subtitle: row.musteriAd ? `Musteri: ${row.musteriAd}` : 'Musteri bilgisi bekleniyor',
        href: '/admin/sevkiyat',
        date: row.tarih ? asDateOnly(row.tarih) : null,
      });
    }
  }

  if (role === 'admin' || role === 'sevkiyatci') {
    const physicalShipmentQueue = await db
      .select({
        id: sevkEmirleri.id,
        sevkEmriNo: sevkEmirleri.sevk_emri_no,
        tarih: sevkEmirleri.tarih,
        musteriAd: musteriler.ad,
      })
      .from(sevkEmirleri)
      .leftJoin(musteriler, eq(sevkEmirleri.musteri_id, musteriler.id))
      .where(eq(sevkEmirleri.durum, 'onaylandi'))
      .limit(10);

    for (const row of physicalShipmentQueue) {
      items.push({
        id: `physical-shipment-${row.id}`,
        type: 'physical_shipment',
        severity: 'critical',
        title: `Sevk emri ${row.sevkEmriNo} fiziki cikis bekliyor`,
        subtitle: row.musteriAd ? `Musteri: ${row.musteriAd}` : 'Fiziksel sevk bekliyor',
        href: '/admin/sevkiyat',
        date: row.tarih ? asDateOnly(row.tarih) : null,
      });
    }
  }

  // Critical stock
  const lowStock = await db
    .select({ id: urunler.id, ad: urunler.ad, stok: urunler.stok })
    .from(urunler)
    .where(and(eq(urunler.is_active, 1), sql`${urunler.stok} < 5.0000`))
    .limit(10);

  for (const row of lowStock) {
    items.push({
      id: `stock-${row.id}`, type: 'critical_stock', severity: 'warning',
      title: `${row.ad} stok kritik`, subtitle: `Mevcut: ${Number(row.stok).toFixed(2)}`,
      href: '/admin/stoklar', date: null,
    });
  }

  // Overdue tasks (user- or role-specific)
  const taskWhere = [inArray(gorevler.durum, ['acik', 'devam_ediyor']), sql`${gorevler.termin_tarihi} < NOW()`];
  if (userId) {
    taskWhere.push(or(eq(gorevler.atanan_kullanici_id, userId), eq(gorevler.atanan_rol, role))!);
  }

  const overdueTasks = await db
    .select({ id: gorevler.id, baslik: gorevler.baslik, terminTarihi: gorevler.termin_tarihi })
    .from(gorevler)
    .where(and(...taskWhere))
    .limit(10);

  for (const row of overdueTasks) {
    items.push({
      id: `task-${row.id}`, type: 'overdue_task', severity: 'critical',
      title: row.baslik, subtitle: 'Görev termin aşımı',
      href: '/admin/gorevler', date: row.terminTarihi ? row.terminTarihi.toISOString().slice(0, 10) : null,
    });
  }

  items.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return 0;
  });

  return {
    items,
    counts: {
      critical: items.filter((i) => i.severity === 'critical').length,
      warning: items.filter((i) => i.severity === 'warning').length,
    },
  };
}

export async function getDashboardTrend(days: number): Promise<{ days: number; items: TrendPoint[] }> {
  const [production, sales, purchase, movements] = await Promise.all([
    getDailyCounts(uretimEmirleri.created_at, uretimEmirleri, days),
    getDailyCounts(satisSiparisleri.created_at, satisSiparisleri, days),
    getDailyCounts(satinAlmaSiparisleri.created_at, satinAlmaSiparisleri, days),
    getDailyCounts(hareketler.created_at, hareketler, days),
  ]);

  const prodMap = new Map(production.map((r) => [r.day, r.count]));
  const salesMap = new Map(sales.map((r) => [r.day, r.count]));
  const purchaseMap = new Map(purchase.map((r) => [r.day, r.count]));
  const movementMap = new Map(movements.map((r) => [r.day, r.count]));

  const items: TrendPoint[] = getDateSeries(days).map((date) => ({
    date,
    productionOrders: prodMap.get(date) ?? 0,
    salesOrders: salesMap.get(date) ?? 0,
    purchaseOrders: purchaseMap.get(date) ?? 0,
    stockMovements: movementMap.get(date) ?? 0,
  }));

  return { days, items };
}
