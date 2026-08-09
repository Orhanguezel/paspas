import { baseApi } from "@/integrations/baseApi";

export type FuarProduct = {
  id: string;
  code: string;
  name: string;
  priceUsd: number | null;
  setsPerCarton: number;
  cartonsPerPallet: number;
  moqAmount: number;
  moqUnit: "set" | "carton" | "pallet";
  isActive: boolean;
};
export type FuarProductCreate = {
  code: string;
  name: string;
  priceUsd?: number;
  setsPerCarton: number;
  cartonsPerPallet: number;
  moqAmount: number;
  moqUnit: "set" | "carton" | "pallet";
};

export const fuarProductsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFuarProducts: builder.query<{ items: FuarProduct[]; total: number }, { q?: string } | undefined>({
      query: (params) => ({ url: "/fuar/v1/products", params: params || undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({ type: "FuarUrun" as const, id: item.id })),
              { type: "FuarUrunler" as const, id: "LIST" },
            ]
          : [{ type: "FuarUrunler" as const, id: "LIST" }],
    }),
    createFuarProduct: builder.mutation<FuarProduct, FuarProductCreate>({
      query: (body) => ({ url: "/fuar/v1/products", method: "POST", body }),
      invalidatesTags: [{ type: "FuarUrunler", id: "LIST" }],
    }),
    archiveFuarProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/fuar/v1/products/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "FuarUrun", id },
        { type: "FuarUrunler", id: "LIST" },
      ],
    }),
  }),
});

export const { useListFuarProductsQuery, useCreateFuarProductMutation, useArchiveFuarProductMutation } =
  fuarProductsApi;
