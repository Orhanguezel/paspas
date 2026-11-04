import { baseApi } from '@/integrations/baseApi';

export type CrmStage = { id: string; name: string; sort: number; probability: number; is_won: number; is_lost: number; renk: string | null };
export type CrmPipeline = { id: string; name: string; stages: CrmStage[] };
export type CrmDeal = {
  id: string; pipeline_id: string; stage_id: string; title: string; status: string;
  amount: number; currency: string; probability: number | null; expected_close_date: string | null;
  owner_user_id: string | null; musteri_id: string | null; musteri_adi: string | null;
  stage_name: string; stage_color: string | null; source: string | null;
  lost_reason: string | null; created_at: string; updated_at: string;
  next_action: string | null; next_action_date: string | null;
};
export type CrmActivity = { id: string; type: string; subject: string; body: string | null; created_at: string; owner_name?: string };
export type CrmLossReason = { id: string; name: string };

const root = '/admin/crm';
export const crmFirsatlarApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    crmPipelines: b.query<CrmPipeline[], void>({ query: () => `${root}/pipelines` }),
    crmDeals: b.query<{ items: CrmDeal[]; total: number }, { q?: string; limit?: number; offset?: number }>({
      query: (params) => ({ url: `${root}/firsatlar`, params: { limit: 500, ...params } }),
      providesTags: [{ type: 'Firsatlar' as const, id: 'LIST' }],
    }),
    crmDeal: b.query<CrmDeal, string>({ query: (id) => `${root}/firsatlar/${id}`, providesTags: (_r, _e, id) => [{ type: 'Firsat' as const, id }] }),
    crmCreateDeal: b.mutation<CrmDeal, Record<string, unknown>>({
      query: (body) => ({ url: `${root}/firsatlar`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Firsatlar' as const, id: 'LIST' }],
    }),
    crmUpdateDeal: b.mutation<CrmDeal, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `${root}/firsatlar/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Firsatlar' as const, id: 'LIST' }, { type: 'Firsat' as const, id }],
    }),
    crmMoveDeal: b.mutation<CrmDeal, { id: string; stageId: string; lostReasonId?: string; nextActionDate?: string }>({
      query: ({ id, ...body }) => ({ url: `${root}/firsatlar/${id}/asama`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Firsatlar' as const, id: 'LIST' }, { type: 'Firsat' as const, id }],
    }),
    crmLossReasons: b.query<CrmLossReason[], void>({ query: () => `${root}/kaybetme-nedenleri` }),
    crmDealActivities: b.query<CrmActivity[], string>({ query: (id) => `${root}/aktiviteler?refType=firsat&refId=${encodeURIComponent(id)}`, providesTags: (_r, _e, id) => [{ type: 'FirsatAktiviteler' as const, id }] }),
    crmAddActivity: b.mutation<CrmActivity, { id: string; type: string; subject: string; body?: string }>({
      query: ({ id, ...body }) => ({ url: `${root}/aktiviteler`, method: 'POST', body: { ...body, refType: 'firsat', refId: id } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'FirsatAktiviteler' as const, id }],
    }),
    crmCustomersForDeals: b.query<{ items: Array<{ id: string; ad: string }> }, void>({ query: () => '/admin/musteriler?tur=musteri&limit=500' }),
  }),
});

export const {
  useCrmPipelinesQuery, useCrmDealsQuery, useCrmDealQuery, useCrmCreateDealMutation,
  useCrmUpdateDealMutation, useCrmMoveDealMutation, useCrmLossReasonsQuery,
  useCrmDealActivitiesQuery, useCrmAddActivityMutation, useCrmCustomersForDealsQuery,
} = crmFirsatlarApi;
