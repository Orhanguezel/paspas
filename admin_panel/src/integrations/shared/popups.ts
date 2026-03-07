// ===================================================================
// FILE: src/integrations/shared/popups.ts
// FINAL — Popups types + normalizers
// Backend:
// PUBLIC:
// - GET  /popups
// - GET  /popups/by-key/:key
//
// ADMIN (auth):
// - GET    /admin/popups
// - GET    /admin/popups/:id
// - POST   /admin/popups
// - PATCH  /admin/popups/:id
// - DELETE /admin/popups/:id
// ===================================================================

import type { BoolLike } from '@/integrations/shared';
import { toBool } from '@/integrations/shared';

export type PopupType = 'modal' | 'drawer' | 'banner' | 'toast';
export type PopupDisplayPages = 'all' | string; // DB varchar(24)
export type PopupDisplayFrequency = 'always' | 'once' | 'daily' | 'weekly';

export type PopupListQuery = {
  is_active?: BoolLike;
  type?: PopupType; // backend currently maps "modal" const; query accepts
  order?: string; // created_at.desc etc.
  limit?: string | number;
  offset?: string | number;
  select?: string;
};

/**
 * PUBLIC mapRow() çıktısı (controller.ts)
 * FE tarafında "CampaignPopup" gibi kullanılsın diye birebir.
 */
export type CampaignPopupRaw = {
  id: string;
  key?: string;

  title?: string | null;

  type: PopupType; // controller: "modal"
  content_html?: string | null;
  options?: Record<string, unknown> | null;

  is_active: boolean;

  start_at?: string | null;
  end_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  content?: string | null;
  button_text?: string | null;
  button_link?: string | null;

  display_pages?: string | null;
  display_frequency?: PopupDisplayFrequency | null;

  delay_seconds?: number | null;
  duration_seconds?: number | null;
  priority?: number | null;

  services_id?: string | null;
};

export type CampaignPopupView = {
  id: string;
  key: string | null;

  title: string | null;

  type: PopupType;
  content_html: string | null;
  options: Record<string, unknown> | null;

  is_active: boolean;

  start_at: string | null;
  end_at: string | null;

  created_at: string | null;
  updated_at: string | null;

  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;

  content: string | null;
  button_text: string | null;
  button_link: string | null;

  display_pages: string; // default "all"
  display_frequency: PopupDisplayFrequency; // default "always"

  delay_seconds: number; // default 0
  duration_seconds: number | null;
  priority: number | null;

  services_id: string | null;
};

/**
 * ADMIN mapRow() çıktısı (admin.controller.ts)
 */
export type PopupAdminRaw = {
  id: string;
  title?: string;
  content?: string;

  image_url?: string;
  image_asset_id?: string;
  image_alt?: string;

  button_text?: string;
  button_link?: string;

  is_active?: boolean;

  display_frequency?: PopupDisplayFrequency;
  delay_seconds?: number;

  start_date?: string | null;
  end_date?: string | null;

  services_id?: string | null;
  display_pages?: string | null;
  priority?: number | null;
  duration_seconds?: number | null;

  created_at?: string;
  updated_at?: string;
};

export type PopupAdminView = {
  id: string;

  title: string;
  content: string;

  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;

  button_text: string | null;
  button_link: string | null;

  is_active: boolean;

  display_frequency: PopupDisplayFrequency;
  delay_seconds: number;

  start_date: string | null;
  end_date: string | null;

  services_id: string | null;
  display_pages: string; // default "all"
  priority: number | null;
  duration_seconds: number | null;

  created_at: string | null;
  updated_at: string | null;
};

export type PopupAdminCreateBody = {
  title: string;
  content: string;

  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;

  button_text?: string | null;
  button_link?: string | null;

  is_active?: BoolLike;

  display_frequency?: PopupDisplayFrequency;
  delay_seconds?: number | null;

  start_date?: string | Date | null;
  end_date?: string | Date | null;

  services_id?: string | null;
  display_pages?: string | null;
  priority?: number | null;
  duration_seconds?: number | null;
};

export type PopupAdminUpdateBody = Partial<PopupAdminCreateBody>;

// ----------------------------- helpers -----------------------------

const s = (v: unknown) => String(v ?? '').trim();

const toInt = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toIso = (v: unknown): string | null => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const x = s(v);
  if (!x) return null;
  const d = new Date(x);
  return Number.isFinite(d.valueOf()) ? d.toISOString() : x; // already iso-ish
};

const toFrequency = (v: unknown): PopupDisplayFrequency => {
  const x = s(v) as PopupDisplayFrequency;
  return x === 'once' || x === 'daily' || x === 'weekly' ? x : 'always';
};

const toType = (v: unknown): PopupType => {
  const x = s(v) as PopupType;
  return x === 'drawer' || x === 'banner' || x === 'toast' ? x : 'modal';
};

// ----------------------------- normalizers -----------------------------

