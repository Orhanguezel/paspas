import { baseApi } from '@/integrations/baseApi';
import type {
  ListingBrandCreatePayload,
  ListingBrandListParams,
  ListingBrandPatchPayload,
  ListingBrandView,
} from '@/integrations/shared';

export const brandsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBrandsAdmin: build.query<ListingBrandView[], ListingBrandListParams | void>({
      query: (params) => ({
        url: '/admin/listing-brands',
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: ListingBrandView[]) => (Array.isArray(response) ? response : []),
      providesTags: (result) =>
        result?.length
          ? [...result.map((x) => ({ type: 'Brand' as const, id: x.id })), { type: 'Brand' as const, id: 'LIST' }]
          : [{ type: 'Brand' as const, id: 'LIST' }],
    }),

    createBrandAdmin: build.mutation<ListingBrandView, ListingBrandCreatePayload>({
      query: (body) => ({ url: '/admin/listing-brands', method: 'POST', body, credentials: 'include' }),
      invalidatesTags: [{ type: 'Brand', id: 'LIST' }],
    }),

    getBrandAdmin: build.query<ListingBrandView, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/listing-brands/${encodeURIComponent(id)}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (result, error, { id }) => [{ type: 'Brand', id }],
    }),

    updateBrandAdmin: build.mutation<ListingBrandView, { id: string; patch: ListingBrandPatchPayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/listing-brands/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Brand', id }, { type: 'Brand', id: 'LIST' }],
    }),

    removeBrandAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/admin/listing-brands/${encodeURIComponent(id)}`, method: 'DELETE', credentials: 'include' }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Brand', id }, { type: 'Brand', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListBrandsAdminQuery,
  useGetBrandAdminQuery,
  useCreateBrandAdminMutation,
  useUpdateBrandAdminMutation,
  useRemoveBrandAdminMutation,
} = brandsAdminApi;
