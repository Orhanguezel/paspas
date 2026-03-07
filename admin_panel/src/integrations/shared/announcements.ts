// =============================================================
// FILE: src/integrations/shared/announcements.ts
// Admin duyurular modülü – backend uyumlu tipler
// =============================================================

import type { BoolLike } from '@/integrations/shared';

export type AnnouncementCategory =
  | 'duyuru'
  | 'haber'
  | 'kampanya'
  | 'etkinlik'
  | 'guncelleme';

// Backend sadece bu değerleri kabul ediyor (published_at | created_at | display_order)
export type AnnouncementSortable = 'published_at' | 'created_at' | 'display_order';

export interface AnnouncementDto {
  id: number;
  uuid: string;

  locale: string | null;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;

  category: AnnouncementCategory | null;

  cover_image_url: string | null;
  cover_asset_id: string | null;
  alt: string | null;
  author: string | null;

  meta_title: string | null;
  meta_description: string | null;

  is_published: BoolLike;
  is_featured: BoolLike;
  display_order: number;

  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiAnnouncementAdmin {
  id: number | string;
  uuid?: string | null;

  locale?: string | null;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;

  category?: string | null;

  cover_image_url?: string | null;
  cover_asset_id?: string | null;
  alt?: string | null;
  author?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;

  is_published?: BoolLike;
  is_featured?: BoolLike;
  display_order?: number | null;

  published_at?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date;
}

const toIsoString = (v: unknown): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

const toNumber = (v: unknown, fallback = 0): number => {
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string'
        ? Number(v)
        : v == null
          ? NaN
          : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeAnnouncementAdmin = (row: ApiAnnouncementAdmin): AnnouncementDto => ({
  id: toNumber(row?.id, 0),
  uuid: String(row?.uuid ?? ''),

  locale: row?.locale ?? null,
  title: row?.title ?? null,
  slug: row?.slug ?? null,
  excerpt: row?.excerpt ?? null,
  content: row?.content ?? null,

  category: (row?.category ?? null) as AnnouncementCategory | null,

  cover_image_url: row?.cover_image_url ?? null,
  cover_asset_id: row?.cover_asset_id ?? null,
  alt: row?.alt ?? null,
  author: row?.author ?? null,

  meta_title: row?.meta_title ?? null,
  meta_description: row?.meta_description ?? null,

  is_published: (row?.is_published ?? 0) as BoolLike,
  is_featured: (row?.is_featured ?? 0) as BoolLike,
  display_order: toNumber(row?.display_order, 0),

  published_at: row?.published_at ? toIsoString(row.published_at) : null,
  created_at: toIsoString(row?.created_at),
  updated_at: toIsoString(row?.updated_at),
});

export interface AnnouncementListQueryParams {
  q?: string;
  category?: AnnouncementCategory;
  is_published?: BoolLike;
  is_featured?: BoolLike;
  locale?: string;

  sort?: AnnouncementSortable;
  /** Backend beklentisi: "order" (orderDir değil) */
  order?: 'asc' | 'desc';

  limit?: number;
  offset?: number;
}

interface AnnouncementBasePayload {
  locale?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: AnnouncementCategory;
  cover_asset_id?: string | null;
  alt?: string;
  author?: string;
  meta_title?: string;
  meta_description?: string;
  is_published?: BoolLike;
  is_featured?: BoolLike;
  display_order?: number;
}

export interface AnnouncementCreatePayload extends AnnouncementBasePayload {
  title: string;
  slug: string;
}

export interface AnnouncementUpdatePayload extends AnnouncementBasePayload {}

export interface AnnouncementPublishPayload {
  is_published: boolean;
}
