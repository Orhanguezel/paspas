import { baseApi } from '@/integrations/baseApi';

type NumberSeries = { year: number; series: Array<{ type: string; lastUsed: number; next: number }> };

export const firmaKurulumuApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    firmaNumaraSerisi: b.query<NumberSeries, void>({ query: () => '/admin/firma-kurulumu/numara-serisi', providesTags: ['FirmaNumaraSerisi'] }),
    firmaNumaraDevri: b.mutation<{ year: number; lastUsed: number; next: number }, { year: number; lastUsed: number }>({ query: (body) => ({ url: '/admin/firma-kurulumu/numara-serisi/devir', method: 'POST', body }), invalidatesTags: ['FirmaNumaraSerisi'] }),
  }),
});

export const { useFirmaNumaraSerisiQuery, useFirmaNumaraDevriMutation } = firmaKurulumuApi;
