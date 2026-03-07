import { cleanParams, toBool, toNumber, toStr, type BoolLike, type WithLocale } from '@/integrations/shared';

export type FlashSaleDiscountType = 'percent' | 'amount';
export type FlashSaleScopeType = 'all' | 'categories' | 'subcategories' | 'properties' | 'sellers';

export type FlashSaleView = {
  id: string;
  title: string;
  slug: string;
  locale: string;
  description: string | null;
  discount_type: FlashSaleDiscountType;
  discount_value: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  scope_type: FlashSaleScopeType;
  scope_ids: string[];
  // Görsel alanlar
  cover_image_url: string | null;
  cover_asset_id: string | null;
  background_color: string | null;
  title_color: string | null;
  description_color: string | null;
  button_text: string | null;
  button_url: string | null;
  button_bg_color: string | null;
  button_text_color: string | null;
  timer_bg_color: string | null;
  timer_text_color: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type FlashSaleListQuery = {
  q?: string;
  locale?: string;
  is_active?: BoolLike;
  active_now?: BoolLike;
  sort?: 'created_at' | 'updated_at' | 'display_order' | 'start_at' | 'end_at' | 'title';
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export type FlashSaleCreatePayload = {
  title: string;
  slug: string;
  locale?: string;
  description?: string | null;
  discount_type: FlashSaleDiscountType;
  discount_value: number;
  start_at: string;
  end_at: string;
  is_active?: BoolLike;
  scope_type?: FlashSaleScopeType;
  scope_ids?: string[];
  // Görsel alanlar
  cover_image_url?: string | null;
  cover_asset_id?: string | null;
  background_color?: string | null;
  title_color?: string | null;
  description_color?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  button_bg_color?: string | null;
  button_text_color?: string | null;
  timer_bg_color?: string | null;
  timer_text_color?: string | null;
  display_order?: number;
};

export type FlashSaleUpdatePayload = Partial<FlashSaleCreatePayload>;

const VALID_SCOPES: FlashSaleScopeType[] = ['all', 'categories', 'subcategories', 'properties', 'sellers'];

export function normalizeFlashSale(row: unknown): FlashSaleView {
  const r = (row ?? {}) as Record<string, unknown>;
  const scopeRaw = toStr(r.scope_type);
  return {
    id: toStr(r.id),
    title: toStr(r.title),
    slug: toStr(r.slug),
    locale: toStr(r.locale || 'tr'),
    description: toStr(r.description) || null,
    discount_type: toStr(r.discount_type) === 'amount' ? 'amount' : 'percent',
    discount_value: toNumber(r.discount_value, 0),
    start_at: toStr(r.start_at),
    end_at: toStr(r.end_at),
    is_active: toBool(r.is_active, false),
    scope_type: VALID_SCOPES.includes(scopeRaw as FlashSaleScopeType) ? (scopeRaw as FlashSaleScopeType) : 'all',
    scope_ids: Array.isArray(r.scope_ids) ? (r.scope_ids as string[]) : [],
    cover_image_url: toStr(r.cover_image_url) || null,
    cover_asset_id: toStr(r.cover_asset_id) || null,
    background_color: toStr(r.background_color) || null,
    title_color: toStr(r.title_color) || null,
    description_color: toStr(r.description_color) || null,
    button_text: toStr(r.button_text) || null,
    button_url: toStr(r.button_url) || null,
    button_bg_color: toStr(r.button_bg_color) || null,
    button_text_color: toStr(r.button_text_color) || null,
    timer_bg_color: toStr(r.timer_bg_color) || null,
    timer_text_color: toStr(r.timer_text_color) || null,
    display_order: toNumber(r.display_order, 0),
    created_at: toStr(r.created_at),
    updated_at: toStr(r.updated_at),
  };
}

export function normalizeFlashSaleList(res: unknown): FlashSaleView[] {
  const arr = Array.isArray(res) ? res : [];
  return arr.map(normalizeFlashSale);
}

export function toFlashSaleListQueryParams(q: WithLocale<FlashSaleListQuery>): Record<string, unknown> {
  return cleanParams({
    q: q.q,
    locale: q.locale,
    is_active: q.is_active,
    active_now: q.active_now,
    sort: q.sort,
    orderDir: q.orderDir,
    limit: q.limit,
    offset: q.offset,
  });
}
