// =============================================================
// FILE: src/integrations/endpoints/admin/articles_admin.endpoints.ts
// Admin articles (haberler) endpoint'leri
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ArticleDto,
  ArticleListQueryParams,
  ArticleCreatePayload,
  ArticleUpdatePayload,
  ArticlePublishPayload,
  ArticleCommentDto,
  ArticleCommentApprovePayload,
  AiEnhanceResult,
} from '@/integrations/shared';
import { cleanParams } from '@/integrations/shared';

export const articlesAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* LIST – GET /admin/articles */
    listArticlesAdmin: builder.query<ArticleDto[], ArticleListQueryParams | void>({
      query: (params) => ({
        url: '/admin/articles',
        method: 'GET',
        params: cleanParams((params ?? {}) as Record<string, unknown>),
      }),
      providesTags: ['Articles'],
    }),

    /* GET BY ID – GET /admin/articles/:id */
    getArticleAdmin: builder.query<ArticleDto, { id: number | string }>({
      query: ({ id }) => ({
        url: `/admin/articles/${encodeURIComponent(String(id))}`,
        method: 'GET',
      }),
      providesTags: (_result, _err, { id }) => [{ type: 'Article', id: String(id) }],
    }),

    /* CREATE – POST /admin/articles */
    createArticleAdmin: builder.mutation<ArticleDto, ArticleCreatePayload>({
      query: (body) => ({
        url: '/admin/articles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Articles'],
    }),

    /* UPDATE – PATCH /admin/articles/:id */
    updateArticleAdmin: builder.mutation<
      ArticleDto,
      { id: number | string; patch: ArticleUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/articles/${encodeURIComponent(String(id))}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        'Articles',
        { type: 'Article', id: String(id) },
      ],
    }),

    /* DELETE – DELETE /admin/articles/:id */
    deleteArticleAdmin: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/admin/articles/${encodeURIComponent(String(id))}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Articles'],
    }),

    /* PUBLISH – PATCH /admin/articles/:id/publish */
    setArticlePublished: builder.mutation<
      ArticleDto,
      { id: number | string; body: ArticlePublishPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/articles/${encodeURIComponent(String(id))}/publish`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        'Articles',
        { type: 'Article', id: String(id) },
      ],
    }),

    /* AI ENHANCE – POST /admin/articles/:id/ai-enhance */
    aiEnhanceArticleAdmin: builder.mutation<AiEnhanceResult, number | string>({
      query: (id) => ({
        url: `/admin/articles/${encodeURIComponent(String(id))}/ai-enhance`,
        method: 'POST',
      }),
    }),

    /* LIST COMMENTS – GET /admin/articles/:id/comments */
    listArticleCommentsAdmin: builder.query<ArticleCommentDto[], number | string>({
      query: (id) => ({
        url: `/admin/articles/${encodeURIComponent(String(id))}/comments`,
        method: 'GET',
      }),
      providesTags: (_result, _err, id) => [{ type: 'ArticleComments', id: String(id) }],
    }),

    /* APPROVE COMMENT – PATCH /admin/articles/comments/:cid/approve */
    approveArticleCommentAdmin: builder.mutation<
      ArticleCommentDto,
      { cid: number | string; body: ArticleCommentApprovePayload }
    >({
      query: ({ cid, body }) => ({
        url: `/admin/articles/comments/${encodeURIComponent(String(cid))}/approve`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { cid }) => [
        { type: 'ArticleComment', id: String(cid) },
        'ArticleComments',
      ],
    }),

    /* DELETE COMMENT – DELETE /admin/articles/comments/:cid */
    deleteArticleCommentAdmin: builder.mutation<void, number | string>({
      query: (cid) => ({
        url: `/admin/articles/comments/${encodeURIComponent(String(cid))}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ArticleComments'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListArticlesAdminQuery,
  useGetArticleAdminQuery,
  useLazyGetArticleAdminQuery,
  useCreateArticleAdminMutation,
  useUpdateArticleAdminMutation,
  useDeleteArticleAdminMutation,
  useSetArticlePublishedMutation,
  useAiEnhanceArticleAdminMutation,
  useListArticleCommentsAdminQuery,
  useApproveArticleCommentAdminMutation,
  useDeleteArticleCommentAdminMutation,
} = articlesAdminApi;
