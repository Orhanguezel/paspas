// =============================================================
// FILE: src/integrations/endpoints/admin/erp/stoklar_admin.endpoints.ts
// Paspas ERP — Stoklar RTK Query endpoints
// =============================================================

import { baseApi } from "@/integrations/baseApi";
import type {
  StokDto,
  StokDuzeltmePayload,
  StokListResponse,
  YeterlilikResponse,
} from "@/integrations/shared/erp/stoklar.types";
import { normalizeStok, normalizeStokList, normalizeYeterlilik } from "@/integrations/shared/erp/stoklar.types";

const BASE = "/admin/stoklar";

export const stoklarAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listStoklarAdmin: b.query<
      StokListResponse,
      | {
          q?: string;
          kategori?: string;
          durum?: "yeterli" | "kritik" | "yetersiz";
          kritikOnly?: boolean;
          stokluOnly?: boolean;
          sort?: "ad" | "kod" | "stok" | "kritik_stok";
          order?: "asc" | "desc";
        }
      | undefined
    >({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeStokList(res),
      providesTags: [{ type: "Stoklar" as const, id: "LIST" }],
    }),

    getStokAdmin: b.query<StokDto, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown) => normalizeStok(res),
      providesTags: (_result, _error, id) => [{ type: "Stoklar" as const, id }],
    }),

    adjustStokAdmin: b.mutation<StokDto, { id: string; body: StokDuzeltmePayload }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}/duzelt`, method: "POST", body }),
      transformResponse: (res: unknown) => normalizeStok(res),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Stoklar", id: "LIST" },
        { type: "Stoklar", id },
        { type: "Hareketler", id: "LIST" },
      ],
    }),

    checkYeterlilikAdmin: b.query<YeterlilikResponse, { urunId: string; miktar: number }>({
      query: (params) => ({ url: `${BASE}/yeterlilik`, params }),
      transformResponse: (res: unknown) => normalizeYeterlilik(res),
      providesTags: [{ type: "Stoklar" as const, id: "YETERLILIK" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListStoklarAdminQuery,
  useGetStokAdminQuery,
  useAdjustStokAdminMutation,
  useCheckYeterlilikAdminQuery,
} = stoklarAdminApi;
