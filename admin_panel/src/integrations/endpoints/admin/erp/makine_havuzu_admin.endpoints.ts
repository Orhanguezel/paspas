// =============================================================
// FILE: src/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints.ts
// Paspas ERP — Makine Havuzu RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AtamaPayload,
  AtanmamisOperasyonDto,
  KapasiteHesabiDto,
  KapasiteQueryParams,
  KuyrukGrubuDto,
  KuyrukSiralaPayload,
  MakineCreatePayload,
  MakineDto,
  MakineListResponse,
  MakinePatchPayload,
} from '@/integrations/shared/erp/makine_havuzu.types';
import {
  normalizeAtanmamisOperasyon,
  normalizeKapasiteHesabi,
  normalizeKuyrukGrubu,
  normalizeMakine,
  normalizeMakineList,
} from '@/integrations/shared/erp/makine_havuzu.types';

const BASE = '/admin/makine-havuzu';

export const makineHavuzuAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMakinelerAdmin: b.query<MakineListResponse, { q?: string; durum?: string } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeMakineList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((m) => ({ type: 'Makine' as const, id: m.id })),
              { type: 'Makineler' as const, id: 'LIST' },
            ]
          : [{ type: 'Makineler' as const, id: 'LIST' }],
    }),

    getMakineAdmin: b.query<MakineDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeMakine(res),
      providesTags: (_r, _e, id) => [{ type: 'Makine' as const, id }],
    }),

    getMakineCapacityAdmin: b.query<KapasiteHesabiDto, { id: string; params?: KapasiteQueryParams }>({
      query: ({ id, params }) => ({ url: `${BASE}/${id}/capacity`, params }),
      transformResponse: (res: unknown) => normalizeKapasiteHesabi(res),
      providesTags: (_r, _e, { id }) => [{ type: 'MakineCapacity' as const, id }],
    }),

    createMakineAdmin: b.mutation<MakineDto, MakineCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeMakine(res),
      invalidatesTags: [{ type: 'Makineler', id: 'LIST' }],
    }),

    updateMakineAdmin: b.mutation<MakineDto, { id: string; body: MakinePatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeMakine(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Makine', id },
        { type: 'Makineler', id: 'LIST' },
      ],
    }),

    deleteMakineAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Makine', id },
        { type: 'Makineler', id: 'LIST' },
      ],
    }),

    // -- Kuyruk Yonetimi --

    listAtanmamisAdmin: b.query<AtanmamisOperasyonDto[], void>({
      query: () => ({ url: `${BASE}/atanmamis` }),
      transformResponse: (res: unknown) =>
        Array.isArray(res) ? (res as unknown[]).map(normalizeAtanmamisOperasyon) : [],
      providesTags: [{ type: 'MakineKuyrugu' as const, id: 'ATANMAMIS' }],
    }),

    listKuyrukAdmin: b.query<KuyrukGrubuDto[], void>({
      query: () => ({ url: `${BASE}/kuyruklar` }),
      transformResponse: (res: unknown) =>
        Array.isArray(res) ? (res as unknown[]).map(normalizeKuyrukGrubu) : [],
      providesTags: [{ type: 'MakineKuyrugu' as const, id: 'KUYRUKLAR' }],
    }),

    ataOperasyonAdmin: b.mutation<{ ok: boolean }, AtamaPayload>({
      query: (body) => ({ url: `${BASE}/ata`, method: 'POST', body }),
      invalidatesTags: [
        { type: 'MakineKuyrugu', id: 'ATANMAMIS' },
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
        { type: 'UretimEmirleri', id: 'LIST' },
        { type: 'Gantt', id: 'LIST' },
      ],
    }),

    kuyrukCikarAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/kuyruk/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'MakineKuyrugu', id: 'ATANMAMIS' },
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
        { type: 'Gantt', id: 'LIST' },
      ],
    }),

    kuyrukSiralaAdmin: b.mutation<{ ok: boolean }, KuyrukSiralaPayload>({
      query: (body) => ({ url: `${BASE}/kuyruk-sirala`, method: 'PATCH', body }),
      invalidatesTags: [
        { type: 'MakineKuyrugu', id: 'KUYRUKLAR' },
        { type: 'Gantt', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMakinelerAdminQuery,
  useGetMakineAdminQuery,
  useGetMakineCapacityAdminQuery,
  useCreateMakineAdminMutation,
  useUpdateMakineAdminMutation,
  useDeleteMakineAdminMutation,
  useListAtanmamisAdminQuery,
  useListKuyrukAdminQuery,
  useAtaOperasyonAdminMutation,
  useKuyrukCikarAdminMutation,
  useKuyrukSiralaAdminMutation,
} = makineHavuzuAdminApi;
