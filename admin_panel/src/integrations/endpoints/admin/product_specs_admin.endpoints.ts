// =============================================================
// FILE: src/integrations/endpoints/admin/product_specs_admin.endpoints.ts
// Admin Product Specs RTK Endpoints
// Routes: /admin/products/:id/specs
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminProductSpecDto,
  AdminProductSpecListParams,
  AdminProductSpecReplacePayload,
} from '@/integrations/shared/product_specs_admin.types';

export const productSpecsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /admin/products/:id/specs?locale=...
    listProductSpecsAdmin: build.query<AdminProductSpecDto[], AdminProductSpecListParams>({
      query: ({ productId, locale }) => ({
        url: `/admin/products/${encodeURIComponent(productId)}/specs`,
        method: 'GET',
        params: { locale },
        credentials: 'include',
      }),
      transformResponse: (response: AdminProductSpecDto[]) =>
        Array.isArray(response) ? response : [],
      providesTags: (result, error, { productId }) => [
        { type: 'AdminProducts' as const, id: `SPECS_${productId}` },
      ],
    }),

    // PUT /admin/products/:id/specs  (replace all)
    replaceProductSpecsAdmin: build.mutation<
      AdminProductSpecDto[],
      { productId: string; locale: string; payload: AdminProductSpecReplacePayload }
    >({
      query: ({ productId, locale, payload }) => ({
        url: `/admin/products/${encodeURIComponent(productId)}/specs`,
        method: 'PUT',
        body: { ...payload, locale },
        credentials: 'include',
      }),
      transformResponse: (response: AdminProductSpecDto[]) =>
        Array.isArray(response) ? response : [],
      invalidatesTags: (result, error, { productId }) => [
        { type: 'AdminProducts' as const, id: `SPECS_${productId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProductSpecsAdminQuery,
  useReplaceProductSpecsAdminMutation,
} = productSpecsAdminApi;
