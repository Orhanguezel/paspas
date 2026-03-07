// ---------------------------------------------------------------------
// FILE: src/integrations/endpoints/admin/projects_admin.endpoints.ts
// (ADMIN)
// ---------------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';
import type {
  Project,
  ProjectImage,
  ProjectListParams,
  UpsertProjectInput,
  PatchProjectInput,
  UpsertProjectImageInput,
  PatchProjectImageInput,
} from '@/integrations/shared';
import { toAdminProjectQuery } from '@/integrations/shared';

const BASE = '/admin/projects';

export const projectsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/projects
    listProjectsAdmin: b.query<Project[], ProjectListParams | void>({
      query: (p) =>
        p
          ? { url: `${BASE}`, params: toAdminProjectQuery(p) as Record<string, any> }
          : { url: BASE },
      providesTags: () => [{ type: 'Projects' as const, id: 'LIST' }],
    }),

    // GET /admin/projects/:id
    getProjectAdmin: b.query<Project, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      providesTags: (_res, _e, id) => [{ type: 'Projects' as const, id }],
    }),

    // GET /admin/projects/by-slug/:slug
    getProjectBySlugAdmin: b.query<Project, string>({
      query: (slug) => ({ url: `${BASE}/by-slug/${slug}` }),
      providesTags: (_res, _e, slug) => [{ type: 'Projects' as const, id: `slug:${slug}` }],
    }),

    // POST /admin/projects
    createProjectAdmin: b.mutation<Project, UpsertProjectInput>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Projects' as const, id: 'LIST' }],
    }),

    // PATCH /admin/projects/:id
    updateProjectAdmin: b.mutation<Project, { id: string; patch: PatchProjectInput }>({
      query: ({ id, patch }) => ({
        url: `${BASE}/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (res) =>
        res?.id
          ? [
              { type: 'Projects' as const, id: res.id },
              { type: 'Projects' as const, id: 'LIST' },
            ]
          : [{ type: 'Projects' as const, id: 'LIST' }],
    }),

    // DELETE /admin/projects/:id
    removeProjectAdmin: b.mutation<void, string>({
      query: (id) => ({
        url: `${BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _e, id) => [
        { type: 'Projects' as const, id },
        { type: 'Projects' as const, id: 'LIST' },
      ],
    }),

    // -------------------------
    // GALLERY (ADMIN)
    // -------------------------

    // GET /admin/projects/:id/images
    listProjectImagesAdmin: b.query<ProjectImage[], string>({
      query: (projectId) => ({ url: `${BASE}/${projectId}/images` }),
      providesTags: (_res, _e, projectId) => [
        { type: 'ProjectImages' as const, id: `p:${projectId}` },
      ],
    }),

    // POST /admin/projects/:id/images
    createProjectImageAdmin: b.mutation<
      ProjectImage[],
      { projectId: string; body: UpsertProjectImageInput }
    >({
      query: ({ projectId, body }) => ({
        url: `${BASE}/${projectId}/images`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _e, { projectId }) => [
        { type: 'ProjectImages' as const, id: `p:${projectId}` },
      ],
    }),

    // PATCH /admin/projects/:id/images/:imageId
    updateProjectImageAdmin: b.mutation<
      ProjectImage[],
      { projectId: string; imageId: string; patch: PatchProjectImageInput }
    >({
      query: ({ projectId, imageId, patch }) => ({
        url: `${BASE}/${projectId}/images/${imageId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_res, _e, { projectId }) => [
        { type: 'ProjectImages' as const, id: `p:${projectId}` },
      ],
    }),

    // DELETE /admin/projects/:id/images/:imageId
    removeProjectImageAdmin: b.mutation<void, { projectId: string; imageId: string }>({
      query: ({ projectId, imageId }) => ({
        url: `${BASE}/${projectId}/images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _e, { projectId }) => [
        { type: 'ProjectImages' as const, id: `p:${projectId}` },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProjectsAdminQuery,
  useGetProjectAdminQuery,
  useGetProjectBySlugAdminQuery,
  useCreateProjectAdminMutation,
  useUpdateProjectAdminMutation,
  useRemoveProjectAdminMutation,

  useListProjectImagesAdminQuery,
  useCreateProjectImageAdminMutation,
  useUpdateProjectImageAdminMutation,
  useRemoveProjectImageAdminMutation,
} = projectsAdminApi;
