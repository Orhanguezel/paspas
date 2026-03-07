// =============================================================
// FILE: src/integrations/endpoints/admin/erp/tanimlar_admin.endpoints.ts
// Paspas ERP — Tanımlar (Kalıplar + Tatiller) RTK Query endpoints
// =============================================================

import { baseApi } from "@/integrations/baseApi";
import type {
  KalipCreatePayload,
  KalipDto,
  KalipListResponse,
  KalipPatchPayload,
  KalipUyumluMakinelerPayload,
  TatilCreatePayload,
  TatilDto,
  TatilListResponse,
  TatilPatchPayload,
  VardiyaDto,
  VardiyaListResponse,
  VardiyaCreatePayload,
  VardiyaPatchPayload,
  DurusNedeniDto,
  DurusNedeniListResponse,
  DurusNedeniCreatePayload,
  DurusNedeniPatchPayload,
} from "@/integrations/shared/erp/tanimlar.types";
import {
  normalizeKalip,
  normalizeKalipList,
  normalizeTatil,
  normalizeTatilList,
  normalizeVardiya,
  normalizeVardiyaList,
  normalizeDurusNedeni,
  normalizeDurusNedeniList,
} from "@/integrations/shared/erp/tanimlar.types";

const BASE = "/admin/tanimlar";

