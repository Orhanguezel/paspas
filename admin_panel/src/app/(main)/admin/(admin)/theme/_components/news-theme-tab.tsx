"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ThemeNewsSection } from "@/integrations/shared";

/* ─── renk paleti (section tab ile aynı) ── */
const BLOCK_COLORS = [
  { bg: "bg-blue-500",   light: "bg-blue-100",   border: "border-blue-200"   },
  { bg: "bg-violet-500", light: "bg-violet-100",  border: "border-violet-200" },
  { bg: "bg-emerald-500",light: "bg-emerald-100", border: "border-emerald-200"},
  { bg: "bg-orange-500", light: "bg-orange-100",  border: "border-orange-200" },
  { bg: "bg-rose-500",   light: "bg-rose-100",    border: "border-rose-200"   },
  { bg: "bg-teal-500",   light: "bg-teal-100",    border: "border-teal-200"   },
  { bg: "bg-amber-500",  light: "bg-amber-100",   border: "border-amber-200"  },
  { bg: "bg-indigo-500", light: "bg-indigo-100",  border: "border-indigo-200" },
];

/* ─── keys where count / cols / banner inputs are shown ── */
const COUNT_KEYS  = new Set(["carousel", "sidebar", "related"]);
const COLS_KEYS   = new Set(["grid"]);
function isBannerKey(key: string): boolean {
  return key.startsWith("banner_") || key.startsWith("banners_");
}

/* ─────────────────────────── SortableNewsBlock ── */

interface BlockProps {
  section:  ThemeNewsSection;
  index:    number;
  onToggle: (v: boolean) => void;
  onUpdate: (patch: Partial<ThemeNewsSection>) => void;
  onRemove: () => void;
  busy:     boolean;
}

