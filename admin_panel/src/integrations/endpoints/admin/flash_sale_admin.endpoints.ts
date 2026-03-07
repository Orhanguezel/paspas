import { baseApi } from '@/integrations/baseApi';
import type {
  FlashSaleCreatePayload,
  FlashSaleListQuery,
  FlashSaleUpdatePayload,
  FlashSaleView,
  WithLocale,
} from '@/integrations/shared';
import {
  normalizeFlashSale,
  normalizeFlashSaleList,
  toFlashSaleListQueryParams,
} from '@/integrations/shared';

const BASE = '/admin/flash-sale';

export const flashSaleAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listFlashSalesAdmin: b.query<FlashSaleView[], WithLocale<FlashSaleListQuery> | void>({
      query: (q) => ({
        url: BASE,
        method: 'GET',
        params: q ? toFlashSaleListQueryParams(q) : undefined,
      }),
      transformResponse: (res: unknown): FlashSaleView[] => normalizeFlashSaleList(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((x) => ({ type: 'Promotion' as const, id: x.id })),
              { type: 'Promotion' as const, id: 'LIST' },
            ]
          : [{ type: 'Promotion' as const, id: 'LIST' }],
    }),

    getFlashSaleAdmin: b.query<FlashSaleView, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): FlashSaleView => normalizeFlashSale(res),
      providesTags: (_r, _e, arg) => [{ type: 'Promotion' as const, id: arg.id }],
    }),

    createFlashSaleAdmin: b.mutation<FlashSaleView, FlashSaleCreatePayload>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): FlashSaleView => normalizeFlashSale(res),
      invalidatesTags: [{ type: 'Promotion' as const, id: 'LIST' }],
    }),

    updateFlashSaleAdmin: b.mutation<FlashSaleView, { id: string; patch: FlashSaleUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): FlashSaleView => normalizeFlashSale(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Promotion' as const, id: arg.id },
        { type: 'Promotion' as const, id: 'LIST' },
      ],
    }),

    deleteFlashSaleAdmin: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Promotion' as const, id: arg.id },
        { type: 'Promotion' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListFlashSalesAdminQuery,
  useGetFlashSaleAdminQuery,
  useCreateFlashSaleAdminMutation,
  useUpdateFlashSaleAdminMutation,
  useDeleteFlashSaleAdminMutation,
} = flashSaleAdminApi;
