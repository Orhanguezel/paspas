import { baseApi } from "@/integrations/baseApi";
import type {
  MakineKapaliAralikCreatePayload,
  MakineKapaliAralikDto,
  MakineKapaliAralikListResponse,
  MakineKapaliAralikPatchPayload,
} from "@/integrations/shared/erp/makine_kapali_araliklar.types";
import {
  normalizeMakineKapaliAralik,
  normalizeMakineKapaliAralikList,
} from "@/integrations/shared/erp/makine_kapali_araliklar.types";

const BASE = "/admin/makine-kapali-araliklar";

export const makineKapaliAraliklarAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMakineKapaliAraliklarAdmin: b.query<MakineKapaliAralikListResponse, { makineId?: string } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeMakineKapaliAralikList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({ type: "MakineKapaliAralik" as const, id: item.id })),
              { type: "MakineKapaliAraliklar" as const, id: "LIST" },
            ]
          : [{ type: "MakineKapaliAraliklar" as const, id: "LIST" }],
    }),

    createMakineKapaliAralikAdmin: b.mutation<MakineKapaliAralikDto, MakineKapaliAralikCreatePayload>({
      query: (body) => ({ url: BASE, method: "POST", body }),
      transformResponse: (res: unknown) => normalizeMakineKapaliAralik(res),
      invalidatesTags: [
        { type: "MakineKapaliAraliklar", id: "LIST" },
        { type: "MakineKuyrugu", id: "LIST" },
      ],
    }),

    updateMakineKapaliAralikAdmin: b.mutation<
      MakineKapaliAralikDto,
      { id: string; body: MakineKapaliAralikPatchPayload }
    >({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown) => normalizeMakineKapaliAralik(res),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "MakineKapaliAralik", id },
        { type: "MakineKapaliAraliklar", id: "LIST" },
        { type: "MakineKuyrugu", id: "LIST" },
      ],
    }),

    deleteMakineKapaliAralikAdmin: b.mutation<void, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "MakineKapaliAralik", id },
        { type: "MakineKapaliAraliklar", id: "LIST" },
        { type: "MakineKuyrugu", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListMakineKapaliAraliklarAdminQuery,
  useCreateMakineKapaliAralikAdminMutation,
  useUpdateMakineKapaliAralikAdminMutation,
  useDeleteMakineKapaliAralikAdminMutation,
} = makineKapaliAraliklarAdminApi;
