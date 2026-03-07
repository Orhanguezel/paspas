import { baseApi } from '@/integrations/baseApi';
import type {
  VariantCreatePayload,
  VariantListParams,
  VariantPatchPayload,
  VariantView,
} from '@/integrations/shared/variants_admin.types';

export const variantsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listVariantsAdmin: build.query<VariantView[], VariantListParams | void>({
      query: (params) => ({
        url: '/admin/variants',
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: VariantView[]) => (Array.isArray(response) ? response : []),
      providesTags: (result) =>
        result?.length
          ? [...result.map((x) => ({ type: 'Variants' as const, id: x.id })), { type: 'Variants' as const, id: 'LIST' }]
          : [{ type: 'Variants' as const, id: 'LIST' }],
    }),

    createVariantAdmin: build.mutation<VariantView, VariantCreatePayload>({
      query: (body) => ({ url: '/admin/variants', method: 'POST', body, credentials: 'include' }),
      invalidatesTags: [{ type: 'Variants', id: 'LIST' }],
    }),

    getVariantAdmin: build.query<VariantView, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/variants/${encodeURIComponent(id)}`,
        method: 'GET',
        credentials: 'include',
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'Variants', id }],
    }),

    updateVariantAdmin: build.mutation<VariantView, { id: string; patch: VariantPatchPayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/variants/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Variants', id }, { type: 'Variants', id: 'LIST' }],
    }),

    deleteVariantAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/admin/variants/${encodeURIComponent(id)}`, method: 'DELETE', credentials: 'include' }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Variants', id }, { type: 'Variants', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListVariantsAdminQuery,
  useGetVariantAdminQuery,
  useCreateVariantAdminMutation,
  useUpdateVariantAdminMutation,
  useDeleteVariantAdminMutation,
} = variantsAdminApi;