export const normalizeCampaignPopup = (raw: unknown): CampaignPopupView => {
  const r = (raw ?? {}) as CampaignPopupRaw;

  return {
    id: s(r.id),
    key: r.key ? s(r.key) : null,

    title: r.title == null ? null : s(r.title),

    type: toType(r.type),
    content_html: r.content_html == null ? null : String(r.content_html ?? ''),
    options: (r.options ?? null) as any,

    is_active: !!r.is_active,

    start_at: r.start_at ? s(r.start_at) : null,
    end_at: r.end_at ? s(r.end_at) : null,

    created_at: r.created_at ? s(r.created_at) : null,
    updated_at: r.updated_at ? s(r.updated_at) : null,

    image_url: r.image_url ? s(r.image_url) : null,
    image_asset_id: r.image_asset_id ? s(r.image_asset_id) : null,
    image_alt: r.image_alt ? s(r.image_alt) : null,

    content: r.content == null ? null : String(r.content ?? ''),
    button_text: r.button_text ? s(r.button_text) : null,
    button_link: r.button_link ? s(r.button_link) : null,

    display_pages: r.display_pages ? s(r.display_pages) : 'all',
    display_frequency: toFrequency(r.display_frequency),

    delay_seconds: toInt(r.delay_seconds ?? 0, 0),
    duration_seconds:
      typeof r.duration_seconds === 'number' && Number.isFinite(r.duration_seconds)
        ? r.duration_seconds
        : r.duration_seconds != null
          ? toInt(r.duration_seconds, 0)
          : null,
    priority:
      typeof r.priority === 'number' && Number.isFinite(r.priority)
        ? r.priority
        : r.priority != null
          ? toInt(r.priority, 0)
          : null,

    services_id: r.services_id ? s(r.services_id) : null,
  };
};

export const normalizeCampaignPopupList = (raw: unknown): CampaignPopupView[] =>
  Array.isArray(raw) ? raw.map(normalizeCampaignPopup) : [];

export const normalizePopupAdmin = (raw: unknown): PopupAdminView => {
  const r = (raw ?? {}) as PopupAdminRaw;

  return {
    id: s(r.id),

    title: s(r.title ?? ''),
    content: String(r.content ?? ''),

    image_url: r.image_url ? s(r.image_url) : null,
    image_asset_id: r.image_asset_id ? s(r.image_asset_id) : null,
    image_alt: r.image_alt ? s(r.image_alt) : null,

    button_text: r.button_text ? s(r.button_text) : null,
    button_link: r.button_link ? s(r.button_link) : null,

    is_active: !!r.is_active,

    display_frequency: toFrequency(r.display_frequency),
    delay_seconds: toInt(r.delay_seconds ?? 0, 0),

    start_date: r.start_date ? s(r.start_date) : null,
    end_date: r.end_date ? s(r.end_date) : null,

    services_id: r.services_id ? s(r.services_id) : null,
    display_pages: r.display_pages ? s(r.display_pages) : 'all',
    priority:
      typeof r.priority === 'number' && Number.isFinite(r.priority)
        ? r.priority
        : r.priority != null
          ? toInt(r.priority, 0)
          : null,
    duration_seconds:
      typeof r.duration_seconds === 'number' && Number.isFinite(r.duration_seconds)
        ? r.duration_seconds
        : r.duration_seconds != null
          ? toInt(r.duration_seconds, 0)
          : null,

    created_at: r.created_at ? s(r.created_at) : null,
    updated_at: r.updated_at ? s(r.updated_at) : null,
  };
};

export const normalizePopupAdminList = (raw: unknown): PopupAdminView[] =>
  Array.isArray(raw) ? raw.map(normalizePopupAdmin) : [];

// ----------------------------- request mappers -----------------------------

export const toPopupListQueryParams = (q: PopupListQuery = {}): Record<string, any> => {
  const out: Record<string, any> = {};
  if (typeof q.is_active !== 'undefined') out.is_active = q.is_active;
  if (q.type) out.type = q.type;
  if (q.order) out.order = q.order;
  if (typeof q.limit !== 'undefined') out.limit = q.limit;
  if (typeof q.offset !== 'undefined') out.offset = q.offset;
  if (q.select) out.select = q.select;
  return out;
};

const toDateVal = (v: unknown): string | null => {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const x = s(v);
  if (!x) return null;
  const d = new Date(x);
  return Number.isFinite(d.valueOf()) ? d.toISOString() : x;
};

export const toPopupAdminCreateBody = (b: PopupAdminCreateBody): Record<string, any> => ({
  title: b.title,
  content: b.content,

  image_url: typeof b.image_url === 'undefined' ? undefined : b.image_url,
  image_asset_id: typeof b.image_asset_id === 'undefined' ? undefined : b.image_asset_id,
  image_alt: typeof b.image_alt === 'undefined' ? undefined : b.image_alt,

  button_text: typeof b.button_text === 'undefined' ? undefined : b.button_text,
  button_link: typeof b.button_link === 'undefined' ? undefined : b.button_link,

  is_active: typeof b.is_active === 'undefined' ? undefined : b.is_active,

  display_frequency: typeof b.display_frequency === 'undefined' ? undefined : b.display_frequency,
  delay_seconds: typeof b.delay_seconds === 'undefined' ? undefined : b.delay_seconds,

  start_date: typeof b.start_date === 'undefined' ? undefined : toDateVal(b.start_date),
  end_date: typeof b.end_date === 'undefined' ? undefined : toDateVal(b.end_date),

  services_id: typeof b.services_id === 'undefined' ? undefined : b.services_id,
  display_pages: typeof b.display_pages === 'undefined' ? undefined : b.display_pages,
  priority: typeof b.priority === 'undefined' ? undefined : b.priority,
  duration_seconds: typeof b.duration_seconds === 'undefined' ? undefined : b.duration_seconds,
});

export const toPopupAdminUpdateBody = (b: PopupAdminUpdateBody): Record<string, any> =>
  toPopupAdminCreateBody(b as any);
