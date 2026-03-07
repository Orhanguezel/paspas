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
import { GripVertical, Plus, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetThemeAdminQuery, useResetThemeAdminMutation, useUpdateThemeAdminMutation } from "@/integrations/hooks";
import type {
  LayoutBlock,
  ThemeColors,
  ThemeConfigView,
  ThemeDarkMode,
  ThemePage,
  ThemeRadius,
  ThemeSection,
  ThemeUpdateInput,
} from "@/integrations/shared";
import { NewsThemeTab } from "./news-theme-tab";

/* ─────────────────────────────────────── constants ── */

const SECTION_VARIANTS: { value: string; label: string; group: string }[] = [
  { value: "carousel", label: "Carousel", group: "Görünüm" },
  { value: "scroll", label: "Yatay Kaydır", group: "Görünüm" },
  { value: "home_top", label: "Banner Üst", group: "Banner" },
  { value: "home_middle", label: "Banner Orta", group: "Banner" },
  { value: "home_bottom", label: "Banner Alt", group: "Banner" },
  { value: "animal", label: "Hayvan", group: "Kategori" },
  { value: "agriculture", label: "Tarım", group: "Kategori" },
  { value: "real_estate", label: "Emlak", group: "Kategori" },
  { value: "vehicle", label: "Araç", group: "Kategori" },
  { value: "food", label: "Yiyecek", group: "Kategori" },
  { value: "satilik", label: "Satılık", group: "Durum" },
  { value: "kiralik", label: "Kiralık", group: "Durum" },
];

const PAGE_VARIANT_OPTIONS = [
  { value: "default", label: "Varsayılan" },
  { value: "wide", label: "Geniş" },
  { value: "narrow", label: "Dar" },
  { value: "centered", label: "Ortalı" },
];

const HERO_STYLE_OPTIONS = [
  { value: "carousel", label: "Carousel" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Görsel" },
  { value: "minimal", label: "Minimal" },
];

const DEFAULT_VIEW_OPTIONS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "Liste" },
];

const FILTERS_STYLE_OPTIONS = [
  { value: "sidebar", label: "Kenar Çubuğu" },
  { value: "top", label: "Üst Bar" },
  { value: "modal", label: "Modal" },
];

const PAGE_KEY_LABELS: Record<string, string> = {
  home: "Ana Sayfa",
  listings: "İlanlar",
  listing_detail: "İlan Detay",
  about: "Hakkımızda",
  contact: "İletişim",
  campaigns: "Kampanyalar",
  advertise: "İlan Ver",
  announcements: "Duyurular",
  haberler: "Haberler",
};

const COLOR_KEYS: Array<keyof ThemeColors> = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "muted",
  "mutedFg",
  "border",
  "destructive",
  "success",
  "navBg",
  "navFg",
  "footerBg",
  "footerFg",
];

const RADIUS_OPTIONS: ThemeRadius[] = ["0rem", "0.3rem", "0.375rem", "0.5rem", "0.75rem", "1rem", "1.5rem"];

const DARK_OPTIONS: ThemeDarkMode[] = ["light", "dark", "system"];

const GRID_COLS = [1, 2, 3, 4, 5, 6];

const LAYOUT_BLOCK_LABELS: Record<string, string> = {
  hero:                    "Hero Slider",
  category:                "Kategoriler",
  flash_sale:              "Flash Fırsat",
  product_featured:        "Öne Çıkan İlanlar",
  banner_section:          "Banner",
  product_top_selling:     "En Çok Görüntülenen",
  product_latest:          "Son İlanlar",
  popular_product_section: "Popüler İlanlar",
  top_stores_section:      "Top Kategoriler",
  announcements:           "Duyurular",
  news_feed:               "Haberler Beslemesi",
  newsletters_section:     "Bülten",
  infinite_listings:       "Sonsuz Liste",
};

const REPEATABLE_TYPES = ["banner_section", "flash_sale"];
const SPAN_OPTIONS = [4, 6, 12] as const;
const SPAN_OPTIONS_EXTENDED = [4, 6, 8, 12] as const;

/* ── Listing tiplerine ait section tipleri ── */
const LISTING_TYPES = [
  "product_featured", "product_top_selling", "product_latest",
  "popular_product_section", "featured", "recent", "infinite_listings",
];

/* ── Span (sayfa genişliği) ayarı olan tüm tipler ── */
const SPAN_CONFIGURABLE_TYPES = [
  ...REPEATABLE_TYPES,          // banner_section, flash_sale
  "announcements", "news_feed",
  ...LISTING_TYPES,             // product_featured, product_top_selling, product_latest, ...
  "category",
  "top_stores_section",
];

/* ── Sütun sayısı (cols_lg) konfigürasyonu destekleyen tipler ── */
const HAS_COLS_CONFIG = [...LISTING_TYPES, "category", "news_feed"];

/* ── Limit konfigürasyonu destekleyen tipler (flash_sale ID bazlı çalışır, limit yok) ── */
const HAS_LIMIT_CONFIG = [...LISTING_TYPES, "announcements", "news_feed"];

/* ── Tip bazlı varsayılan sütun sayıları ── */
const COLS_DEFAULTS: Record<string, number> = {
  product_featured:        4,
  product_top_selling:     4,
  product_latest:          4,
  popular_product_section: 4,
  featured:                4,
  recent:                  4,
  infinite_listings:       4,
  category:                6,
  news_feed:               3,
};

/* ── Tip bazlı varsayılan limit değerleri ── */
const LIMIT_DEFAULTS: Record<string, number> = {
  product_featured:        8,
  product_top_selling:     8,
  product_latest:          8,
  popular_product_section: 10,
  featured:                8,
  recent:                  8,
  infinite_listings:       20,
  announcements:           7,
  news_feed:               9,
};

/* ── Tip bazlı sütun seçenekleri ── */
const COLS_OPTIONS: Record<string, number[]> = {
  category:  [4, 5, 6, 7, 8],
  news_feed: [2, 3],
  default:   [2, 3, 4, 5],
};

