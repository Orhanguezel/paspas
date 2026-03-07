'use client';

// =============================================================
// FILE: src/app/(main)/admin/gantt/_components/gantt-client.tsx
// Paspas ERP — Gantt Diyagramı (zaman çizelgesi görünümü)
// =============================================================

import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCcw, Search, Wrench } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

import { useLocaleContext } from '@/i18n/LocaleProvider';
import { useListGanttAdminQuery } from '@/integrations/endpoints/admin/erp/gantt_admin.endpoints';
import { useListMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { EMIR_DURUM_LABELS, EMIR_DURUM_BADGE } from '@/integrations/shared/erp/uretim_emirleri.types';
import type { UretimEmriDurum } from '@/integrations/shared/erp/uretim_emirleri.types';
import type { GanttItemDto } from '@/integrations/shared/erp/gantt.types';

// ─── Sabitler ───────────────────────────────────────────────
const DAY_MS = 86_400_000;
const COL_W = 40; // piksel / gün
const ROW_H = 44; // piksel / satır
const LABEL_W = 220; // sol etiket sütunu genişliği

const DURUM_COLORS: Record<string, string> = {
  planlandi:    'bg-slate-400',
  hazirlaniyor: 'bg-amber-500',
  uretimde:     'bg-blue-500',
  tamamlandi:   'bg-emerald-500',
  iptal:        'bg-red-400',
};

const DURUM_BAR_FILL: Record<string, string> = {
  planlandi:    'bg-slate-300',
  hazirlaniyor: 'bg-amber-300',
  uretimde:     'bg-blue-300',
  tamamlandi:   'bg-emerald-200',
  iptal:        'bg-red-200',
};

const ALL_DURUMLAR = ['planlandi', 'hazirlaniyor', 'uretimde', 'tamamlandi', 'iptal'] as const;

// ─── Yardımcılar ────────────────────────────────────────────
function toDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function fmtDateFull(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function isoStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// ─── Bileşen ────────────────────────────────────────────────
export default function GanttClient() {
  const { t } = useLocaleContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());
  const [baslangic, setBaslangic] = useState(isoStr(addDays(today, -7)));
  const [bitis, setBitis] = useState(isoStr(addDays(today, 30)));
  const [q, setQ] = useState('');
  const [durumFilter, setDurumFilter] = useState<string>('');
  const [makineIdFilter, setMakineIdFilter] = useState<string>('');

  const queryParams = useMemo(() => ({
    baslangic: baslangic || undefined,
    bitis: bitis || undefined,
    q: q.trim() || undefined,
    durum: durumFilter || undefined,
    makineId: makineIdFilter || undefined,
  }), [baslangic, bitis, q, durumFilter, makineIdFilter]);

  const { data, isLoading, isFetching, refetch } = useListGanttAdminQuery(queryParams);
  const { data: makinelerData } = useListMakinelerAdminQuery();
  const items = data?.items ?? [];
  const makineler = makinelerData?.items ?? [];

  // Zaman aralığını hesapla
  const { timelineStart, totalDays, columns } = useMemo(() => {
    const tsStart = startOfDay(new Date(baslangic));
    const tsEnd = startOfDay(new Date(bitis));
    const days = Math.max(1, daysBetween(tsStart, tsEnd) + 1);

    const cols: { date: Date; label: string; isToday: boolean; isWeekend: boolean; monthLabel?: string }[] = [];
    let lastMonth = -1;

    for (let i = 0; i < days; i++) {
      const d = addDays(tsStart, i);
      const dayOfWeek = d.getDay();
      const month = d.getMonth();
      cols.push({
        date: d,
        label: d.getDate().toString(),
        isToday: isoStr(d) === isoStr(today),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        monthLabel: month !== lastMonth
          ? d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
          : undefined,
      });
      lastMonth = month;
    }

    return { timelineStart: tsStart, totalDays: days, columns: cols };
  }, [baslangic, bitis]);

  // Ay gruplarını hesapla (üst başlık)
  const monthHeaders = useMemo(() => {
    const headers: { label: string; span: number }[] = [];
    let current = '';
    let count = 0;

    for (const col of columns) {
      const monthKey = col.date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      if (monthKey !== current) {
        if (current) headers.push({ label: current, span: count });
        current = monthKey;
        count = 1;
      } else {
        count++;
      }
    }
    if (current) headers.push({ label: current, span: count });
    return headers;
  }, [columns]);

  function ilerleme(planlanan: number, uretilen: number) {
    if (!planlanan) return 0;
    return Math.min(100, Math.round((uretilen / planlanan) * 100));
  }

  // Tarih aralığını kaydır
  function shiftRange(days: number) {
    const s = addDays(new Date(baslangic), days);
    const e = addDays(new Date(bitis), days);
    setBaslangic(isoStr(s));
    setBitis(isoStr(e));
  }

  // Bugüne git
  function scrollToToday() {
    if (!scrollRef.current) return;
    const todayIdx = columns.findIndex((c) => c.isToday);
    if (todayIdx >= 0) {
      scrollRef.current.scrollLeft = Math.max(0, todayIdx * COL_W - 200);
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ─── Başlık ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{t('admin.erp.gantt.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('admin.erp.gantt.description', { count: data?.total ?? 0 })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => shiftRange(-7)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={scrollToToday}>
              {t('admin.erp.gantt.today')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => shiftRange(7)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ─── Filtreler ─── */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Tarih aralığı */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('admin.erp.gantt.columns.baslangic')}</Label>
            <Input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} className="w-40 h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('admin.erp.gantt.columns.bitis')}</Label>
            <Input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} className="w-40 h-8" />
          </div>

          {/* Arama */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('admin.erp.gantt.filters.ara')}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('admin.erp.gantt.filters.araPlaceholder')}
                className="pl-7 w-44 h-8"
              />
            </div>
          </div>

          {/* Durum filtresi */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('admin.erp.gantt.filters.durum')}</Label>
            <Select value={durumFilter || '_all'} onValueChange={(v) => setDurumFilter(v === '_all' ? '' : v)}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t('admin.erp.gantt.filters.tumDurumlar')}</SelectItem>
                {ALL_DURUMLAR.map((d) => (
                  <SelectItem key={d} value={d}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block size-2 rounded-full ${DURUM_COLORS[d]}`} />
                      {EMIR_DURUM_LABELS[d]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Makine filtresi */}
          {makineler.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('admin.erp.gantt.filters.makine')}</Label>
              <Select value={makineIdFilter || '_all'} onValueChange={(v) => setMakineIdFilter(v === '_all' ? '' : v)}>
                <SelectTrigger className="w-48 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('admin.erp.gantt.filters.tumMakineler')}</SelectItem>
                  {makineler.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-mono">{m.kod}</span> — {m.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Durum renk açıklaması */}
          <div className="flex items-center gap-3 pb-1 ml-auto">
            {ALL_DURUMLAR.map((d) => (
              <div key={d} className="flex items-center gap-1.5">
                <span className={`inline-block size-3 rounded-sm ${DURUM_COLORS[d]}`} />
                <span className="text-xs text-muted-foreground">{EMIR_DURUM_LABELS[d]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Gantt Diyagramı ─── */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border py-16 text-center text-sm text-muted-foreground">
            {t('admin.erp.gantt.notFound')}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="flex">
              {/* ─── Sol etiket sütunu ─── */}
              <div className="shrink-0 border-r bg-muted/50" style={{ width: LABEL_W }}>
                {/* Ay başlığı boşluk */}
                <div className="h-6 border-b" />
                {/* Gün başlığı boşluk */}
                <div className="h-8 border-b" />
                {/* Satırlar */}
                {items.map((item) => {
                  const durum = item.durum as UretimEmriDurum;
                  const isTamamlandi = item.durum === 'tamamlandi';
                  return (
                    <div
                      key={item.uretimEmriId}
                      className={`flex items-center gap-2 border-b px-2 ${isTamamlandi ? 'opacity-60' : ''}`}
                      style={{ height: ROW_H }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate flex items-center gap-1 ${isTamamlandi ? 'line-through text-muted-foreground' : ''}`}>
                          {isTamamlandi && <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />}
                          {item.emirNo}
                          {item.montaj && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Wrench className="size-3 text-amber-500 shrink-0 cursor-default" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs">
                                {t('admin.erp.gantt.montajVar')}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {item.urunAd ?? item.urunId}
                        </div>
                        {item.musteriOzet && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {item.musteriOzet}
                          </div>
                        )}
                      </div>
                      <Badge variant={EMIR_DURUM_BADGE[durum] ?? 'outline'} className="text-[10px] px-1.5 py-0 shrink-0">
                        {EMIR_DURUM_LABELS[durum] ?? durum}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {/* ─── Zaman çizelgesi ─── */}
              <div className="flex-1 overflow-x-auto" ref={scrollRef}>
                <div style={{ width: totalDays * COL_W, minWidth: '100%' }}>
                  {/* Ay başlıkları */}
                  <div className="flex h-6 border-b">
                    {monthHeaders.map((mh, i) => (
                      <div
                        key={i}
                        className="text-[10px] font-medium text-muted-foreground flex items-center justify-center border-r bg-muted/30"
                        style={{ width: mh.span * COL_W }}
                      >
                        {mh.label}
                      </div>
                    ))}
                  </div>

                  {/* Gün başlıkları */}
                  <div className="flex h-8 border-b">
                    {columns.map((col, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-center text-[10px] border-r
                          ${col.isToday ? 'bg-blue-100 dark:bg-blue-950 font-bold text-blue-700 dark:text-blue-300' : ''}
                          ${col.isWeekend && !col.isToday ? 'bg-muted/40 text-muted-foreground' : ''}
                        `}
                        style={{ width: COL_W }}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>

                  {/* Gantt satırları */}
                  {items.map((item) => (
                    <GanttRow
                      key={item.uretimEmriId}
                      item={item}
                      timelineStart={timelineStart}
                      totalDays={totalDays}
                      columns={columns}
                      ilerleme={ilerleme}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Gantt Satır Bileşeni ────────────────────────────────────
function GanttRow({
  item,
  timelineStart,
  totalDays,
  columns,
  ilerleme,
}: {
  item: GanttItemDto;
  timelineStart: Date;
  totalDays: number;
  columns: { isToday: boolean; isWeekend: boolean }[];
  ilerleme: (p: number, u: number) => number;
}) {
  const start = toDate(item.baslangicTarihi);
  const end = toDate(item.bitisTarihi);
  const termin = toDate(item.terminTarihi);
  const durum = item.durum as UretimEmriDurum;
  const pct = ilerleme(item.planlananMiktar, item.uretilenMiktar);
  const isTamamlandi = item.durum === 'tamamlandi';
  const isIptal = item.durum === 'iptal';

  // Bar pozisyonu hesaplama
  let barLeft = 0;
  let barWidth = 0;

  if (start && end) {
    const startOffset = daysBetween(timelineStart, start);
    const duration = daysBetween(start, end) + 1;
    barLeft = Math.max(0, startOffset) * COL_W;
    barWidth = Math.max(1, Math.min(duration, totalDays - Math.max(0, startOffset))) * COL_W;
  } else if (start) {
    const startOffset = daysBetween(timelineStart, start);
    barLeft = Math.max(0, startOffset) * COL_W;
    barWidth = COL_W; // tek gün
  }

  const barColor = DURUM_BAR_FILL[durum] ?? 'bg-slate-300';
  const fillColor = DURUM_COLORS[durum] ?? 'bg-slate-400';

  return (
    <div className={`relative border-b ${isTamamlandi ? 'opacity-60' : ''}`} style={{ height: ROW_H }}>
      {/* Arka plan grid çizgileri */}
      <div className="absolute inset-0 flex">
        {columns.map((col, i) => (
          <div
            key={i}
            className={`border-r h-full
              ${col.isToday ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}
              ${col.isWeekend && !col.isToday ? 'bg-muted/20' : ''}
            `}
            style={{ width: COL_W }}
          />
        ))}
      </div>

      {/* Gantt barı */}
      {barWidth > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute top-2 cursor-default"
              style={{ left: barLeft + 2, width: Math.max(barWidth - 4, 8) }}
            >
              {/* Arka plan bar */}
              <div className={`h-7 rounded-md ${barColor} relative overflow-hidden shadow-sm ${isIptal ? 'opacity-50' : ''}`}>
                {/* İlerleme dolgu */}
                {pct > 0 && !isIptal && (
                  <div
                    className={`absolute inset-y-0 left-0 rounded-l-md ${fillColor} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                )}
                {/* Tamamlandı checkmark */}
                {isTamamlandi && barWidth > 30 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="size-4 text-emerald-700 drop-shadow-sm" />
                  </div>
                )}
                {/* Bar içi yüzde — tamamlanmış/iptal değilse */}
                {!isTamamlandi && !isIptal && barWidth > 60 && (
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white drop-shadow-sm">
                    {pct}%
                  </div>
                )}
                {/* Montaj ikonu */}
                {item.montaj && barWidth > 20 && (
                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <Wrench className="size-3 text-amber-600 drop-shadow-sm" />
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium">{item.emirNo}</div>
              {item.urunAd ? (
                <div className="text-xs">
                  <span className="font-mono text-muted-foreground">{item.urunKod}</span>
                  {' '}{item.urunAd}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">{item.urunId}</div>
              )}
              {item.musteriOzet && (
                <div className="text-xs text-muted-foreground">{item.musteriOzet}</div>
              )}
              <div className="text-xs">
                {start ? fmtDateFull(start) : '—'} → {end ? fmtDateFull(end) : '—'}
              </div>
              {termin && (
                <div className="text-xs text-muted-foreground">
                  Termin: {fmtDateFull(termin)}
                </div>
              )}
              <div className="text-xs">
                İlerleme: {pct}% ({item.uretilenMiktar}/{item.planlananMiktar})
              </div>
              {item.montaj && (
                <div className="text-xs flex items-center gap-1 text-amber-600">
                  <Wrench className="size-3" /> Montaj operasyonu var
                </div>
              )}
              <Badge variant={EMIR_DURUM_BADGE[durum] ?? 'outline'} className="text-[10px]">
                {EMIR_DURUM_LABELS[durum] ?? durum}
              </Badge>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
