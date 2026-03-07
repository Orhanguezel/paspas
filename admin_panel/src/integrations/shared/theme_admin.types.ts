import { toBool, toNumber, toStr } from '@/integrations/shared';

export type ThemeDarkMode = 'light' | 'dark' | 'system';
export type ThemeRadius = '0rem' | '0.3rem' | '0.375rem' | '0.5rem' | '0.75rem' | '1rem' | '1.5rem';

export type ThemeColors = {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  mutedFg?: string;
  border?: string;
  destructive?: string;
  success?: string;
  navBg?: string;
  navFg?: string;
  footerBg?: string;
  footerFg?: string;
};

export type ThemeSection = {
  key: string;
  enabled: boolean;
  order: number;
  label: string;
  colsLg: number;
  colsMd: number;
  colsSm: number;
  limit: number | null;
  variant?: string;
  /** banner_row_* → virgülle ayrılmış banner ID'leri: "1,2" */
  bannerIds?: string;
  /** flash_sale → virgülle ayrılmış kampanya ID'leri: "1,2" */
  flashSaleIds?: string;
  /** Aynı rowId'ye sahip section'lar tek satırda yan yana render edilir */
  rowId?: string;
  /** 12-kolon gridde kaç kolon kapladığı (1-12) */
  span?: number;
};

export type ThemePage = {
  variant?: string;
  heroStyle?: string;
  defaultView?: string;
  filtersStyle?: string;
  carouselCount?: string;
  gridStart?: string;
  sidebarEnabled?: string;
  perPage?: string;
  adBannerPos?: string;
  [key: string]: string | undefined;
};

export type ThemeNewsSection = {
  key:       string;
  enabled:   boolean;
  order:     number;
  label:     string;
  count?:    number | null;
  cols?:     number;
  bannerIds?: string;
};

/** Quickecommerce mimarisi: homepage layout bloğu */
export type LayoutBlock = {
  id: string;                        // "banner_section__1", "hero__1"
  type: string;                      // section tipi
  instance: number;                  // kaçıncı instance
  enabled_disabled: 'on' | 'off';   // aktif/pasif
  config?: {
    banner_span?: 4 | 6 | 12;       // banner_section genişliği (kolon)
    flash_sale_span?: 4 | 6 | 12;   // flash_sale genişliği (kolon)
    section_span?: number;           // announcements/news_feed genişliği (kolon)
    cols_lg?: number;                // masaüstünde satır başına kart sayısı
    limit?: number;                  // maksimum gösterilecek öğe sayısı
    flash_sale_ids?: string;         // virgülle ayrılmış flash sale ID'leri ("1,2")
    [key: string]: unknown;
  };
};

export type ThemeConfigView = {
  colors: ThemeColors;
  radius: ThemeRadius;
  fontFamily: string | null;
  darkMode: ThemeDarkMode;
  sections: ThemeSection[];
  pages: Record<string, ThemePage>;
  newsListSections: ThemeNewsSection[];
  newsDetailSections: ThemeNewsSection[];
  /** Quickecommerce mimarisi: layout_blocks mevcutsa sections[] yerine kullanılır */
  layout_blocks?: LayoutBlock[];
};

export type ThemeUpdateInput = Partial<ThemeConfigView>;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function sanitizeHex(v: unknown): string | undefined {
  const s = toStr(v).trim();
  return HEX.test(s) ? s : undefined;
}

