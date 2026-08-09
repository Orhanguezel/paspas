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
  lines: Array<{ productId: string; amount: number; unit: "set" | "carton" | "pallet" }>;
};
export type FuarQuoteDetail = FuarQuote & {
  customerId: string;
  revisions: Array<{
    revisionNo: number;
    createdAt: string;
    snapshot: Omit<FuarQuoteCreate, "lines"> & {
      quoteNo: string;
      customer: { id: string; code: string; name: string; discountPercent: number };
      lines: Array<
        FuarQuoteCreate["lines"][number] & {
          product: { id: string; code: string; name: string };
          unitPricePerSet: number;
          lineTotal: number;
        }
      >;
    };
    totals: {
      grossProductTotal: number;
      customerDiscountAmount: number;
      extraDiscountAmount: number;
      freight: number;
      grandTotal: number;
    };
  }>;
};
export const fuarQuotesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFuarQuotes: builder.query<{ items: FuarQuote[] }, undefined>({
      query: () => "/fuar/v1/quotes",
      providesTags: [{ type: "FuarTeklifler", id: "LIST" }],
    }),
    getFuarQuote: builder.query<FuarQuoteDetail, string>({
      query: (id) => `/fuar/v1/quotes/${id}`,
      providesTags: (_result, _error, id) => [{ type: "FuarTeklifler", id }],
    }),
    createFuarQuote: builder.mutation<
      { quoteNo: string; revisionNo: number; totals: { grandTotal: number } },
      FuarQuoteCreate
    >({
      query: (body) => ({ url: "/fuar/v1/quotes", method: "POST", body }),
      invalidatesTags: [{ type: "FuarTeklifler", id: "LIST" }],
    }),
    createFuarQuoteRevision: builder.mutation<
      { quoteNo: string; revisionNo: number; totals: { grandTotal: number } },
      { id: string; body: FuarQuoteCreate }
    >({
      query: ({ id, body }) => ({ url: `/fuar/v1/quotes/${id}/revisions`, method: "POST", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "FuarTeklifler", id: "LIST" },
        { type: "FuarTeklifler", id },
      ],
    }),
  }),
});
export const {
  useListFuarQuotesQuery,
  useGetFuarQuoteQuery,
  useCreateFuarQuoteMutation,
  useCreateFuarQuoteRevisionMutation,
} = fuarQuotesApi;
