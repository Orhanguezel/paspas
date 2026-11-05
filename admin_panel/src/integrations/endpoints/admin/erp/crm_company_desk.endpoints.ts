import { baseApi } from '@/integrations/baseApi';

export type CompanyDesk = {
  company: { id: string; ad: string; kod: string; musteri_durumu: string };
  profile: { buyer_type: string | null; company_note: string | null; source_ref: string | null } | null;
  contacts: Array<{ id: string; name: string; title: string | null; email: string | null; phone: string | null; linkedin_url: string | null; note: string | null }>;
  research: Array<{ id: string; finding: string; information_type: 'research' | 'customer_statement'; source_url: string | null; source_label: string | null; observed_at: string | null; verification_status: 'unverified' | 'verified' | 'disputed' }>;
  products: Array<{ id: string; product_group: 'PROMATS' | 'MEFATECH' | 'WOGEN'; interest_status: 'unknown' | 'possible' | 'confirmed' | 'not_interested'; current_supplier: string | null; blocker: string | null; purchase_timing: string | null; evidence_note: string | null }>;
  activities: Array<{ id: string; type: string; subject: string; body: string | null; result: string | null; done: number; done_at: string | null; due_at: string | null; planned_start_at: string | null; created_at: string }>;
};
export type CompanyResearchListItem = CompanyDesk['research'][number] & {customer_id:string;company_name:string;company_code:string;created_at:string};

const root = '/admin/crm/sirketler';
const tag = (id: string) => [{ type: 'CrmCompanyDesk' as const, id }];
export const crmCompanyDeskApi = baseApi.enhanceEndpoints({ addTagTypes: ['CrmCompanyDesk'] }).injectEndpoints({
  endpoints: (b) => ({
    companyResearchList: b.query<CompanyResearchListItem[], string>({ query: q => ({url:'/admin/crm/arastirmalar',params:q?{q}:undefined}), providesTags:[{type:'CrmCompanyDesk' as const,id:'RESEARCH_LIST'}] }),
    companyDesk: b.query<CompanyDesk, string>({ query: id => `${root}/${id}/masa`, providesTags: (_r,_e,id) => tag(id) }),
    saveCompanyProfile: b.mutation<unknown,{id:string; body:{buyerType?:string|null;companyNote?:string|null}}>({ query: ({id,body}) => ({url:`${root}/${id}/profil`,method:'PUT',body}), invalidatesTags: (_r,_e,{id}) => tag(id) }),
    addCompanyContact: b.mutation<unknown,{id:string; body:{name:string;title?:string;email?:string;phone?:string;note?:string}}>({ query: ({id,body}) => ({url:`${root}/${id}/kisiler`,method:'POST',body}), invalidatesTags: (_r,_e,{id}) => tag(id) }),
    addCompanyResearch: b.mutation<unknown,{id:string; body:{finding:string;informationType:'research'|'customer_statement';sourceUrl?:string;sourceLabel?:string;observedAt?:string;verificationStatus:'unverified'|'verified'|'disputed'}}>({ query: ({id,body}) => ({url:`${root}/${id}/arastirmalar`,method:'POST',body}), invalidatesTags: (_r,_e,{id}) => [...tag(id),{type:'CrmCompanyDesk' as const,id:'RESEARCH_LIST'}] }),
    saveCompanyProduct: b.mutation<unknown,{id:string; body:{productGroup:'PROMATS'|'MEFATECH'|'WOGEN';interestStatus:'unknown'|'possible'|'confirmed'|'not_interested';currentSupplier?:string|null;blocker?:string|null;purchaseTiming?:string|null;evidenceNote?:string|null}}>({ query: ({id,body}) => ({url:`${root}/${id}/urun-ilgisi`,method:'PUT',body}), invalidatesTags: (_r,_e,{id}) => tag(id) }),
    addCompanyActivity: b.mutation<unknown,{id:string;body:{type:'call'|'meeting'|'email'|'whatsapp'|'note'|'task';subject:string;body?:string;result?:string;dueAt?:string}}>({ query: ({id,body}) => ({url:'/admin/crm/aktiviteler',method:'POST',body:{...body,refType:'musteri',refId:id}}), invalidatesTags: (_r,_e,{id}) => tag(id) }),
  }),
});
export const { useCompanyResearchListQuery, useCompanyDeskQuery, useSaveCompanyProfileMutation, useAddCompanyContactMutation, useAddCompanyResearchMutation, useSaveCompanyProductMutation, useAddCompanyActivityMutation } = crmCompanyDeskApi;
