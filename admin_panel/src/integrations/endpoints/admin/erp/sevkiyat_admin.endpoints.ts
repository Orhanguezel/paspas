// =============================================================
// FILE: src/integrations/endpoints/admin/erp/sevkiyat_admin.endpoints.ts
// Paspas ERP — Sevkiyat RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  BekleyenlerResponse,
  SevkEmriCreatePayload,
  SevkEmriDto,
  SevkEmriListResponse,
  SevkEmriPatchPayload,
  SiparissizResponse,
} from '@/integrations/shared/erp/sevkiyat.types';
import {
  normalizeBekleyenlerResponse,
  normalizeSevkEmri,
  normalizeSevkEmriList,
  normalizeSiparissizResponse,
} from '@/integrations/shared/erp/sevkiyat.types';

const BASE = '/admin/sevkiyat';

export interface BekleyenlerParams {
  q?: string;
  musteriId?: string;
  stokFiltre?: 'stoklu' | 'tumu';
  limit?: number;
  offset?: number;
}

export interface SiparissizParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export interface SevkEmriListParams {
  q?: string;
  durum?: string;
  musteriId?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
}

export const sevkiyatAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listBekleyenlerAdmin: b.query<BekleyenlerResponse, BekleyenlerParams | void>({
      query: (params) => ({ url: `${BASE}/bekleyenler`, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeBekleyenlerResponse(res),
      providesTags: [{ type: 'SevkBekleyenler' as const, id: 'LIST' }],
    }),

    listSiparissizAdmin: b.query<SiparissizResponse, SiparissizParams | void>({
      query: (params) => ({ url: `${BASE}/siparissiz`, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeSiparissizResponse(res),
      providesTags: [{ type: 'SevkBekleyenler' as const, id: 'SIPARISSIZ' }],
    }),

    listSevkEmirleriAdmin: b.query<SevkEmriListResponse, SevkEmriListParams | void>({
      query: (params) => ({ url: `${BASE}/emirler`, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeSevkEmriList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((e) => ({ type: 'SevkEmri' as const, id: e.id })),
              { type: 'SevkEmirleri' as const, id: 'LIST' },
            ]
          : [{ type: 'SevkEmirleri' as const, id: 'LIST' }],
    }),

    getSevkEmriAdmin: b.query<SevkEmriDto, string>({
      query: (id) => ({ url: `${BASE}/emirler/${id}` }),
      transformResponse: (res: unknown) => normalizeSevkEmri(res),
      providesTags: (_r, _e, id) => [{ type: 'SevkEmri' as const, id }],
    }),

    createSevkEmriAdmin: b.mutation<SevkEmriDto, SevkEmriCreatePayload>({
      query: (body) => ({ url: `${BASE}/emri`, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeSevkEmri(res),
      invalidatesTags: [
        { type: 'SevkEmirleri', id: 'LIST' },
        { type: 'SevkBekleyenler', id: 'LIST' },
        { type: 'SevkBekleyenler', id: 'SIPARISSIZ' },
        { type: 'Sevkiyat', id: 'LIST' },
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'Urunler', id: 'LIST' },
      ],
    }),

    updateSevkEmriAdmin: b.mutation<SevkEmriDto, { id: string; body: SevkEmriPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/emirler/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeSevkEmri(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'SevkEmri', id },
        { type: 'SevkEmirleri', id: 'LIST' },
        { type: 'SevkBekleyenler', id: 'LIST' },
        { type: 'SevkBekleyenler', id: 'SIPARISSIZ' },
        { type: 'Sevkiyat', id: 'LIST' },
        { type: 'SatisSiparisleri', id: 'LIST' },
        { type: 'Stoklar', id: 'LIST' },
        { type: 'Urunler', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListBekleyenlerAdminQuery,
  useListSiparissizAdminQuery,
  useListSevkEmirleriAdminQuery,
  useGetSevkEmriAdminQuery,
  useCreateSevkEmriAdminMutation,
  useUpdateSevkEmriAdminMutation,
} = sevkiyatAdminApi;
