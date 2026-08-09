import { baseApi } from "@/integrations/baseApi";

export type FuarQuote = {
  id: string;
  quoteNo: string;
  customerName: string;
  status: string;
  currency: "USD" | "EUR" | "TRY";
  deliveryMethod: "EXW" | "FOB" | "CIF";
  currentRevision: number;
  createdAt: string;
};
export type FuarQuoteCreate = {
  customerId: string;
  currency: "USD" | "EUR" | "TRY";
  deliveryMethod: "EXW" | "FOB" | "CIF";
  freight: number;
  extraDiscountPercent: number;
  lines: Array<{ productId: string; amount: number; unit: "pallet" }>;
};
export const fuarQuotesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFuarQuotes: builder.query<{ items: FuarQuote[] }, undefined>({
      query: () => "/fuar/v1/quotes",
      providesTags: [{ type: "FuarTeklifler", id: "LIST" }],
    }),
    createFuarQuote: builder.mutation<
      { quoteNo: string; revisionNo: number; totals: { grandTotal: number } },
      FuarQuoteCreate
    >({
      query: (body) => ({ url: "/fuar/v1/quotes", method: "POST", body }),
      invalidatesTags: [{ type: "FuarTeklifler", id: "LIST" }],
    }),
  }),
});
export const { useListFuarQuotesQuery, useCreateFuarQuoteMutation } = fuarQuotesApi;
