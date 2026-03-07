// =============================================================
// FILE: src/integrations/shared/articles.ts
// Articles (kendi haberlerimiz) modülü – backend uyumlu tipler
// =============================================================

import type { BoolLike } from '@/integrations/shared/common';

export type ArticleCategory =
  | 'gundem'
  | 'spor'
  | 'ekonomi'
  | 'teknoloji'
  | 'kultur'
  | 'saglik'
  | 'dunya'
  | 'yerel'
  | 'genel';

export type ArticleSortable = 'published_at' | 'created_at' | 'display_order';

export interface ArticleDto {
  id: number;
  uuid: string;

  locale: string | null;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;

  category: ArticleCategory | null;

  cover_url: string | null;
  cover_image_url: string | null;
  cover_asset_id: string | null;
  alt: string | null;

  video_url: string | null;

  author: string | null;
  source: string | null;
  source_url: string | null;

  tags: string | null;
  reading_time: number;

  meta_title: string | null;
  meta_description: string | null;

  is_published: boolean | BoolLike;
  is_featured: boolean | BoolLike;
  display_order: number;

  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleListQueryParams {
  q?: string;
  category?: ArticleCategory;
  is_published?: BoolLike;
  is_featured?: BoolLike;
  locale?: string;
  tags?: string;

  sort?: ArticleSortable;
  order?: 'asc' | 'desc';

  limit?: number;
  offset?: number;
}

interface ArticleBasePayload {
  locale?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  category?: ArticleCategory;
  cover_image_url?: string | null;
  cover_asset_id?: string | null;
  alt?: string;
  video_url?: string | null;
  author?: string;
  source?: string;
  source_url?: string | null;
  tags?: string;
  reading_time?: number;
  meta_title?: string;
  meta_description?: string;
  is_published?: BoolLike;
  is_featured?: BoolLike;
  display_order?: number;
}

export interface ArticleCreatePayload extends ArticleBasePayload {
  title: string;
  slug: string;
}

export interface ArticleUpdatePayload extends ArticleBasePayload {}

export interface ArticlePublishPayload {
  is_published: boolean;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface ArticleCommentDto {
  id: number;
  article_id: number;
  user_id: string;
  author_name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleCommentApprovePayload {
  is_approved: boolean;
}

// ─── Likes ────────────────────────────────────────────────────────────────────

export interface ArticleLikeCountDto {
  count: number;
  user_liked: boolean | null;
}
