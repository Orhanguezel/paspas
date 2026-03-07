'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Boxes,
  CheckSquare2,
  Eye,
  EyeOff,
  Factory,
  PackageCheck,
  RefreshCcw,
  Settings2,
  ShoppingCart,
  Truck,
  Waves,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetDashboardActionCenterAdminQuery,
  useGetDashboardKpiAdminQuery,
  useGetDashboardSummaryAdminQuery,
  useGetDashboardTrendAdminQuery,
} from '@/integrations/endpoints/admin/dashboard_admin.endpoints';
import type { ActionItem } from '@/integrations/endpoints/admin/dashboard_admin.endpoints';
import { useListHareketlerAdminQuery } from '@/integrations/endpoints/admin/erp/hareketler_admin.endpoints';
import { useListGorevlerAdminQuery } from '@/integrations/endpoints/admin/erp/gorevler_admin.endpoints';
import { useListAtanmamisAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { useListGunlukGirislerAdminQuery } from '@/integrations/endpoints/admin/erp/operator_admin.endpoints';
import { useListStoklarAdminQuery } from '@/integrations/endpoints/admin/erp/stoklar_admin.endpoints';
import { HAREKET_KAYNAK_LABELS, HAREKET_TIPI_BADGE, HAREKET_TIPI_LABELS } from '@/integrations/shared/erp/hareketler.types';
import { useStatusQuery } from '@/integrations/endpoints/users/auth_public.endpoints';
import { normalizeMeFromStatus } from '@/integrations/shared/users/auth.public';
import type { UserRoleName } from '@/integrations/shared/users/users';

// ── Widget config ─────────────────────────────────────────────
type WidgetKey =
  | 'todayActivity'
  | 'generalStatus'
  | 'trendChart'
  | 'stockChart'
  | 'openTasks'
  | 'myTasks'
  | 'actionCenter'
  | 'recentMovements'
  | 'lowStockAlerts'
  | 'moduleSummary'
  | 'weeklyComparison';

const WIDGET_LABELS: Record<WidgetKey, string> = {
  todayActivity: 'Bugünkü Aktivite',
  generalStatus: 'Genel Durum',
  trendChart: 'Son 30 Gün Trend',
  stockChart: 'Stok Durum Dağılımı',
  openTasks: 'Açık Görevler',
  myTasks: 'Bana Atanan Görevler',
  actionCenter: 'Aksiyon Merkezi',
  recentMovements: 'Son Hareketler',
  lowStockAlerts: 'Düşük Stok Uyarıları',
  moduleSummary: 'Modül Özetleri',
  weeklyComparison: 'Haftalık Aktivite',
};

// Role-based default widget visibility
const ROLE_WIDGETS: Record<UserRoleName, WidgetKey[]> = {
  admin: [
    'actionCenter', 'todayActivity', 'generalStatus', 'trendChart', 'stockChart',
    'openTasks', 'myTasks', 'recentMovements', 'lowStockAlerts', 'moduleSummary', 'weeklyComparison',
  ],
  operator: [
    'todayActivity', 'myTasks', 'openTasks', 'actionCenter',
  ],
  satin_almaci: [
    'actionCenter', 'generalStatus', 'lowStockAlerts', 'myTasks', 'openTasks', 'recentMovements',
  ],
  sevkiyatci: [
    'todayActivity', 'myTasks', 'recentMovements', 'actionCenter',
  ],
};

const STORAGE_KEY = 'paspas_dashboard_widgets';

function loadWidgetConfig(role: UserRoleName): Record<WidgetKey, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[role]) return parsed[role];
    }
  } catch { /* ignore */ }

  const defaults: Record<string, boolean> = {};
  const allKeys = Object.keys(WIDGET_LABELS) as WidgetKey[];
  const roleDefaults = ROLE_WIDGETS[role];
  for (const key of allKeys) {
    defaults[key] = roleDefaults.includes(key);
  }
  return defaults as Record<WidgetKey, boolean>;
}

