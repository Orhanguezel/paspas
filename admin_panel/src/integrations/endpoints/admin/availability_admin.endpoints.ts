// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/availability_admin.endpoints.ts
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminGenerateSlotsPayload,
  AdminGenerateSlotsResult,
  AdminListSlotsQuery,
  AdminListWorkingHoursQuery,
  AdminOverrideDayPayload,
  AdminOverrideDayResult,
  AdminOverrideSlotPayload,
  AdminOverrideSlotResult,
  AdminPlanQuery,
  AdminSlotAvailabilityQuery,
  AdminUpsertWorkingHourPayload,
  PlannedSlotDto,
  ResourceSlotDto,
  ResourceWorkingHourDto,
  SlotAvailabilityDto,
} from '@/integrations/shared';

const WH_BASE = '/admin/resource-working-hours';
const SLOTS_BASE = '/admin/resource-slots';

export const availabilityAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /* -------------------- working hours -------------------- */

    /** LIST — GET /admin/resource-working-hours?resource_id=... */
    listWorkingHoursAdmin: build.query<ResourceWorkingHourDto[], AdminListWorkingHoursQuery>({
      query: (params) => ({
        url: `${WH_BASE}`,
        method: 'GET',
        params,
      }),
      providesTags: (result, error, arg) =>
        result
          ? [
              ...result.map((r) => ({ type: 'AvailabilityWH' as const, id: r.id })),
              { type: 'AvailabilityWH' as const, id: `LIST:${arg.resource_id}` },
            ]
          : [{ type: 'AvailabilityWH' as const, id: `LIST:${arg.resource_id}` }],
    }),

    /**
     * UPSERT — POST /admin/resource-working-hours
     * - if payload.id exists => upsert by id (controller uses onDuplicate)
     * - else => insert new
     */
    upsertWorkingHourAdmin: build.mutation<
      ResourceWorkingHourDto | null,
      AdminUpsertWorkingHourPayload
    >({
      query: (body) => ({
        url: `${WH_BASE}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'AvailabilityWH' as const, id: arg.id ?? 'NEW' },
        { type: 'AvailabilityWH' as const, id: `LIST:${arg.resource_id}` },
        { type: 'AvailabilityPlan' as const, id: 'PLAN' }, // plan depends on WH
      ],
    }),

    /** DELETE — DELETE /admin/resource-working-hours/:id */
    deleteWorkingHourAdmin: build.mutation<
      { ok: boolean } | void,
      { id: string; resource_id?: string }
    >({
      query: ({ id }) => ({
        url: `${WH_BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'AvailabilityWH' as const, id: arg.id },
        ...(arg.resource_id
          ? [{ type: 'AvailabilityWH' as const, id: `LIST:${arg.resource_id}` }]
          : []),
        { type: 'AvailabilityPlan' as const, id: 'PLAN' },
      ],
    }),

    /* -------------------- plan / generate -------------------- */

    /** PLAN — GET /admin/resource-slots/plan?resource_id=...&date=... */
    getDailyPlanAdmin: build.query<PlannedSlotDto[], AdminPlanQuery>({
      query: (params) => ({
        url: `${SLOTS_BASE}/plan`,
        method: 'GET',
        params,
      }),
      providesTags: (result, error, arg) => [
        { type: 'AvailabilityPlan' as const, id: `PLAN:${arg.resource_id}:${arg.date}` },
      ],
    }),

    /** GENERATE — POST /admin/resource-slots/generate */
    generateSlotsAdmin: build.mutation<AdminGenerateSlotsResult, AdminGenerateSlotsPayload>({
      query: (body) => ({
        url: `${SLOTS_BASE}/generate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'AvailabilitySlots' as const, id: `SLOTS:${arg.resource_id}:${arg.date}` },
        { type: 'AvailabilityPlan' as const, id: `PLAN:${arg.resource_id}:${arg.date}` },
      ],
    }),

    /* -------------------- slots list / availability -------------------- */

    /** SLOTS — GET /admin/resource-slots?resource_id=...&date=... */
    listSlotsAdmin: build.query<ResourceSlotDto[], AdminListSlotsQuery>({
      query: (params) => ({
        url: `${SLOTS_BASE}`,
        method: 'GET',
        params,
      }),
      providesTags: (result, error, arg) =>
        result
          ? [
              ...result.map((s) => ({ type: 'AvailabilitySlots' as const, id: s.id })),
              { type: 'AvailabilitySlots' as const, id: `SLOTS:${arg.resource_id}:${arg.date}` },
            ]
          : [{ type: 'AvailabilitySlots' as const, id: `SLOTS:${arg.resource_id}:${arg.date}` }],
    }),

    /** AVAILABILITY — GET /admin/resource-slots/availability?resource_id=...&date=...&time=... */
    getSlotAvailabilityAdmin: build.query<SlotAvailabilityDto, AdminSlotAvailabilityQuery>({
      query: (params) => ({
        url: `${SLOTS_BASE}/availability`,
        method: 'GET',
        params,
      }),
      providesTags: (result, error, arg) => [
        {
          type: 'AvailabilityCheck' as const,
          id: `CHK:${arg.resource_id}:${arg.date}:${arg.time}`,
        },
      ],
    }),

    /* -------------------- overrides -------------------- */

    /** OVERRIDE DAY — POST /admin/resource-slots/override-day */
    overrideDayAdmin: build.mutation<AdminOverrideDayResult, AdminOverrideDayPayload>({
      query: (body) => ({
        url: `${SLOTS_BASE}/override-day`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'AvailabilitySlots' as const, id: `SLOTS:${arg.resource_id}:${arg.date}` },
        { type: 'AvailabilityPlan' as const, id: `PLAN:${arg.resource_id}:${arg.date}` },
      ],
    }),

    /** OVERRIDE SLOT — POST /admin/resource-slots/override */
    overrideSlotAdmin: build.mutation<AdminOverrideSlotResult, AdminOverrideSlotPayload>({
      query: (body) => ({
        url: `${SLOTS_BASE}/override`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'AvailabilitySlots' as const, id: `SLOTS:${arg.resource_id}:${arg.date}` },
        { type: 'AvailabilityPlan' as const, id: `PLAN:${arg.resource_id}:${arg.date}` },
        {
          type: 'AvailabilityCheck' as const,
          id: `CHK:${arg.resource_id}:${arg.date}:${arg.time}`,
        },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListWorkingHoursAdminQuery,
  useUpsertWorkingHourAdminMutation,
  useDeleteWorkingHourAdminMutation,

  useGetDailyPlanAdminQuery,
  useGenerateSlotsAdminMutation,

  useListSlotsAdminQuery,
  useGetSlotAvailabilityAdminQuery,

  useOverrideDayAdminMutation,
  useOverrideSlotAdminMutation,
} = availabilityAdminApi;