export const tanimlarAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ── Kalıplar ──────────────────────────────────────────────
    listKaliplarAdmin: b.query<KalipListResponse, { q?: string } | undefined>({
      query: (params) => ({ url: `${BASE}/kaliplar`, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeKalipList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((k) => ({ type: "Kalip" as const, id: k.id })),
              { type: "Kaliplar" as const, id: "LIST" },
            ]
          : [{ type: "Kaliplar" as const, id: "LIST" }],
    }),

    createKalipAdmin: b.mutation<KalipDto, KalipCreatePayload>({
      query: (body) => ({ url: `${BASE}/kaliplar`, method: "POST", body }),
      transformResponse: (res: unknown) => normalizeKalip(res),
      invalidatesTags: [{ type: "Kaliplar", id: "LIST" }],
    }),

    updateKalipAdmin: b.mutation<KalipDto, { id: string; body: KalipPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/kaliplar/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeKalip(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Kalip", id },
        { type: "Kaliplar", id: "LIST" },
      ],
    }),

    deleteKalipAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/kaliplar/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Kalip", id },
        { type: "Kaliplar", id: "LIST" },
      ],
    }),

    // ── Kalıp Uyumlu Makineler ─────────────────────────────────
    listUyumluMakinelerAdmin: b.query<string[], string>({
      query: (kalipId) => ({ url: `${BASE}/kaliplar/${kalipId}/uyumlu-makineler` }),
      transformResponse: (res: unknown) =>
        Array.isArray(res)
          ? (res as Array<Record<string, unknown>>).map((r) => String(r.makineId ?? "")).filter(Boolean)
          : [],
      providesTags: (_r, _e, kalipId) => [{ type: "Kalip" as const, id: kalipId }],
    }),

    setUyumluMakinelerAdmin: b.mutation<string[], { kalipId: string; body: KalipUyumluMakinelerPayload }>({
      query: ({ kalipId, body }) => ({ url: `${BASE}/kaliplar/${kalipId}/uyumlu-makineler`, method: "PUT", body }),
      transformResponse: (res: unknown) =>
        Array.isArray(res)
          ? (res as Array<Record<string, unknown>>).map((r) => String(r.makineId ?? "")).filter(Boolean)
          : [],
      invalidatesTags: (_r, _e, { kalipId }) => [
        { type: "Kalip", id: kalipId },
        { type: "Kaliplar", id: "LIST" },
        { type: "Makineler", id: "LIST" },
      ],
    }),

    // ── Tatiller ──────────────────────────────────────────────
    listTatillerAdmin: b.query<TatilListResponse, void>({
      query: () => ({ url: `${BASE}/tatiller` }),
      transformResponse: (res: unknown) => normalizeTatilList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((t) => ({ type: "Tatil" as const, id: t.id })),
              { type: "Tatiller" as const, id: "LIST" },
            ]
          : [{ type: "Tatiller" as const, id: "LIST" }],
    }),

    createTatilAdmin: b.mutation<TatilDto, TatilCreatePayload>({
      query: (body) => ({ url: `${BASE}/tatiller`, method: "POST", body }),
      transformResponse: (res: unknown) => normalizeTatil(res),
      invalidatesTags: [{ type: "Tatiller", id: "LIST" }],
    }),

    updateTatilAdmin: b.mutation<TatilDto, { id: string; body: TatilPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/tatiller/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeTatil(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Tatil", id },
        { type: "Tatiller", id: "LIST" },
      ],
    }),

    deleteTatilAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/tatiller/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Tatil", id },
        { type: "Tatiller", id: "LIST" },
      ],
    }),

    // ── Vardiyalar ───────────────────────────────────────────────────
    listVardiyalarAdmin: b.query<VardiyaListResponse, void>({
      query: () => ({ url: `${BASE}/vardiyalar` }),
      transformResponse: (res: unknown) => normalizeVardiyaList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((v) => ({ type: "Vardiya" as const, id: v.id })),
              { type: "Vardiyalar" as const, id: "LIST" },
            ]
          : [{ type: "Vardiyalar" as const, id: "LIST" }],
    }),

    createVardiyaAdmin: b.mutation<VardiyaDto, VardiyaCreatePayload>({
      query: (body) => ({ url: `${BASE}/vardiyalar`, method: "POST", body }),
      transformResponse: (res: unknown) => normalizeVardiya(res),
      invalidatesTags: [{ type: "Vardiyalar", id: "LIST" }],
    }),

    updateVardiyaAdmin: b.mutation<VardiyaDto, { id: string; body: VardiyaPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/vardiyalar/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeVardiya(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Vardiya", id },
        { type: "Vardiyalar", id: "LIST" },
      ],
    }),

    deleteVardiyaAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/vardiyalar/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Vardiya", id },
        { type: "Vardiyalar", id: "LIST" },
      ],
    }),

    // ── Duruş Nedenleri ────────────────────────────────────────────
    listDurusNedenleriAdmin: b.query<DurusNedeniListResponse, void>({
      query: () => ({ url: `${BASE}/durus-nedenleri` }),
      transformResponse: (res: unknown) => normalizeDurusNedeniList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((d) => ({ type: "DurusNedeni" as const, id: d.id })),
              { type: "DurusNedenleri" as const, id: "LIST" },
            ]
          : [{ type: "DurusNedenleri" as const, id: "LIST" }],
    }),

    createDurusNedeniAdmin: b.mutation<DurusNedeniDto, DurusNedeniCreatePayload>({
      query: (body) => ({ url: `${BASE}/durus-nedenleri`, method: "POST", body }),
      transformResponse: (res: unknown) => normalizeDurusNedeni(res),
      invalidatesTags: [{ type: "DurusNedenleri", id: "LIST" }],
    }),

    updateDurusNedeniAdmin: b.mutation<DurusNedeniDto, { id: string; body: DurusNedeniPatchPayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/durus-nedenleri/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeDurusNedeni(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "DurusNedeni", id },
        { type: "DurusNedenleri", id: "LIST" },
      ],
    }),

    deleteDurusNedeniAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/durus-nedenleri/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "DurusNedeni", id },
        { type: "DurusNedenleri", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListKaliplarAdminQuery,
  useListUyumluMakinelerAdminQuery,
  useSetUyumluMakinelerAdminMutation,
  useCreateKalipAdminMutation,
  useUpdateKalipAdminMutation,
  useDeleteKalipAdminMutation,
  useListTatillerAdminQuery,
  useCreateTatilAdminMutation,
  useUpdateTatilAdminMutation,
  useDeleteTatilAdminMutation,
  useListVardiyalarAdminQuery,
  useCreateVardiyaAdminMutation,
  useUpdateVardiyaAdminMutation,
  useDeleteVardiyaAdminMutation,
  useListDurusNedenleriAdminQuery,
  useCreateDurusNedeniAdminMutation,
  useUpdateDurusNedeniAdminMutation,
  useDeleteDurusNedeniAdminMutation,
} = tanimlarAdminApi;
