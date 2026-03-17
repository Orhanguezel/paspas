"use client";

import { useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight, RefreshCcw, Search, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListGanttAdminQuery } from "@/integrations/endpoints/admin/erp/gantt_admin.endpoints";
import { useListMakinelerAdminQuery } from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import type { GanttBarDto, GanttBlockDto, GanttMachineDto } from "@/integrations/shared/erp/gantt.types";

const DAY_MS = 86_400_000;
const ROW_H = 56;
const LABEL_W = 260;
const PRESET_COL_W: Record<RangePreset, number> = {
  week: 140,
  month: 42,
  quarter: 14,
};
const BLOCK_STYLES: Record<GanttBlockDto["tip"], string> = {
  hafta_sonu: "bg-slate-200/65",
  tatil: "bg-rose-200/70",
  durus: "bg-orange-300/70",
};
const BLOCK_LABELS: Record<GanttBlockDto["tip"], string> = {
  hafta_sonu: "Hafta Sonu / Çalışma Yok",
  tatil: "Tatil / Planlı Kesinti",
  durus: "Operatör Duruşu",
};

const DURUM_STYLES: Record<string, { dot: string; track: string; fill: string; text: string; badge: string }> = {
  bekliyor: {
    dot: "bg-amber-500",
    track: "border border-amber-300 bg-amber-50",
    fill: "bg-amber-500",
    text: "text-amber-950",
    badge: "border-amber-300 bg-amber-50 text-amber-800",
  },
  calisiyor: {
    dot: "bg-blue-600",
    track: "border border-blue-300 bg-blue-50",
    fill: "bg-blue-600",
    text: "text-blue-950",
    badge: "border-blue-300 bg-blue-50 text-blue-800",
  },
  tamamlandi: {
    dot: "bg-emerald-600",
    track: "border border-emerald-300 bg-emerald-50",
    fill: "bg-emerald-500",
    text: "text-emerald-950",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  duraklatildi: {
    dot: "bg-orange-500",
    track: "border border-orange-300 bg-orange-50",
    fill: "bg-orange-500",
    text: "text-orange-950",
    badge: "border-orange-300 bg-orange-50 text-orange-800",
  },
  iptal: {
    dot: "bg-rose-600",
    track: "border border-rose-300 bg-rose-50",
    fill: "bg-rose-500",
    text: "text-rose-950",
    badge: "border-rose-300 bg-rose-50 text-rose-800",
  },
};

const DURUM_LABELS: Record<string, string> = {
  bekliyor: "Bekliyor",
  calisiyor: "Çalışıyor",
  duraklatildi: "Durdu",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
};

const ALL_DURUMLAR = ["bekliyor", "calisiyor", "duraklatildi", "tamamlandi", "iptal"] as const;
const RANGE_PRESETS = {
  week: 7,
  month: 30,
  quarter: 90,
} as const;

type RangePreset = keyof typeof RANGE_PRESETS;

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(value: string | null): string {
  const parsed = toDate(value);
  if (!parsed) return "—";
  return parsed.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string | null): string {
  const parsed = toDate(value);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("tr-TR");
}

function preciseDayOffset(start: Date, point: Date): number {
  return (point.getTime() - start.getTime()) / DAY_MS;
}

function preciseDayDuration(start: Date, end: Date): number {
  return Math.max((end.getTime() - start.getTime()) / DAY_MS, 1 / 24);
}

function blockPatternStyle(tip: GanttBlockDto["tip"]): React.CSSProperties {
  if (tip === "durus") {
    return { backgroundColor: "rgba(254,215,170,0.95)" }; // orange-200
  }
  if (tip === "tatil") {
    return { backgroundColor: "rgba(254,205,211,0.95)" }; // rose-200
  }
  // hafta_sonu
  return { backgroundColor: "rgba(226,232,240,0.95)" }; // slate-200
}

function getBlockRect(block: GanttBlockDto, timelineStart: Date, totalDays: number, colWidth: number) {
  const start = toDate(block.baslangicTarihi);
  const end = toDate(block.bitisTarihi);
  if (!start || !end) return null;

  const startOffset = preciseDayOffset(timelineStart, start);
  const duration = preciseDayDuration(start, end);
  const left = Math.max(0, startOffset) * colWidth;
  const width = Math.max(6, Math.min(duration, totalDays - Math.max(0, startOffset)) * colWidth);

  return { left, width };
}

function progressOf(item: GanttBarDto): number {
  if (!item.planlananMiktar) return 0;
  return Math.max(0, Math.min(100, Math.round((item.uretilenMiktar / item.planlananMiktar) * 100)));
}

function hasVisiblePlan(item: GanttBarDto) {
  return Boolean(item.baslangicTarihi && item.bitisTarihi);
}

export default function GanttClient() {
  const { t } = useLocaleContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());
  const [rangePreset, setRangePreset] = useState<RangePreset>("week");
  const [baslangic, setBaslangic] = useState(isoDate(today));
  const [bitis, setBitis] = useState(isoDate(addDays(today, RANGE_PRESETS.week - 1)));
  const [q, setQ] = useState("");
  const [durumFilter, setDurumFilter] = useState("");
  const [makineIdFilter, setMakineIdFilter] = useState("");
  const [makineGosterim, setMakineGosterim] = useState<"kuyrukta" | "tamami">("kuyrukta");

  const queryParams = useMemo(
    () => ({
      baslangic: baslangic || undefined,
      bitis: bitis || undefined,
      q: q.trim() || undefined,
      durum: durumFilter || undefined,
      makineId: makineIdFilter || undefined,
    }),
    [baslangic, bitis, q, durumFilter, makineIdFilter],
  );

  const { data, isLoading, isFetching, refetch } = useListGanttAdminQuery(queryParams);
  const { data: makinelerData } = useListMakinelerAdminQuery({});
  const colWidth = PRESET_COL_W[rangePreset];

  const groups = useMemo(
    () =>
      makineGosterim === "tamami"
        ? (data?.items ?? [])
        : (data?.items ?? []).filter((group) => group.items.length > 0),
    [data?.items, makineGosterim],
  );
  const makineler = makinelerData?.items ?? [];
  const totalBarCount = useMemo(() => groups.reduce((sum, group) => sum + group.items.length, 0), [groups]);
  const summary = useMemo(() => {
    const bars = groups.flatMap((group) => group.items);
    return {
      makineSayisi: groups.length,
      toplamIs: bars.length,
      calisan: bars.filter((item) => item.durum === "calisiyor").length,
      bekleyen: bars.filter((item) => item.durum === "bekliyor").length,
      durdu: bars.filter((item) => item.durum === "duraklatildi").length,
      montajli: bars.filter((item) => item.montaj).length,
    };
  }, [groups]);

  const { timelineStart, totalDays, columns } = useMemo(() => {
    const start = startOfDay(new Date(baslangic));
    const end = startOfDay(new Date(bitis));
    const days = Math.max(1, daysBetween(start, end) + 1);
    const cols: { date: Date; label: string; isToday: boolean; isWeekend: boolean }[] = [];

    for (let i = 0; i < days; i++) {
      const date = addDays(start, i);
      cols.push({
        date,
        label: String(date.getDate()),
        isToday: isoDate(date) === isoDate(today),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    return { timelineStart: start, totalDays: days, columns: cols };
  }, [baslangic, bitis, today]);

  const monthHeaders = useMemo(() => {
    const headers: Array<{ label: string; span: number }> = [];
    let current = "";
    let span = 0;

    for (const col of columns) {
      const label = col.date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
      if (label !== current) {
        if (current) headers.push({ label: current, span });
        current = label;
        span = 1;
      } else {
        span += 1;
      }
    }
    if (current) headers.push({ label: current, span });
    return headers;
  }, [columns]);

  function shiftRange(days: number) {
    setBaslangic(isoDate(addDays(new Date(baslangic), days)));
    setBitis(isoDate(addDays(new Date(bitis), days)));
  }

  function applyPreset(preset: RangePreset) {
    setRangePreset(preset);
    setBaslangic(isoDate(today));
    setBitis(isoDate(addDays(today, RANGE_PRESETS[preset] - 1)));
  }

  function scrollToToday() {
    if (!scrollRef.current) return;
    const index = columns.findIndex((col) => col.isToday);
    if (index >= 0) {
      scrollRef.current.scrollLeft = Math.max(0, index * colWidth - 220);
    }
  }

  function resetFilters() {
    setRangePreset("month");
    setBaslangic(isoDate(today));
    setBitis(isoDate(addDays(today, RANGE_PRESETS.month - 1)));
    setQ("");
    setDurumFilter("");
    setMakineIdFilter("");
    setMakineGosterim("kuyrukta");
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{t("admin.erp.gantt.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.erp.gantt.description", { count: totalBarCount })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border p-1">
              <Button variant={rangePreset === "week" ? "default" : "ghost"} size="sm" onClick={() => applyPreset("week")}>
                Haftalik
              </Button>
              <Button variant={rangePreset === "month" ? "default" : "ghost"} size="sm" onClick={() => applyPreset("month")}>
                Aylik
              </Button>
              <Button
                variant={rangePreset === "quarter" ? "default" : "ghost"}
                size="sm"
                onClick={() => applyPreset("quarter")}
              >
                3 Aylik
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => shiftRange(-RANGE_PRESETS[rangePreset])}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={scrollToToday}>
              {t("admin.erp.gantt.today")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => shiftRange(RANGE_PRESETS[rangePreset])}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCcw className={`size-4${isFetching ? " animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <SummaryCard label="Makine" value={summary.makineSayisi} />
          <SummaryCard label="Toplam İş" value={summary.toplamIs} />
          <SummaryCard label="Çalışan" value={summary.calisan} valueClassName="text-indigo-600" />
          <SummaryCard label="Bekleyen" value={summary.bekleyen} valueClassName="text-amber-600" />
          <SummaryCard label="Durdu" value={summary.durdu} valueClassName="text-orange-600" />
          <SummaryCard label="Montajlı" value={summary.montajli} valueClassName="text-emerald-600" />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("admin.erp.gantt.columns.baslangic")}</Label>
            <Input type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} className="h-8 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("admin.erp.gantt.columns.bitis")}</Label>
            <Input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} className="h-8 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("admin.erp.gantt.filters.ara")}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("admin.erp.gantt.filters.araPlaceholder")}
                className="h-8 w-52 pl-7"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("admin.erp.gantt.filters.durum")}</Label>
            <Select
              value={durumFilter || "_all"}
              onValueChange={(value) => setDurumFilter(value === "_all" ? "" : value)}
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t("admin.erp.gantt.filters.tumDurumlar")}</SelectItem>
                {ALL_DURUMLAR.map((durum) => (
                  <SelectItem key={durum} value={durum}>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block size-2 rounded-full ${DURUM_STYLES[durum].dot}`} />
                      {DURUM_LABELS[durum]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {makineler.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("admin.erp.gantt.filters.makine")}</Label>
              <Select
                value={makineIdFilter || "_all"}
                onValueChange={(value) => setMakineIdFilter(value === "_all" ? "" : value)}
              >
                <SelectTrigger className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t("admin.erp.gantt.filters.tumMakineler")}</SelectItem>
                  {makineler.map((makine) => (
                    <SelectItem key={makine.id} value={makine.id}>
                      <span className="font-mono">{makine.kod}</span> - {makine.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Görünüm</Label>
            <Select value={makineGosterim} onValueChange={(v) => setMakineGosterim(v as "kuyrukta" | "tamami")}>
              <SelectTrigger className="h-8 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kuyrukta">Kuyruktaki Makineler</SelectItem>
                <SelectItem value="tamami">Tüm Makineler</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t("admin.erp.gantt.filters.reset")}
          </Button>
          <div className="ml-auto flex items-center gap-3 pb-1">
            {ALL_DURUMLAR.map((durum) => (
              <div key={durum} className="flex items-center gap-1.5">
                <span className={`inline-block size-3 rounded-sm ${DURUM_STYLES[durum].dot}`} />
                <span className="text-xs text-muted-foreground">{DURUM_LABELS[durum]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex size-3 items-center justify-center rounded-full bg-amber-500 text-[6px] font-bold text-white">!</span>
              <span className="text-xs text-muted-foreground">H.Sonu Bitiş</span>
            </div>
            {(["hafta_sonu", "tatil", "durus"] as const).map((tip) => (
              <div key={tip} className="flex items-center gap-1.5">
                <span
                  className={`inline-block size-3 rounded-sm border ${BLOCK_STYLES[tip]}`}
                  style={blockPatternStyle(tip)}
                />
                <span className="text-xs text-muted-foreground">{BLOCK_LABELS[tip]}</span>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-md border py-16 text-center text-sm text-muted-foreground">
            {t("admin.erp.gantt.notFound")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <div className="flex">
              <div className="shrink-0 border-r bg-muted/40" style={{ width: LABEL_W }}>
                <div className="h-6 border-b" />
                <div className="h-8 border-b" />
                {groups.map((group) => {
                  const sonBitis = group.items.length
                    ? formatDateTime(group.items[group.items.length - 1]?.bitisTarihi ?? null)
                    : "—";
                  return (
                    <div key={group.makineId} className="border-b px-3 flex items-center gap-2" style={{ height: ROW_H }}>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold leading-tight">
                          <span className="font-mono">{group.makineKod}</span>
                          <span className="ml-1 font-normal text-muted-foreground">{group.makineAd}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground leading-tight truncate">
                          {group.items.length} iş · Son: {sonBitis}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 overflow-x-auto" ref={scrollRef}>
                <div style={{ width: totalDays * colWidth, minWidth: "100%" }}>
                  <div className="flex h-6 border-b">
                    {monthHeaders.map((header) => (
                      <div
                        key={`${header.label}-${header.span}`}
                        className="flex items-center justify-center border-r bg-muted/30 text-[10px] font-medium text-muted-foreground"
                        style={{ width: header.span * colWidth }}
                      >
                        {header.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex h-8 border-b">
                    {columns.map((col) => (
                      <div
                        key={col.date.toISOString()}
                        className={`flex items-center justify-center border-r text-[10px] ${
                          col.isToday ? "bg-blue-100 font-semibold text-blue-700" : ""
                        } ${col.isWeekend && !col.isToday ? "bg-muted/30 text-muted-foreground" : ""}`}
                        style={{ width: colWidth }}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                  {groups.map((group) => (
                    <MachineTimelineRow
                      key={group.makineId}
                      group={group}
                      timelineStart={timelineStart}
                      totalDays={totalDays}
                      columns={columns}
                      colWidth={colWidth}
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

function SummaryCard({ label, value, valueClassName }: { label: string; value: number; valueClassName?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueClassName ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function MachineTimelineRow({
  group,
  timelineStart,
  totalDays,
  columns,
  colWidth,
}: {
  group: GanttMachineDto;
  timelineStart: Date;
  totalDays: number;
  columns: Array<{ date: Date; isToday: boolean; isWeekend: boolean }>;
  colWidth: number;
}) {
  const bars = useMemo(() => {
    const sorted = group.items.filter(hasVisiblePlan).sort((a, b) => a.sira - b.sira);

    return sorted
      .map((item) => {
        const start = toDate(item.baslangicTarihi);
        const end = toDate(item.bitisTarihi);
        if (!start || !end) return null;

        const startOffset = preciseDayOffset(timelineStart, start);
        const duration = preciseDayDuration(start, end);
        const left = Math.max(0, startOffset) * colWidth;
        const width = Math.max(12, Math.min(duration, totalDays - Math.max(0, startOffset)) * colWidth - 4);

        return { item, left, width };
      })
      .filter((value): value is { item: GanttBarDto; left: number; width: number } => value !== null);
  }, [group.items, timelineStart, totalDays]);

  // Bugün çizgisi pozisyonu (saat bazlı)
  const now = new Date();
  const todayOffset = preciseDayOffset(timelineStart, now);
  const todayLineLeft = todayOffset * colWidth;
  const showTodayLine = todayOffset >= 0 && todayOffset <= totalDays;

  return (
    <div className="relative border-b" style={{ height: ROW_H }}>
      {/* Layer 0: Column grid + today highlight */}
      <div className="absolute inset-0 flex">
        {columns.map((col) => (
          <div
            key={col.date.toISOString()}
            className={`h-full border-r ${col.isToday ? "bg-blue-50/40" : ""}`}
            style={{ width: colWidth }}
          />
        ))}
      </div>

      {/* Layer 1: Weekend stripes — ALWAYS visible on all weekends for all machines */}
      <div className="absolute inset-0 z-1 flex pointer-events-none">
        {columns.map((col) =>
          col.isWeekend ? (
            <div
              key={`wk-${col.date.toISOString()}`}
              className="h-full"
              style={{ width: colWidth, ...blockPatternStyle("hafta_sonu") }}
            />
          ) : (
            <div key={`wk-${col.date.toISOString()}`} style={{ width: colWidth }} />
          ),
        )}
      </div>

      {/* Layer 2: Work bars (z-[5]) — on top of weekend stripes */}
      {bars.length === 0 ? (
        <div className="absolute inset-y-0 left-3 z-5 flex items-center text-xs text-muted-foreground">
          Bu makinede seçili aralıkta planlı iş yok
        </div>
      ) : (
        bars.map(({ item, left, width }) => (
          <GanttBar key={item.kuyrukId} item={item} left={left} top={12} width={width} />
        ))
      )}

      {/* Layer 3: Non-working hafta sonu + tatil blocks (z-10) — bar'ların üstünde */}
      {group.blocks
        .filter((block) => block.tip !== "durus")
        .map((block) => {
          const rect = getBlockRect(block, timelineStart, totalDays, colWidth);
          if (!rect) return null;

          return (
            <Tooltip key={block.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute inset-y-0 z-10 border-x border-background/50"
                  style={{ left: rect.left, width: rect.width, ...blockPatternStyle(block.tip) }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {BLOCK_LABELS[block.tip]}: {formatDateTime(block.baslangicTarihi)} → {formatDateTime(block.bitisTarihi)}
              </TooltipContent>
            </Tooltip>
          );
        })}

      {/* Layer 4: Bugün çizgisi */}
      {showTodayLine && (
        <div
          className="absolute top-0 bottom-0 z-20 w-px bg-red-500 pointer-events-none"
          style={{ left: todayLineLeft }}
        >
          <div className="absolute -top-0.5 -left-1 size-2 rounded-full bg-red-500" />
        </div>
      )}

      {/* Layer 5: Duruş blocks (z-[15]) — on top of everything */}
      {group.blocks
        .filter((block) => block.tip === "durus")
        .map((block) => {
          const rect = getBlockRect(block, timelineStart, totalDays, colWidth);
          if (!rect) return null;

          return (
            <Tooltip key={block.id}>
              <TooltipTrigger asChild>
                <div
                  className={`absolute inset-y-0 z-15 border ${BLOCK_STYLES[block.tip]}`}
                  style={{ left: rect.left, width: rect.width, ...blockPatternStyle(block.tip) }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {BLOCK_LABELS[block.tip]}: {formatDateTime(block.baslangicTarihi)} → {formatDateTime(block.bitisTarihi)}
              </TooltipContent>
            </Tooltip>
          );
        })}
    </div>
  );
}

function GanttBar({ item, left, top, width }: { item: GanttBarDto; left: number; top: number; width: number }) {
  const pct = progressOf(item);
  const style = DURUM_STYLES[item.durum] ?? DURUM_STYLES.bekliyor;
  const isCancelled = item.durum === "iptal";

  const bitisDate = toDate(item.bitisTarihi);
  const isWeekendBitis = bitisDate ? bitisDate.getDay() === 0 || bitisDate.getDay() === 6 : false;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute z-5 cursor-default" style={{ left: left + 2, top, width }}>
          <div
            className={`relative h-8 overflow-hidden rounded-md shadow-sm ${style.track} ${isWeekendBitis ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
          >
            {pct > 0 && !isCancelled && (
              <div className={`absolute inset-y-0 left-0 ${style.fill}`} style={{ width: `${pct}%` }} />
            )}
            {isCancelled && <div className={`absolute inset-0 opacity-35 ${style.fill}`} />}
            <div className={`absolute inset-0 flex items-center gap-1 px-2 text-[10px] font-medium ${style.text}`}>
              <span className="truncate">{item.operasyonAdi ?? item.emirNo}</span>
              {item.musteriOzet && width > 120 && <span className="shrink-0 text-muted-foreground">· {item.musteriOzet}</span>}
              {item.montaj && (
                <span className="ml-auto flex items-center gap-0.5 shrink-0 text-amber-700">
                  <Wrench className="size-3" />
                  {width > 100 && <span className="text-[9px]">Montaj</span>}
                </span>
              )}
              {isWeekendBitis && (
                <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white" title="Bitiş hafta sonuna denk geliyor">
                  !
                </span>
              )}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1 text-xs">
          {item.operasyonAdi && <div className="font-medium">{item.operasyonAdi}</div>}
          {item.musteriOzet && <div>Müşteri: {item.musteriOzet}</div>}
          <div>Başlangıç: {formatDateTime(item.baslangicTarihi)}</div>
          <div>Bitiş: {formatDateTime(item.bitisTarihi)}</div>
          {isWeekendBitis && (
            <div className="font-medium text-amber-600">⚠ Bitiş hafta sonuna denk geliyor</div>
          )}
          <div>
            İlerleme: {pct}% ({item.uretilenMiktar}/{item.planlananMiktar})
          </div>
          <Badge variant="outline" className={`text-[10px] ${style.badge}`}>
            {DURUM_LABELS[item.durum] ?? item.durum}
          </Badge>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
