// =============================================================
// FILE: src/integrations/rtk/endpoints/admin/custom_pages_admin.endpoints.ts
// Ensotek – Admin Custom Pages RTK Endpoints (FINAL)
// Base URL: /api (baseApi üzerinden)
// Backend: src/modules/customPages/admin.routes.ts
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  ApiCustomPage,
  CustomPageDto,
  CustomPageListAdminQueryParams,
  CustomPageCreatePayload,
  CustomPageUpdatePayload,
} from '@/integrations/shared';
import { mapApiCustomPageToDto } from '@/integrations/shared';

const cleanParams = (
  params?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
      continue;
    }
    if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') out[k] = v;
    else out[k] = String(v);
  }
  return Object.keys(out).length ? out : undefined;
};

const getTotalFromHeaders = (headers: Headers | undefined, fallbackLength: number): number => {
  const headerValue = headers?.get('x-total-count') ?? headers?.get('X-Total-Count');
  if (!headerValue) return fallbackLength;
  const n = Number(headerValue);
  return Number.isFinite(n) && n >= 0 ? n : fallbackLength;
};

const normalizeList = (raw: unknown): ApiCustomPage[] => {
  if (Array.isArray(raw)) return raw as ApiCustomPage[];
  const anyRaw: any = raw as any;
  if (anyRaw && Array.isArray(anyRaw.items)) return anyRaw.items as ApiCustomPage[];
  return [];
};

const BASE = '/admin/custom_pages';

export const customPagesAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCustomPagesAdmin: build.query<
      { items: CustomPageDto[]; total: number },
      CustomPageListAdminQueryParams | void
    >({
      query: (params) => ({
        url: `${BASE}`,
        method: 'GET',
        params: cleanParams(params as any),
      }),
      transformResponse: (response: unknown, meta) => {
        const rows = normalizeList(response);
        const total = getTotalFromHeaders(meta?.response?.headers, rows.length);
        return { items: rows.map(mapApiCustomPageToDto), total };
      },
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((p) => ({ type: 'CustomPage' as const, id: p.id })),
              { type: 'CustomPage' as const, id: 'ADMIN_LIST' },
            ]
          : [{ type: 'CustomPage' as const, id: 'ADMIN_LIST' }],
    }),

    getCustomPageAdmin: build.query<
      CustomPageDto,
      { id: string; locale?: string; default_locale?: string }
    >({
      query: ({ id, locale, default_locale }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'GET',
        params: cleanParams({ locale, default_locale }),
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      providesTags: (_result, _error, { id }) => [{ type: 'CustomPage' as const, id }],
    }),

    getCustomPageBySlugAdmin: build.query<
      CustomPageDto,
      { slug: string; locale?: string; default_locale?: string }
    >({
      query: ({ slug, locale, default_locale }) => ({
        url: `${BASE}/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        params: cleanParams({ locale, default_locale }),
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      providesTags: (_result, _error, { slug }) => [{ type: 'CustomPageSlug' as const, id: slug }],
    }),

    createCustomPageAdmin: build.mutation<CustomPageDto, CustomPageCreatePayload>({
      query: (body) => ({
        url: `${BASE}`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      invalidatesTags: [{ type: 'CustomPage' as const, id: 'ADMIN_LIST' }],
    }),

    updateCustomPageAdmin: build.mutation<
      CustomPageDto,
      { id: string; patch: CustomPageUpdatePayload }
    >({
      query: ({ id, patch }) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'CustomPage' as const, id },
        { type: 'CustomPage' as const, id: 'ADMIN_LIST' },
      ],
    }),

    deleteCustomPageAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'CustomPage' as const, id },
        { type: 'CustomPage' as const, id: 'ADMIN_LIST' },
      ],
    }),

    reorderCustomPagesAdmin: build.mutation<
      { ok: boolean },
      { items: { id: string; display_order: number }[] }
    >({
      query: (payload) => ({
        url: `${BASE}/reorder`,
        method: 'POST',
        body: payload,
      }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: [{ type: 'CustomPage' as const, id: 'ADMIN_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomPagesAdminQuery,
  useLazyListCustomPagesAdminQuery,
  useGetCustomPageAdminQuery,
  useLazyGetCustomPageAdminQuery,
  useGetCustomPageBySlugAdminQuery,
  useLazyGetCustomPageBySlugAdminQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
  useReorderCustomPagesAdminMutation,
} = customPagesAdminApi;
