// =============================================================
// FILE: src/integrations/endpoints/admin/erp/urunler_admin.endpoints.ts
// Paspas ERP — Ürünler RTK Query endpoints
// =============================================================

import { baseApi } from "@/integrations/baseApi";
import type { ReceteDto } from "@/integrations/shared/erp/receteler.types";
import { normalizeRecete } from "@/integrations/shared/erp/receteler.types";
import type {
  TedarikTipi,
  UrunCreatePayload,
  UrunDto,
  UrunKategori,
  UrunListResponse,
  UrunMedyaDto,
  UrunMedyaPayload,
  UrunOperasyonDto,
  UrunUpdatePayload,
} from "@/integrations/shared/erp/urunler.types";
import {
  normalizeOperasyon,
  normalizeUrun,
  normalizeUrunList,
  normalizeUrunMedyaList,
} from "@/integrations/shared/erp/urunler.types";

const BASE = "/admin/urunler";

export const urunlerAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getNextCodeAdmin: b.query<{ kod: string }, { kategori?: string } | undefined>({
      query: (params) => ({ url: `${BASE}/next-code`, params: params ?? undefined }),
    }),

    listUrunlerAdmin: b.query<
      UrunListResponse,
      | {
          q?: string;
          page?: number;
          limit?: number;
          kategori?: UrunKategori;
          tedarikTipi?: TedarikTipi;
          urunGrubu?: string;
        }
      | undefined
    >({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeUrunList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((u) => ({ type: "Urun" as const, id: u.id })),
              { type: "Urunler" as const, id: "LIST" },
            ]
          : [{ type: "Urunler" as const, id: "LIST" }],
    }),

    getUrunAdmin: b.query<UrunDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeUrun(res),
      providesTags: (_r, _e, id) => [{ type: "Urun" as const, id }],
    }),

    createUrunAdmin: b.mutation<UrunDto, UrunCreatePayload>({
      query: (body) => ({ url: BASE, method: "POST", body }),
      transformResponse: (res: unknown) => normalizeUrun(res),
      invalidatesTags: [{ type: "Urunler", id: "LIST" }],
    }),

    // Asıl ürün + otomatik yarı mamul(ler) + reçeteleri tek istekte oluşturur
    createUrunFullAdmin: b.mutation<
      {
        urun: UrunDto;
        yariMamuller: UrunDto[];
        asilUrunReceteId: string | null;
        yariMamulReceteIds: string[];
      },
      {
        kod: string;
        ad: string;
        urunGrubu?: string;
        aciklama?: string;
        birim?: string;
        renk?: string;
        stok?: number;
        kritikStok?: number;
        birimFiyat?: number;
        kdvOrani?: number;
        operasyonTipi: "tek_tarafli" | "cift_tarafli";
        hazirlikSuresiDk?: number;
        cevrimSuresiSn?: number;
        yariMamulHammaddeleri?: Array<{ urunId: string; miktar: number; fireOrani?: number; sira?: number }>;
        asilUrunMalzemeleri?: Array<{ urunId: string; miktar: number; fireOrani?: number; sira?: number }>;
      }
    >({
      query: (body) => ({ url: `${BASE}/full`, method: "POST", body }),
      invalidatesTags: [{ type: "Urunler", id: "LIST" }, { type: "Receteler", id: "LIST" }],
    }),

    updateUrunAdmin: b.mutation<UrunDto, { id: string; body: UrunUpdatePayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeUrun(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Urun", id },
        { type: "Urunler", id: "LIST" },
      ],
    }),

    deleteUrunAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Urun", id },
        { type: "Urunler", id: "LIST" },
      ],
    }),

    // Operasyonlar
    listOperasyonlarAdmin: b.query<UrunOperasyonDto[], string>({
      query: (urunId) => ({ url: `${BASE}/${urunId}/operasyonlar` }),
      transformResponse: (res: unknown) => (Array.isArray(res) ? (res as unknown[]).map(normalizeOperasyon) : []),
      providesTags: (_r, _e, urunId) => [{ type: "Urun" as const, id: urunId }],
    }),

    patchOperasyonAdmin: b.mutation<UrunOperasyonDto, { opId: string; body: Partial<UrunOperasyonDto> }>({
      query: ({ opId, body }) => ({ url: `${BASE}/operasyonlar/${opId}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeOperasyon(res),
      invalidatesTags: [{ type: "Urunler", id: "LIST" }],
    }),

    // Recete (urun bazli)
    getUrunReceteAdmin: b.query<ReceteDto | null, string>({
      query: (urunId) => ({ url: `${BASE}/${urunId}/recete` }),
      transformResponse: (res: unknown) => {
        if (
          !res ||
          (typeof res === "object" &&
            "recete" in (res as Record<string, unknown>) &&
            (res as Record<string, unknown>).recete === null)
        ) {
          return null;
        }
        return normalizeRecete(res);
      },
      providesTags: (_r, _e, urunId) => [{ type: "Recete" as const, id: `urun-${urunId}` }],
    }),

    saveUrunReceteAdmin: b.mutation<
      ReceteDto,
      { urunId: string; items: { urunId: string; miktar: number; fireOrani: number; sira: number }[] }
    >({
      query: ({ urunId, items }) => ({ url: `${BASE}/${urunId}/recete`, method: "PUT", body: { items } }),
      transformResponse: (res: unknown) => normalizeRecete(res),
      invalidatesTags: (_r, _e, { urunId }) => [
        { type: "Recete", id: `urun-${urunId}` },
        { type: "Receteler", id: "LIST" },
      ],
    }),

    deleteUrunReceteAdmin: b.mutation<void, string>({
      query: (urunId) => ({ url: `${BASE}/${urunId}/recete`, method: "DELETE" }),
      invalidatesTags: (_r, _e, urunId) => [
        { type: "Recete", id: `urun-${urunId}` },
        { type: "Receteler", id: "LIST" },
      ],
    }),

    // Medya
    listUrunMedyaAdmin: b.query<UrunMedyaDto[], string>({
      query: (urunId) => ({ url: `${BASE}/${urunId}/medya` }),
      transformResponse: (res: unknown) => normalizeUrunMedyaList(res),
      providesTags: (_r, _e, urunId) => [{ type: "Urun" as const, id: `medya-${urunId}` }],
    }),

    saveUrunMedyaAdmin: b.mutation<UrunMedyaDto[], { urunId: string; items: UrunMedyaPayload[] }>({
      query: ({ urunId, items }) => ({ url: `${BASE}/${urunId}/medya`, method: "PUT", body: { items } }),
      transformResponse: (res: unknown) => normalizeUrunMedyaList(res),
      invalidatesTags: (_r, _e, { urunId }) => [
        { type: "Urun", id: `medya-${urunId}` },
        { type: "Urun", id: urunId },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetNextCodeAdminQuery,
  useListUrunlerAdminQuery,
  useGetUrunAdminQuery,
  useCreateUrunAdminMutation,
  useCreateUrunFullAdminMutation,
  useUpdateUrunAdminMutation,
  useDeleteUrunAdminMutation,
  useListOperasyonlarAdminQuery,
  usePatchOperasyonAdminMutation,
  useGetUrunReceteAdminQuery,
  useSaveUrunReceteAdminMutation,
  useDeleteUrunReceteAdminMutation,
  useListUrunMedyaAdminQuery,
  useSaveUrunMedyaAdminMutation,
} = urunlerAdminApi;
