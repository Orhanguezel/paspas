// =============================================================
// FILE: src/integrations/shared/newsAggregator.ts
// Haber Toplayıcı tipler
// =============================================================

export type NewsSourceType = 'rss' | 'og' | 'scrape';
export type NewsSuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface NewsSourceDto {
  id:                 number;
  name:               string;
  url:                string;
  source_type:        NewsSourceType;
  is_enabled:         number;  // 0 | 1
  fetch_interval_min: number;
  last_fetched_at:    string | null;
  error_count:        number;
  last_error:         string | null;
  notes:              string | null;
  display_order:      number;
  created_at:         string;
  updated_at:         string;
}

export interface NewsSuggestionDto {
  id:              number;
  source_id:       number | null;
  source_url:      string;
  title:           string | null;
  excerpt:         string | null;
  content:         string | null;
  image_url:       string | null;
  source_name:     string | null;
  author:          string | null;
  category:        string | null;
  tags:            string | null;
  original_pub_at: string | null;
  status:          NewsSuggestionStatus;
  article_id:      number | null;
  reject_reason:   string | null;
  created_at:      string;
  updated_at:      string;
}

// Payloads
export interface NewsSourceCreatePayload {
  name:               string;
  url:                string;
  source_type?:       NewsSourceType;
  is_enabled?:        number;
  fetch_interval_min?: number;
  notes?:             string;
  display_order?:     number;
}

export interface NewsSourceUpdatePayload extends Partial<NewsSourceCreatePayload> {}

export interface NewsSourcesListParams {
  enabled_only?: boolean;
  limit?:        number;
  offset?:       number;
}

export interface NewsSuggestionsListParams {
  status?:    NewsSuggestionStatus | 'all';
  source_id?: number;
  q?:         string;
  limit?:     number;
  offset?:    number;
}

export interface SuggestionUpdatePayload {
  title?:            string;
  excerpt?:          string;
  content?:          string;
  image_url?:        string | null;
  author?:           string;
  category?:         string;
  tags?:             string;
  meta_title?:       string | null;
  meta_description?: string | null;
  original_pub_at?:  string | null;
}

export interface SuggestionApprovePayload {
  category?:         string;
  tags?:             string;
  is_featured?:      number;
  meta_title?:       string | null;
  meta_description?: string | null;
}

export interface SuggestionRejectPayload {
  reason?: string;
}

export interface OgPreviewResult {
  source_url:      string;
  title:           string | null;
  excerpt:         string | null;
  content:         string | null;
  image_url:       string | null;
  original_pub_at: string | null;
}

export interface FetchResult {
  ok:       boolean;
  inserted: number;
  skipped:  number;
  error:    string | null;
  total?:   number;
  errors?:  number;
}

export interface AiEnhanceResult {
  ok:               boolean;
  title?:           string;
  excerpt?:         string;
  content?:         string;
  meta_title?:      string;
  meta_description?: string;
  tags?:            string;
}

/** Canlı RSS feed öğesi — DB'ye kaydedilmez */
export interface LiveFeedItem {
  source_id:       number;
  source_name:     string;
  source_url:      string;
  title:           string | null;
  excerpt:         string | null;
  content:         string | null;
  image_url:       string | null;
  author:          string | null;
  original_pub_at: string | null;
}

export interface LiveFeedParams {
  source_id?: number;
  q?:         string;
  limit?:     number;
}

export interface QuickApprovePayload {
  source_url:        string;
  title:             string;
  excerpt?:          string | null;
  content?:          string | null;
  image_url?:        string | null;
  author?:           string | null;
  source_name?:      string | null;
  category?:         string;
  tags?:             string | null;
  meta_title?:       string | null;
  meta_description?: string | null;
  fetch_content?:    boolean;
}

export interface QuickApproveResult {
  ok:         boolean;
  article_id: number;
}

export interface LiveFeedResult {
  items:        LiveFeedItem[];
  total:        number;
  source_count: number;
  errors:       string[];
}

export interface DismissFeedItemPayload {
  source_url: string;
  title?:     string | null;
}

/** Ham canlı haber verisi için AI geliştirme */
export interface AiEnhanceLivePayload {
  title?:      string;
  excerpt?:    string;
  content?:    string;
  source_url?: string;
  category?:   string;
  tags?:       string;
}

export interface AiEnhanceLiveResult {
  ok:               boolean;
  title?:           string;
  excerpt?:         string;
  content?:         string;
  meta_title?:      string;
  meta_description?: string;
  tags?:            string;
}
