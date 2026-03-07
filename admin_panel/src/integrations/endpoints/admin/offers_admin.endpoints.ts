// ===================================================================
// FILE: src/integrations/endpoints/offers.admin.endpoints.ts
// FINAL — Offers (ADMIN) RTK (auth+admin)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  OfferListQuery,
  OfferView,
  OfferAdminUpsertBody,
  OfferAdminPatchBody,
  ApiOk,
} from '@/integrations/shared';
import {
  normalizeOffer,
  normalizeOfferList,
  toOfferListQueryParams,
  toOfferAdminUpsertBody,
  toOfferAdminPatchBody,
} from '@/integrations/shared';

const BASE = '/admin/offers';

export const offersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /offers */
    listOffersAdmin: b.query<OfferView[], OfferListQuery | void>({
      query: (q) => ({
        url: BASE,
        method: 'GET',
        params: q ? toOfferListQueryParams(q) : undefined,
      }),
      transformResponse: (res: unknown): OfferView[] => normalizeOfferList(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((x) => ({ type: 'Offer' as const, id: x.id })),
              { type: 'Offers' as const, id: 'LIST' },
            ]
          : [{ type: 'Offers' as const, id: 'LIST' }],
      keepUnusedDataFor: 20,
    }),

    /** GET /offers/:id */
    getOfferAdmin: b.query<OfferView, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): OfferView => normalizeOffer(res),
      providesTags: (_r, _e, arg) => [{ type: 'Offer' as const, id: arg.id }],
      keepUnusedDataFor: 30,
    }),

    /** POST /offers */
    createOfferAdmin: b.mutation<OfferView, OfferAdminUpsertBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body: toOfferAdminUpsertBody(body),
      }),
      transformResponse: (res: unknown): OfferView => normalizeOffer(res),
      invalidatesTags: [{ type: 'Offers' as const, id: 'LIST' }],
    }),

    /** PATCH /offers/:id */
    updateOfferAdmin: b.mutation<OfferView, { id: string; body: OfferAdminPatchBody }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: toOfferAdminPatchBody(body),
      }),
      transformResponse: (res: unknown): OfferView => normalizeOffer(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Offer' as const, id: arg.id },
        { type: 'Offers' as const, id: 'LIST' },
      ],
    }),

    /** DELETE /offers/:id */
    deleteOfferAdmin: b.mutation<ApiOk, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (_res: unknown): ApiOk => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Offer' as const, id: arg.id },
        { type: 'Offers' as const, id: 'LIST' },
      ],
    }),

    /** POST /offers/:id/pdf?force=1 */
    generateOfferPdfAdmin: b.mutation<OfferView, { id: string; force?: boolean }>({
      query: ({ id, force }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/pdf`,
        method: 'POST',
        params: force ? { force: '1' } : undefined,
        body: {}, // backend reads force from body too; sending {} safe
      }),
      transformResponse: (res: unknown): OfferView => normalizeOffer(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Offer' as const, id: arg.id },
        { type: 'Offers' as const, id: 'LIST' },
      ],
    }),

    /** POST /offers/:id/email?force=1 */
    sendOfferEmailAdmin: b.mutation<OfferView, { id: string; force?: boolean }>({
      query: ({ id, force }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/email`,
        method: 'POST',
        params: force ? { force: '1' } : undefined,
        body: {}, // backend reads force from body too; sending {} safe
      }),
      transformResponse: (res: unknown): OfferView => normalizeOffer(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Offer' as const, id: arg.id },
        { type: 'Offers' as const, id: 'LIST' },
      ],
    }),

    /** POST /offers/:id/send?force=1  (PDF + Email) */
    sendOfferAdmin: b.mutation<OfferView, { id: string; force?: boolean }>({
      query: ({ id, force }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/send`,
        method: 'POST',
        params: force ? { force: '1' } : undefined,
        body: {}, // backend reads force from body too; sending {} safe
      }),
      transformResponse: (res: unknown): OfferView => normalizeOffer(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Offer' as const, id: arg.id },
        { type: 'Offers' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOffersAdminQuery,
  useLazyListOffersAdminQuery,
  useGetOfferAdminQuery,
  useLazyGetOfferAdminQuery,
  useCreateOfferAdminMutation,
  useUpdateOfferAdminMutation,
  useDeleteOfferAdminMutation,
  useGenerateOfferPdfAdminMutation,
  useSendOfferEmailAdminMutation,
  useSendOfferAdminMutation,
} = offersAdminApi;
