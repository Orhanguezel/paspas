// =============================================================
// FILE: src/integrations/endpoints/admin/resources_admin.endpoints.ts
// FINAL — Admin Resources RTK endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ResourceAdminListItemDto,
  ResourcesAdminListQueryParams,
  ResourceRowDto,
  ResourceCreatePayload,
  ResourceUpdatePayload,
} from '@/integrations/shared';

const BASE = '/admin/resources';

function asArray<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];
  const items = (input as any)?.items;
  if (Array.isArray(items)) return items as T[];
  return [];
}

function normalizeList(rows: ResourceAdminListItemDto[]): ResourceAdminListItemDto[] {
  return rows.map((r) => {
    const title = String((r as any).title ?? '').trim();
    const id = String((r as any).id ?? '').trim();
    return {
      ...r,
      label: String((r as any).label ?? title ?? id),
    } as ResourceAdminListItemDto;
  });
}

export const resourcesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** LIST — GET /admin/resources */
    listResourcesAdmin: b.query<ResourceAdminListItemDto[], ResourcesAdminListQueryParams | void>({
      query: (params) => ({
        url: BASE,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (res: unknown) => normalizeList(asArray<ResourceAdminListItemDto>(res)),
      providesTags: (result) =>
        result && result.length
          ? [
              ...result.map((r) => ({ type: 'Resource' as const, id: r.id })),
              { type: 'Resources' as const, id: 'LIST' },
            ]
          : [{ type: 'Resources' as const, id: 'LIST' }],
    }),

    /** GET /admin/resources/:id */
    getResourceAdmin: b.query<ResourceRowDto, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [{ type: 'Resource' as const, id }],
    }),

    /** POST /admin/resources */
    createResourceAdmin: b.mutation<ResourceRowDto, ResourceCreatePayload>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Resources' as const, id: 'LIST' }],
    }),

    /** PATCH /admin/resources/:id */
    updateResourceAdmin: b.mutation<
      ResourceRowDto,
      { id: string; patch: ResourceUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Resource' as const, id: arg.id },
        { type: 'Resources' as const, id: 'LIST' },
      ],
    }),

    /** DELETE /admin/resources/:id */
    deleteResourceAdmin: b.mutation<{ ok: boolean } | void, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Resource' as const, id },
        { type: 'Resources' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListResourcesAdminQuery,
  useGetResourceAdminQuery,
  useCreateResourceAdminMutation,
  useUpdateResourceAdminMutation,
  useDeleteResourceAdminMutation,
} = resourcesAdminApi;
