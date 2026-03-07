// =============================================================
// FILE: src/integrations/endpoints/admin/faqs_admin.endpoints.ts
// Admin FAQ endpoint'leri (auth gerektirir, locale destekli)
// - Locale header set ETMEZ (baseApi zaten Accept-Language default set ediyor)
// - Locale gerekiyorsa query param olarak gider (?locale=..)
// - Types tek noktadan: @/integrations/shared
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  FaqDto,
  FaqListQueryParams,
  FaqCreatePayload,
  FaqUpdatePayload,
  WithLocale,
} from '@/integrations/shared';
import { cleanParams } from '@/integrations/shared';

export const faqsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* --------------------------------------------------------- */
    /* LIST – GET /admin/faqs                                    */
    /* --------------------------------------------------------- */
    listFaqsAdmin: builder.query<FaqDto[], WithLocale<FaqListQueryParams> | void>({
      query: (params) => {
        const p = (params || {}) as WithLocale<FaqListQueryParams>;
        const { locale, ...rest } = p;

        return {
          url: '/admin/faqs',
          method: 'GET',
          params: cleanParams({ ...rest, locale }),
        };
      },
    }),

    /* --------------------------------------------------------- */
    /* GET BY ID – GET /admin/faqs/:id                           */
    /* --------------------------------------------------------- */
    getFaqAdmin: builder.query<FaqDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/admin/faqs/${encodeURIComponent(id)}`,
        method: 'GET',
        params: cleanParams({ locale }),
      }),
    }),

    /* --------------------------------------------------------- */
    /* GET BY SLUG – GET /admin/faqs/by-slug/:slug               */
    /* --------------------------------------------------------- */
    getFaqBySlugAdmin: builder.query<FaqDto, { slug: string; locale?: string }>({
      query: ({ slug, locale }) => ({
        url: `/admin/faqs/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        params: cleanParams({ locale }),
      }),
    }),

    /* --------------------------------------------------------- */
    /* CREATE – POST /admin/faqs                                 */
    /* --------------------------------------------------------- */
    createFaqAdmin: builder.mutation<FaqDto, FaqCreatePayload>({
      query: (body) => ({
        url: '/admin/faqs',
        method: 'POST',
        body,
      }),
    }),

    /* --------------------------------------------------------- */
    /* UPDATE (PATCH) – PATCH /admin/faqs/:id                    */
    /* --------------------------------------------------------- */
    updateFaqAdmin: builder.mutation<FaqDto, { id: string; patch: FaqUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/faqs/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
    }),

    /* --------------------------------------------------------- */
    /* DELETE – DELETE /admin/faqs/:id                           */
    /* --------------------------------------------------------- */
    deleteFaqAdmin: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/faqs/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFaqsAdminQuery,
  useGetFaqAdminQuery,
  useLazyGetFaqAdminQuery,
  useGetFaqBySlugAdminQuery,
  useCreateFaqAdminMutation,
  useUpdateFaqAdminMutation,
  useDeleteFaqAdminMutation,
} = faqsAdminApi;
