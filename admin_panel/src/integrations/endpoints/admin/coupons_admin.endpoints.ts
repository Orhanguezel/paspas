import { baseApi } from '@/integrations/baseApi';
import type {
  CouponCreatePayload,
  CouponListQuery,
  CouponUpdatePayload,
  CouponView,
} from '@/integrations/shared';
import { normalizeCoupon, normalizeCouponList } from '@/integrations/shared';

const BASE = '/admin/coupons';

export const couponsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCouponsAdmin: b.query<CouponView[], CouponListQuery | void>({
      query: (q) => ({
        url: BASE,
        method: 'GET',
        params: q ?? undefined,
      }),
      transformResponse: (res: unknown): CouponView[] => normalizeCouponList(res),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((x) => ({ type: 'Coupon' as const, id: x.id })),
              { type: 'Coupon' as const, id: 'LIST' },
            ]
          : [{ type: 'Coupon' as const, id: 'LIST' }],
    }),

    getCouponAdmin: b.query<CouponView, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): CouponView => normalizeCoupon(res),
      providesTags: (_r, _e, arg) => [{ type: 'Coupon' as const, id: arg.id }],
    }),

    createCouponAdmin: b.mutation<CouponView, CouponCreatePayload>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown): CouponView => normalizeCoupon(res),
      invalidatesTags: [{ type: 'Coupon' as const, id: 'LIST' }],
    }),

    updateCouponAdmin: b.mutation<CouponView, { id: string; patch: CouponUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): CouponView => normalizeCoupon(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Coupon' as const, id: arg.id },
        { type: 'Coupon' as const, id: 'LIST' },
      ],
    }),

    deleteCouponAdmin: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Coupon' as const, id: arg.id },
        { type: 'Coupon' as const, id: 'LIST' },
      ],
    }),

    toggleCouponAdmin: b.mutation<CouponView, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${encodeURIComponent(id)}/toggle`,
        method: 'PATCH',
      }),
      transformResponse: (res: unknown): CouponView => normalizeCoupon(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Coupon' as const, id: arg.id },
        { type: 'Coupon' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCouponsAdminQuery,
  useGetCouponAdminQuery,
  useCreateCouponAdminMutation,
  useUpdateCouponAdminMutation,
  useDeleteCouponAdminMutation,
  useToggleCouponAdminMutation,
} = couponsAdminApi;
