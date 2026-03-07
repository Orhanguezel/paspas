import { baseApi } from '@/integrations/baseApi';
import type {
  UnitCreatePayload,
  UnitListParams,
  UnitPatchPayload,
  UnitView,
} from '@/integrations/shared/units_admin.types';

export const unitsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listUnitsAdmin: build.query<UnitView[], UnitListParams | void>({
      query: (params) => ({
        url: '/admin/units',
        method: 'GET',
        params: params ?? {},
        credentials: 'include',
      }),
      transformResponse: (response: UnitView[]) => (Array.isArray(response) ? response : []),
      providesTags: (result) =>
        result?.length
          ? [...result.map((x) => ({ type: 'Units' as const, id: x.id })), { type: 'Units' as const, id: 'LIST' }]
          : [{ type: 'Units' as const, id: 'LIST' }],
    }),

    createUnitAdmin: build.mutation<UnitView, UnitCreatePayload>({
      query: (body) => ({ url: '/admin/units', method: 'POST', body, credentials: 'include' }),
      invalidatesTags: [{ type: 'Units', id: 'LIST' }],
    }),

    updateUnitAdmin: build.mutation<UnitView, { id: string; patch: UnitPatchPayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/units/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
        credentials: 'include',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Units', id }, { type: 'Units', id: 'LIST' }],
    }),

    deleteUnitAdmin: build.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/admin/units/${encodeURIComponent(id)}`, method: 'DELETE', credentials: 'include' }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Units', id }, { type: 'Units', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListUnitsAdminQuery,
  useCreateUnitAdminMutation,
  useUpdateUnitAdminMutation,
  useDeleteUnitAdminMutation,
} = unitsAdminApi;

