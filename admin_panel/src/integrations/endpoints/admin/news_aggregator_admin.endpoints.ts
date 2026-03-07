// =============================================================
// FILE: src/integrations/endpoints/admin/news_aggregator_admin.endpoints.ts
// Haber Toplayıcı — RTK Query admin endpoints
// =============================================================
import { baseApi } from '@/integrations/baseApi';
import type {
  NewsSourceDto,
  NewsSuggestionDto,
  NewsSourceCreatePayload,
  NewsSourceUpdatePayload,
  NewsSourcesListParams,
  NewsSuggestionsListParams,
  SuggestionUpdatePayload,
  SuggestionApprovePayload,
  SuggestionRejectPayload,
  OgPreviewResult,
  FetchResult,
  AiEnhanceResult,
  LiveFeedParams,
  LiveFeedResult,
  QuickApprovePayload,
  QuickApproveResult,
  AiEnhanceLivePayload,
  AiEnhanceLiveResult,
  DismissFeedItemPayload,
} from '@/integrations/shared';

export const newsAggregatorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ──────────────────────────────────────────────────────
    // NEWS SOURCES
    // ──────────────────────────────────────────────────────

    listNewsSourcesAdmin: builder.query<NewsSourceDto[], NewsSourcesListParams | void>({
      query: (params) => ({
        url: '/admin/news-sources',
        params: params ?? {},
      }),
      providesTags: ['NewsSources'],
    }),

    getNewsSourceAdmin: builder.query<NewsSourceDto, number>({
      query: (id) => `/admin/news-sources/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'NewsSource', id }],
    }),

    createNewsSourceAdmin: builder.mutation<NewsSourceDto, NewsSourceCreatePayload>({
      query: (body) => ({
        url: '/admin/news-sources',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['NewsSources'],
    }),

    updateNewsSourceAdmin: builder.mutation<NewsSourceDto, { id: number; patch: NewsSourceUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/news-sources/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => ['NewsSources', { type: 'NewsSource', id }],
    }),

    deleteNewsSourceAdmin: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/news-sources/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NewsSources'],
    }),

    fetchNewsSourceAdmin: builder.mutation<FetchResult, number>({
      query: (id) => ({
        url: `/admin/news-sources/${id}/fetch`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => ['NewsSources', { type: 'NewsSource', id }, 'NewsSuggestions'],
    }),

    fetchAllNewsSourcesAdmin: builder.mutation<FetchResult & { total: number; errors: number }, void>({
      query: () => ({
        url: '/admin/news-sources/fetch-all',
        method: 'POST',
      }),
      invalidatesTags: ['NewsSources', 'NewsSuggestions'],
    }),

    previewUrlAdmin: builder.mutation<OgPreviewResult, { url: string }>({
      query: (body) => ({
        url: '/admin/news-sources/preview-url',
        method: 'POST',
        body,
      }),
    }),

    // ──────────────────────────────────────────────────────
    // NEWS SUGGESTIONS
    // ──────────────────────────────────────────────────────

    listNewsSuggestionsAdmin: builder.query<NewsSuggestionDto[], NewsSuggestionsListParams | void>({
      query: (params) => ({
        url: '/admin/news-suggestions',
        params: params ?? {},
      }),
      providesTags: ['NewsSuggestions'],
    }),

    getNewsSuggestionAdmin: builder.query<NewsSuggestionDto, number>({
      query: (id) => `/admin/news-suggestions/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'NewsSuggestion', id }],
    }),

    updateNewsSuggestionAdmin: builder.mutation<NewsSuggestionDto, { id: number; patch: SuggestionUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/news-suggestions/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => ['NewsSuggestions', { type: 'NewsSuggestion', id }],
    }),

    approveNewsSuggestionAdmin: builder.mutation<{ ok: boolean; article_id: number }, { id: number; body?: SuggestionApprovePayload }>({
      query: ({ id, body }) => ({
        url: `/admin/news-suggestions/${id}/approve`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_r, _e, { id }) => ['NewsSuggestions', { type: 'NewsSuggestion', id }, 'Articles'],
    }),

    rejectNewsSuggestionAdmin: builder.mutation<{ ok: boolean }, { id: number; body?: SuggestionRejectPayload }>({
      query: ({ id, body }) => ({
        url: `/admin/news-suggestions/${id}/reject`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: (_r, _e, { id }) => ['NewsSuggestions', { type: 'NewsSuggestion', id }],
    }),

    deleteNewsSuggestionAdmin: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/news-suggestions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NewsSuggestions'],
    }),

    fetchSourceNewsSuggestionAdmin: builder.mutation<{
      suggestion:      NewsSuggestionDto;
      fetched_title:   string | null;
      fetched_excerpt: string | null;
      fetched_content: string | null;
      fetched_image:   string | null;
    }, number>({
      query: (id) => ({
        url: `/admin/news-suggestions/${id}/fetch-source`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'NewsSuggestion', id }],
    }),

    aiEnhanceNewsSuggestionAdmin: builder.mutation<AiEnhanceResult, number>({
      query: (id) => ({
        url: `/admin/news-suggestions/${id}/ai-enhance`,
        method: 'POST',
      }),
    }),

    // ──────────────────────────────────────────────────────
    // LIVE FEED (no DB save)
    // ──────────────────────────────────────────────────────

    listLiveFeedAdmin: builder.query<LiveFeedResult, LiveFeedParams | void>({
      query: (params) => ({
        url: '/admin/news-sources/live-feed',
        params: params ?? {},
      }),
    }),

    quickApproveAdmin: builder.mutation<QuickApproveResult, QuickApprovePayload>({
      query: (body) => ({
        url: '/admin/news-sources/quick-approve',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Articles'],
    }),

    aiEnhanceLiveAdmin: builder.mutation<AiEnhanceLiveResult, AiEnhanceLivePayload>({
      query: (body) => ({
        url: '/admin/news-sources/ai-enhance-live',
        method: 'POST',
        body,
      }),
    }),

    dismissFeedItemAdmin: builder.mutation<{ ok: boolean }, DismissFeedItemPayload>({
      query: (body) => ({
        url: '/admin/news-sources/dismiss-feed-item',
        method: 'POST',
        body,
      }),
    }),

  }),
  overrideExisting: false,
});

export const {
  // Sources
  useListNewsSourcesAdminQuery,
  useLazyListNewsSourcesAdminQuery,
  useGetNewsSourceAdminQuery,
  useCreateNewsSourceAdminMutation,
  useUpdateNewsSourceAdminMutation,
  useDeleteNewsSourceAdminMutation,
  useFetchNewsSourceAdminMutation,
  useFetchAllNewsSourcesAdminMutation,
  usePreviewUrlAdminMutation,
  // Suggestions (legacy)
  useListNewsSuggestionsAdminQuery,
  useLazyListNewsSuggestionsAdminQuery,
  useGetNewsSuggestionAdminQuery,
  useUpdateNewsSuggestionAdminMutation,
  useApproveNewsSuggestionAdminMutation,
  useRejectNewsSuggestionAdminMutation,
  useDeleteNewsSuggestionAdminMutation,
  useFetchSourceNewsSuggestionAdminMutation,
  useAiEnhanceNewsSuggestionAdminMutation,
  // Live feed
  useListLiveFeedAdminQuery,
  useLazyListLiveFeedAdminQuery,
  useQuickApproveAdminMutation,
  useAiEnhanceLiveAdminMutation,
  useDismissFeedItemAdminMutation,
} = newsAggregatorApi;