/* ── Config getter helpers ── */
function getBlockSpan(block: LayoutBlock): number {
  if (block.type === "banner_section") return (block.config?.banner_span     as number | undefined) ?? 4;
  if (block.type === "flash_sale")     return (block.config?.flash_sale_span as number | undefined) ?? 6;
  if (block.type === "announcements")  return (block.config?.section_span    as number | undefined) ?? 4;
  if (block.type === "news_feed")      return (block.config?.section_span    as number | undefined) ?? 8;
  // Tüm diğer tipler (listing, category, top_stores, hero, vb.) — section_span yoksa 12 (tam genişlik)
  return (block.config?.section_span as number | undefined) ?? 12;
}

function getBlockColsLg(block: LayoutBlock): number {
  return (block.config?.cols_lg as number | undefined) ?? COLS_DEFAULTS[block.type] ?? 4;
}

function getBlockLimit(block: LayoutBlock): number | null {
  const v = block.config?.limit;
  return v == null ? null : Number(v);
}

function getBlockStackCount(block: LayoutBlock): number {
  return Math.max(1, Number((block.config?.stack_count as number | undefined) ?? 1));
}


const DEFAULT_ADMIN_LAYOUT_BLOCKS: LayoutBlock[] = [
  { id: "hero__1",                    type: "hero",                    instance: 1, enabled_disabled: "on" },
  { id: "category__1",                type: "category",                instance: 1, enabled_disabled: "on",  config: { cols_lg: 6 } },
  { id: "flash_sale__1",              type: "flash_sale",              instance: 1, enabled_disabled: "on",  config: { flash_sale_span: 6 } },
  { id: "flash_sale__2",              type: "flash_sale",              instance: 2, enabled_disabled: "on",  config: { flash_sale_span: 6 } },
  { id: "product_featured__1",        type: "product_featured",        instance: 1, enabled_disabled: "on",  config: { section_span: 8, cols_lg: 4, limit: 8 } },
  { id: "announcements__1",           type: "announcements",           instance: 1, enabled_disabled: "on",  config: { section_span: 4, limit: 7 } },
  { id: "banner_section__1",          type: "banner_section",          instance: 1, enabled_disabled: "on",  config: { banner_span: 4 } },
  { id: "banner_section__2",          type: "banner_section",          instance: 2, enabled_disabled: "on",  config: { banner_span: 4 } },
  { id: "banner_section__3",          type: "banner_section",          instance: 3, enabled_disabled: "on",  config: { banner_span: 4 } },
  { id: "product_top_selling__1",     type: "product_top_selling",     instance: 1, enabled_disabled: "on",  config: { section_span: 8, cols_lg: 4, limit: 8 } },
  { id: "news_feed__1",               type: "news_feed",               instance: 1, enabled_disabled: "on",  config: { section_span: 4, cols_lg: 3, limit: 9 } },
  { id: "banner_section__4",          type: "banner_section",          instance: 4, enabled_disabled: "on",  config: { banner_span: 12 } },
  { id: "product_latest__1",          type: "product_latest",          instance: 1, enabled_disabled: "on",  config: { section_span: 8, cols_lg: 4, limit: 8 } },
  { id: "banner_section__5",          type: "banner_section",          instance: 5, enabled_disabled: "on",  config: { banner_span: 4 } },
  { id: "popular_product_section__1", type: "popular_product_section", instance: 1, enabled_disabled: "on",  config: { section_span: 12, cols_lg: 4, limit: 10 } },
  { id: "banner_section__6",          type: "banner_section",          instance: 6, enabled_disabled: "on",  config: { banner_span: 12 } },
  { id: "top_stores_section__1",      type: "top_stores_section",      instance: 1, enabled_disabled: "on",  config: { section_span: 12 } },
  { id: "newsletters_section__1",     type: "newsletters_section",     instance: 1, enabled_disabled: "on",  config: { section_span: 12 } },
  { id: "infinite_listings__1",       type: "infinite_listings",       instance: 1, enabled_disabled: "off", config: { cols_lg: 4, limit: 20 } },
];

