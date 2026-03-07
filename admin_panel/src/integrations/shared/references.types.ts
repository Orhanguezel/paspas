// =============================================================
// FILE: src/integrations/types/references.types.ts
// Ensotek – References (Referanslar) tipleri
// Backend: src/modules/references/*
// =============================================================

import type { BoolLike } from '@/integrations/shared';

/* -------------------------------------------------------------
 * LIST QUERY (public + admin ortak)
 * backend: ReferenceListQuery + ListParams
 * ----------------------------------------------------------- */

export type ReferenceListQueryParams = {
  // shared order param (örn: "created_at.asc")
  order?: string;

  // sort + orderDir: shared util
  sort?: "created_at" | "updated_at" | "display_order";
  orderDir?: "asc" | "desc";

  limit?: number;
  offset?: number;

  is_published?: BoolLike; // admin kullanıyor, public ignore
  is_featured?: BoolLike;

  q?: string;
  slug?: string;
  select?: string;

  category_id?: string;
  sub_category_id?: string;

  /** categories.module_key üzerinden filtre (ör: 'references') */
  module_key?: string;

  /** website_url var/yok filtresi */
  has_website?: BoolLike;

  /** locale-aware list için opsiyonel locale paramı */
  locale?: string;
};

/* -------------------------------------------------------------
 * ReferenceView (public + admin aynı yapı)
 * backend: ReferenceMerged (repository.ts)
 * ----------------------------------------------------------- */

export interface ReferenceAssetInfo {
  bucket: string;
  path: string;
  url: string | null;
  width: number | null;
  height: number | null;
  mime: string | null;
}

export interface ReferenceDto {
  id: string;
  is_published: 0 | 1;
  is_featured: 0 | 1;
  display_order: number;

  featured_image: string | null;
  featured_image_asset_id: string | null;
  website_url: string | null;

  created_at: string | Date;
  updated_at: string | Date;

  category_id: string | null;
  sub_category_id: string | null;

  title: string | null;
  slug: string | null;
  summary: string | null;
  content: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;

  // ✅ backend’in “locale aware” sonucu
  locale_resolved: string | null;

  // ✅ FE için stabilize alan (endpoints transformResponse ile setlenecek)
  locale?: string | null;

  featured_image_url_resolved: string | null;
  featured_asset?: ReferenceAssetInfo | null;
}


/* -------------------------------------------------------------
 * CREATE / UPDATE gövdesi (admin)
 * backend: UpsertReferenceBody / PatchReferenceBody
 * ----------------------------------------------------------- */

export interface ReferenceUpsertPayload {
  // parent
  is_published?: BoolLike;
  is_featured?: BoolLike;
  display_order?: number;

  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  website_url?: string | null;

  category_id?: string | null;
  sub_category_id?: string | null;

  // i18n
  locale?: string;

  title?: string;
  slug?: string;
  summary?: string | null;
  content?: string; // HTML veya JSON-string

  featured_image_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;

  // create: tüm dillere kopyala?
  replicate_all_locales?: boolean;

  // update: tüm dillere uygula?
  apply_all_locales?: boolean;
}

/* -------------------------------------------------------------
 * GALLERY tipleri
 * backend: ReferenceImageMerged / UpsertReferenceImageBody / PatchReferenceImageBody
 * ----------------------------------------------------------- */

export interface ReferenceImageAssetInfo {
  bucket: string;
  path: string;
  url: string | null;
  width: number | null;
  height: number | null;
  mime: string | null;
}

export interface ReferenceImageDto {
  id: string;
  reference_id: string;
  asset_id: string;
  image_url: string | null;
  display_order: number;
  is_active: 0 | 1;
  created_at: string | Date;
  updated_at: string | Date;

  alt: string | null;
  caption: string | null;
  locale_resolved: string | null;

  image_url_resolved: string | null;
  asset?: ReferenceImageAssetInfo | null;
}

export interface ReferenceImageUpsertPayload {
  // parent
  asset_id?: string; // create'de zorunlu, update'de opsiyonel
  image_url?: string | null;
  display_order?: number;
  is_active?: BoolLike;

  // i18n
  locale?: string;
  alt?: string | null;
  caption?: string | null;

  replicate_all_locales?: boolean; // create
  apply_all_locales?: boolean; // update
}

/* -------------------------------------------------------------
 * LIST response tipi (x-total-count header ile)
 * ----------------------------------------------------------- */

export interface ReferenceListResponse {
  items: ReferenceDto[];
  total: number;
}



/* ---------------- Helpers ---------------- */

export const serializeListQuery = (q?: ReferenceListQueryParams): Record<string, any> => {
  if (!q) return {};
  const params: Record<string, any> = {};

  if (q.order) params.order = q.order;
  if (q.sort) params.sort = q.sort;
  if (q.orderDir) params.orderDir = q.orderDir;
  if (typeof q.limit === 'number') params.limit = q.limit;
  if (typeof q.offset === 'number') params.offset = q.offset;

  if (typeof q.is_published !== 'undefined') params.is_published = q.is_published;
  if (typeof q.is_featured !== 'undefined') params.is_featured = q.is_featured;

  if (q.q) params.q = q.q;
  if (q.slug) params.slug = q.slug;
  if (q.select) params.select = q.select;

  if (q.category_id) params.category_id = q.category_id;
  if (q.sub_category_id) params.sub_category_id = q.sub_category_id;

  if (q.module_key) params.module_key = q.module_key;
  if (typeof q.has_website !== 'undefined') params.has_website = q.has_website;

  // ✅ locale param (dynamic server-side validation handled by backend)
  if (q.locale) params.locale = q.locale;

  return params;
};

export const withResolvedLocale = (r: ReferenceDto): ReferenceDto => ({
  ...r,
  // normalize for FE usage
  locale: (r.locale_resolved ?? r.locale ?? null) as any,
});