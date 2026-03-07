// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/catalog_admin.endpoints.ts
// Ensotek – Admin Catalog Requests (RTK Query)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  CatalogRequestDto,
  CatalogRequestListQueryParams,
  PatchCatalogRequestAdminBody,
  DeleteCatalogRequestResult,
} from '@/integrations/shared';

/**
 * IMPORTANT:
 * Backend routes (as shared):
 *   GET    /catalog-requests
 *   GET    /catalog-requests/:id
 *   PATCH  /catalog-requests/:id
 *   DELETE /catalog-requests/:id
 *   POST   /catalog-requests/:id/resend
 *
 * If your server mounts admin routes under "/admin", change BASE to:
 *   const BASE = "admin/catalog-requests";
 */
const BASE = 'admin/catalog-requests';

export const catalogAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // LIST
    listCatalogRequestsAdmin: build.query<
      CatalogRequestDto[],
      CatalogRequestListQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}`,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: (res) =>
        res && res.length
          ? [
              { type: 'CatalogRequest' as const, id: 'LIST' },
              ...res.map((r) => ({
                type: 'CatalogRequest' as const,
                id: r.id,
              })),
            ]
          : [{ type: 'CatalogRequest' as const, id: 'LIST' }],
    }),

    // GET
    getCatalogRequestAdmin: build.query<CatalogRequestDto, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${id}`,
        method: 'GET',
      }),
      providesTags: (_res, _err, arg) => [{ type: 'CatalogRequest' as const, id: arg.id }],
    }),

    // PATCH
    patchCatalogRequestAdmin: build.mutation<
      CatalogRequestDto,
      { id: string; body: PatchCatalogRequestAdminBody }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'CatalogRequest' as const, id: 'LIST' },
        { type: 'CatalogRequest' as const, id: arg.id },
      ],
    }),

    // DELETE (204 No Content)
    removeCatalogRequestAdmin: build.mutation<DeleteCatalogRequestResult, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'CatalogRequest' as const, id: 'LIST' },
        { type: 'CatalogRequest' as const, id: arg.id },
      ],
    }),

    // RESEND
    resendCatalogRequestAdmin: build.mutation<CatalogRequestDto, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${id}/resend`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'CatalogRequest' as const, id: 'LIST' },
        { type: 'CatalogRequest' as const, id: arg.id },
      ],
    }),
  }),
});

export const {
  useListCatalogRequestsAdminQuery,
  useGetCatalogRequestAdminQuery,
  usePatchCatalogRequestAdminMutation,
  useRemoveCatalogRequestAdminMutation,
  useResendCatalogRequestAdminMutation,
} = catalogAdminApi;