function saveWidgetConfig(role: UserRoleName, config: Record<WidgetKey, boolean>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[role] = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

// ── Helpers ───────────────────────────────────────────────────
function isSameDay(dateLike: string, ymd: string): boolean {
  return dateLike.slice(0, 10) === ymd;
}

function formatDate(ymd: string) {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${ymd}T00:00:00`));
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value);
}

const MODULE_ROUTES: Record<string, string> = {
  hareketler: '/admin/hareketler',
  makine_havuzu: '/admin/makine-havuzu',
  operator: '/admin/operator',
  gorevler: '/admin/gorevler',
  satin_alma: '/admin/satin-alma',
  satis_siparisleri: '/admin/satis-siparisleri',
  stoklar: '/admin/stoklar',
  tanimlar: '/admin/tanimlar?tab=kaliplar',
  uretim_emirleri: '/admin/uretim-emirleri',
  urunler: '/admin/urunler',
};

const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const ACTION_TYPE_LABELS: Record<ActionItem['type'], string> = {
  overdue_production: 'Üretim',
  overdue_sales: 'Satış',
  overdue_purchase: 'Satın Alma',
  overdue_task: 'Görev',
  critical_stock: 'Stok',
  pending_purchase: 'Onay',
};

const ROLE_LABELS: Record<UserRoleName, string> = {
  admin: 'Yönetici',
  operator: 'Operatör',
  satin_almaci: 'Satın Almacı',
  sevkiyatci: 'Sevkiyatçı',
};

// ── Main Component ────────────────────────────────────────────
export default function AdminDashboardClient() {
  const todayYmd = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  // User role
  const { data: statusData } = useStatusQuery();
  const currentUser = React.useMemo(() => normalizeMeFromStatus(statusData), [statusData]);
  const role: UserRoleName = currentUser?.role ?? 'admin';

  // Widget config
  const [widgetConfig, setWidgetConfig] = React.useState<Record<WidgetKey, boolean>>(() => loadWidgetConfig(role));
  const [showWidgetSettings, setShowWidgetSettings] = React.useState(false);

  React.useEffect(() => {
    setWidgetConfig(loadWidgetConfig(role));
  }, [role]);

  function toggleWidget(key: WidgetKey) {
    setWidgetConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveWidgetConfig(role, next);
      return next;
    });
  }

  function isVisible(key: WidgetKey): boolean {
    return widgetConfig[key] ?? false;
  }

  // Data queries
  const summary = useGetDashboardSummaryAdminQuery();
  const kpi = useGetDashboardKpiAdminQuery();
  const trend = useGetDashboardTrendAdminQuery({ days: 30 });
  const actionCenter = useGetDashboardActionCenterAdminQuery();
  const todayMovements = useListHareketlerAdminQuery({ period: 'today', limit: 200 });
  const recentMovements = useListHareketlerAdminQuery({ period: 'week', limit: 6 });
  const criticalStocks = useListStoklarAdminQuery({ kritikOnly: true, sort: 'kritik_stok', order: 'desc' });
  const allStocks = useListStoklarAdminQuery();
  const gorevler = useListGorevlerAdminQuery({ limit: 6, gecikenOnly: false });
  const myTasks = useListGorevlerAdminQuery({ limit: 6, sadeceBenim: true });
  const unassignedOperations = useListAtanmamisAdminQuery();
  const gunlukGirisler = useListGunlukGirislerAdminQuery({ limit: 200 });

  const isLoading =
    summary.isLoading || kpi.isLoading || trend.isLoading || todayMovements.isLoading ||
    recentMovements.isLoading || criticalStocks.isLoading || allStocks.isLoading ||
    gorevler.isLoading || unassignedOperations.isLoading || gunlukGirisler.isLoading ||
    actionCenter.isLoading || myTasks.isLoading;

  const todayProduction = React.useMemo(() => {
    const entries = gunlukGirisler.data?.items ?? [];
    return entries.filter((item) => isSameDay(item.kayitTarihi, todayYmd)).reduce((total, item) => total + item.netMiktar, 0);
  }, [gunlukGirisler.data, todayYmd]);

  const todayShipment = React.useMemo(() => {
    const entries = todayMovements.data?.items ?? [];
    return entries.filter((item) => item.kaynakTipi === 'sevkiyat').reduce((total, item) => total + Math.abs(item.miktar), 0);
  }, [todayMovements.data]);

  const todayReceipt = React.useMemo(() => {
    const entries = todayMovements.data?.items ?? [];
    return entries.filter((item) => item.kaynakTipi === 'mal_kabul').reduce((total, item) => total + Math.abs(item.miktar), 0);
  }, [todayMovements.data]);

  const stockStatusChart = React.useMemo(() => {
    const items = allStocks.data?.items ?? [];
    return [
      { name: 'Yeterli', value: items.filter((item) => item.durum === 'yeterli').length },
      { name: 'Kritik', value: items.filter((item) => item.durum === 'kritik').length },
      { name: 'Yetersiz', value: items.filter((item) => item.durum === 'yetersiz').length },
    ];
  }, [allStocks.data]);

  const summaryItems = React.useMemo(
    () => (summary.data?.items ?? []).filter((item) => ['urunler', 'stoklar', 'hareketler', 'tanimlar'].includes(item.key)),
    [summary.data],
  );

  function refetchAll() {
    summary.refetch();
    kpi.refetch();
    trend.refetch();
    actionCenter.refetch();
    todayMovements.refetch();
    recentMovements.refetch();
    criticalStocks.refetch();
    allStocks.refetch();
    gorevler.refetch();
    myTasks.refetch();
    unassignedOperations.refetch();
    gunlukGirisler.refetch();
  }

  const actionItems = actionCenter.data?.items ?? [];
  const actionCounts = actionCenter.data?.counts ?? { critical: 0, warning: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <Badge variant="outline" className="text-xs">{ROLE_LABELS[role]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Bugün: {formatDate(todayYmd)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWidgetSettings((prev) => !prev)}
          >
            <Settings2 className="mr-2 size-4" />
            Widget Ayarları
          </Button>
          <Button variant="outline" size="sm" onClick={refetchAll} disabled={isLoading}>
            <RefreshCcw className={`mr-2 size-4${isLoading ? ' animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Widget settings panel */}
      {showWidgetSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Widget Görünürlüğü</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {(Object.keys(WIDGET_LABELS) as WidgetKey[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleWidget(key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    widgetConfig[key] ? 'border-primary/50 bg-primary/5' : 'opacity-60'
                  }`}
                >
                  {widgetConfig[key] ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4 text-muted-foreground" />}
                  {WIDGET_LABELS[key]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Center */}
      {isVisible('actionCenter') && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Aksiyon Merkezi</h2>
            {actionCounts.critical > 0 && (
              <Badge variant="destructive" className="text-xs">{actionCounts.critical} kritik</Badge>
            )}
            {actionCounts.warning > 0 && (
              <Badge variant="secondary" className="text-xs">{actionCounts.warning} uyarı</Badge>
            )}
          </div>
          {actionCenter.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`ac-${i}`} className="h-20" />)}
            </div>
          ) : actionItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Waves className="size-5 text-emerald-500" />
                Tüm süreçler yolunda, aksiyon gerektiren bir durum yok.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {actionItems.slice(0, 8).map((item) => (
                <Link key={item.id} href={item.href} className="block">
                  <Card className={`transition-colors hover:border-primary/50 ${item.severity === 'critical' ? 'border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20' : ''}`}>
                    <CardContent className="flex items-start gap-3 p-4">
                      <Bell className={`mt-0.5 size-4 shrink-0 ${item.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm">{item.title}</div>
                          <Badge variant={item.severity === 'critical' ? 'destructive' : 'outline'} className="shrink-0 text-xs">
                            {ACTION_TYPE_LABELS[item.type]}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                        {item.date && <div className="text-xs text-muted-foreground">Termin: {formatDate(item.date)}</div>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Today Activity */}
      {isVisible('todayActivity') && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Bugünkü Aktivite</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <TodayCard href="/admin/operator" title="Üretim" value={formatCompact(todayProduction)} subtitle="adet üretildi" icon={Factory} tint="bg-sky-50 text-sky-700 border-sky-100" />
            <TodayCard href="/admin/hareketler" title="Sevkiyat" value={formatCompact(todayShipment)} subtitle="adet sevk edildi" icon={Truck} tint="bg-emerald-50 text-emerald-700 border-emerald-100" />
            <TodayCard href="/admin/operator" title="Mal Kabul" value={formatCompact(todayReceipt)} subtitle="adet teslim alındı" icon={PackageCheck} tint="bg-indigo-50 text-indigo-700 border-indigo-100" />
          </div>
        </section>
      )}

      {/* General Status */}
      {isVisible('generalStatus') && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Genel Durum</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatusCard href="/admin/satis-siparisleri" title="Açık Satış Siparişi" value={kpi.data?.salesOpenCount ?? 0} subtitle="müşteri siparişi" icon={ShoppingCart} />
            <StatusCard href="/admin/uretim-emirleri" title="Aktif Üretim Emri" value={kpi.data?.activeProductionOrders ?? 0} subtitle="planlandı / üretiliyor" icon={Factory} />
            <StatusCard href="/admin/makine-havuzu" title="Makine Havuzu" value={unassignedOperations.data?.length ?? 0} subtitle="makine atama bekliyor" icon={Boxes} />
            <StatusCard href="/admin/satin-alma" title="Açık Satın Alma" value={kpi.data?.purchaseOpenCount ?? 0} subtitle="bekleyen tedarik" icon={Truck} />
            <StatusCard href="/admin/gorevler" title="Açık Görev" value={gorevler.data?.summary.acik ?? 0} subtitle={`${gorevler.data?.summary.geciken ?? 0} geciken`} icon={CheckSquare2} />
          </div>
        </section>
      )}

      {/* Charts: Trend + Stock */}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        {isVisible('trendChart') && (
          <Card className="min-h-[340px]">
            <CardHeader><CardTitle className="text-base">Son 30 Gün Trend</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              {trend.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.data?.items ?? []} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(value) => String(value).slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="productionOrders" name="Üretim Emri" stroke="#0f766e" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="salesOrders" name="Satış" stroke="#2563eb" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="purchaseOrders" name="Satın Alma" stroke="#f59e0b" strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="stockMovements" name="Hareket" stroke="#7c3aed" strokeWidth={2.2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {isVisible('stockChart') && (
          <Card className="min-h-[340px]">
            <CardHeader><CardTitle className="text-base">Stok Durum Dağılımı</CardTitle></CardHeader>
            <CardContent className="grid h-[280px] gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="h-full min-h-[220px]">
                {allStocks.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stockStatusChart} dataKey="value" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={4}>
                        {stockStatusChart.map((entry, index) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[index] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-3 self-center">
                {stockStatusChart.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[index] ?? '#94a3b8' }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{item.value}</span>
                  </div>
                ))}
                <div className="rounded-lg border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                  Kritik stoklar ve serbest stok hesapları stok ekranındaki canlı veriden besleniyor.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Tasks + Open Tasks */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {isVisible('myTasks') && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bana Atanan Görevler</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {myTasks.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={`my-${i}`} className="h-16 w-full" />)
              ) : (myTasks.data?.items ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Size atanmış açık görev yok.
                </div>
              ) : (
                (myTasks.data?.items ?? []).map((item) => (
                  <Link
                    key={item.id}
                    href="/admin/gorevler"
                    className={`block rounded-lg border p-3 transition hover:bg-muted/50 ${item.gecikti ? 'border-red-200 bg-red-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium">{item.baslik}</div>
                        <div className="text-sm text-muted-foreground">{item.modul ?? 'Genel'}</div>
                      </div>
                      <Badge variant={item.gecikti ? 'destructive' : 'outline'}>
                        {item.terminTarihi ? formatDateTime(item.terminTarihi) : 'Termin yok'}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {isVisible('openTasks') && (
          <Card>
            <CardHeader><CardTitle className="text-base">Açık Görevler</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {gorevler.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={`gorev-${i}`} className="h-16 w-full" />)
              ) : (gorevler.data?.items ?? []).length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Açık görev bulunmuyor.
                </div>
              ) : (
                (gorevler.data?.items ?? []).map((item) => (
                  <Link
                    key={item.id}
                    href="/admin/gorevler"
                    className={`block rounded-lg border p-3 transition hover:bg-muted/50 ${item.gecikti ? 'border-red-200 bg-red-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium">{item.baslik}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.atananKullaniciAd ?? item.atananRol ?? 'Atama yok'} · {item.modul ?? 'Genel'}
                        </div>
                      </div>
                      <Badge variant={item.gecikti ? 'destructive' : 'outline'}>
                        {item.terminTarihi ? formatDateTime(item.terminTarihi) : 'Termin yok'}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Summary (show if openTasks visible) */}
      {isVisible('openTasks') && (
        <Card>
          <CardHeader><CardTitle className="text-base">Görev Özeti</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickMetric title="Açık" value={gorevler.data?.summary.acik ?? 0} />
            <QuickMetric title="Bugün Terminli" value={gorevler.data?.summary.bugunTerminli ?? 0} />
            <QuickMetric title="Geciken" value={gorevler.data?.summary.geciken ?? 0} danger />
            <QuickMetric title="Tamamlanan" value={gorevler.data?.summary.tamamlanan ?? 0} />
          </CardContent>
        </Card>
      )}

      {/* Recent Movements + Low Stock */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {isVisible('recentMovements') && (
          <Card>
            <CardHeader><CardTitle className="text-base">Son Hareketler</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(recentMovements.data?.items ?? []).length === 0 ? (
                <EmptyState title="Henüz hareket yok" />
              ) : (
                (recentMovements.data?.items ?? []).map((item) => (
                  <Link key={item.id} href="/admin/hareketler" className="block rounded-xl border p-3 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium">{item.urunAd ?? item.urunKod ?? item.urunId}</div>
                        <div className="text-xs text-muted-foreground">
                          {HAREKET_KAYNAK_LABELS[item.kaynakTipi] ?? item.kaynakTipi} • {formatDateTime(item.createdAt)}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.aciklama ?? 'Açıklama yok'}</div>
                      </div>
                      <div className="space-y-1 text-right">
                        <Badge variant={HAREKET_TIPI_BADGE[item.hareketTipi] ?? 'outline'}>
                          {HAREKET_TIPI_LABELS[item.hareketTipi] ?? item.hareketTipi}
                        </Badge>
                        <div className={item.miktar < 0 ? 'text-sm font-semibold text-destructive' : 'text-sm font-semibold text-emerald-600'}>
                          {item.miktar > 0 ? '+' : ''}{item.miktar.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {isVisible('lowStockAlerts') && (
          <Card>
            <CardHeader><CardTitle className="text-base">Düşük Stok Uyarıları</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(criticalStocks.data?.items ?? []).length === 0 ? (
                <EmptyState title="Tüm stoklar yeterli seviyede" icon={Waves} positive />
              ) : (
                (criticalStocks.data?.items ?? []).slice(0, 6).map((item) => (
                  <Link key={item.urunId} href="/admin/stoklar" className="block rounded-xl border p-3 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-medium">{item.urunAd}</div>
                        <div className="font-mono text-xs text-muted-foreground">{item.urunKod}</div>
                      </div>
                      <Badge variant={item.durum === 'yetersiz' ? 'destructive' : 'secondary'}>
                        {item.durum === 'yetersiz' ? 'Yetersiz' : 'Kritik'}
                      </Badge>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={item.durum === 'yetersiz' ? 'h-full bg-red-500' : 'h-full bg-amber-500'}
                        style={{ width: `${Math.max(8, Math.min(100, item.kritikStok > 0 ? (item.stok / item.kritikStok) * 100 : 0))}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Stok: {item.stok.toFixed(2)} {item.birim}</span>
                      <span>Kritik: {item.kritikStok.toFixed(2)} {item.birim}</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Module Summary */}
      {isVisible('moduleSummary') && (
        <Card>
          <CardHeader><CardTitle className="text-base">Modül Özetleri</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.isLoading
              ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)
              : summaryItems.map((item) => (
                  <Link key={item.key} href={MODULE_ROUTES[item.key] ?? '/admin/dashboard'} className="rounded-xl border p-4 transition-colors hover:border-primary/50">
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <div className="mt-3 text-3xl font-semibold tabular-nums">{item.count}</div>
                  </Link>
                ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly Comparison */}
      {isVisible('weeklyComparison') && (
        <Card>
          <CardHeader><CardTitle className="text-base">Haftalık Aktivite Karşılaştırması</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            {todayMovements.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Üretim', value: todayProduction },
                    { name: 'Sevkiyat', value: todayShipment },
                    { name: 'Mal Kabul', value: todayReceipt },
                    { name: 'Düşük Stok', value: criticalStocks.data?.items.length ?? 0 },
                  ]}
                  margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────
function QuickMetric({ title, value, danger = false }: { title: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${danger ? 'border-red-200 bg-red-50/50' : ''}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${danger ? 'text-destructive' : ''}`}>{formatCompact(value)}</div>
    </div>
  );
}

function TodayCard({
  href, title, value, subtitle, icon: Icon, tint,
}: {
  href: string; title: string; value: string; subtitle: string;
  icon: React.ComponentType<{ className?: string }>; tint: string;
}) {
  return (
    <Link href={href}>
      <Card className={`border ${tint}`}>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Icon className="size-5" />
            <span className="font-medium">{title}</span>
          </div>
          <div className="text-5xl font-semibold tracking-tight">{value}</div>
          <div className="text-sm opacity-80">{subtitle}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatusCard({
  href, title, value, subtitle, icon: Icon,
}: {
  href: string; title: string; value: number; subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">{title}</div>
              <div className="text-5xl font-semibold tracking-tight">{value}</div>
              <div className="text-sm text-muted-foreground">{subtitle}</div>
            </div>
            <Icon className="mt-1 size-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({
  title, icon: Icon = AlertTriangle, positive = false,
}: {
  title: string; icon?: React.ComponentType<{ className?: string }>; positive?: boolean;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center">
      <Icon className={positive ? 'size-8 text-emerald-500' : 'size-8 text-muted-foreground'} />
      <div className={positive ? 'text-sm text-emerald-600' : 'text-sm text-muted-foreground'}>{title}</div>
    </div>
  );
}
