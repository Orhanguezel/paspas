// =============================================================
// FILE: src/integrations/endpoints/admin/erp/teklifler_admin.endpoints.ts
// Paspas ERP — Teklif Modülü (Teklifler + Teklif Talepleri) RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  FirmaProfiliDto,
  TeklifDto,
  TeklifListResponse,
  TeklifCreatePayload,
  TeklifPatchPayload,
  TeklifDurumPayload,
  TeklifKalemPayload,
  TeklifDurum,
  TalepDto,
  TalepListResponse,
  TalepPatchPayload,
  TalepDonusturPayload,
  TalepDonusturResponse,
  TalepDurum,
} from '@/integrations/shared/erp/teklifler.types';
import {
  normalizeTeklif,
  normalizeTeklifList,
  normalizeTalep,
  normalizeTalepList,
} from '@/integrations/shared/erp/teklifler.types';

const BASE = '/admin/teklifler';
const TALEP_BASE = '/admin/teklif-talepleri';

export interface TeklifListParams {
  q?: string;
  durum?: TeklifDurum;
  musteriId?: string;
  limit?: number;
  offset?: number;
}

export interface TalepListParams {
  q?: string;
  durum?: TalepDurum;
  limit?: number;
  offset?: number;
}

export const tekliflerAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ── Teklifler ──────────────────────────────────────────
    listTekliflerAdmin: b.query<TeklifListResponse, TeklifListParams | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown, meta) => {
        const list = normalizeTeklifList(res);
        const totalHeader = meta?.response?.headers.get('x-total-count');
        const total = totalHeader ? Number(totalHeader) : list.total;
        return { ...list, total: Number.isFinite(total) ? total : list.total };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((t) => ({ type: 'Teklif' as const, id: t.id })),
              { type: 'Teklifler' as const, id: 'LIST' },
            ]
          : [{ type: 'Teklifler' as const, id: 'LIST' }],
    }),

    getTeklifAdmin: b.query<TeklifDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      providesTags: (_r, _e, id) => [{ type: 'Teklif' as const, id }],
    }),

    // Firma profili (logo + firma bilgisi — teklif başlığı için, ayarlardan)
    getTeklifFirmaProfiliAdmin: b.query<FirmaProfiliDto, void>({
      query: () => ({ url: `${BASE}/firma-profili` }),
    }),

    createTeklifAdmin: b.mutation<TeklifDto, TeklifCreatePayload>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      invalidatesTags: [{ type: 'Teklifler', id: 'LIST' }],
    }),

    updateTeklifAdmin: b.mutation<TeklifDto, { id: string; body: TeklifPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    deleteTeklifAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    setTeklifDurumAdmin: b.mutation<TeklifDto, { id: string; body: TeklifDurumPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}/durum`, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    gonderTeklifAdmin: b.mutation<TeklifDto, { id: string; body: { kanal: 'email' | 'whatsapp_link' | 'manuel'; aliciEmail?: string } }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}/gonder`, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    convertTeklifToSiparisAdmin: b.mutation<{ siparisId: string; siparisNo: string }, string>({
      query: (id) => ({ url: `${BASE}/${id}/siparise-donustur`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    addTeklifKalemAdmin: b.mutation<TeklifDto, { id: string; body: TeklifKalemPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}/kalemler`, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    patchTeklifKalemAdmin: b.mutation<TeklifDto, { id: string; kalemId: string; body: Partial<TeklifKalemPayload> }>({
      query: ({ id, kalemId, body }) => ({ url: `${BASE}/${id}/kalemler/${kalemId}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    deleteTeklifKalemAdmin: b.mutation<TeklifDto, { id: string; kalemId: string }>({
      query: ({ id, kalemId }) => ({ url: `${BASE}/${id}/kalemler/${kalemId}`, method: 'DELETE' }),
      transformResponse: (res: unknown) => normalizeTeklif(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Teklif', id },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),

    // ── Teklif Talepleri (web lead'leri) ────────────────────
    listTeklifTalepleriAdmin: b.query<TalepListResponse, TalepListParams | void>({
      query: (params) => ({ url: TALEP_BASE, params: params ?? undefined }),
      transformResponse: (res: unknown, meta) => {
        const list = normalizeTalepList(res);
        const totalHeader = meta?.response?.headers.get('x-total-count');
        const total = totalHeader ? Number(totalHeader) : list.total;
        return { ...list, total: Number.isFinite(total) ? total : list.total };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((t) => ({ type: 'TeklifTalep' as const, id: t.id })),
              { type: 'TeklifTalepleri' as const, id: 'LIST' },
            ]
          : [{ type: 'TeklifTalepleri' as const, id: 'LIST' }],
    }),

    getTeklifTalebiAdmin: b.query<TalepDto, string>({
      query: (id) => ({ url: `${TALEP_BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeTalep(res),
      providesTags: (_r, _e, id) => [{ type: 'TeklifTalep' as const, id }],
    }),

    patchTeklifTalebiAdmin: b.mutation<TalepDto, { id: string; body: TalepPatchPayload }>({
      query: ({ id, body }) => ({ url: `${TALEP_BASE}/${id}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeTalep(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'TeklifTalep', id },
        { type: 'TeklifTalepleri', id: 'LIST' },
      ],
    }),

    donusturTeklifTalebiAdmin: b.mutation<TalepDonusturResponse, { id: string; body: TalepDonusturPayload }>({
      query: ({ id, body }) => ({ url: `${TALEP_BASE}/${id}/donustur`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'TeklifTalep', id },
        { type: 'TeklifTalepleri', id: 'LIST' },
        { type: 'Teklifler', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTekliflerAdminQuery,
  useGetTeklifAdminQuery,
  useGetTeklifFirmaProfiliAdminQuery,
  useCreateTeklifAdminMutation,
  useUpdateTeklifAdminMutation,
  useDeleteTeklifAdminMutation,
  useSetTeklifDurumAdminMutation,
  useGonderTeklifAdminMutation,
  useConvertTeklifToSiparisAdminMutation,
  useAddTeklifKalemAdminMutation,
  usePatchTeklifKalemAdminMutation,
  useDeleteTeklifKalemAdminMutation,
  useListTeklifTalepleriAdminQuery,
  useGetTeklifTalebiAdminQuery,
  usePatchTeklifTalebiAdminMutation,
  useDonusturTeklifTalebiAdminMutation,
} = tekliflerAdminApi;
