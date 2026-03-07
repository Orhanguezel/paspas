// -------------------------------------------------------------
// FILE: frontend/src/integrations/endpoints/resume.admin.endpoints.ts
// FINAL — Admin resume endpoints
// - base: /admin/resume-entries
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type {
  ResumeMerged,
  ResumeListParams,
  UpsertResumeInput,
  PatchResumeInput,
} from '@/integrations/shared';
import { toAdminResumeQuery } from '@/integrations/shared';

const BASE = '/admin/resume-entries';

export const resumeAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listResumeAdmin: b.query<ResumeMerged[], ResumeListParams | void>({
      query: (p) => ({ url: BASE, params: toAdminResumeQuery(p) }),
      providesTags: () => [{ type: 'Resume' as const, id: 'LIST' }],
    }),

    getResumeAdmin: b.query<ResumeMerged, { id: string; locale?: string; default_locale?: string }>(
      {
        query: ({ id, locale, default_locale }) => ({
          url: `${BASE}/${id}`,
          params: { ...(locale ? { locale } : {}), ...(default_locale ? { default_locale } : {}) },
        }),
        providesTags: (_res, _e, arg) => [{ type: 'Resume' as const, id: arg.id }],
      },
    ),

    getResumeBySlugAdmin: b.query<
      ResumeMerged,
      { slug: string; locale?: string; default_locale?: string }
    >({
      query: ({ slug, locale, default_locale }) => ({
        url: `${BASE}/by-slug/${slug}`,
        params: { ...(locale ? { locale } : {}), ...(default_locale ? { default_locale } : {}) },
      }),
      providesTags: (_res, _e, arg) => [{ type: 'Resume' as const, id: `slug:${arg.slug}` }],
    }),

    createResumeAdmin: b.mutation<ResumeMerged, UpsertResumeInput>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      invalidatesTags: () => [{ type: 'Resume' as const, id: 'LIST' }],
    }),

    updateResumeAdmin: b.mutation<ResumeMerged, { id: string; body: PatchResumeInput }>({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _e, arg) => [
        { type: 'Resume' as const, id: 'LIST' },
        { type: 'Resume' as const, id: arg.id },
      ],
    }),

    removeResumeAdmin: b.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => [{ type: 'Resume' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListResumeAdminQuery,
  useGetResumeAdminQuery,
  useGetResumeBySlugAdminQuery,
  useCreateResumeAdminMutation,
  useUpdateResumeAdminMutation,
  useRemoveResumeAdminMutation,
} = resumeAdminApi;
