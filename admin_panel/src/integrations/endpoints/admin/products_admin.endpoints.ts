// =============================================================
// FILE: src/integrations/endpoints/admin/products_admin.endpoints.ts
// Admin Properties RTK Endpoints (UI module name kept as products)
// Routes: /admin/properties  (backend: modules/proporties/admin.routes.ts)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminProductDto,
  AdminProductListParams,
  AdminProductListResult,
  AdminProductCreatePayload,
  AdminProductUpdatePayload,
} from '@/integrations/shared/product_admin.types';

export const productsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /admin/properties
    listProductsAdmin: build.query<AdminProductListResult, AdminProductListParams | void>({
      query: (params) => ({
        url: '/admin/properties',
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: AdminProductDto[], meta) => {
        const items = Array.isArray(response) ? response : [];
        const totalHeader = meta?.response?.headers.get('x-total-count');
        const total = totalHeader ? Number(totalHeader) : items.length;
        return { items, total };
      },
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'AdminProducts' as const, id })),
              { type: 'AdminProducts' as const, id: 'LIST' },
            ]
          : [{ type: 'AdminProducts' as const, id: 'LIST' }],
    }),

    // GET /admin/properties/:id
    getProductAdmin: build.query<AdminProductDto, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/properties/${encodeURIComponent(id)}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (result, error, { id }) => [{ type: 'AdminProducts', id }],
    }),

    // POST /admin/properties
    createProductAdmin: build.mutation<AdminProductDto, AdminProductCreatePayload>({
      query: (body) => ({
        url: '/admin/properties',
        method: 'POST',
        body,
        credentials: 'include',
      }),
      invalidatesTags: [{ type: 'AdminProducts', id: 'LIST' }],
    }),

    // PATCH /admin/properties/:id
    updateProductAdmin: build.mutation<AdminProductDto, { id: string; patch: AdminProductUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/properties/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminProducts', id },
        { type: 'AdminProducts', id: 'LIST' },
      ],
    }),

    // DELETE /admin/properties/:id
    deleteProductAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/properties/${encodeURIComponent(id)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminProducts', id },
        { type: 'AdminProducts', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProductsAdminQuery,
  useLazyListProductsAdminQuery,
  useGetProductAdminQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
  useDeleteProductAdminMutation,
} = productsAdminApi;
