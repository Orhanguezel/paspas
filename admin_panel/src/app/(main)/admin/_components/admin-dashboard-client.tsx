'use client';

// =============================================================
// FILE: _components/admin-dashboard-client.tsx
// Paspas ERP — Dashboard widgetları (OZ-1..OZ-6)
// =============================================================

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useListHareketlerAdminQuery } from '@/integrations/endpoints/admin/erp/hareketler_admin.endpoints';
import { useListMalKabulAdminQuery } from '@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints';
import { useListGanttAdminQuery } from '@/integrations/endpoints/admin/erp/gantt_admin.endpoints';
import { useListSevkEmirleriAdminQuery } from '@/integrations/endpoints/admin/erp/sevkiyat_admin.endpoints';
import { useListStoklarAdminQuery } from '@/integrations/endpoints/admin/erp/stoklar_admin.endpoints';

// Period filter options for OZ-1
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Ay' },
  { value: '', label: 'Tümü' },
];

const SEVK_DURUM_BADGE: Record<string, string> = {
  bekliyor: 'bg-amber-50 text-amber-800 border-amber-200',
  onaylandi: 'bg-blue-50 text-blue-800 border-blue-200',
  sevk_edildi: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  iptal: 'bg-red-50 text-red-800 border-red-200',
};
const SEVK_DURUM_LABELS: Record<string, string> = {
  bekliyor: 'Bekliyor',
  onaylandi: 'Onaylı',
  sevk_edildi: 'Sevk Edildi',
  iptal: 'İptal',
};

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function WidgetSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 pt-2">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
    </div>
  );
}

