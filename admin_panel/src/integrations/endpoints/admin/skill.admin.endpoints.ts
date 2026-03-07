// ===================================================================
// FILE: frontend/src/integrations/endpoints/skill.admin.endpoints.ts
// FINAL — Skill admin endpoints
// - base: /admin/skill-counters + /admin/skill-logos
// - unwrap tolerant
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  SkillCounterMerged,
  SkillLogoMerged,
  SkillListParams,
  CreateSkillCounterInput,
  PatchSkillCounterInput,
  CreateSkillLogoInput,
  PatchSkillLogoInput,
} from '@/integrations/shared/skill';
import { unwrap, toAdminSkillQuery } from '@/integrations/shared/skill';

const COUNTERS = '/admin/skill-counters';
const LOGOS = '/admin/skill-logos';

export const skillAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ---------------- Counters ----------------
    listSkillCountersAdmin: b.query<SkillCounterMerged[], SkillListParams | void>({
      query: (p) => ({ url: COUNTERS, params: toAdminSkillQuery(p) }),
      transformResponse: (raw: any) => unwrap<SkillCounterMerged[]>(raw),
      providesTags: (res) =>
        res
          ? [
              { type: 'Skill' as const, id: 'COUNTERS' },
              ...res.map((x) => ({ type: 'Skill' as const, id: `counter:${x.id}` })),
            ]
          : [{ type: 'Skill' as const, id: 'COUNTERS' }],
    }),

    createSkillCounterAdmin: b.mutation<SkillCounterMerged, CreateSkillCounterInput>({
      query: (body) => ({ url: COUNTERS, method: 'POST', body }),
      transformResponse: (raw: any) => unwrap<SkillCounterMerged>(raw),
      invalidatesTags: (_res) => [{ type: 'Skill' as const, id: 'COUNTERS' }],
    }),

    updateSkillCounterAdmin: b.mutation<
      SkillCounterMerged,
      { id: string; patch: PatchSkillCounterInput }
    >({
      query: ({ id, patch }) => ({ url: `${COUNTERS}/${id}`, method: 'PATCH', body: patch }),
      transformResponse: (raw: any) => unwrap<SkillCounterMerged>(raw),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Skill' as const, id: 'COUNTERS' },
        { type: 'Skill' as const, id: `counter:${arg.id}` },
      ],
    }),

    removeSkillCounterAdmin: b.mutation<{ ok: true } | void, { id: string }>({
      query: ({ id }) => ({ url: `${COUNTERS}/${id}`, method: 'DELETE' }),
      // backend returns 204 typically
      transformResponse: (raw: any) => unwrap<any>(raw),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Skill' as const, id: 'COUNTERS' },
        { type: 'Skill' as const, id: `counter:${arg.id}` },
      ],
    }),

    // ---------------- Logos ----------------
    listSkillLogosAdmin: b.query<SkillLogoMerged[], SkillListParams | void>({
      query: (p) => ({ url: LOGOS, params: toAdminSkillQuery(p) }),
      transformResponse: (raw: any) => unwrap<SkillLogoMerged[]>(raw),
      providesTags: (res) =>
        res
          ? [
              { type: 'Skill' as const, id: 'LOGOS' },
              ...res.map((x) => ({ type: 'Skill' as const, id: `logo:${x.id}` })),
            ]
          : [{ type: 'Skill' as const, id: 'LOGOS' }],
    }),

    createSkillLogoAdmin: b.mutation<SkillLogoMerged, CreateSkillLogoInput>({
      query: (body) => ({ url: LOGOS, method: 'POST', body }),
      transformResponse: (raw: any) => unwrap<SkillLogoMerged>(raw),
      invalidatesTags: () => [{ type: 'Skill' as const, id: 'LOGOS' }],
    }),

    updateSkillLogoAdmin: b.mutation<SkillLogoMerged, { id: string; patch: PatchSkillLogoInput }>({
      query: ({ id, patch }) => ({ url: `${LOGOS}/${id}`, method: 'PATCH', body: patch }),
      transformResponse: (raw: any) => unwrap<SkillLogoMerged>(raw),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Skill' as const, id: 'LOGOS' },
        { type: 'Skill' as const, id: `logo:${arg.id}` },
      ],
    }),

    removeSkillLogoAdmin: b.mutation<{ ok: true } | void, { id: string }>({
      query: ({ id }) => ({ url: `${LOGOS}/${id}`, method: 'DELETE' }),
      transformResponse: (raw: any) => unwrap<any>(raw),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Skill' as const, id: 'LOGOS' },
        { type: 'Skill' as const, id: `logo:${arg.id}` },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSkillCountersAdminQuery,
  useCreateSkillCounterAdminMutation,
  useUpdateSkillCounterAdminMutation,
  useRemoveSkillCounterAdminMutation,

  useListSkillLogosAdminQuery,
  useCreateSkillLogoAdminMutation,
  useUpdateSkillLogoAdminMutation,
  useRemoveSkillLogoAdminMutation,
} = skillAdminApi;
