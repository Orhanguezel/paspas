// =============================================================
// FILE: src/integrations/types/library.types.ts
// Ensotek – Library tipleri (DB/DTO + payloadlar) [SCHEMA-SAFE]
// - Matches: src/modules/library/schema.ts + validation.ts
// - Endpoints: public + admin routes (router.ts / admin.routes.ts)
// =============================================================

import { BoolLike } from '@/integrations/shared';

/* =============================================================
 * DTOs (response contracts)
 * NOTE:
 * - Controller “view” alanları ekliyorsa (resolved urls vb.)
 *   bu tipler genişletilebilir.
 * ============================================================= */

export interface LibraryDto {
  id: string;

  // parent
  type: string;

  category_id: string | null;
  sub_category_id: string | null;

  featured: 0 | 1;
  is_published: 0 | 1;
  is_active: 0 | 1;
  display_order: number;

  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;

  views: number;
  download_count: number;

  published_at: string | null;
  created_at: string;
  updated_at: string;

  // i18n (library_i18n joined for resolved locale)
  locale: string | null;
  slug: string | null;
  name: string | null;
  description: string | null;
  image_alt: string | null;

  tags: string | null; // library_i18n.tags (varchar 255) – comma string or free string

  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  /** backend resolve bilgisi döndürüyorsa (opsiyonel) */
  locale_resolved?: string | null;
}

export interface LibraryImageDto {
  id: string;
  library_id: string;

  image_asset_id: string | null;
  image_url: string | null;

  is_active: 0 | 1;
  display_order: number;

  created_at: string;
  updated_at: string;

  // i18n (library_images_i18n resolved)
  locale: string | null;
  title: string | null;
  alt: string | null;
  caption: string | null;
}

export interface LibraryFileDto {
  id: string;
  library_id: string;

  asset_id: string | null;
  file_url: string | null;

  name: string;

  size_bytes: number | null;
  mime_type: string | null;

  /** JSON-string in DB; controllers typically deserialize to string[] */
  tags: string[] | null;

  display_order: number;
  is_active: 0 | 1;

  created_at: string;
  updated_at: string;
}

/* =============================================================
 * LIST Query Params (validation.ts ile uyumlu)
 * ============================================================= */

export interface LibraryListQueryParams {
  order?: string;
  sort?:
    | 'created_at'
    | 'updated_at'
    | 'published_at'
    | 'display_order'
    | 'views'
    | 'download_count';
  orderDir?: 'asc' | 'desc';

  limit?: number;
  offset?: number;

  q?: string;

  type?: string;

  category_id?: string;
  sub_category_id?: string;

  module_key?: string;

  featured?: BoolLike;
  is_published?: BoolLike;
  is_active?: BoolLike;

  published_before?: string; // ISO datetime
  published_after?: string; // ISO datetime

  locale?: string;
  default_locale?: string;
}

export type LibraryPublicListQueryParams = Omit<
  LibraryListQueryParams,
  'is_published' | 'is_active'
>;

/* =============================================================
 * Payloads – Library (parent + i18n combined)
 * - Matches: upsertLibraryBodySchema / patchLibraryBodySchema
 * ============================================================= */

export interface LibraryCreatePayload {
  // parent
  type?: string;

  category_id?: string | null;
  sub_category_id?: string | null;

  featured?: BoolLike;
  is_published?: BoolLike;
  is_active?: BoolLike;
  display_order?: number;

  featured_image?: string | null;
  image_url?: string | null;
  image_asset_id?: string | null;

  published_at?: string | null;

  // i18n
  locale?: string;

  name?: string;
  slug?: string;

  description?: string | null;
  image_alt?: string | null;

  tags?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  replicate_all_locales?: boolean;
}

export interface LibraryUpdatePayload {
  // parent (partial)
  type?: string;

  category_id?: string | null;
  sub_category_id?: string | null;

  featured?: BoolLike;
  is_published?: BoolLike;
  is_active?: BoolLike;
  display_order?: number;

  featured_image?: string | null;
  image_url?: string | null;
  image_asset_id?: string | null;

  published_at?: string | null;

  // i18n (partial)
  locale?: string;

  name?: string;
  slug?: string;

  description?: string | null;
  image_alt?: string | null;

  tags?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;

  apply_all_locales?: boolean;
}

/* =============================================================
 * Payloads – Images (library_images + i18n inline)
 * - Matches: upsertLibraryImageBodySchema / patchLibraryImageBodySchema
 * ============================================================= */

export interface LibraryImageCreatePayload {
  image_asset_id?: string | null;
  image_url?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  locale?: string;
  title?: string | null;
  alt?: string | null;
  caption?: string | null;

  replicate_all_locales?: boolean;
}

export interface LibraryImageUpdatePayload {
  image_asset_id?: string | null;
  image_url?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  locale?: string;
  title?: string | null;
  alt?: string | null;
  caption?: string | null;

  apply_all_locales?: boolean;
}

/* =============================================================
 * Payloads – Files (library_files)
 * - Matches: upsertLibraryFileBodySchema / patchLibraryFileBodySchema
 * ============================================================= */

export interface LibraryFileCreatePayload {
  asset_id?: string | null;
  file_url?: string | null;

  name: string;

  size_bytes?: number | null;
  mime_type?: string | null;

  tags?: string[];

  display_order?: number;
  is_active?: BoolLike;
}

export interface LibraryFileUpdatePayload {
  asset_id?: string | null;
  file_url?: string | null;

  name?: string;

  size_bytes?: number | null;
  mime_type?: string | null;

  tags?: string[] | null;

  display_order?: number;
  is_active?: BoolLike;
}