// ─── OZ-1: Gerçekleşen Üretim ───────────────────────────────
function UretimWidget() {
  const [period, setPeriod] = useState('today');

  const { data, isLoading } = useListHareketlerAdminQuery({
    kaynakTipi: 'uretim',
    period: period || undefined,
    limit: 10,
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Gerçekleşen Üretim</CardTitle>
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={period === opt.value ? 'default' : 'ghost'}
                className="h-6 px-2 text-xs"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <WidgetSkeleton /> : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Kayıt yok.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Tarih</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((h) => (
                <TableRow key={h.id} className="text-xs">
                  <TableCell className="text-muted-foreground">{fmtDate(h.createdAt)}</TableCell>
                  <TableCell className="font-medium">{h.urunAd ?? h.urunKod ?? h.urunId}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-emerald-700">
                    +{h.miktar.toLocaleString('tr-TR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── OZ-2: Sevkiyat ─────────────────────────────────────────
function SevkiyatWidget() {
  const { data, isLoading } = useListSevkEmirleriAdminQuery({
    sort: 'tarih',
    order: 'desc',
    limit: 10,
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Sevkiyat</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <WidgetSkeleton /> : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Kayıt yok.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Tarih</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id} className="text-xs">
                  <TableCell className="text-muted-foreground">{fmtDate(s.tarih)}</TableCell>
                  <TableCell className="font-medium">{s.musteriAd ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-30">{s.urunAd ?? s.urunKod ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.miktar.toLocaleString('tr-TR')}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${SEVK_DURUM_BADGE[s.durum] ?? ''}`}>
                      {SEVK_DURUM_LABELS[s.durum] ?? s.durum}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── OZ-3: Mal Kabul ────────────────────────────────────────
function MalKabulWidget() {
  const { data, isLoading } = useListMalKabulAdminQuery({
    sort: 'kabul_tarihi',
    order: 'desc',
    limit: 10,
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Mal Kabul</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <WidgetSkeleton /> : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Kayıt yok.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Tarih</TableHead>
                <TableHead>Tedarikçi</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Kalite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((k) => (
                <TableRow key={k.id} className="text-xs">
                  <TableCell className="text-muted-foreground">{fmtDate(k.kabulTarihi)}</TableCell>
                  <TableCell className="font-medium">{k.tedarikciAd ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-30">{k.urunAd ?? k.urunKod ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {k.gelenMiktar.toLocaleString('tr-TR')}
                    {k.urunBirim && <span className="ml-1 text-muted-foreground">{k.urunBirim}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={k.kaliteDurumu === 'kabul' ? 'outline' : k.kaliteDurumu === 'red' ? 'destructive' : 'secondary'}
                      className="text-[10px]"
                    >
                      {k.kaliteDurumu === 'kabul' ? 'Kabul' : k.kaliteDurumu === 'red' ? 'Red' : 'Koşullu'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── OZ-4: Depo Stok (paspas kategorisi) ────────────────────
function StokWidget() {
  const { data, isLoading } = useListStoklarAdminQuery({
    q: 'paspas',
    kategori: 'urun',
    sort: 'stok',
    order: 'desc',
    stokluOnly: true,
  });

  const items = (data?.items ?? []).slice(0, 10);
  const maxStok = items.length > 0 ? Math.max(...items.map((i) => i.stok)) : 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Depo Stok (Paspas)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <WidgetSkeleton /> : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Stok yok.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate max-w-50">{item.urunAd ?? item.urunKod ?? '—'}</span>
                  <span className="tabular-nums text-muted-foreground shrink-0 ml-2">
                    {item.stok.toLocaleString('tr-TR')} {item.birim}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${Math.min(100, (item.stok / maxStok) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── OZ-6: Makine Durumları ──────────────────────────────────
function MakineDurumlariWidget() {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  const { data, isLoading } = useListGanttAdminQuery({
    baslangic: today.toISOString().split('T')[0],
    bitis: endDate.toISOString().split('T')[0],
  });

  const groups = (data?.items ?? []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Makine Durumları</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <WidgetSkeleton /> : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Makine yok.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Makine</TableHead>
                <TableHead className="text-right">İş Sayısı</TableHead>
                <TableHead>Son Bitiş</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => {
                const lastItem = g.items[g.items.length - 1];
                return (
                  <TableRow key={g.makineId} className="text-xs">
                    <TableCell>
                      <span className="font-mono text-muted-foreground mr-1">{g.makineKod}</span>
                      <span className="font-medium">{g.makineAd}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {g.items.length > 0 ? (
                        <Badge variant="outline" className="text-[10px]">{g.items.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lastItem ? fmtDateTime(lastItem.bitisTarihi) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── OZ-5: Üretim vs Sevkiyat Karşılaştırma ─────────────────

const CHART_PERIOD_OPTIONS = [
  { value: 'week', label: 'Haftalık' },
  { value: 'month', label: 'Aylık' },
  { value: 'all', label: 'Tümü' },
];

function groupByWeek(items: { createdAt: string; miktar: number }[]) {
  const buckets = new Map<string, number>();
  for (const h of items) {
    const d = new Date(h.createdAt);
    const year = d.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = `${year}-H${String(week).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(h.miktar));
  }
  return buckets;
}

function groupByMonth(items: { createdAt: string; miktar: number }[]) {
  const buckets = new Map<string, number>();
  const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  for (const h of items) {
    const d = new Date(h.createdAt);
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(h.miktar));
  }
  return buckets;
}

function UretimSevkiyatWidget() {
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'all'>('month');

  const backendPeriod = chartPeriod === 'week' ? 'week' : chartPeriod === 'month' ? 'month' : undefined;

  const { data: uretimData, isLoading: uLoading } = useListHareketlerAdminQuery({
    kaynakTipi: 'uretim',
    period: backendPeriod,
    limit: 500,
  });
  const { data: sevkData, isLoading: sLoading } = useListHareketlerAdminQuery({
    kaynakTipi: 'sevkiyat',
    period: backendPeriod,
    limit: 500,
  });

  const chartData = useMemo(() => {
    const uretimItems = uretimData?.items ?? [];
    const sevkItems = sevkData?.items ?? [];

    const uretimBuckets = chartPeriod === 'week'
      ? groupByWeek(uretimItems)
      : groupByMonth(uretimItems);
    const sevkBuckets = chartPeriod === 'week'
      ? groupByWeek(sevkItems)
      : groupByMonth(sevkItems);

    const allKeys = new Set([...uretimBuckets.keys(), ...sevkBuckets.keys()]);
    return Array.from(allKeys)
      .sort()
      .map((key) => ({
        label: key,
        uretim: Math.round(uretimBuckets.get(key) ?? 0),
        sevkiyat: Math.round(sevkBuckets.get(key) ?? 0),
      }));
  }, [uretimData, sevkData, chartPeriod]);

  const isLoading = uLoading || sLoading;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Üretim vs Sevkiyat</CardTitle>
          <div className="flex gap-1">
            {CHART_PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={chartPeriod === opt.value ? 'default' : 'ghost'}
                className="h-6 px-2 text-xs"
                onClick={() => setChartPeriod(opt.value as 'week' | 'month' | 'all')}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Veri yok.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 5000]} allowDataOverflow />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString('tr-TR'),
                  name === 'uretim' ? 'Üretim' : 'Sevkiyat',
                ]}
              />
              <Bar dataKey="uretim" name="uretim" fill="var(--color-emerald-500, #10b981)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sevkiyat" name="sevkiyat" fill="var(--color-blue-500, #3b82f6)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-2 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-emerald-500" />
            Üretim
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-blue-500" />
            Sevkiyat
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────

export default function AdminDashboardClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Günlük üretim, sevkiyat ve stok özeti</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OZ-1 */}
        <UretimWidget />
        {/* OZ-2 */}
        <SevkiyatWidget />
        {/* OZ-3 */}
        <MalKabulWidget />
        {/* OZ-4 */}
        <StokWidget />
      </div>

      {/* OZ-5 */}
      <UretimSevkiyatWidget />

      {/* OZ-6 */}
      <MakineDurumlariWidget />
    </div>
  );
}
