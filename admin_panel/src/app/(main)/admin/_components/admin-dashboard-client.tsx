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
import VardiyaOzetWidget from './vardiya-ozet-widget';
import { useListMalKabulAdminQuery } from '@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints';
import { useListGanttAdminQuery } from '@/integrations/endpoints/admin/erp/gantt_admin.endpoints';
import { useListMakineKapaliAraliklarAdminQuery } from '@/integrations/endpoints/admin/erp/makine_kapali_araliklar_admin.endpoints';
import { useListAktifKalipDegisimleriAdminQuery } from '@/integrations/endpoints/admin/erp/operator_admin.endpoints';
import { useListSevkEmirleriAdminQuery } from '@/integrations/endpoints/admin/erp/sevkiyat_admin.endpoints';
import { useListStoklarAdminQuery } from '@/integrations/endpoints/admin/erp/stoklar_admin.endpoints';

type DashboardPeriod = 'yesterday' | 'today' | 'week' | 'month' | '';
type ShiftFilter = 'all' | 'gunduz' | 'gece';

// Period filter options for dashboard cards
const PERIOD_OPTIONS = [
  { value: 'yesterday', label: 'Dün' },
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Ay' },
  { value: '', label: 'Tümü' },
] satisfies { value: DashboardPeriod; label: string }[];

const SHIFT_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'gunduz', label: 'Gündüz' },
  { value: 'gece', label: 'Gece' },
] satisfies { value: ShiftFilter; label: string }[];

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

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPeriodRange(period: DashboardPeriod): { dateFrom?: string; dateTo?: string } {
  if (!period) return {};
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'week') {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { dateFrom: toDateOnly(start), dateTo: toDateOnly(end) };
}

function getShift(createdAt: string | null | undefined): ShiftFilter {
  if (!createdAt) return 'gunduz';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return 'gunduz';
  const minutes = d.getHours() * 60 + d.getMinutes();
  if (minutes >= 7 * 60 + 30 && minutes < 9 * 60 + 30) return 'gece';
  return minutes >= 19 * 60 + 30 || minutes < 7 * 60 + 30 ? 'gece' : 'gunduz';
}

function shiftLabel(value: ShiftFilter) {
  if (value === 'gece') return 'Gece';
  if (value === 'gunduz') return 'Gündüz';
  return 'Tümü';
}

function diffDaysFromToday(value: string | null | undefined) {
  if (!value) return 0;
  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
}

function planColorClass(days: number) {
  if (days <= 2) return 'border-l-red-500 bg-red-50/50';
  if (days <= 5) return 'border-l-orange-500 bg-orange-50/50';
  if (days <= 10) return 'border-l-yellow-500 bg-yellow-50/50';
  return 'border-l-emerald-500 bg-emerald-50/50';
}

