import { baseApi } from '@/integrations/baseApi';

export type PromatsMcpJeton = {
  id: string; ad: string; onek: string; kapsamlar: ('okuma' | 'not')[];
  sonKullanma: string; sonKullanimAt: string | null; sonKullanimIp: string | null;
  kullanimSayisi: number; iptalAt: string | null; createdAt: string;
  kullanici: { id: string; ad: string; email: string };
};
export type PromatsMcpListe = {
  items: PromatsMcpJeton[]; mcpUrl: string; yonetici: boolean;
  oauth: { url: string; clientId: string } | null;
  kapsamSecenekleri: { kod: 'okuma' | 'not'; ad: string; aciklama: string }[];
};
export type PromatsMcpCreate = { jeton: string; item: PromatsMcpJeton; komut: string };
export type PromatsMcpHistory = { items: { id: string; islem: string; createdAt: string; kullanildiAt: string | null; sonKullanma: string; userId: string }[] };
export type PromatsOAuthRequest = { gecerli: boolean; istemci: string; kapsamSecenekleri: PromatsMcpListe['kapsamSecenekleri']; sureler: number[] };

export const promatsMcpApi = baseApi.injectEndpoints({ endpoints: (builder) => ({
  listPromatsMcpJetonlar: builder.query<PromatsMcpListe, { hepsi?: boolean; iptalDahil?: boolean }>({
    query: (params) => ({ url: '/admin/promats-mcp/jetonlar', params: { hepsi: params.hepsi ? '1' : '0', iptalDahil: params.iptalDahil ? '1' : '0' } }),
  }),
  createPromatsMcpJeton: builder.mutation<PromatsMcpCreate, { ad: string; kapsamlar: ('okuma' | 'not')[]; gun: number }>({
    query: (body) => ({ url: '/admin/promats-mcp/jetonlar', method: 'POST', body }),
  }),
  revokePromatsMcpJeton: builder.mutation<{ ok: boolean }, string>({
    query: (id) => ({ url: `/admin/promats-mcp/jetonlar/${encodeURIComponent(id)}`, method: 'DELETE' }),
  }),
  listPromatsMcpHistory: builder.query<PromatsMcpHistory, { hepsi?: boolean }>({
    query: (params) => ({ url: '/admin/promats-mcp/gecmis', params: { hepsi: params.hepsi ? '1' : '0' } }),
  }),
  getPromatsOAuthRequest: builder.query<PromatsOAuthRequest, string>({
    query: (istek) => ({ url: '/admin/promats/oauth/istek', params: { istek } }),
  }),
  decidePromatsOAuth: builder.mutation<{ yonlendir: string }, { istek: string; onay: boolean; kapsamlar: ('okuma' | 'not')[]; gun: number }>({
    query: (body) => ({ url: '/admin/promats/oauth/onay', method: 'POST', body }),
  }),
}), overrideExisting: false });

export const { useListPromatsMcpJetonlarQuery, useCreatePromatsMcpJetonMutation,
  useRevokePromatsMcpJetonMutation, useListPromatsMcpHistoryQuery,
  useGetPromatsOAuthRequestQuery, useDecidePromatsOAuthMutation } = promatsMcpApi;
