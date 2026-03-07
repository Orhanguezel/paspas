import { baseApi } from '@/integrations/baseApi';
import type { GorevDto, GorevListResponse } from '@/integrations/shared/erp/gorevler.types';
import { normalizeGorev, normalizeGorevList } from '@/integrations/shared/erp/gorevler.types';

const BASE = '/admin/gorevler';

export const gorevlerAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listGorevlerAdmin: b.query<GorevListResponse, {
      q?: string;
      durum?: string;
      oncelik?: string;
      modul?: string;
      atananKullaniciId?: string;
      atananRol?: string;
      sadeceBenim?: boolean;
      gecikenOnly?: boolean;
      limit?: number;
      offset?: number;
    } | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeGorevList(res),
      providesTags: [{ type: 'Gorevler' as const, id: 'LIST' }],
    }),
    getGorevAdmin: b.query<GorevDto, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown) => normalizeGorev(res),
      providesTags: (_result, _error, arg) => [{ type: 'Gorev' as const, id: arg.id }],
    }),
    createGorevAdmin: b.mutation<GorevDto, {
      baslik: string;
      aciklama?: string;
      tip?: string;
      modul?: string;
      ilgiliKayitId?: string;
      atananKullaniciId?: string;
      atananRol?: string;
      durum?: string;
      oncelik?: string;
      terminTarihi?: string;
    }>({
      query: (body) => ({ url: BASE, method: 'POST', body }),
      transformResponse: (res: unknown) => normalizeGorev(res),
      invalidatesTags: [
        { type: 'Gorevler', id: 'LIST' },
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
    updateGorevAdmin: b.mutation<GorevDto, {
      id: string;
      body: {
        baslik?: string;
        aciklama?: string;
        tip?: string;
        modul?: string;
        ilgiliKayitId?: string;
        atananKullaniciId?: string;
        atananRol?: string;
        durum?: string;
        oncelik?: string;
        terminTarihi?: string | null;
      };
    }>({
      query: ({ id, body }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'PATCH', body }),
      transformResponse: (res: unknown) => normalizeGorev(res),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Gorev', id: arg.id },
        { type: 'Gorevler', id: 'LIST' },
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
    deleteGorevAdmin: b.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Gorev', id: arg.id },
        { type: 'Gorevler', id: 'LIST' },
        { type: 'Dashboard', id: 'SUMMARY' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListGorevlerAdminQuery,
  useGetGorevAdminQuery,
  useCreateGorevAdminMutation,
  useUpdateGorevAdminMutation,
  useDeleteGorevAdminMutation,
} = gorevlerAdminApi;