function planBadgeClass(days: number) {
  if (days <= 2) return 'border-red-200 bg-red-50 text-red-700';
  if (days <= 5) return 'border-orange-200 bg-orange-50 text-orange-700';
  if (days <= 10) return 'border-yellow-200 bg-yellow-50 text-yellow-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function isTodayWithinRange(start: string, end: string) {
  const today = toDateOnly(new Date());
  return start.slice(0, 10) <= today && end.slice(0, 10) >= today;
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
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [shift, setShift] = useState<ShiftFilter>('all');

  // Sadece üretimi yapılan ürüne (+) stok yansıyan giriş hareketleri.
  // hareketTipi='giris' + kategori='urun': tüketilen koli/etiket/yarımamul
  // (cikis, operasyonel_ym/yarimamul) bu kutuda görünmez.
  const { data, isLoading } = useListHareketlerAdminQuery({
    kaynakTipi: 'uretim',
    hareketTipi: 'giris',
    kategori: 'urun',
    period: period || undefined,
    limit: 10,
  });

  const items = useMemo(
    () => (data?.items ?? []).filter((item) => shift === 'all' || getShift(item.createdAt) === shift),
    [data?.items, shift],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-sm font-semibold">Gerçekleşen Üretim</CardTitle>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <div className="flex flex-wrap justify-end gap-1">
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
            <div className="flex flex-wrap justify-end gap-1">
              {SHIFT_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={shift === opt.value ? 'secondary' : 'ghost'}
                  className="h-6 px-2 text-xs"
                  onClick={() => setShift(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
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
                <TableHead>Vardiya</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((h) => (
                <TableRow key={h.id} className="text-xs">
                  <TableCell className="text-muted-foreground">{fmtDate(h.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{shiftLabel(getShift(h.createdAt))}</Badge>
                  </TableCell>
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
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const range = getPeriodRange(period);
  const { data, isLoading } = useListSevkEmirleriAdminQuery({
    sort: 'tarih',
    order: 'desc',
    ...range,
    limit: 10,
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-semibold">Sevkiyat</CardTitle>
          <div className="flex flex-wrap gap-1">
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
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const range = getPeriodRange(period);
  const { data, isLoading } = useListMalKabulAdminQuery({
    sort: 'kabul_tarihi',
    order: 'desc',
    ...range,
    limit: 10,
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-semibold">Mal Kabul</CardTitle>
          <div className="flex flex-wrap gap-1">
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

// ─── OZ-4: Depo Stok (ürün kategorisi) ───────────────────────
function StokWidget() {
  // Not: önceki `q: 'paspas'` filtresi ürün adı/kodunda "paspas" arıyordu;
  // hiçbir ürün bu metni içermediği için kutu sürekli boş kalıyordu.
  // Bitmiş ürün (kategori='urun') deposundaki stoklu kayıtlar gösterilir.
  const { data, isLoading } = useListStoklarAdminQuery({
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
        <CardTitle className="text-sm font-semibold">Depo Stok</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <WidgetSkeleton /> : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Stok yok.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.urunId} className="space-y-0.5">
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
  const { data: kapaliAraliklar } = useListMakineKapaliAraliklarAdminQuery();
  const { data: aktifKalipDegisimleri } = useListAktifKalipDegisimleriAdminQuery();

  const groups = (data?.items ?? []);
  const kapaliMakineIds = useMemo(
    () =>
      new Set(
        (kapaliAraliklar?.items ?? [])
          .filter((item) => isTodayWithinRange(item.baslangicTarih, item.bitisTarih))
          .map((item) => item.makineId),
      ),
    [kapaliAraliklar?.items],
  );
  const kalipDegisimMakineIds = useMemo(
    () => new Set((aktifKalipDegisimleri ?? []).map((item) => item.makineId)),
    [aktifKalipDegisimleri],
  );

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
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İş Sayısı</TableHead>
                <TableHead className="text-right">Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => {
                const lastItem = g.items[g.items.length - 1];
                const planDays = diffDaysFromToday(lastItem?.bitisTarihi);
                const status = kapaliMakineIds.has(g.makineId)
                  ? 'Kapalı'
                  : kalipDegisimMakineIds.has(g.makineId)
                    ? 'Kalıp Değişimi'
                    : g.items.some((item) => item.durum === 'duraklatildi')
                      ? 'Duraklatıldı'
                      : 'Çalışıyor';
                const statusVariant = status === 'Kapalı' || status === 'Duraklatıldı' ? 'destructive' : status === 'Kalıp Değişimi' ? 'secondary' : 'outline';
                return (
                  <TableRow key={g.makineId} className={`border-l-4 text-xs ${planColorClass(planDays)}`}>
                    <TableCell>
                      <span className="font-mono text-muted-foreground mr-1">{g.makineKod}</span>
                      <span className="font-medium">{g.makineAd}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant} className="text-[10px]">{status}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {g.items.length > 0 ? (
                        <Badge variant="outline" className="text-[10px]">{g.items.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium ${planBadgeClass(planDays)}`}>
                        {lastItem ? `${planDays} gün` : '0 gün'}
                      </span>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{lastItem ? fmtDateTime(lastItem.bitisTarihi) : '—'}</div>
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

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WEEK_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function currentWeekStart() {
  const start = new Date();
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function chartBuckets(period: 'week' | 'month' | 'all') {
  const now = new Date();
  if (period === 'week') {
    const start = currentWeekStart();
    return WEEK_DAYS.map((label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        label,
        match: (value: Date) => sameDay(value, date),
      };
    });
  }

  if (period === 'month') {
    const month = now.getMonth();
    const year = now.getFullYear();
    return [1, 2, 3, 4, 5].map((week) => ({
      label: `${week}. Hafta`,
      match: (value: Date) => value.getFullYear() === year && value.getMonth() === month && Math.ceil(value.getDate() / 7) === week,
    }));
  }

  const year = now.getFullYear();
  return MONTHS.map((label, month) => ({
    label,
    match: (value: Date) => value.getFullYear() === year && value.getMonth() === month,
  }));
}

function sumForBucket(items: { createdAt: string; miktar: number }[], match: (date: Date) => boolean) {
  return items.reduce((sum, item) => {
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime()) || !match(date)) return sum;
    return sum + Math.abs(item.miktar);
  }, 0);
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

    return chartBuckets(chartPeriod).map((bucket) => ({
      label: bucket.label,
      uretim: Math.round(sumForBucket(uretimItems, bucket.match)),
      sevkiyat: Math.round(sumForBucket(sevkItems, bucket.match)),
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
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OZ-6 — Vardiya Özeti */}
        <VardiyaOzetWidget />

        {/* OZ-7 — Makine Durumları */}
        <MakineDurumlariWidget />
      </div>
    </div>
  );
}
