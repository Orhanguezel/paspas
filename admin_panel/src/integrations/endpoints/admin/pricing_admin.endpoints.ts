// ---------------------------------------------------------------------
// FILE: src/integrations/endpoints/admin/pricing_admin.endpoints.ts
// FINAL — Admin Pricing RTK endpoints (plans CRUD)
// - /admin/pricing/plans
// ---------------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';
import type {
  PricingPlanAdmin,
  PricingPlanListParams,
  UpsertPricingPlanInput,
  PatchPricingPlanInput,
} from '@/integrations/shared';
import { toAdminPricingQuery } from '@/integrations/shared';

const BASE = '/admin/pricing/plans';

export const pricingAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/pricing/plans
    listPricingPlansAdmin: b.query<PricingPlanAdmin[], PricingPlanListParams | void>({
      query: (p) =>
        p ? { url: BASE, params: toAdminPricingQuery(p) as Record<string, any> } : { url: BASE },
      providesTags: () => [{ type: 'Pricing' as const, id: 'LIST' }],
    }),

    // GET /admin/pricing/plans/:id
    getPricingPlanAdmin: b.query<PricingPlanAdmin, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      providesTags: (_res, _e, id) => [{ type: 'Pricing' as const, id }],
    }),

    // POST /admin/pricing/plans
    createPricingPlanAdmin: b.mutation<PricingPlanAdmin, UpsertPricingPlanInput>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Pricing' as const, id: 'LIST' }],
    }),

    // PATCH /admin/pricing/plans/:id
    updatePricingPlanAdmin: b.mutation<
      PricingPlanAdmin,
      { id: string; patch: PatchPricingPlanInput }
    >({
      query: ({ id, patch }) => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (res) =>
        res?.id
          ? [
              { type: 'Pricing' as const, id: res.id },
              { type: 'Pricing' as const, id: 'LIST' },
            ]
          : [{ type: 'Pricing' as const, id: 'LIST' }],
    }),

    // DELETE /admin/pricing/plans/:id
    removePricingPlanAdmin: b.mutation<void, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _e, id) => [
        { type: 'Pricing' as const, id },
        { type: 'Pricing' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPricingPlansAdminQuery,
  useGetPricingPlanAdminQuery,
  useCreatePricingPlanAdminMutation,
  useUpdatePricingPlanAdminMutation,
  useRemovePricingPlanAdminMutation,
} = pricingAdminApi;
