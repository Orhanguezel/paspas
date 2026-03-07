// ===================================================================
// FILE: src/integrations/endpoints/admin/newsletter_admin.endpoints.ts
// FINAL — Newsletter Admin RTK (Single Language)
// Backend:
// - GET    /admin/newsletter              (array + headers x-total-count/content-range)
// - GET    /admin/newsletter/:id
// - PATCH  /admin/newsletter/:id
// - DELETE /admin/newsletter/:id          (204)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  NewsletterAdminListParams,
  NewsletterAdminListResp,
  NewsletterAdminSubscriber,
  NewsletterAdminUpdateBody,
} from '@/integrations/shared';
import {
  normalizeNewsletterAdminList,
  normalizeNewsletterAdminSubscriber,
  toNewsletterAdminListQuery,
  toNewsletterAdminUpdateBody,
} from '@/integrations/shared';

const BASE = '/admin/newsletter';

export const newsletterAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listNewsletterAdmin: b.query<NewsletterAdminListResp, NewsletterAdminListParams | void>({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: params ? toNewsletterAdminListQuery(params) : undefined,
      }),
      // RTK baseQuery should expose meta?.response?.headers in many setups.
      // If not available in your baseApi, total will remain null safely.
      transformResponse: (
        res: unknown,
        meta: any,
        arg: NewsletterAdminListParams | void,
      ): NewsletterAdminListResp => {
        const data = normalizeNewsletterAdminList(res);

        let total: number | null = null;
        try {
          const headers =
            meta?.response?.headers || meta?.headers || meta?.meta?.response?.headers || undefined;

          // fetch baseQuery often returns Headers object
          const xTotal =
            typeof headers?.get === 'function'
              ? headers.get('x-total-count')
              : headers?.['x-total-count'];

          if (xTotal != null && String(xTotal).trim()) total = Number(xTotal);
          if (Number.isNaN(total as any)) total = null;
        } catch {
          total = null;
        }

        const p = (arg ?? {}) as NewsletterAdminListParams;

        return {
          data,
          meta: {
            total,
            limit: typeof p.limit === 'number' ? p.limit : null,
            offset: typeof p.offset === 'number' ? p.offset : null,
          },
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((x) => ({ type: 'NewsletterSubscriber' as const, id: x.id })),
              { type: 'NewsletterSubscribers' as const, id: 'LIST' },
            ]
          : [{ type: 'NewsletterSubscribers' as const, id: 'LIST' }],
    }),

    getNewsletterAdmin: b.query<NewsletterAdminSubscriber, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): NewsletterAdminSubscriber =>
        normalizeNewsletterAdminSubscriber(res),
      providesTags: (_r, _e, arg) => [{ type: 'NewsletterSubscriber' as const, id: arg.id }],
    }),

    updateNewsletterAdmin: b.mutation<
      NewsletterAdminSubscriber,
      { id: string; body: NewsletterAdminUpdateBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toNewsletterAdminUpdateBody(body),
      }),
      transformResponse: (res: unknown): NewsletterAdminSubscriber =>
        normalizeNewsletterAdminSubscriber(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'NewsletterSubscriber' as const, id: arg.id },
        { type: 'NewsletterSubscribers' as const, id: 'LIST' },
      ],
    }),

    removeNewsletterAdmin: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      // backend returns 204
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'NewsletterSubscriber' as const, id: arg.id },
        { type: 'NewsletterSubscribers' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListNewsletterAdminQuery,
  useGetNewsletterAdminQuery,
  useUpdateNewsletterAdminMutation,
  useRemoveNewsletterAdminMutation,
} = newsletterAdminApi;
