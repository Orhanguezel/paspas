'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useListGanttAdminQuery } from '@/integrations/endpoints/admin/erp/gantt_admin.endpoints';
import type { GanttBarDto, GanttBlockDto } from '@/integrations/shared/erp/gantt.types';

const DAY = 86_400_000;
type Range = 1 | 3 | 7;
const STATUS: Record<string, { label: string; className: string }> = {
  tamamlandi: { label: 'Tamamlandı', className: 'border-emerald-300 bg-emerald-100 text-emerald-900' },
  calisiyor: { label: 'Çalışıyor', className: 'border-blue-300 bg-blue-100 text-blue-900' },
  bekliyor: { label: 'Sırada', className: 'border-slate-300 bg-slate-100 text-slate-800' },
  duraklatildi: { label: 'Duraklatıldı', className: 'border-orange-300 bg-orange-100 text-orange-900' },
  iptal: { label: 'İptal', className: 'border-rose-300 bg-rose-100 text-rose-900' },
};
function startOfDay(value: Date) { const result = new Date(value); result.setHours(0, 0, 0, 0); return result; }
function addDays(value: Date, days: number) { return new Date(value.getTime() + days * DAY); }
function iso(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function asDate(value: string | null) { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function fmt(value: string | null) { const date = asDate(value); return date ? date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'; }
function pct(value: Date, start: Date, end: Date) { return ((value.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100; }
function clipped(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
  const visibleStart = new Date(Math.max(start.getTime(), rangeStart.getTime()));
  const visibleEnd = new Date(Math.min(end.getTime(), rangeEnd.getTime()));
  if (visibleEnd <= visibleStart) return null;
  return { left: Math.max(0, pct(visibleStart, rangeStart, rangeEnd)), width: Math.max(.5, pct(visibleEnd, rangeStart, rangeEnd) - pct(visibleStart, rangeStart, rangeEnd)), before: start < rangeStart, after: end > rangeEnd };
}
function blockClass(block: GanttBlockDto) { return block.tip === 'durus' ? 'bg-orange-100/70' : block.tip === 'tatil' ? 'bg-rose-50' : 'bg-slate-100/80'; }

export default function GanttClient() {
  const [range, setRange] = useState<Range>(3);
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [hovered, setHovered] = useState<GanttBarDto | null>(null);
  const [pinned, setPinned] = useState<GanttBarDto | null>(null);
  const rangeEnd = addDays(anchor, range);
  const { data, isLoading, isFetching, refetch } = useListGanttAdminQuery({ baslangic: iso(anchor), bitis: iso(addDays(rangeEnd, -1)) });
  const groups = (data?.items ?? []).filter((group) => group.items.length > 0);
  const allItems = groups.flatMap((group) => group.items);
  const detail = pinned ?? hovered ?? allItems[0] ?? null;
  const ticks = useMemo(() => {
    const values: Array<{ at: Date; label: string }> = [];
    const stepHours = range === 1 ? 3 : range === 3 ? 6 : 24;
    for (let cursor = new Date(anchor); cursor <= rangeEnd; cursor = new Date(cursor.getTime() + stepHours * 3_600_000)) {
      values.push({ at: cursor, label: stepHours === 24 ? cursor.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }) : cursor.toLocaleString('tr-TR', { weekday: range === 3 ? 'short' : undefined, day: range === 3 ? 'numeric' : undefined, hour: '2-digit', minute: '2-digit' }) });
    }
    return values;
  }, [anchor, range, rangeEnd]);
  const now = new Date();
  const nowVisible = now >= anchor && now <= rangeEnd;
  const minTimelineWidth = range === 1 ? 720 : range === 3 ? 960 : 1120;

  return <div className="space-y-4 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight">Gantt Planı</h1><p className="text-sm text-muted-foreground">Her iş gerçek zaman ölçeğinde ayrı satırda gösterilir.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border p-1">{([1, 3, 7] as Range[]).map((value) => <Button key={value} size="sm" variant={range === value ? 'default' : 'ghost'} onClick={() => { setRange(value); setAnchor(startOfDay(new Date())); }}>{value === 1 ? '1 gün' : value === 3 ? '3 gün' : '1 hafta'}</Button>)}</div>
        <Button size="icon" variant="outline" aria-label="Önceki dönem" onClick={() => setAnchor(addDays(anchor, -range))}><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" onClick={() => setAnchor(startOfDay(new Date()))}>Bugün</Button>
        <Button size="icon" variant="outline" aria-label="Sonraki dönem" onClick={() => setAnchor(addDays(anchor, range))}><ChevronRight className="size-4" /></Button>
        <Button size="icon" variant="outline" aria-label="Yenile" onClick={() => refetch()}><RefreshCcw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} /></Button>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-3 py-2 text-xs">
      {Object.values(STATUS).slice(0, 3).map((status) => <span key={status.label} className="flex items-center gap-1.5"><span className={`size-3 rounded-sm border ${status.className}`} />{status.label}</span>)}
      <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-slate-100 ring-1 ring-slate-200" />Çalışma dışı zaman</span>
      <span className="ml-auto font-medium">{anchor.toLocaleDateString('tr-TR')} – {addDays(rangeEnd, -1).toLocaleDateString('tr-TR')}</span>
    </div>
    <Card className="overflow-hidden"><CardContent className="p-0"><div className="overflow-x-auto" role="region" aria-label="Gantt çizelgesi"><div style={{ minWidth: 250 + minTimelineWidth }}>
      <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: `250px minmax(${minTimelineWidth}px,1fr)` }}><div className="sticky left-0 z-30 border-r bg-muted/40 p-3 font-medium">Makine / Üretim işi</div><div className="relative h-14">{ticks.map((tick) => <div key={tick.at.toISOString()} className="absolute inset-y-0 border-l px-1 pt-2 text-[11px] text-muted-foreground" style={{ left: `${pct(tick.at, anchor, rangeEnd)}%` }}>{tick.label}</div>)}</div></div>
      {isLoading ? <div className="p-8 text-center text-sm text-muted-foreground">Plan yükleniyor…</div> : groups.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Bu tarih aralığında planlanmış iş yok.</div> : groups.map((group) => <div key={group.makineId}>
        <div className="sticky left-0 z-20 border-b bg-slate-50 px-3 py-2 text-sm font-semibold">{group.makineKod} — {group.makineAd}<span className="ml-2 font-normal text-muted-foreground">{group.items.length} iş</span></div>
        {group.items.map((item) => { const start = asDate(item.baslangicTarihi); const end = asDate(item.bitisTarihi); const rect = start && end ? clipped(start, end, anchor, rangeEnd) : null; const style = STATUS[item.durum] ?? STATUS.bekliyor; return <div key={item.kuyrukId} className="grid border-b" style={{ gridTemplateColumns: `250px minmax(${minTimelineWidth}px,1fr)` }}>
          <button className={`sticky left-0 z-20 border-r bg-background p-3 text-left hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${detail?.kuyrukId === item.kuyrukId ? 'bg-primary/5' : ''}`} onMouseEnter={() => !pinned && setHovered(item)} onFocus={() => !pinned && setHovered(item)} onClick={() => setPinned((current) => current?.kuyrukId === item.kuyrukId ? null : item)}><span className="block truncate font-medium">{item.urunAd ?? item.operasyonAdi ?? 'Üretim işi'}</span><span className="block text-xs text-muted-foreground">{item.emirNo} · {item.planlananMiktar.toLocaleString('tr-TR')} adet</span></button>
          <div className="relative h-[66px] overflow-hidden bg-white">{ticks.map((tick) => <span key={tick.at.toISOString()} className="absolute inset-y-0 border-l border-slate-100" style={{ left: `${pct(tick.at, anchor, rangeEnd)}%` }} />)}
            {group.blocks.map((block) => { const blockStart = asDate(block.baslangicTarihi); const blockEnd = asDate(block.bitisTarihi); const blockRect = blockStart && blockEnd ? clipped(blockStart, blockEnd, anchor, rangeEnd) : null; return blockRect ? <span key={block.id} aria-label={block.etiket} className={`absolute inset-y-0 ${blockClass(block)}`} style={{ left: `${blockRect.left}%`, width: `${blockRect.width}%` }} /> : null; })}
            {rect && <button aria-label={`${item.emirNo} ${style.label}`} className={`absolute top-4 h-9 overflow-hidden rounded-md border px-2 text-left text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary ${style.className} ${detail?.kuyrukId === item.kuyrukId ? 'ring-2 ring-primary' : ''}`} style={{ left: `${rect.left}%`, width: `${rect.width}%`, minWidth: 8 }} onMouseEnter={() => !pinned && setHovered(item)} onFocus={() => !pinned && setHovered(item)} onClick={() => setPinned((current) => current?.kuyrukId === item.kuyrukId ? null : item)}><span className="block truncate">{rect.before ? '◀ ' : ''}{style.label} · {item.emirNo}{rect.after ? ' ▶' : ''}</span></button>}
            {nowVisible && <span className="absolute inset-y-0 z-10 w-px bg-rose-500" style={{ left: `${pct(now, anchor, rangeEnd)}%` }}><span className="absolute left-1 top-0 whitespace-nowrap text-[10px] font-medium text-rose-600">Şimdi: {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></span>}
          </div></div>; })}
      </div>)}</div></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Seçili iş detayı</CardTitle></CardHeader><CardContent>{!detail ? <p className="text-sm text-muted-foreground">Bir iş satırına dokunun veya klavyeyle odaklanın.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs text-muted-foreground">İş / ürün</p><p className="font-medium">{detail.urunAd ?? '—'}</p><p className="text-xs text-muted-foreground">{detail.urunKod ?? 'Kod yok'} · {detail.emirNo}</p></div>
      <div><p className="text-xs text-muted-foreground">Durum ve miktar</p><Badge className={STATUS[detail.durum]?.className}>{STATUS[detail.durum]?.label ?? detail.durum}</Badge><p className="mt-1 text-sm">{detail.uretilenMiktar.toLocaleString('tr-TR')} / {detail.planlananMiktar.toLocaleString('tr-TR')} adet</p></div>
      <div><p className="text-xs text-muted-foreground">Planlanan zaman</p><p className="text-sm">{fmt(detail.planlananBaslangicTarihi)} → {fmt(detail.planlananBitisTarihi)}</p></div>
      <div><p className="text-xs text-muted-foreground">Gerçek / güncel zaman</p><p className="text-sm">{fmt(detail.baslangicTarihi)} → {fmt(detail.bitisTarihi)}</p><p className="text-xs text-muted-foreground">Termin: {fmt(detail.terminTarihi)}</p></div>
      <div className="border-t pt-3 text-sm sm:col-span-2 lg:col-span-4"><span className="font-medium">Ne yapılacak?</span> {detail.operasyonAdi ?? (detail.montaj ? 'Montaj' : 'Üretim')} · <span className="font-medium">Kimin için?</span> {detail.musteriOzet ?? detail.siparisNo ?? 'Stok üretimi'} · <span className="font-medium">Ne zaman bitecek?</span> {fmt(detail.bitisTarihi)}</div>
    </div>}</CardContent></Card>
  </div>;
}