function SortableNewsBlock({ section, index, onToggle, onUpdate, onRemove, busy }: BlockProps) {
  const id = section.key || String(index);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const color = BLOCK_COLORS[index % BLOCK_COLORS.length];

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const showCount     = COUNT_KEYS.has(section.key);
  const showCols      = COLS_KEYS.has(section.key);
  const showBannerPos = isBannerKey(section.key);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-card transition-all ${
        isDragging ? "shadow-xl ring-2 ring-primary/20" : "shadow-sm hover:shadow-md"
      } ${!section.enabled ? "opacity-60" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none shrink-0 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          disabled={busy}
          aria-label="Sırala"
        >
          <GripVertical className="size-4" />
        </button>
        <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.bg}`} />
        <Switch checked={section.enabled} onCheckedChange={onToggle} disabled={busy} className="shrink-0" />
        <span className={`flex-1 min-w-0 truncate text-sm font-semibold ${!section.enabled ? "text-muted-foreground" : ""}`}>
          {section.label || section.key || `Blok ${index + 1}`}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          disabled={busy}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Expanded */}
      {section.enabled && (
        <div className={`border-t ${color.border} rounded-b-xl bg-muted/30 px-3 pb-3 pt-3 grid grid-cols-2 gap-3`}>
          {/* Label */}
          <div className={`space-y-1 ${!showCount && !showCols ? "col-span-2" : ""}`}>
            <Label className="text-xs text-muted-foreground">Başlık</Label>
            <Input
              value={section.label}
              className="h-8 text-xs"
              onChange={(e) => onUpdate({ label: e.target.value })}
              disabled={busy}
            />
          </div>

          {/* Count */}
          {showCount && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Adet</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                placeholder="∞"
                value={section.count === null || section.count === undefined ? "" : String(section.count)}
                onChange={(e) =>
                  onUpdate({ count: e.target.value.trim() === "" ? null : Number(e.target.value) })
                }
                disabled={busy}
              />
            </div>
          )}

          {/* Banner IDs */}
          {showBannerPos && (
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">Banner ID (virgülle ayır: 50,51)</Label>
              <Input
                value={section.bannerIds ?? ""}
                className="h-8 text-xs font-mono"
                placeholder="50"
                onChange={(e) => onUpdate({ bannerIds: e.target.value || undefined })}
                disabled={busy}
              />
            </div>
          )}

          {/* Cols */}
          {showCols && (
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Grid Sütun (LG)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onUpdate({ cols: col })}
                    disabled={busy}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition-all ${
                      section.cols === col
                        ? `${color.bg} border-transparent text-white shadow-sm`
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Preview Panel ── */

function FullWidthBannerPreview({ item }: { item: ThemeNewsSection }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-rose-500" />
        <span className="truncate font-medium text-rose-700">{item.label}</span>
        {item.bannerIds && <span className="ml-auto font-mono text-rose-600">#{item.bannerIds}</span>}
      </div>
      <div className="h-5 w-full rounded border border-dashed border-rose-300 bg-rose-50 flex items-center justify-center">
        <span className="text-[8px] text-rose-400">12/12 Tam Genişlik</span>
      </div>
    </div>
  );
}

function ListPreview({ sections }: { sections: ThemeNewsSection[] }) {
  const enabled  = [...sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const carousel = enabled.find((s) => s.key === "carousel");
  const grid     = enabled.find((s) => s.key === "grid");
  const cols     = grid?.cols ?? 3;

  const sidebarItems   = enabled.filter((s) => s.key === "sidebar" || s.key.startsWith("banner_sidebar_"));
  const fullWidthItems = enabled.filter((s) => s.key.startsWith("banner_full_"));
  const mainMinOrder   = Math.min(carousel?.order ?? 99, grid?.order ?? 99);
  const fullTop    = fullWidthItems.filter((s) => s.order < mainMinOrder);
  const fullBottom = fullWidthItems.filter((s) => s.order >= mainMinOrder);

  const hasSidebar = sidebarItems.length > 0;

  return (
    <div className="space-y-1.5 text-[10px] text-muted-foreground">
      {/* Full-width banners above */}
      {fullTop.map((item) => <FullWidthBannerPreview key={item.key} item={item} />)}

      {/* Carousel */}
      {carousel && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="font-medium">{carousel.label}</span>
            <span className="ml-auto">{carousel.count ?? 6} makale</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <div className="col-span-3 h-8 rounded bg-blue-100" />
            <div className="col-span-2 space-y-1">
              {[1,2,3].map((i) => <div key={i} className="h-[18px] rounded bg-blue-50" />)}
            </div>
          </div>
        </div>
      )}

      {/* Grid + Sidebar */}
      <div className={`grid gap-1 ${hasSidebar ? "grid-cols-4" : "grid-cols-1"}`}>
        {grid && (
          <div className={`space-y-1 ${hasSidebar ? "col-span-3" : ""}`}>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{grid.label}</span>
              <span className="ml-auto">{cols} sütun</span>
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, 1fr)` }}>
              {Array.from({ length: Math.min(cols * 2, 6) }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-emerald-50" />
              ))}
            </div>
          </div>
        )}
        {hasSidebar && (
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              if (item.key === "sidebar") {
                return (
                  <div key={item.key} className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="truncate font-medium">{item.label}</span>
                    </div>
                    {[1,2,3,4].map((i) => <div key={i} className="h-4 rounded bg-orange-50" />)}
                  </div>
                );
              }
              return (
                <div key={item.key} className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="truncate font-medium text-amber-700">{item.label}</span>
                    {item.bannerIds && <span className="ml-auto font-mono text-amber-600">#{item.bannerIds}</span>}
                  </div>
                  <div className="h-7 rounded border border-dashed border-amber-300 bg-amber-50" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-width banners below */}
      {fullBottom.map((item) => <FullWidthBannerPreview key={item.key} item={item} />)}
    </div>
  );
}

function DetailPreview({ sections }: { sections: ThemeNewsSection[] }) {
  const enabled  = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const mainKeys = new Set(["cover", "meta", "body", "video", "tags", "comments"]);
  const main     = enabled.filter((s) => mainKeys.has(s.key));
  const sidebar  = enabled.filter((s) => !mainKeys.has(s.key) && !s.key.startsWith("banner_full_"));
  const fullBanners = enabled.filter((s) => s.key.startsWith("banner_full_"));
  const mainMinOrder = Math.min(...main.map((s) => s.order), 99);
  const fullTop    = fullBanners.filter((s) => s.order < mainMinOrder);
  const fullBottom = fullBanners.filter((s) => s.order >= mainMinOrder);

  return (
    <div className="space-y-1 text-[10px]">
      {fullTop.map((item) => <FullWidthBannerPreview key={item.key} item={item} />)}
      <div className="grid grid-cols-4 gap-1">
        {/* Main */}
        <div className="col-span-3 space-y-1">
          {main.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1.5 rounded bg-muted/60 px-2 py-1">
              <div className={`h-1.5 w-1.5 rounded-full ${BLOCK_COLORS[i % BLOCK_COLORS.length].bg}`} />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
        {/* Sidebar */}
        <div className="space-y-1">
          {sidebar.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 rounded bg-muted/40 px-1.5 py-1">
              <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${BLOCK_COLORS[(i + 4) % BLOCK_COLORS.length].bg}`} />
              <span className="truncate text-[9px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      {fullBottom.map((item) => <FullWidthBannerPreview key={item.key} item={item} />)}
    </div>
  );
}

/* ─────────────────────────── DnD block list ── */

interface BlockListProps {
  sections:  ThemeNewsSection[];
  onUpdate:  (idx: number, patch: Partial<ThemeNewsSection>) => void;
  onToggle:  (idx: number, v: boolean) => void;
  onRemove:  (idx: number) => void;
  onReorder: (sections: ThemeNewsSection[]) => void;
  busy:      boolean;
}

function BlockList({ sections, onUpdate, onToggle, onRemove, onReorder, busy }: BlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s, i) => s.key || String(i));
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    onReorder(arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, order: i + 1 })));
  };

  if (!sections.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Blok yok. Varsayılanları yükleyin veya ekleyin.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sections.map((s, i) => s.key || String(i))}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sections.map((s, i) => (
            <SortableNewsBlock
              key={s.key || i}
              section={s}
              index={i}
              onToggle={(v) => onToggle(i, v)}
              onUpdate={(p) => onUpdate(i, p)}
              onRemove={() => onRemove(i)}
              busy={busy}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/* ─────────────────────────── Main Export ── */

export interface NewsThemeTabProps {
  listSections:    ThemeNewsSection[];
  detailSections:  ThemeNewsSection[];
  onListChange:    (sections: ThemeNewsSection[]) => void;
  onDetailChange:  (sections: ThemeNewsSection[]) => void;
  busy:            boolean;
}

const DEFAULT_LIST_SECTIONS: ThemeNewsSection[] = [
  { key: "banner_full_1",    enabled: true,  order: 0,  label: "Tam Genişlik Reklam 1",  bannerIds: "52" },
  { key: "carousel",         enabled: true,  order: 1,  label: "Carousel",               count: 6 },
  { key: "grid",             enabled: true,  order: 2,  label: "Haber Listesi",           cols: 3 },
  { key: "banner_sidebar_1", enabled: true,  order: 3,  label: "Sidebar Üst Reklam",      bannerIds: "50" },
  { key: "sidebar",          enabled: true,  order: 4,  label: "Kenar Çubuğu",            count: 8 },
  { key: "banner_sidebar_2", enabled: true,  order: 5,  label: "Sidebar Alt Reklam",      bannerIds: "51" },
  { key: "banner_full_2",    enabled: true,  order: 10, label: "Tam Genişlik Reklam 2",   bannerIds: "53" },
];

const DEFAULT_DETAIL_SECTIONS: ThemeNewsSection[] = [
  { key: "banner_full_1",  enabled: true,  order: 0,  label: "Makale Üstü Tam Reklam",  bannerIds: "57" },
  { key: "cover",          enabled: true,  order: 1,  label: "Kapak Görseli"                           },
  { key: "meta",           enabled: true,  order: 2,  label: "Yazar & Tarih"                           },
  { key: "body",           enabled: true,  order: 3,  label: "Makale İçeriği"                          },
  { key: "video",          enabled: true,  order: 4,  label: "Video Embed"                             },
  { key: "tags",           enabled: true,  order: 5,  label: "Etiketler"                               },
  { key: "comments",       enabled: true,  order: 6,  label: "Yorumlar"                                },
  { key: "banners_top",    enabled: true,  order: 7,  label: "Sidebar Üst Reklam",       bannerIds: "55" },
  { key: "related",        enabled: true,  order: 8,  label: "İlgili Haberler",          count: 7       },
  { key: "banners_bottom", enabled: true,  order: 9,  label: "Sidebar Alt Reklam",       bannerIds: "56" },
  { key: "banner_full_2",  enabled: true,  order: 10, label: "Makale Altı Tam Reklam",   bannerIds: "58" },
];

export function NewsThemeTab({
  listSections,
  detailSections,
  onListChange,
  onDetailChange,
  busy,
}: NewsThemeTabProps) {
  const updateList   = (idx: number, patch: Partial<ThemeNewsSection>) =>
    onListChange(listSections.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const toggleList   = (idx: number, v: boolean) => updateList(idx, { enabled: v });
  const removeList   = (idx: number) => onListChange(listSections.filter((_, i) => i !== idx));

  const updateDetail = (idx: number, patch: Partial<ThemeNewsSection>) =>
    onDetailChange(detailSections.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const toggleDetail = (idx: number, v: boolean) => updateDetail(idx, { enabled: v });
  const removeDetail = (idx: number) => onDetailChange(detailSections.filter((_, i) => i !== idx));

  const addListBanner = () => {
    let maxN = 0;
    for (const s of listSections) {
      const m = s.key.match(/^banner_sidebar_(\d+)$/);
      if (m) maxN = Math.max(maxN, Number(m[1]));
    }
    const n = maxN + 1;
    onListChange([...listSections, {
      key: `banner_sidebar_${n}`,
      enabled: true,
      order: listSections.length + 1,
      label: `Sidebar Reklam ${n}`,
      bannerIds: "",
    }]);
  };

  const addListFullWidthBanner = () => {
    let maxN = 0;
    for (const s of listSections) {
      const m = s.key.match(/^banner_full_(\d+)$/);
      if (m) maxN = Math.max(maxN, Number(m[1]));
    }
    const n = maxN + 1;
    onListChange([...listSections, {
      key: `banner_full_${n}`,
      enabled: true,
      order: listSections.length + 1,
      label: `Tam Genişlik Reklam ${n}`,
      bannerIds: "",
    }]);
  };

  const addDetailBanner = () => {
    let maxN = 0;
    for (const s of detailSections) {
      const m = s.key.match(/^banners_sidebar_(\d+)$/);
      if (m) maxN = Math.max(maxN, Number(m[1]));
    }
    const n = maxN + 1;
    onDetailChange([...detailSections, {
      key: `banners_sidebar_${n}`,
      enabled: true,
      order: detailSections.length + 1,
      label: `Sidebar Reklam ${n}`,
      bannerIds: "",
    }]);
  };

  const addDetailFullWidthBanner = () => {
    let maxN = 0;
    for (const s of detailSections) {
      const m = s.key.match(/^banner_full_(\d+)$/);
      if (m) maxN = Math.max(maxN, Number(m[1]));
    }
    const n = maxN + 1;
    onDetailChange([...detailSections, {
      key: `banner_full_${n}`,
      enabled: true,
      order: detailSections.length + 1,
      label: `Tam Genişlik Reklam ${n}`,
      bannerIds: "",
    }]);
  };

  return (
    <Tabs defaultValue="list" className="space-y-4">
      <TabsList>
        <TabsTrigger value="list">
          Liste Sayfası
          <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {listSections.filter((s) => s.enabled).length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="detail">
          Detay Sayfası
          <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {detailSections.filter((s) => s.enabled).length}
          </span>
        </TabsTrigger>
      </TabsList>

      {/* ── Liste Sayfası ── */}
      <TabsContent value="list">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Blok Akışı — /haberler</CardTitle>
                  <CardDescription className="mt-1">
                    Carousel, makale grid ve sidebar bloklarını sırala veya aç/kapat.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addListBanner}
                    disabled={busy}
                  >
                    + Sidebar Banner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addListFullWidthBanner}
                    disabled={busy}
                  >
                    + Tam Genişlik Banner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onListChange(DEFAULT_LIST_SECTIONS)}
                    disabled={busy}
                  >
                    Varsayılan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BlockList
                sections={listSections}
                onUpdate={updateList}
                onToggle={toggleList}
                onRemove={removeList}
                onReorder={onListChange}
                busy={busy}
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="text-sm">Liste Önizleme</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ListPreview sections={listSections} />
              </CardContent>
            </Card>

            <Card className="mt-3">
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="text-sm">Sıralama</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {listSections
                  .filter((s) => s.enabled)
                  .map((s, i) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className={`h-2 w-2 shrink-0 rounded-full ${BLOCK_COLORS[listSections.indexOf(s) % BLOCK_COLORS.length].bg}`} />
                      <span className="flex-1 min-w-0 truncate text-xs font-medium">{s.label}</span>
                      {s.count != null && <span className="shrink-0 text-[10px] text-muted-foreground">{s.count} adet</span>}
                      {s.cols  != null && <span className="shrink-0 text-[10px] text-muted-foreground">{s.cols} sütun</span>}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* ── Detay Sayfası ── */}
      <TabsContent value="detail">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Blok Akışı — /haberler/[slug]</CardTitle>
                  <CardDescription className="mt-1">
                    Detay sayfasında görünecek bölümleri sırala veya aç/kapat.
                  </CardDescription>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDetailBanner}
                    disabled={busy}
                  >
                    + Sidebar Banner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDetailFullWidthBanner}
                    disabled={busy}
                  >
                    + Tam Genişlik Banner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDetailChange(DEFAULT_DETAIL_SECTIONS)}
                    disabled={busy}
                  >
                    Varsayılan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BlockList
                sections={detailSections}
                onUpdate={updateDetail}
                onToggle={toggleDetail}
                onRemove={removeDetail}
                onReorder={onDetailChange}
                busy={busy}
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="lg:sticky lg:top-4 lg:self-start space-y-3">
            <Card>
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="text-sm">Detay Önizleme</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <DetailPreview sections={detailSections} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="text-sm">Sıralama</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {detailSections
                  .filter((s) => s.enabled)
                  .map((s, i) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className={`h-2 w-2 shrink-0 rounded-full ${BLOCK_COLORS[detailSections.indexOf(s) % BLOCK_COLORS.length].bg}`} />
                      <span className="flex-1 min-w-0 truncate text-xs font-medium">{s.label}</span>
                      {s.count != null && <span className="shrink-0 text-[10px] text-muted-foreground">{s.count} adet</span>}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
