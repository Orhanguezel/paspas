// =============================================================
// FILE: src/integrations/endpoints/admin/subscriptions_admin.endpoints.ts
// Abonelik planları — Admin RTK Query endpoint'leri
// Base URL: /api/admin/subscription (baseApi üzerinden)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import { cleanParams } from '@/integrations/shared';
import type {
  SubscriptionPlanDto,
  SubscriptionPlanFeatureDto,
  UserSubscriptionDto,
  PlanCreatePayload,
  PlanUpdatePayload,
  FeaturesBulkPayload,
  AssignPlanPayload,
} from '@/integrations/shared';

const BASE = '/admin/subscription';

export const subscriptionsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* --------------------------------- */
    /* Plans LIST                        */
    /* --------------------------------- */
    listPlansAdmin: build.query<SubscriptionPlanDto[], void>({
      query: () => ({ url: `${BASE}/plans`, method: 'GET' }),
      providesTags: ['Subscriptions'],
    }),

    /* --------------------------------- */
    /* Plan GET by id (includes features)*/
    /* --------------------------------- */
    getPlanAdmin: build.query<SubscriptionPlanDto, number>({
      query: (id) => ({ url: `${BASE}/plans/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Subscription', id }],
    }),

    /* --------------------------------- */
    /* Plan CREATE                       */
    /* --------------------------------- */
    createPlanAdmin: build.mutation<SubscriptionPlanDto, PlanCreatePayload>({
      query: (body) => ({ url: `${BASE}/plans`, method: 'POST', body }),
      invalidatesTags: ['Subscriptions'],
    }),

    /* --------------------------------- */
    /* Plan UPDATE (PATCH)               */
    /* --------------------------------- */
    updatePlanAdmin: build.mutation<SubscriptionPlanDto, { id: number; patch: PlanUpdatePayload }>({
      query: ({ id, patch }) => ({ url: `${BASE}/plans/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id }) => ['Subscriptions', { type: 'Subscription', id }],
    }),

    /* --------------------------------- */
    /* Plan DELETE                       */
    /* --------------------------------- */
    deletePlanAdmin: build.mutation<void, number>({
      query: (id) => ({ url: `${BASE}/plans/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Subscriptions'],
    }),

    /* --------------------------------- */
    /* Plan FEATURES GET                 */
    /* --------------------------------- */
    getPlanFeaturesAdmin: build.query<SubscriptionPlanFeatureDto[], number>({
      query: (planId) => ({ url: `${BASE}/plans/${planId}/features`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Subscription', id: `features-${id}` }],
    }),

    /* --------------------------------- */
    /* Plan FEATURES bulk UPDATE (PUT)   */
    /* --------------------------------- */
    upsertPlanFeaturesAdmin: build.mutation<
      SubscriptionPlanFeatureDto[],
      { planId: number; body: FeaturesBulkPayload }
    >({
      query: ({ planId, body }) => ({
        url: `${BASE}/plans/${planId}/features`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { planId }) => [
        { type: 'Subscription', id: planId },
        { type: 'Subscription', id: `features-${planId}` },
      ],
    }),

    /* --------------------------------- */
    /* User Subscriptions LIST           */
    /* --------------------------------- */
    listUserSubscriptionsAdmin: build.query<
      UserSubscriptionDto[],
      { limit?: number; offset?: number } | void
    >({
      query: (params) => ({
        url: `${BASE}/users`,
        method: 'GET',
        params: cleanParams((params ?? {}) as Record<string, unknown>),
      }),
      providesTags: ['Subscriptions'],
    }),

    /* --------------------------------- */
    /* Assign plan to user (PUT)         */
    /* --------------------------------- */
    assignPlanAdmin: build.mutation<UserSubscriptionDto, { userId: string; body: AssignPlanPayload }>({
      query: ({ userId, body }) => ({
        url: `${BASE}/users/${encodeURIComponent(userId)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Subscriptions'],
    }),
  }),

  overrideExisting: false,
});

export const {
  useListPlansAdminQuery,
  useGetPlanAdminQuery,
  useLazyGetPlanAdminQuery,
  useCreatePlanAdminMutation,
  useUpdatePlanAdminMutation,
  useDeletePlanAdminMutation,
  useGetPlanFeaturesAdminQuery,
  useUpsertPlanFeaturesAdminMutation,
  useListUserSubscriptionsAdminQuery,
  useAssignPlanAdminMutation,
} = subscriptionsAdminApi;
