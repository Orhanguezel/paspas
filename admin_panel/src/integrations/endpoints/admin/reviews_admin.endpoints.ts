// =============================================================
// FILE: src/integrations/endpoints/admin/reviews_admin.endpoints.ts
// Admin Reviews (LIST + CRUD)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminReviewDto,
  AdminReviewListQueryParams,
  AdminReviewListResponse,
  AdminGetReviewParams,
  AdminReviewCreatePayload,
  AdminReviewUpdatePayload,
} from '@/integrations/shared';

export const reviewsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // -------- LIST (admin) --------
    listReviewsAdmin: build.query<AdminReviewListResponse, AdminReviewListQueryParams | undefined>({
      query: (params) => ({
        url: '/admin/reviews',
        method: 'GET',
        params,
      }),
      // Şu an backend X-Total-Count header set etmiyor; total = items.length
      transformResponse: (response: AdminReviewDto[]): AdminReviewListResponse => {
        const items = response ?? [];
        return {
          items,
          total: items.length,
        };
      },
    }),

    // -------- DETAIL (admin) --------
    getReviewAdmin: build.query<AdminReviewDto, AdminGetReviewParams>({
      query: ({ id }) => ({
        url: `/admin/reviews/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
    }),

    // -------- CREATE (admin) --------
    createReviewAdmin: build.mutation<AdminReviewDto, AdminReviewCreatePayload>({
      query: (body) => ({
        url: '/admin/reviews',
        method: 'POST',
        body,
      }),
    }),

    // -------- UPDATE (admin) --------
    updateReviewAdmin: build.mutation<
      AdminReviewDto,
      { id: string; patch: AdminReviewUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/reviews/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
    }),

    // -------- DELETE (admin) --------
    deleteReviewAdmin: build.mutation<{ ok?: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/reviews/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListReviewsAdminQuery,
  useGetReviewAdminQuery,
  useCreateReviewAdminMutation,
  useUpdateReviewAdminMutation,
  useDeleteReviewAdminMutation,
} = reviewsAdminApi;
