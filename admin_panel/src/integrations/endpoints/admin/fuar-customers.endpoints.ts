import { baseApi } from "@/integrations/baseApi";

export type FuarCustomer = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  defaultDiscountPercent: number;
  isForeign: boolean;
  isActive: boolean;
};
export type FuarCustomerInput = {
  code: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  defaultDiscountPercent: number;
  isForeign: boolean;
};
export const fuarCustomersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFuarCustomers: builder.query<{ items: FuarCustomer[]; total: number }, undefined>({
      query: () => "/fuar/v1/customers",
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({ type: "FuarMusteri" as const, id: item.id })),
              { type: "FuarMusteriler" as const, id: "LIST" },
            ]
          : [{ type: "FuarMusteriler" as const, id: "LIST" }],
    }),
    createFuarCustomer: builder.mutation<FuarCustomer, FuarCustomerInput>({
      query: (body) => ({ url: "/fuar/v1/customers", method: "POST", body }),
      invalidatesTags: [{ type: "FuarMusteriler", id: "LIST" }],
    }),
    updateFuarCustomer: builder.mutation<FuarCustomer, { id: string; body: FuarCustomerInput }>({
      query: ({ id, body }) => ({ url: `/fuar/v1/customers/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "FuarMusteri", id },
        { type: "FuarMusteriler", id: "LIST" },
      ],
    }),
    archiveFuarCustomer: builder.mutation<void, string>({
      query: (id) => ({ url: `/fuar/v1/customers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "FuarMusteriler", id: "LIST" }],
    }),
  }),
});
export const {
  useListFuarCustomersQuery,
  useCreateFuarCustomerMutation,
  useUpdateFuarCustomerMutation,
  useArchiveFuarCustomerMutation,
} = fuarCustomersApi;
