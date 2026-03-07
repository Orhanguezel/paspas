// =============================================================
// FILE: src/integrations/endpoints/admin/erp/receteler_admin.endpoints.ts
// Paspas ERP — Reçeteler RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ReceteDto,
  ReceteListResponse,
  ReceteCreatePayload,
  ReceteUpdatePayload,
} from '@/integrations/shared/erp/receteler.types';
import { normalizeRecete, normalizeReceteList } from '@/integrations/shared/erp/receteler.types';

const BASE = '/admin/receteler';

export const recetelerAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listRecetelerAdmin: b.query<ReceteListResponse, { search?: string } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeReceteList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((r) => ({ type: 'Recete' as const, id: r.id })),
              { type: 'Receteler' as const, id: 'LIST' },
            ]
          : [{ type: 'Receteler' as const, id: 'LIST' }],
    }),

    getReceteAdmin: b.query<ReceteDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeRecete(res),
      providesTags: (_r, _e, id) => [{ type: 'Recete' as const, id }],
    }),

    createReceteAdmin: b.mutation<ReceteDto, ReceteCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeRecete(res),
      invalidatesTags: [{ type: 'Receteler', id: 'LIST' }],
    }),

    updateReceteAdmin: b.mutation<ReceteDto, { id: string; body: ReceteUpdatePayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeRecete(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Recete', id },
        { type: 'Receteler', id: 'LIST' },
      ],
    }),

    deleteReceteAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Recete', id },
        { type: 'Receteler', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListRecetelerAdminQuery,
  useGetReceteAdminQuery,
  useCreateReceteAdminMutation,
  useUpdateReceteAdminMutation,
  useDeleteReceteAdminMutation,
} = recetelerAdminApi;