const BLOCK_COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  { bg: "bg-violet-500", light: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  { bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  { bg: "bg-orange-500", light: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { bg: "bg-rose-500", light: "bg-rose-100", text: "text-rose-700", border: "border-rose-200" },
  { bg: "bg-teal-500", light: "bg-teal-100", text: "text-teal-700", border: "border-teal-200" },
  { bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-indigo-500", light: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
];

/* ─────────────────────────────────────── helpers ── */

function defaultTheme(): ThemeConfigView {
  return {
    colors: {},
    radius: "0.375rem",
    fontFamily: null,
    darkMode: "light",
    sections: [],
    pages: {},
    newsListSections: [],
    newsDetailSections: [],
    layout_blocks: [],
  };
}

function normalizeHex(v: string): string {
  const s = String(v || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : "#000000";
}

function sectionId(s: ThemeSection, i: number) {
  return s.key || String(i);
}

/* ─────────────────────────────────── SortableBlock ── */

interface SortableBlockProps {
  section: ThemeSection;
  index: number;
  total: number;
  colorIdx: number;
  onToggle: (v: boolean) => void;
  onUpdate: (patch: Partial<ThemeSection>) => void;
  onMoveTo: (targetPosition: number) => void;
  onRemove: () => void;
  busy: boolean;
}

function SortableBlock({ section, index, total, colorIdx, onToggle, onUpdate, onMoveTo, onRemove, busy }: SortableBlockProps) {
  const id = sectionId(section, index);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const color = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];

  const [posInput, setPosInput] = React.useState(String(index + 1));
  React.useEffect(() => { setPosInput(String(index + 1)); }, [index]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-card transition-all ${
        isDragging ? "shadow-xl ring-2 ring-primary/20" : "shadow-sm hover:shadow-md"
      } ${!section.enabled ? "opacity-60" : ""}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing touch-none flex-shrink-0"
          disabled={busy}
          aria-label="Sırala"
        >
          <GripVertical className="size-4" />
        </button>

        <input
          type="number"
          min={1}
          max={total}
          value={posInput}
          onChange={(e) => setPosInput(e.target.value)}
          onBlur={() => {
            const n = parseInt(posInput, 10);
            if (!isNaN(n) && n >= 1) onMoveTo(n);
            else setPosInput(String(index + 1));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const n = parseInt(posInput, 10);
              if (!isNaN(n) && n >= 1) onMoveTo(n);
            }
          }}
          disabled={busy}
          className="w-9 h-6 text-center text-xs rounded border border-border bg-background font-bold text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-shrink-0"
        />

        <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${color.bg}`} />

        <Switch checked={section.enabled} onCheckedChange={onToggle} disabled={busy} className="flex-shrink-0" />

        <span
          className={`flex-1 min-w-0 text-sm font-semibold truncate ${!section.enabled ? "text-muted-foreground" : ""}`}
        >
          {section.label || section.key || `Blok ${index + 1}`}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 flex-shrink-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          disabled={busy}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Expanded settings */}
      {section.enabled && (
        <div className={`border-t ${color.border} bg-muted/30 rounded-b-xl px-3 pb-3 pt-3 space-y-3`}>
          {/* Label + count */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Başlık</Label>
              <Input
                value={section.label}
                className="h-8 text-xs"
                onChange={(e) => onUpdate({ label: e.target.value })}
                disabled={busy}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Adet</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                placeholder="∞ Sınırsız"
                value={section.limit === null ? "" : String(section.limit)}
                onChange={(e) =>
                  onUpdate({
                    limit: e.target.value.trim() === "" ? null : Number(e.target.value),
                  })
                }
                disabled={busy}
              />
            </div>
          </div>

          {/* Grid column selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ürün Başına Grid (LG)</Label>
            <div className="flex gap-1">
              {GRID_COLS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onUpdate({ colsLg: col })}
                  disabled={busy}
                  className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition-all ${
                    section.colsLg === col
                      ? `${color.bg} text-white border-transparent shadow-sm`
                      : `bg-background hover:bg-muted border-border text-muted-foreground`
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Variant */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Variant</Label>
            <Select
              value={section.variant || "__none__"}
              onValueChange={(v) => onUpdate({ variant: v === "__none__" ? "" : v })}
              disabled={busy}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Seç…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">— Seçilmedi —</span>
                </SelectItem>
                {Object.entries(
                  SECTION_VARIANTS.reduce<Record<string, typeof SECTION_VARIANTS>>((acc, v) => {
                    (acc[v.group] ??= []).push(v);
                    return acc;
                  }, {}),
                ).map(([group, items]) => (
                  <React.Fragment key={group}>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </div>
                    {items.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{v.value}</span>
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row grouping + span */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Satır Grubu <span className="font-normal text-muted-foreground/60">(aynı = yan yana)</span>
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="örn: row_1 (boş = tam genişlik)"
                value={section.rowId ?? ""}
                onChange={(e) => onUpdate({ rowId: e.target.value || undefined })}
                disabled={busy}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Genişlik <span className="font-normal text-muted-foreground/60">(1-12 sütun)</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={12}
                className="h-8 text-xs"
                placeholder="12 = tam"
                value={section.span ?? ""}
                onChange={(e) =>
                  onUpdate({ span: e.target.value.trim() === "" ? undefined : Number(e.target.value) })
                }
                disabled={busy}
              />
            </div>
          </div>

          {/* Flash Sale ID — flash_sale section'ı için */}
          {section.key === "flash_sale" && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Kampanya ID{" "}
                <span className="font-normal text-muted-foreground/60">(virgülle ayır: 1,2 — boş = tümü)</span>
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                placeholder="örn: 1,2 (boş = tüm aktif kampanyalar)"
                value={section.flashSaleIds ?? ""}
                onChange={(e) => onUpdate({ flashSaleIds: e.target.value || undefined })}
                disabled={busy}
              />
            </div>
          )}

          {/* Reklam alanı bilgi notu — banner_row_* sections için */}
          {section.key.startsWith("banner_row") && (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Bannerlar</strong> sayfasına gidin →{" "}
                banner ekle veya düzenle → <em>Satır Numarası</em> alanını{" "}
                <strong>
                  {section.key === "banner_row_1" ? "1" : section.key === "banner_row_2" ? "2" : "3"}
                </strong>{" "}
                olarak ayarlayın. Sütun sayısını da banner üzerinden seçin.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── SortableLayoutBlock ── */

interface SortableLayoutBlockProps {
  block: LayoutBlock;
  index: number;
  total: number;
  colorIdx: number;
  onToggle: (v: boolean) => void;
  onSpanChange: (span: number) => void;
  onInstanceChange: (instance: number) => void;
  onConfigChange: (patch: Record<string, unknown>) => void;
  onMoveTo: (targetPosition: number) => void;
  onRemove: () => void;
  canRemove: boolean;
  busy: boolean;
}

function SortableLayoutBlock({
  block, index, total, colorIdx, onToggle, onSpanChange, onInstanceChange, onConfigChange, onMoveTo, onRemove, canRemove, busy,
}: SortableLayoutBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const color = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];
  const [posInput, setPosInput] = React.useState(String(index + 1));
  React.useEffect(() => { setPosInput(String(index + 1)); }, [index]);
  const [instanceInput, setInstanceInput] = React.useState(String(block.instance));
  React.useEffect(() => { setInstanceInput(String(block.instance)); }, [block.instance]);

  const isEnabled         = block.enabled_disabled === "on";
  const isRepeatable      = REPEATABLE_TYPES.includes(block.type);
  const isSpanConfigurable = SPAN_CONFIGURABLE_TYPES.includes(block.type);
  const hasCols           = HAS_COLS_CONFIG.includes(block.type);
  const hasLimit          = HAS_LIMIT_CONFIG.includes(block.type);
  const hasExtra = isEnabled && (hasCols || hasLimit);

  const currentSpan  = getBlockSpan(block);
  const currentCols  = getBlockColsLg(block);
  const currentLimit = getBlockLimit(block);
  const colsOptions  = COLS_OPTIONS[block.type] ?? COLS_OPTIONS.default;

  const baseLabel    = LAYOUT_BLOCK_LABELS[block.type] ?? block.type;
  const displayLabel = block.instance > 1 ? `${baseLabel} #${block.instance}` : baseLabel;
  const typePrefix   = block.type === "flash_sale" ? "⚡ " : "";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card transition-shadow ${
        isDragging ? "shadow-xl ring-2 ring-primary/20" : "shadow-sm hover:shadow"
      } ${!isEnabled ? "opacity-55" : ""}`}
    >
      {/* ── Ana satır ── */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Sürükleme tutamacı */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing touch-none flex-shrink-0"
          disabled={busy}
          aria-label="Sırala"
        >
          <GripVertical className="size-4" />
        </button>

        {/* Sıra numarası */}
        <input
          type="number"
          min={1}
          max={total}
          value={posInput}
          onChange={(e) => setPosInput(e.target.value)}
          onBlur={() => {
            const n = parseInt(posInput, 10);
            if (!isNaN(n) && n >= 1) onMoveTo(n);
            else setPosInput(String(index + 1));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const n = parseInt(posInput, 10);
              if (!isNaN(n) && n >= 1) onMoveTo(n);
            }
          }}
          disabled={busy}
          className="w-8 h-6 text-center text-xs rounded border border-border bg-background font-bold text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-shrink-0"
        />

        {/* Renkli nokta */}
        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${color.bg}`} />

        {/* Blok adı */}
        <span className={`text-sm font-medium truncate min-w-0 ${!isEnabled ? "text-muted-foreground" : ""}`}>
          {typePrefix}{displayLabel}
        </span>

        {/* "Aktif" rozeti */}
        {isEnabled && (
          <span className="flex-shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 border border-green-200">
            Aktif
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Toggle */}
        <Switch checked={isEnabled} onCheckedChange={onToggle} disabled={busy} className="flex-shrink-0" />

        {/* Span dropdown: banner/flash/announcements/news_feed için */}
        {isSpanConfigurable && (
          <Select
            value={String(currentSpan)}
            onValueChange={(v) => onSpanChange(Number(v))}
            disabled={busy}
          >
            <SelectTrigger className="h-7 w-[68px] text-xs flex-shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(isRepeatable ? SPAN_OPTIONS : SPAN_OPTIONS_EXTENDED).map((s) => (
                <SelectItem key={s} value={String(s)}>{s}/12</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Tekrarlanabilir bloklar: düzenlenebilir instance numarası + sil */}
        {isRepeatable && (
          <>
            {/* Düzenlenebilir instance numarası */}
            <input
              type="number"
              min={1}
              max={99}
              value={instanceInput}
              title="Instance numarası"
              onChange={(e) => setInstanceInput(e.target.value)}
              onBlur={() => {
                const n = parseInt(instanceInput, 10);
                if (!isNaN(n) && n >= 1) onInstanceChange(n);
                else setInstanceInput(String(block.instance));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = parseInt(instanceInput, 10);
                  if (!isNaN(n) && n >= 1) onInstanceChange(n);
                }
              }}
              disabled={busy}
              className="w-8 h-6 text-center text-xs rounded border border-border bg-background font-bold text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-shrink-0"
            />

            {/* Banner yığın sayısı (sadece banner_section için) */}
            {block.type === "banner_section" && (
              <div className="flex items-center gap-0.5 flex-shrink-0" title="Yığın sayısı (dikey banner adedi)">
                {[1, 2, 3].map((n) => {
                  const current = Number(block.config?.stack_count ?? 1);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onConfigChange({ stack_count: n })}
                      disabled={busy}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all border ${
                        current === n
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sil butonu */}
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                className="flex-shrink-0 text-xs font-medium text-destructive hover:underline px-0.5"
              >
                Sil
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Genişletilmiş ayarlar (sütun / limit) ── */}
      {hasExtra && (
        <div className="border-t border-dashed border-border/50 bg-muted/20 px-3 pb-2.5 pt-2 grid grid-cols-2 gap-x-3 gap-y-2">

          {/* Satır başına kart (cols_lg) */}
          {hasCols && (
            <div className="space-y-0.5">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Satır başına kart
              </Label>
              <div className="flex gap-1">
                {colsOptions.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onConfigChange({ cols_lg: col })}
                    disabled={busy}
                    className={`flex-1 rounded border py-1 text-xs font-semibold transition-all ${
                      currentCols === col
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "bg-background hover:bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Maksimum öğe sayısı (limit) */}
          {hasLimit && (
            <div className="space-y-0.5">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Maks. öğe sayısı
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                className="h-7 text-xs"
                placeholder={String(LIMIT_DEFAULTS[block.type] ?? 8)}
                value={currentLimit === null ? "" : String(currentLimit)}
                onChange={(e) =>
                  onConfigChange({
                    limit: e.target.value.trim() === "" ? undefined : Number(e.target.value),
                  })
                }
                disabled={busy}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── LayoutPreview ── */

function LayoutPreview({ blocks }: { blocks: LayoutBlock[] }) {
  const enabled = blocks.filter((b) => b.enabled_disabled === "on");
  if (!enabled.length) return <p className="text-xs text-muted-foreground text-center py-4">Aktif blok yok</p>;

  /* Span bazlı satır grupları */
  const rows: LayoutBlock[][] = [];
  let currentRow: LayoutBlock[] = [];
  let currentSpan = 0;
  for (const b of enabled) {
    const span = getBlockSpan(b);
    if (span >= 12) {
      if (currentRow.length > 0) { rows.push(currentRow); currentRow = []; currentSpan = 0; }
      rows.push([b]);
    } else if (currentSpan + span > 12) {
      rows.push(currentRow);
      currentRow = [b];
      currentSpan = span;
    } else {
      currentRow.push(b);
      currentSpan += span;
      if (currentSpan === 12) { rows.push(currentRow); currentRow = []; currentSpan = 0; }
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const BLOCK_ICONS: Record<string, string> = {
    hero: "🎠", category: "🏷", flash_sale: "⚡", banner_section: "🖼",
    product_featured: "⭐", product_top_selling: "📈", product_latest: "🕐",
    popular_product_section: "🔥", announcements: "📢", news_feed: "📰",
    newsletters_section: "✉", top_stores_section: "🏬", infinite_listings: "∞",
  };

  return (
    <div className="space-y-1.5">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1">
          {row.map((b) => {
            const span       = getBlockSpan(b);
            const colorIdx   = blocks.indexOf(b);
            const color      = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];
            const label      = LAYOUT_BLOCK_LABELS[b.type] ?? b.type;
            const lbl        = b.instance > 1 ? `${label} #${b.instance}` : label;
            const isBanner   = b.type === "banner_section";
            const colsLg     = LISTING_TYPES.includes(b.type) ? getBlockColsLg(b) : null;
            const lim        = HAS_LIMIT_CONFIG.includes(b.type) ? getBlockLimit(b) : null;
            const stackCount = isBanner ? getBlockStackCount(b) : 1;
            const icon       = BLOCK_ICONS[b.type] ?? "▪";

            return (
              <div
                key={b.id}
                style={{ flex: `${span} 0 0%`, minWidth: 0 }}
                className={`rounded-md border ${color.border} ${color.light} overflow-hidden`}
              >
                {/* Üst renk şeridi */}
                <div className={`h-1 w-full ${color.bg}`} />
                <div className="px-1.5 py-1.5">
                  {/* Etiket satırı */}
                  <div className={`text-[10px] font-bold truncate leading-tight ${color.text}`}>
                    {icon} {lbl}
                  </div>
                  {/* Meta bilgiler */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${color.text} bg-white/70`}>
                      {span}/12
                    </span>
                    {stackCount > 1 && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded text-orange-700 bg-orange-100 border border-orange-200">
                        ×{stackCount}
                      </span>
                    )}
                    {colsLg !== null && (
                      <span className="text-[8px] text-muted-foreground">{colsLg} stn</span>
                    )}
                    {lim !== null && (
                      <span className="text-[8px] text-muted-foreground">/{lim}</span>
                    )}
                  </div>
                  {/* Banner yığın görseli */}
                  {isBanner && stackCount > 1 && (
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      {Array.from({ length: stackCount }).map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-sm ${color.bg} opacity-50`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Boşluk dolgusu (toplam span < 12 ise) */}
          {row.reduce((s, b) => s + getBlockSpan(b), 0) < 12 && (
            <div
              style={{ flex: `${12 - row.reduce((s, b) => s + getBlockSpan(b), 0)} 0 0%` }}
              className="rounded-md border border-dashed border-border/40 flex items-center justify-center py-2"
            >
              <span className="text-[9px] text-muted-foreground/40">boş</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────── GridPreview ── */

const GRID_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

interface GridPreviewProps {
  sections: ThemeSection[];
  allSections: ThemeSection[];
}

function GridPreview({ sections, allSections }: GridPreviewProps) {
  if (!sections.length) {
    return <p className="text-xs text-muted-foreground text-center py-4">Aktif blok yok</p>;
  }
  return (
    <div className="space-y-3">
      {sections.map((s) => {
        const cols = Math.max(1, Math.min(6, s.colsLg || 3));
        const itemCount = s.limit ? Math.min(s.limit, cols) : cols;
        const colorIdx = allSections.indexOf(s);
        const color = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];
        const gridClass = GRID_CLASS[cols] ?? "grid-cols-3";
        return (
          <div key={s.key} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${color.bg}`} />
              <span className="text-xs font-medium truncate">{s.label || s.key}</span>
              <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">{cols} sütun</span>
            </div>
            <div className={`grid ${gridClass} gap-1`}>
              {Array.from({ length: itemCount }).map((_, idx) => (
                <div key={idx} className={`h-5 rounded ${color.light}`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────── Main Component ── */

export default function AdminThemeClient() {
  const t = useAdminT("admin.themeManagement");
  const q = useGetThemeAdminQuery();
  const [updateTheme, updateState] = useUpdateThemeAdminMutation();
  const [resetTheme, resetState] = useResetThemeAdminMutation();

  const [form, setForm] = React.useState<ThemeConfigView>(defaultTheme);

  React.useEffect(() => {
    if (q.data) {
      setForm({
        ...q.data,
        sections: [...q.data.sections].sort((a, b) => a.order - b.order),
        layout_blocks: q.data.layout_blocks?.length
          ? q.data.layout_blocks
          : DEFAULT_ADMIN_LAYOUT_BLOCKS,
      });
    }
  }, [q.data]);

  const busy = q.isLoading || q.isFetching || updateState.isLoading || resetState.isLoading;

  /* dnd-kit sensors */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* ── state updaters ── */
  const setColor = React.useCallback((k: keyof ThemeColors, v: string) => {
    setForm((p) => ({ ...p, colors: { ...p.colors, [k]: v } }));
  }, []);

  const setSection = React.useCallback((idx: number, patch: Partial<ThemeSection>) => {
    setForm((p) => ({
      ...p,
      sections: p.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }, []);

  const moveSectionToPosition = React.useCallback((fromIndex: number, toPosition: number) => {
    setForm((p) => {
      const to = Math.max(0, Math.min(toPosition - 1, p.sections.length - 1));
      if (fromIndex === to) return p;
      const reordered = arrayMove(p.sections, fromIndex, to).map((s, i) => ({ ...s, order: i + 1 }));
      return { ...p, sections: reordered };
    });
  }, []);

  const setPage = React.useCallback((key: string, patch: Partial<ThemePage>) => {
    setForm((p) => ({
      ...p,
      pages: { ...p.pages, [key]: { ...(p.pages[key] || {}), ...patch } },
    }));
  }, []);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((p) => {
      const ids = p.sections.map((s, i) => sectionId(s, i));
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return p;
      const reordered = arrayMove(p.sections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i + 1 }));
      return { ...p, sections: reordered };
    });
  }, []);

  const addSection = React.useCallback(() => {
    setForm((p) => ({
      ...p,
      sections: [
        ...p.sections,
        {
          key: `section_${Date.now()}`,
          enabled: true,
          order: p.sections.length + 1,
          label: `${t("sections.item")} ${p.sections.length + 1}`,
          colsLg: 3,
          colsMd: 2,
          colsSm: 1,
          limit: null,
          variant: "",
        },
      ],
    }));
  }, [t]);

  const removeSection = React.useCallback((idx: number) => {
    setForm((p) => ({ ...p, sections: p.sections.filter((_, i) => i !== idx) }));
  }, []);

  /* ── layout_blocks handlers ── */
  const setLayoutBlock = React.useCallback((idx: number, patch: Partial<LayoutBlock>) => {
    setForm((p) => ({
      ...p,
      layout_blocks: (p.layout_blocks ?? []).map((b, i) =>
        i === idx ? { ...b, ...patch } : b,
      ),
    }));
  }, []);

  const setLayoutBlockSpan = React.useCallback((idx: number, span: number) => {
    setForm((p) => {
      const blocks = [...(p.layout_blocks ?? [])];
      const b = blocks[idx];
      if (!b) return p;
      const configKey =
        b.type === "banner_section" ? "banner_span" :
        b.type === "flash_sale"     ? "flash_sale_span" :
        "section_span";
      blocks[idx] = { ...b, config: { ...(b.config ?? {}), [configKey]: span } };
      return { ...p, layout_blocks: blocks };
    });
  }, []);

  const setLayoutBlockInstance = React.useCallback((idx: number, newInstance: number) => {
    setForm((p) => {
      const blocks = [...(p.layout_blocks ?? [])];
      const b = blocks[idx];
      if (!b) return p;
      // instance, içerik seçimini temsil eder (ör: banner ID). Blok id'si stabil kalmalı.
      blocks[idx] = { ...b, instance: newInstance };
      return { ...p, layout_blocks: blocks };
    });
  }, []);

  const setLayoutBlockConfig = React.useCallback((idx: number, patch: Record<string, unknown>) => {
    setForm((p) => {
      const blocks = [...(p.layout_blocks ?? [])];
      const b = blocks[idx];
      if (!b) return p;
      blocks[idx] = { ...b, config: { ...(b.config ?? {}), ...patch } };
      return { ...p, layout_blocks: blocks };
    });
  }, []);

  const moveLayoutBlockToPosition = React.useCallback((fromIndex: number, toPosition: number) => {
    setForm((p) => {
      const blocks = p.layout_blocks ?? [];
      const to = Math.max(0, Math.min(toPosition - 1, blocks.length - 1));
      if (fromIndex === to) return p;
      return { ...p, layout_blocks: arrayMove(blocks, fromIndex, to) };
    });
  }, []);

  const handleLayoutDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm((p) => {
      const blocks = p.layout_blocks ?? [];
      const ids = blocks.map((b) => b.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return p;
      return { ...p, layout_blocks: arrayMove(blocks, oldIndex, newIndex) };
    });
  }, []);

  const addLayoutBlockInstance = React.useCallback((type: string) => {
    setForm((p) => {
      const blocks = p.layout_blocks ?? [];
      const existing = blocks.filter((b) => b.type === type);
      const nextInstance = existing.length + 1;
      const id = `${type}__${nextInstance}`;
      const defaultConfig =
        type === "banner_section"
          ? { banner_span: 4 as const }
          : type === "flash_sale"
          ? { flash_sale_span: 6 as const }
          : undefined;
      const newBlock: LayoutBlock = { id, type, instance: nextInstance, enabled_disabled: "on", config: defaultConfig };
      return { ...p, layout_blocks: [...blocks, newBlock] };
    });
  }, []);

  const removeLayoutBlock = React.useCallback((idx: number) => {
    setForm((p) => ({
      ...p,
      layout_blocks: (p.layout_blocks ?? []).filter((_, i) => i !== idx),
    }));
  }, []);

  const addPage = React.useCallback(() => {
    const key = window.prompt(t("pages.newKeyPrompt"));
    if (!key) return;
    const k = key.trim();
    if (!k) return;
    setForm((p) => ({
      ...p,
      pages: { ...p.pages, [k]: p.pages[k] || { variant: "default" } },
    }));
  }, [t]);

  const removePage = React.useCallback((key: string) => {
    setForm((p) => {
      const next = { ...p.pages };
      delete next[key];
      return { ...p, pages: next };
    });
  }, []);

  /* ── save / reset ── */
  const onSave = React.useCallback(async () => {
    const payload: ThemeUpdateInput = {
      colors: Object.fromEntries(
        Object.entries(form.colors || {})
          .filter(([, v]) => typeof v === "string" && v.trim())
          .map(([k, v]) => [k, normalizeHex(String(v))]),
      ) as ThemeColors,
      radius: form.radius,
      fontFamily: form.fontFamily?.trim() || null,
      darkMode: form.darkMode,
      sections: form.sections.map((s) => ({
        ...s,
        key: s.key.trim(),
        enabled: !!s.enabled,
        order: Number(s.order || 0),
        label: s.label.trim(),
        colsLg: Number(s.colsLg || 1),
        colsMd: Number(s.colsMd || 1),
        colsSm: Number(s.colsSm || 1),
        limit: s.limit === null || s.limit === undefined || String(s.limit) === "" ? null : Number(s.limit),
        variant: s.variant?.trim() || undefined,
        flashSaleIds: s.flashSaleIds?.trim() || undefined,
      })),
      pages: Object.fromEntries(
        Object.entries(form.pages || {}).map(([k, p]) => [
          k,
          {
            variant: p.variant?.trim() || undefined,
            heroStyle: p.heroStyle?.trim() || undefined,
            defaultView: p.defaultView?.trim() || undefined,
            filtersStyle: p.filtersStyle?.trim() || undefined,
            carouselCount: p.carouselCount?.trim() || undefined,
            gridStart: p.gridStart?.trim() || undefined,
            sidebarEnabled: p.sidebarEnabled?.trim() || undefined,
            perPage: p.perPage?.trim() || undefined,
            adBannerPos: p.adBannerPos?.trim() || undefined,
          },
        ]),
      ),
      newsListSections: form.newsListSections.map((s) => ({
        key:       s.key.trim(),
        enabled:   !!s.enabled,
        order:     Number(s.order || 0),
        label:     s.label.trim(),
        count:     s.count === null || s.count === undefined ? null : Number(s.count),
        cols:      s.cols != null ? Number(s.cols) : undefined,
        bannerIds: s.bannerIds?.trim() || undefined,
      })),
      newsDetailSections: form.newsDetailSections.map((s) => ({
        key:       s.key.trim(),
        enabled:   !!s.enabled,
        order:     Number(s.order || 0),
        label:     s.label.trim(),
        count:     s.count === null || s.count === undefined ? null : Number(s.count),
        cols:      s.cols != null ? Number(s.cols) : undefined,
        bannerIds: s.bannerIds?.trim() || undefined,
      })),
      layout_blocks: (form.layout_blocks ?? DEFAULT_ADMIN_LAYOUT_BLOCKS).map((b) => {
        const cfg: Record<string, unknown> = {};
        if (b.config?.banner_span != null)     cfg.banner_span     = b.config.banner_span;
        if (b.config?.flash_sale_span != null) cfg.flash_sale_span = b.config.flash_sale_span;
        if (b.config?.section_span != null)    cfg.section_span    = Number(b.config.section_span);
        if (b.config?.cols_lg != null)         cfg.cols_lg         = Number(b.config.cols_lg);
        if (b.config?.limit != null)           cfg.limit           = Number(b.config.limit);
        if (b.config?.stack_count != null)     cfg.stack_count     = Number(b.config.stack_count);
        return {
          id:               b.id,
          type:             b.type,
          instance:         b.instance,
          enabled_disabled: b.enabled_disabled,
          config:           Object.keys(cfg).length > 0 ? cfg : undefined,
        };
      }),
    };
    try {
      const saved = await updateTheme(payload).unwrap();
      setForm({
        ...saved,
        sections: [...saved.sections].sort((a, b) => a.order - b.order),
        layout_blocks: saved.layout_blocks?.length ? saved.layout_blocks : DEFAULT_ADMIN_LAYOUT_BLOCKS,
      });
      toast.success(t("messages.saved"));
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.message || t("messages.saveError"));
    }
  }, [form, t, updateTheme]);

  const onReset = React.useCallback(async () => {
    if (!window.confirm(t("messages.resetConfirm"))) return;
    try {
      const reset = await resetTheme().unwrap();
      setForm(reset);
      toast.success(t("messages.resetDone"));
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.message || t("messages.resetError"));
    }
  }, [resetTheme, t]);

  /* ── derived ── */
  const pageKeys = Object.keys(form.pages || {});
  const enabledSections = form.sections.filter((s) => s.enabled);
  const layoutBlocks = form.layout_blocks ?? DEFAULT_ADMIN_LAYOUT_BLOCKS;
  const enabledLayoutBlocks = layoutBlocks.filter((b) => b.enabled_disabled === "on");

  /* ─────────────────────────────── render ── */
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => q.refetch()} disabled={busy}>
            <RefreshCcw className="mr-1.5 size-3.5" />
            {t("actions.refresh")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={busy}>
            <RotateCcw className="mr-1.5 size-3.5" />
            {t("actions.reset")}
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={busy}>
            {t("actions.save")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{t("tabs.general")}</TabsTrigger>
          <TabsTrigger value="colors">{t("tabs.colors")}</TabsTrigger>
          <TabsTrigger value="pages">{t("tabs.pages")}</TabsTrigger>
          <TabsTrigger value="haberler">
            Haberler
          </TabsTrigger>
          <TabsTrigger value="layout">
            Ana Sayfa
            {enabledLayoutBlocks.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {enabledLayoutBlocks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("general.title")}</CardTitle>
              <CardDescription>{t("general.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("general.darkMode")}</Label>
                <Select
                  value={form.darkMode}
                  onValueChange={(v) => setForm((p) => ({ ...p, darkMode: v as ThemeDarkMode }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DARK_OPTIONS.map((x) => (
                      <SelectItem key={x} value={x}>
                        {t(`darkMode.${x}` as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("general.radius")}</Label>
                <Select value={form.radius} onValueChange={(v) => setForm((p) => ({ ...p, radius: v as ThemeRadius }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_OPTIONS.map((x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("general.fontFamily")}</Label>
                <Input
                  value={form.fontFamily || ""}
                  onChange={(e) => setForm((p) => ({ ...p, fontFamily: e.target.value }))}
                  placeholder={t("general.fontFamilyPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Colors ── */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("colors.title")}</CardTitle>
              <CardDescription>{t("colors.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {COLOR_KEYS.map((k) => {
                const v = String(form.colors?.[k] || "#000000");
                return (
                  <div key={k} className="space-y-2">
                    <Label>{t(`colors.keys.${k}` as any)}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={normalizeHex(v)}
                        className="w-14 p-1"
                        onChange={(e) => setColor(k, e.target.value)}
                      />
                      <Input value={v} onChange={(e) => setColor(k, e.target.value)} placeholder="#000000" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pages ── */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.title")}</CardTitle>
              <CardDescription>{t("pages.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Button type="button" variant="outline" onClick={addPage} disabled={busy}>
                  <Plus className="mr-2 size-4" />
                  {t("pages.add")}
                </Button>
              </div>

              {pageKeys.map((k) => {
                const p = form.pages[k] || {};
                const friendlyName = PAGE_KEY_LABELS[k];
                return (
                  <div key={k} className="rounded-xl border bg-card shadow-sm space-y-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2.5 bg-muted/40 px-4 py-2.5 border-b">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{friendlyName ?? k}</div>
                        {friendlyName && <div className="text-[10px] text-muted-foreground font-mono">{k}</div>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removePage(k)}
                        disabled={busy}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* Fields */}
                    <div className="grid gap-3 p-4 md:grid-cols-2">
                      {/* Variant */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t("pages.fields.variant")}</Label>
                        <Select
                          value={p.variant || "__none__"}
                          onValueChange={(v) => setPage(k, { variant: v === "__none__" ? "" : v })}
                          disabled={busy}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seç…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">— Seçilmedi —</span>
                            </SelectItem>
                            {PAGE_VARIANT_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                                <span className="ml-1.5 text-[10px] text-muted-foreground">{o.value}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Hero Style */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t("pages.fields.heroStyle")}</Label>
                        <Select
                          value={p.heroStyle || "__none__"}
                          onValueChange={(v) => setPage(k, { heroStyle: v === "__none__" ? "" : v })}
                          disabled={busy}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seç…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">— Seçilmedi —</span>
                            </SelectItem>
                            {HERO_STYLE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                                <span className="ml-1.5 text-[10px] text-muted-foreground">{o.value}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Default View */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t("pages.fields.defaultView")}</Label>
                        <Select
                          value={p.defaultView || "__none__"}
                          onValueChange={(v) => setPage(k, { defaultView: v === "__none__" ? "" : v })}
                          disabled={busy}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seç…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">— Seçilmedi —</span>
                            </SelectItem>
                            {DEFAULT_VIEW_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                                <span className="ml-1.5 text-[10px] text-muted-foreground">{o.value}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filters Style */}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t("pages.fields.filtersStyle")}</Label>
                        <Select
                          value={p.filtersStyle || "__none__"}
                          onValueChange={(v) => setPage(k, { filtersStyle: v === "__none__" ? "" : v })}
                          disabled={busy}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seç…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">— Seçilmedi —</span>
                            </SelectItem>
                            {FILTERS_STYLE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                                <span className="ml-1.5 text-[10px] text-muted-foreground">{o.value}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* ── Haberler sayfasına özel ayarlar ── */}
                    {k === "haberler" && (
                      <div className="border-t border-border pt-3 mt-1 grid gap-3 p-4 md:grid-cols-2">
                        <div className="col-span-full text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Haberler Sayfası Ayarları
                        </div>

                        {/* carouselCount */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Carousel Makale Sayısı</Label>
                          <Input
                            type="number"
                            min={1}
                            max={12}
                            className="h-8 text-xs"
                            value={p.carouselCount ?? "6"}
                            onChange={(e) => setPage(k, { carouselCount: e.target.value })}
                            disabled={busy}
                          />
                        </div>

                        {/* gridStart */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Grid Başlangıç İndeksi</Label>
                          <Input
                            type="number"
                            min={0}
                            max={12}
                            className="h-8 text-xs"
                            value={p.gridStart ?? "6"}
                            onChange={(e) => setPage(k, { gridStart: e.target.value })}
                            disabled={busy}
                          />
                        </div>

                        {/* perPage */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Sayfa Başına Makale</Label>
                          <Input
                            type="number"
                            min={10}
                            max={200}
                            step={10}
                            className="h-8 text-xs"
                            value={p.perPage ?? "60"}
                            onChange={(e) => setPage(k, { perPage: e.target.value })}
                            disabled={busy}
                          />
                        </div>

                        {/* sidebarEnabled */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Kenar Çubuğu</Label>
                          <Select
                            value={p.sidebarEnabled ?? "true"}
                            onValueChange={(v) => setPage(k, { sidebarEnabled: v })}
                            disabled={busy}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Göster</SelectItem>
                              <SelectItem value="false">Gizle</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* adBannerPos */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Reklam Banner Pozisyonu</Label>
                          <Input
                            className="h-8 text-xs"
                            placeholder="news_sidebar"
                            value={p.adBannerPos ?? ""}
                            onChange={(e) => setPage(k, { adBannerPos: e.target.value })}
                            disabled={busy}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!pageKeys.length && <p className="text-sm text-muted-foreground">{t("pages.empty")}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Haberler ── */}
        <TabsContent value="haberler">
          <NewsThemeTab
            listSections={form.newsListSections}
            detailSections={form.newsDetailSections}
            onListChange={(sections) => setForm((p) => ({ ...p, newsListSections: sections }))}
            onDetailChange={(sections) => setForm((p) => ({ ...p, newsDetailSections: sections }))}
            busy={busy}
          />
        </TabsContent>

        {/* ── Ana Sayfa Layout Blocks ── */}
        <TabsContent value="layout">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* Left: Drag-and-drop layout block flow */}
            <Card className="min-w-0">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Ana Sayfa Blokları</CardTitle>
                    <CardDescription className="mt-1">
                      Blokları sürükleyerek sıralayın. Tüm bloklar için 12-sütun üzerinden genişlik seçilebilir (4/6/8/12). Mobil/tablet ekranda her blok otomatik tam genişliktedir.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {REPEATABLE_TYPES.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addLayoutBlockInstance(type)}
                        disabled={busy}
                      >
                        <Plus className="mr-1 size-3.5" />
                        {LAYOUT_BLOCK_LABELS[type] ?? type}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                {layoutBlocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <GripVertical className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Blok yok</p>
                    <p className="mt-1 text-xs text-muted-foreground">Yukarıdaki butonlarla banner veya flash fırsat ekleyin</p>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLayoutDragEnd}>
                    <SortableContext
                      items={layoutBlocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {layoutBlocks.map((block, i) => {
                        const sameTypeBlocks = layoutBlocks.filter((b) => b.type === block.type);
                        const canRemove = REPEATABLE_TYPES.includes(block.type) && sameTypeBlocks.length > 1;
                        return (
                          <SortableLayoutBlock
                            key={block.id}
                            block={block}
                            index={i}
                            total={layoutBlocks.length}
                            colorIdx={i}
                            onToggle={(v) =>
                              setLayoutBlock(i, { enabled_disabled: v ? "on" : "off" })
                            }
                            onSpanChange={(span) => setLayoutBlockSpan(i, span)}
                            onInstanceChange={(instance) => setLayoutBlockInstance(i, instance)}
                            onConfigChange={(patch) => setLayoutBlockConfig(i, patch)}
                            onMoveTo={(pos) => moveLayoutBlockToPosition(i, pos)}
                            onRemove={() => removeLayoutBlock(i)}
                            canRemove={canRemove}
                            busy={busy}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>

            {/* Right: Preview sidebar */}
            <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
              {/* Önizleme Sırası (breadcrumb) */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">Önizleme Sırası</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {enabledLayoutBlocks.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">Aktif blok yok</p>
                  ) : (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {enabledLayoutBlocks.map((b, i) => {
                        const label = LAYOUT_BLOCK_LABELS[b.type] ?? b.type;
                        const lbl   = b.instance > 1 ? `${label} #${b.instance}` : label;
                        const isFlash = b.type === "flash_sale";
                        return (
                          <React.Fragment key={b.id}>
                            {i > 0 && <span className="mx-1 text-muted-foreground/30">›</span>}
                            <span className={isFlash ? "text-orange-600 font-medium" : "font-medium text-foreground"}>
                              {isFlash ? "⚡ " : ""}{lbl}
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 12-Grid Satır Önizleme */}
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">12-Grid Satır Önizleme</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <LayoutPreview blocks={layoutBlocks} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
