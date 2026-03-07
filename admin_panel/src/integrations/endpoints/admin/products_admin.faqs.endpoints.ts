// =============================================================
// FILE: src/integrations/endpoints/admin/products_admin.faqs.endpoints.ts
// Admin Product FAQs RTK Endpoints
// Routes: /admin/products/:id/faqs
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminProductFaqDto,
  AdminProductFaqListParams,
  AdminProductFaqReplacePayload,
} from '@/integrations/shared/product_faqs_admin.types';

export const productFaqsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /admin/products/:id/faqs?locale=...
    listProductFaqsAdmin: build.query<AdminProductFaqDto[], AdminProductFaqListParams>({
      query: ({ productId, locale }) => ({
        url: `/admin/products/${encodeURIComponent(productId)}/faqs`,
        method: 'GET',
        params: { locale },
        credentials: 'include',
      }),
      transformResponse: (response: AdminProductFaqDto[]) =>
        Array.isArray(response) ? response : [],
      providesTags: (result, error, { productId }) => [
        { type: 'AdminProducts' as const, id: `FAQS_${productId}` },
      ],
    }),

    // PUT /admin/products/:id/faqs  (replace all)
    replaceProductFaqsAdmin: build.mutation<
      AdminProductFaqDto[],
      { productId: string; locale: string; payload: AdminProductFaqReplacePayload }
    >({
      query: ({ productId, locale, payload }) => ({
        url: `/admin/products/${encodeURIComponent(productId)}/faqs`,
        method: 'PUT',
        body: { ...payload, locale },
        credentials: 'include',
      }),
      transformResponse: (response: AdminProductFaqDto[]) =>
        Array.isArray(response) ? response : [],
      invalidatesTags: (result, error, { productId }) => [
        { type: 'AdminProducts' as const, id: `FAQS_${productId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProductFaqsAdminQuery,
  useReplaceProductFaqsAdminMutation,
} = productFaqsAdminApi;