export function normalizeThemeConfig(row: unknown): ThemeConfigView {
  const r = (row ?? {}) as Record<string, unknown>;
  const colorsRaw = ((r.colors ?? {}) as Record<string, unknown>) || {};
  const sectionsRaw = Array.isArray(r.sections) ? r.sections : [];
  const pagesRaw = ((r.pages ?? {}) as Record<string, unknown>) || {};

  const colors: ThemeColors = {
    primary: sanitizeHex(colorsRaw.primary),
    secondary: sanitizeHex(colorsRaw.secondary),
    accent: sanitizeHex(colorsRaw.accent),
    background: sanitizeHex(colorsRaw.background),
    foreground: sanitizeHex(colorsRaw.foreground),
    muted: sanitizeHex(colorsRaw.muted),
    mutedFg: sanitizeHex(colorsRaw.mutedFg),
    border: sanitizeHex(colorsRaw.border),
    destructive: sanitizeHex(colorsRaw.destructive),
    success: sanitizeHex(colorsRaw.success),
    navBg: sanitizeHex(colorsRaw.navBg),
    navFg: sanitizeHex(colorsRaw.navFg),
    footerBg: sanitizeHex(colorsRaw.footerBg),
    footerFg: sanitizeHex(colorsRaw.footerFg),
  };

  const sections: ThemeSection[] = sectionsRaw.map((x) => {
    const s = (x ?? {}) as Record<string, unknown>;
    const lim = s.limit === null || typeof s.limit === 'undefined' || String(s.limit) === '' ? null : toNumber(s.limit, 0);
    return {
      key:          toStr(s.key),
      enabled:      toBool(s.enabled, true),
      order:        toNumber(s.order, 0),
      label:        toStr(s.label),
      colsLg:       toNumber(s.colsLg, 1),
      colsMd:       toNumber(s.colsMd, 1),
      colsSm:       toNumber(s.colsSm, 1),
      limit:        lim !== null && lim < 1 ? 1 : lim,
      variant:      toStr(s.variant) || undefined,
      bannerIds:    toStr(s.bannerIds) || undefined,
      flashSaleIds: toStr(s.flashSaleIds) || undefined,
      rowId:        toStr(s.rowId) || undefined,
      span:         s.span != null ? toNumber(s.span, 12) : undefined,
    };
  });

  const pages: Record<string, ThemePage> = {};
  for (const [k, v] of Object.entries(pagesRaw)) {
    const p = (v ?? {}) as Record<string, unknown>;
    pages[k] = {
      variant:        toStr(p.variant) || undefined,
      heroStyle:      toStr(p.heroStyle) || undefined,
      defaultView:    toStr(p.defaultView) || undefined,
      filtersStyle:   toStr(p.filtersStyle) || undefined,
      carouselCount:  toStr(p.carouselCount) || undefined,
      gridStart:      toStr(p.gridStart) || undefined,
      sidebarEnabled: toStr(p.sidebarEnabled) || undefined,
      perPage:        toStr(p.perPage) || undefined,
      adBannerPos:    toStr(p.adBannerPos) || undefined,
    };
  }

  const radiusRaw = toStr(r.radius) as ThemeRadius;
  const radius = (['0rem', '0.3rem', '0.375rem', '0.5rem', '0.75rem', '1rem', '1.5rem'] as const).includes(radiusRaw)
    ? radiusRaw
    : '0.375rem';
  const darkRaw = toStr(r.darkMode) as ThemeDarkMode;
  const darkMode = (['light', 'dark', 'system'] as const).includes(darkRaw) ? darkRaw : 'light';

  function parseNewsSections(raw: unknown): ThemeNewsSection[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((x) => {
      const s = (x ?? {}) as Record<string, unknown>;
      const countRaw = s.count;
      const count = countRaw === null || typeof countRaw === 'undefined' ? null : toNumber(countRaw as number, 0);
      const colsRaw = typeof s.cols === 'number' ? s.cols : undefined;
      return {
        key:       toStr(s.key),
        enabled:   toBool(s.enabled, true),
        order:     toNumber(s.order as number, 0),
        label:     toStr(s.label),
        count:     count !== null && count < 1 ? 1 : count,
        cols:      colsRaw,
        bannerIds: toStr(s.bannerIds) || undefined,
      };
    });
  }

  const layoutBlocksRaw = Array.isArray(r.layout_blocks) ? r.layout_blocks : [];
  const layout_blocks: LayoutBlock[] = layoutBlocksRaw.map((x) => {
    const b = (x ?? {}) as Record<string, unknown>;
    const cfg = (typeof b.config === 'object' && b.config !== null ? b.config : {}) as Record<string, unknown>;
    const normalizedCfg: Record<string, unknown> = {};
    if (cfg.banner_span != null)     normalizedCfg.banner_span     = Number(cfg.banner_span);
    if (cfg.flash_sale_span != null) normalizedCfg.flash_sale_span = Number(cfg.flash_sale_span);
    if (cfg.section_span != null)    normalizedCfg.section_span    = Number(cfg.section_span);
    if (cfg.cols_lg != null)         normalizedCfg.cols_lg         = Number(cfg.cols_lg);
    if (cfg.limit != null)           normalizedCfg.limit           = Number(cfg.limit);
    if (cfg.stack_count != null)     normalizedCfg.stack_count     = Number(cfg.stack_count);
    if (cfg.flash_sale_ids)          normalizedCfg.flash_sale_ids  = toStr(cfg.flash_sale_ids);
    return {
      id:               toStr(b.id),
      type:             toStr(b.type),
      instance:         toNumber(b.instance as number, 1),
      enabled_disabled: b.enabled_disabled === 'off' ? 'off' : 'on',
      config:           Object.keys(normalizedCfg).length > 0 ? (normalizedCfg as LayoutBlock['config']) : undefined,
    };
  });

  return {
    colors,
    radius,
    fontFamily:         toStr(r.fontFamily) || null,
    darkMode,
    sections,
    pages,
    newsListSections:   parseNewsSections(r.newsListSections),
    newsDetailSections: parseNewsSections(r.newsDetailSections),
    layout_blocks:      layout_blocks.length > 0 ? layout_blocks : undefined,
  };
}
