import { baseApi } from '@/integrations/baseApi';

export type FirmaProfil = { sektor: string | null; hsKodlari: string[]; hedefUlkeler: string[]; aynaAdlari: string[] };
export type FirmaAday = { id: string; firmaAdi: string; ulke: string | null; hsKodlari: string[]; sevkiyatSayisi: number; tedarikciSayisi: number; sonSevkiyat: string | null; uygunlukPuani: number; uygunlukNedenleri: string[]; kaynak: string[]; durum: string; crmMusteriId: string | null };
export type FirmaSonuc = { rol: 'alici' | 'tedarikci'; ad: string; ulke: string | null; sevkiyat: number; sonSevkiyatAyi: string | null; lastShipment: { hsCode: string; date: string | null; exporter: string | null } | null };
export type FirmaTrade = { total: number; summary: { buyers: number; suppliers: number; countries: number }; sonuclar: FirmaSonuc[]; nextOffset: number | null; dahaFazlaVar: boolean; facets: { hsCodes: Array<{ code: string; count: number }> } };
export type FirmaAynasi = { names: string[]; totals: { shipments: number; buyers: number; markets: number; firstDate: string | null; lastDate: string | null } | null; buyers: Array<{ name: string; country: string | null; shipments: number }>; products: Array<{ hsCode: string; description: string | null; shipments: number }>; timeline: Array<{ year: number; shipments: number }> };
export type SektorAnalizi = { status: string; period: { start: string; end: string } | null; markets: Array<{ country: string; current: number; previous: number; buyers: number; exporters: number; score: number | null; competition: string; eligible: boolean }>; coverage: { records: number; unknownDestination: number }; notes: string[] };
export type FirmaDetay = { buyer: { name: string; country: string | null }; totals: { shipments: number; firstDate: string | null; lastDate: string | null; suppliers: number; products: number }; shipments: { items: Array<{ id: string; date: string | null; exporter: string | null; hsCode: string; description: string | null; source: string | null }> }; suppliers: Array<{ name: string; shipments: number }>; products: Array<{ hsCode: string; shipments: number }> };
export type FirmaIletisim = { website: string | null; emails: string[]; phones: string[]; people: Array<{ fullName: string | null; title: string | null; email: string | null }>; address: string | null; sources: string[] };
export type PromatsUrunGtip = { id: string; kod: string; ad: string; gtipKodu: string | null; kaynak: string | null; updatedAt: string | null };

const root = '/admin/firma-bulma';
export const firmaBulmaApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    firmaDurum: b.query<{ yapilandirildi: boolean; kaynak: string; iletisimHavuzuHazir: boolean }, void>({ query: () => `${root}/durum` }),
    firmaProfil: b.query<FirmaProfil, void>({ query: () => `${root}/profil`, providesTags: ['FirmaBulmaProfil'] }),
    firmaProfilKaydet: b.mutation<FirmaProfil, FirmaProfil>({ query: (body) => ({ url: `${root}/profil`, method: 'PUT', body }), invalidatesTags: ['FirmaBulmaProfil'] }),
    firmaGtipKaynaklari: b.query<{ codes: Array<{ code: string; productCount: number; productNames: string[]; source: string }>; sourceProductCount: number; note: string }, void>({ query: () => `${root}/gtip-kaynaklari`, providesTags: ['FirmaBulmaProfil'] }),
    firmaUrunGtip: b.query<{ items: PromatsUrunGtip[] }, void>({ query: () => `${root}/urun-gtip`, providesTags: ['FirmaBulmaProfil'] }),
    firmaUrunGtipKaydet: b.mutation<{ ok: boolean }, { id: string; gtipKodu: string; kaynak: string }>({ query: ({ id, ...body }) => ({ url: `${root}/urun-gtip/${id}`, method: 'PUT', body }), invalidatesTags: ['FirmaBulmaProfil'] }),
    firmaHsAra: b.query<{ items: Array<{ hsCode: string; description: string | null; recordCount: number }> }, string>({ query: (q) => `${root}/hs-ara?q=${encodeURIComponent(q)}` }),
    firmaGtipOneriler: b.query<{ gtip: Array<{ kod: string; aciklama: string | null; sektor: string | null; kayit: number }>; firmalar: unknown[] }, string>({ query: (q) => `${root}/oneriler?q=${encodeURIComponent(q)}` }),
    firmaProfilTara: b.mutation<{ bulunan: number }, { limit: number }>({ query: (body) => ({ url: `${root}/profil-tara`, method: 'POST', body }), invalidatesTags: ['FirmaBulmaAdaylar'] }),
    firmaAdaylar: b.query<{ items: FirmaAday[] }, string>({ query: (durum) => `${root}/potansiyeller?durum=${durum}`, providesTags: ['FirmaBulmaAdaylar'] }),
    firmaAdayDurum: b.mutation<{ ok: boolean }, { id: string; durum: string }>({ query: ({ id, durum }) => ({ url: `${root}/potansiyeller/${id}/durum`, method: 'PATCH', body: { durum } }), invalidatesTags: ['FirmaBulmaAdaylar'] }),
    firmaAdayCrm: b.mutation<{ ok: boolean; musteriId: string }, string>({ query: (id) => ({ url: `${root}/potansiyeller/${id}/crm`, method: 'POST' }), invalidatesTags: ['FirmaBulmaAdaylar'] }),
    firmaAyna: b.query<FirmaAynasi, void>({ query: () => `${root}/ayna/iz` }),
    firmaSektor: b.query<SektorAnalizi, { hsCode: string; origin: string }>({ query: (p) => `${root}/sektor-analizi?hsCode=${encodeURIComponent(p.hsCode)}&origin=${encodeURIComponent(p.origin)}` }),
    firmaTrade: b.query<FirmaTrade, { q: string; offset: number; role: string; hsCode?: string; origin?: string; destination?: string; dateFrom?: string; dateTo?: string }>({ query: (p) => `${root}/ticaret-ara?${new URLSearchParams(Object.entries(p).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])).toString()}` }),
    firmaDetay: b.query<FirmaDetay, { buyer: string; country?: string | null; role: string }>({ query: (p) => `${root}/firma-detay?${new URLSearchParams(Object.entries(p).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => [key, String(value)])).toString()}` }),
    firmaBilgileri: b.query<{ items: Record<string, FirmaIletisim | null> }, { name: string; country?: string | null }>({ query: (p) => `${root}/firma-bilgileri?${new URLSearchParams(Object.entries(p).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => [key, String(value)])).toString()}` }),
  }),
});
export const { useFirmaDurumQuery, useFirmaProfilQuery, useFirmaProfilKaydetMutation, useFirmaGtipKaynaklariQuery, useFirmaUrunGtipQuery, useFirmaUrunGtipKaydetMutation, useFirmaHsAraQuery, useFirmaGtipOnerilerQuery, useFirmaProfilTaraMutation, useFirmaAdaylarQuery, useFirmaAdayDurumMutation, useFirmaAdayCrmMutation, useFirmaAynaQuery, useFirmaSektorQuery, useFirmaTradeQuery, useFirmaDetayQuery, useFirmaBilgileriQuery } = firmaBulmaApi;
