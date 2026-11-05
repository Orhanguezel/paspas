'use client';

import CustomsCompanyDrawer from './customs-company-drawer';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Building2, Database, Radar, Search, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  type FirmaAday, type FirmaProfil, type FirmaSonuc,
  useFirmaDurumQuery, useFirmaProfilQuery, useFirmaProfilKaydetMutation,
  useFirmaGtipKaynaklariQuery, useFirmaProfilTaraMutation,
  useFirmaAdaylarQuery, useFirmaAdayDurumMutation, useFirmaAdayCrmMutation,
  useFirmaAynaQuery, useFirmaSektorQuery, useFirmaTradeQuery, useFirmaBilgileriQuery,
} from '@/integrations/endpoints/admin/erp/firma_bulma.endpoints';

type Tab = 'profil' | 'ayna' | 'sektor' | 'ara' | 'adaylar';
const date = (v: string | null | undefined) => v ? new Date(v).toLocaleDateString('tr-TR') : '—';
const errorText = (error: unknown) => {
  const data = error && typeof error === 'object' && 'data' in error ? (error as { data?: { error?: { message?: string } } }).data : null;
  return data?.error?.message ?? 'İşlem tamamlanamadı.';
};
const card = 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm';
const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';

export default function FirmaBulmaPage() {
  const [tab, setTab] = useState<Tab>('profil');
  const { data: status, isLoading, error } = useFirmaDurumQuery();
  return <main className="space-y-5 text-slate-900">
    <div><p className="text-xs font-semibold text-slate-500">Satış ve Teklif / Firma Bulma</p><h1 className="mt-1 text-2xl font-black">Firma Bulma</h1><p className="text-sm text-slate-500">Firma profilinize göre potansiyel müşterileri bulun, gümrük kanıtını inceleyin ve CRM’e aktarın.</p></div>
    <nav aria-label="Firma bulma bölümleri" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {([['profil', 'Potansiyel Müşteriler', Radar], ['ayna', 'Firma Aynası', Building2], ['sektor', 'Sektör Analizi', BarChart3], ['ara', 'Detaylı Arama', Search], ['adaylar', 'CRM’e Aktarılanlar', Users]] as const).map(([key, title, Icon]) => <button key={key} onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${tab === key ? 'bg-slate-950 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Icon size={15} /> {title}</button>)}
    </nav>
    {isLoading && <p className="text-sm text-slate-500">Gümrük bağlantısı kontrol ediliyor…</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Gümrük bağlantısı kontrol edilemedi: {errorText(error)}</p>}
    {status?.yapilandirildi && <p className="flex items-center gap-2 text-xs font-bold text-emerald-700"><Database size={14} /> Gümrük veri havuzu · salt okunur bağlantı hazır</p>}
    {status?.yapilandirildi === false && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Gümrük veri havuzu bağlantısı hazır değil.</p>}
    {status?.yapilandirildi && tab === 'profil' && <ProfileTab />}
    {status?.yapilandirildi && tab === 'ayna' && <MirrorTab />}
    {status?.yapilandirildi && tab === 'sektor' && <SectorTab />}
    {status?.yapilandirildi && tab === 'ara' && <TradeTab />}
    {tab === 'adaylar' && <CandidatesTab importedOnly />}
  </main>;
}

function ProfileTab() {
  const { data: saved, isLoading } = useFirmaProfilQuery();
  const { data: sources } = useFirmaGtipKaynaklariQuery();
  const [form, setForm] = useState<FirmaProfil>({ sektor: null, hsKodlari: [], hedefUlkeler: [], aynaAdlari: [] });
  const [countries, setCountries] = useState('');
  const [aliases, setAliases] = useState('');
  const [filter, setFilter] = useState('tumu');
  const [save, saveState] = useFirmaProfilKaydetMutation();
  const [scan, scanState] = useFirmaProfilTaraMutation();
  useEffect(() => { if (saved) { setForm(saved); setCountries(saved.hedefUlkeler.join(', ')); setAliases(saved.aynaAdlari.join(', ')); } }, [saved]);
  const addCode = (code: string) => { const cleaned = code.replace(/\D/g, '').slice(0,6); if (!sources?.codes.some((item) => item.code === cleaned)) return toast.error('Önce Promats ürününe GTİP kodu bağlayın.'); setForm((p) => ({ ...p, hsKodlari: [...new Set([...p.hsKodlari, cleaned])].slice(0, 20) })); };
  async function persist() { try { await save({ ...form, hedefUlkeler: countries.split(',').map((s) => s.trim()).filter(Boolean), aynaAdlari: aliases.split(',').map((s) => s.trim()).filter(Boolean) }).unwrap(); toast.success('Firma profili kaydedildi.'); return true; } catch (error) { toast.error(errorText(error)); return false; } }
  async function runScan() { if (!await persist()) return; try { const result = await scan({ limit: 100 }).unwrap(); toast.success(`${result.bulunan} firma kaydı tarandı.`); } catch (error) { toast.error(errorText(error)); } }
  return <div className="space-y-4">
    <section className={card}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black">Firma profiliniz</h2><p className="mt-1 text-xs text-slate-500">Seçilen HS kodundan ithalat yapmış firmalar aranır. Bu, ürününüzü kullandıkları anlamına gelmez.</p></div><button onClick={() => void runScan()} disabled={scanState.isLoading || saveState.isLoading || isLoading} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">{scanState.isLoading ? 'Taranıyor…' : 'Potansiyel müşteri tara'}</button></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><label className="text-xs font-bold">Sektör<input value={form.sektor ?? ''} onChange={(e) => setForm({ ...form, sektor: e.target.value || null })} className={`mt-1 ${input}`} placeholder="Sektör" /></label><label className="text-xs font-bold">Hedef ülkeler · virgülle ayırın<input value={countries} onChange={(e) => setCountries(e.target.value)} className={`mt-1 ${input}`} placeholder="GERMANY, FRANCE" /></label><label className="lg:col-span-2 text-xs font-bold">Firma Aynası için kendi şirket ünvanlarınız · virgülle ayırın<input value={aliases} onChange={(e) => setAliases(e.target.value)} className={`mt-1 ${input}`} placeholder="Resmî ihracatçı ünvanı" /></label></div>
      <div className="mt-4"><p className="text-xs font-bold">Aramada kullanılacak Promats HS6 aileleri</p><p className="mt-1 text-xs text-slate-500">Aşağıdaki ürün kodlarından seçim yapın. Kod eklemek için Firma Kurulumu’na gidin.</p><div className="mt-2 flex flex-wrap gap-2">{form.hsKodlari.map((code) => <button key={code} onClick={() => setForm({ ...form, hsKodlari: form.hsKodlari.filter((x) => x !== code) })} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{code} ×</button>)}</div></div>
      <div className="mt-4 flex justify-end"><button onClick={() => void persist()} disabled={saveState.isLoading} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold">Profili kaydet</button></div>
    </section>
    <section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-black">Promats ürün GTİP kodları</h2><Link href="/admin/firma-kurulumu#urunler" className="text-xs font-bold text-indigo-700">Ürün eşlemelerini yönet</Link></div><p className="mt-1 text-xs text-slate-600">{sources?.note || 'Ürün kodları Firma Kurulumu içinden yönetilir.'}</p><div className="mt-3 flex flex-wrap gap-2">{sources?.codes.map((source) => <button key={source.code} onClick={() => addCode(source.code)} title={source.productNames.join(', ')} className="rounded-xl border border-slate-200 px-3 py-2 text-left text-xs hover:bg-slate-50"><strong>{source.code}</strong><span className="ml-2 text-slate-500">{source.productCount} Promats ürünü</span></button>)}</div>{!sources?.codes.length && <p className="mt-3 text-xs text-amber-800">Henüz doğrulanmış Promats ürün GTİP eşlemesi yok.</p>}</section>
    <div className="flex items-center justify-between"><h2 className="font-black">Potansiyel müşteriler</h2><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">{[['tumu', 'Tümü'], ['aday', 'Aday'], ['nitelikli', 'Nitelikli'], ['elenmis', 'Elenmiş'], ['crm_aktarildi', 'CRM’e aktarıldı']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <CandidatesTab durum={filter} />
  </div>;
}

function CandidatesTab({ durum = 'tumu', importedOnly = false }: { durum?: string; importedOnly?: boolean }) {
  const { data, isLoading } = useFirmaAdaylarQuery(importedOnly ? 'crm_aktarildi' : durum);
  const [statusChange] = useFirmaAdayDurumMutation();
  const [sendToCrm, crmState] = useFirmaAdayCrmMutation();
  const [selected, setSelected] = useState<FirmaAday | null>(null);
  async function change(id: string, state: string) { try { await statusChange({ id, durum: state }).unwrap(); toast.success('Durum kaydedildi.'); } catch (error) { toast.error(errorText(error)); } }
  async function importToCrm(id: string) { try { await sendToCrm(id).unwrap(); toast.success('Aday CRM’e aktarıldı.'); setSelected(null); } catch (error) { toast.error(errorText(error)); } }
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b p-4"><h2 className="font-black">{importedOnly ? 'CRM’e aktarılan potansiyel müşteriler' : 'Gümrük kayıtlarından bulunan firmalar'}</h2><p className="mt-1 text-xs text-slate-500">İthalat kanıtı müşteri ilişkisi veya ürün kullanımı doğrulaması değildir.</p></div>{isLoading ? <p className="p-6 text-sm">Yükleniyor…</p> : data?.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Firma', 'Ülke', 'HS kodu', 'Sevkiyat', 'Son kayıt', 'Uygunluk', 'Durum'].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{data.items.map((item) => <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer border-t hover:bg-indigo-50"><td className="p-3 font-bold">{item.firmaAdi}</td><td className="p-3">{item.ulke || '—'}</td><td className="p-3">{item.hsKodlari.join(', ')}</td><td className="p-3">{item.sevkiyatSayisi}</td><td className="p-3">{date(item.sonSevkiyat)}</td><td className="p-3">%{item.uygunlukPuani}</td><td className="p-3">{item.durum}</td></tr>)}</tbody></table></div> : <p className="p-10 text-center text-sm text-slate-500">Henüz firma kaydı yok. Profilinizde HS kodu seçip tarama başlatın.</p>}
    {selected && <div className="fixed inset-0 z-[90] bg-slate-950/50" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><aside role="dialog" aria-modal="true" aria-label="Potansiyel müşteri detayı" className="absolute inset-y-0 right-0 w-full max-w-[690px] overflow-y-auto bg-slate-50 p-5 shadow-2xl"><div className="flex justify-between"><h2 className="text-xl font-black">{selected.firmaAdi}</h2><button onClick={() => setSelected(null)} aria-label="Kapat"><X size={20} /></button></div><section className={`mt-4 ${card}`}><p className="text-sm">Ülke: <strong>{selected.ulke || 'Bilinmiyor'}</strong></p><p className="mt-1 text-sm">HS kodları: <strong>{selected.hsKodlari.join(', ')}</strong></p><p className="mt-1 text-sm">Kaynak sevkiyat: <strong>{selected.sevkiyatSayisi}</strong></p><p className="mt-1 text-sm">Son kayıt: <strong>{date(selected.sonSevkiyat)}</strong></p><p className="mt-3 text-xs text-slate-500">{selected.uygunlukNedenleri.join(' · ')}</p><p className="mt-3 text-xs text-slate-500">Kaynak: {selected.kaynak.join(', ')}</p></section><section className={`mt-4 ${card}`}><ContactCard name={selected.firmaAdi} country={selected.ulke} /><h3 className="font-black">Satış takibi</h3>{selected.crmMusteriId ? <Link href={`/admin/crm?firma=${selected.crmMusteriId}`} className="mt-3 inline-block text-sm font-bold text-indigo-700">CRM kartını aç</Link> : <><div className="mt-3 flex flex-wrap gap-2">{(['aday', 'nitelikli', 'elenmis'] as const).map((state) => <button key={state} onClick={() => void change(selected.id, state)} className="rounded-lg border px-3 py-2 text-xs font-bold">{state}</button>)}</div><button onClick={() => void importToCrm(selected.id)} disabled={crmState.isLoading} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">CRM’e aday olarak aktar</button></>}<p className="mt-2 text-xs text-amber-800">Aktarım müşteri durumunu “aday” yapar; doğrulanmış müşteri veya sipariş sayılmaz.</p></section></aside></div>}
  </section>;
}

function MirrorTab() {
  const { data: profile } = useFirmaProfilQuery();
  const { data, isFetching, error, refetch } = useFirmaAynaQuery(undefined, { skip: !profile?.aynaAdlari.length });
  return <div className="space-y-4"><section className={card}><h2 className="font-black">Firma Aynası</h2><p className="mt-1 text-sm text-slate-500">Kendi ihracatçı ünvanlarınızın gümrük kayıtlarındaki izini gösterir. Ünvanları Potansiyel Müşteriler profilinde kaydedin.</p><p className="mt-2 text-xs font-bold">{profile?.aynaAdlari.join(', ') || 'Henüz ünvan tanımlanmadı'}</p><button onClick={() => refetch()} disabled={!profile?.aynaAdlari.length || isFetching} className="mt-3 rounded-xl border px-4 py-2 text-xs font-bold">{isFetching ? 'Yükleniyor…' : 'Yenile'}</button>{error && <p role="alert" className="mt-2 text-xs text-rose-700">{errorText(error)}</p>}</section>{data?.totals && <><div className="grid gap-3 sm:grid-cols-3">{[['Sevkiyat', data.totals.shipments], ['Alıcı', data.totals.buyers], ['Pazar', data.totals.markets]].map(([label, value]) => <div key={String(label)} className={card}><p className="text-xs text-slate-500">{label}</p><strong className="text-2xl">{value}</strong></div>)}</div><section className={card}><h3 className="font-black">Alıcılar</h3><div className="mt-3 max-h-96 overflow-auto">{data.buyers.map((buyer) => <div key={`${buyer.name}-${buyer.country}`} className="flex justify-between border-b py-2 text-sm"><span>{buyer.name} <small className="text-slate-500">{buyer.country}</small></span><strong>{buyer.shipments}</strong></div>)}{!data.buyers.length && <p className="text-sm text-slate-500">Eşleşen alıcı yok.</p>}</div></section><section className={card}><h3 className="font-black">Ürün kodları</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{data.products.map((product) => <p key={product.hsCode} className="rounded-lg border p-2 text-xs"><strong>{product.hsCode}</strong> · {product.shipments} kayıt<br />{product.description}</p>)}</div></section></>}</div>;
}

function SectorTab() {
  const { data: profile } = useFirmaProfilQuery();
  const [code, setCode] = useState('');
  const [origin, setOrigin] = useState('TURKEY');
  const [search, setSearch] = useState<{ hsCode: string; origin: string } | null>(null);
  const { data, isFetching, error } = useFirmaSektorQuery(search!, { skip: !search });
  useEffect(() => { if (profile?.hsKodlari[0] && !code) setCode(profile.hsKodlari[0].slice(0, 6)); }, [profile, code]);
  return <div className="space-y-4"><section className={card}><h2 className="font-black">Sektör Analizi</h2><p className="mt-1 text-xs text-slate-500">İki eşit dönem içindeki gümrük kaydı ve pazar yoğunluğu karşılaştırılır; satış cirosu veya toplam pazar büyüklüğü değildir.</p><div className="mt-4 flex flex-wrap gap-2"><input value={code} onChange={(e) => setCode(e.target.value)} className={`${input} sm:w-48`} placeholder="6 haneli HS kodu" /><input value={origin} onChange={(e) => setOrigin(e.target.value)} className={`${input} sm:w-48`} placeholder="Menşe ülke" /><button onClick={() => { const hs = code.replace(/\D/g, '').slice(0, 6); if (hs.length !== 6) return toast.error('6 haneli HS kodu girin.'); setSearch({ hsCode: hs, origin }); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Analiz et</button></div>{isFetching && <p className="mt-3 text-xs text-slate-500">Analiz hazırlanıyor…</p>}{error && <p role="alert" className="mt-3 text-xs text-rose-700">{errorText(error)}</p>}</section>{data && <><section className={card}><h3 className="font-black">{search?.hsCode} · pazarlar</h3><p className="mt-1 text-xs text-slate-500">{data.period ? `${date(data.period.start)} – ${date(data.period.end)}` : 'Karşılaştırılabilir dönem bulunamadı.'} · {data.coverage.records} kaynak kayıt</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-xs text-slate-500"><tr>{['Pazar', 'Son dönem', 'Önceki', 'Alıcı', 'İhracatçı', 'Puan'].map((x) => <th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{data.markets.map((market) => <tr key={market.country} className="border-t"><td className="p-2 font-bold">{market.country}</td><td className="p-2">{market.current}</td><td className="p-2">{market.previous}</td><td className="p-2">{market.buyers}</td><td className="p-2">{market.exporters}</td><td className="p-2">{market.score ?? '—'}</td></tr>)}</tbody></table></div></section><section className={card}><h3 className="font-black">Veri notları</h3><ul className="mt-2 list-disc pl-5 text-xs text-slate-600">{data.notes.map((note) => <li key={note}>{note}</li>)}</ul></section></>}</div>;
}

function TradeTab() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [hsCode, setHsCode] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [params, setParams] = useState<{ q: string; offset: number; role: string; hsCode?: string; origin?: string; destination?: string; dateFrom?: string; dateTo?: string } | null>(null);
  const [selected, setSelected] = useState<FirmaSonuc | null>(null);
  const { data, isFetching, error } = useFirmaTradeQuery(params!, { skip: !params });
  function search(offset = 0) { if (q.trim().length < 3) return toast.error('En az 3 karakter veya 6 haneli HS kodu girin.'); setParams({ q: q.trim(), offset, role, hsCode: hsCode || undefined, origin: origin || undefined, destination: destination || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }); }
  return <div className="space-y-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950"><strong>Bu liste seçilen ürünün doğrulanmış kullanıcıları değildir.</strong><p className="mt-1">Gümrük kaydına göre seçilen HS kodundan ithalat veya ihracat yapan firmaları gösterir.</p></div><section className={card}><h2 className="font-black">Detaylı Arama</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(); }} placeholder="Firma adı veya HS kodu" className={`${input} sm:col-span-2`} /><select value={role} onChange={(e) => setRole(e.target.value)} className={input}><option value="all">Alıcı ve tedarikçi</option><option value="alici">Alıcılar</option><option value="tedarikci">Tedarikçiler</option></select><input value={hsCode} onChange={(e) => setHsCode(e.target.value)} placeholder="HS filtresi" className={input} /><input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Çıkış ülkesi" className={input} /><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Varış ülkesi" className={input} /><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={input} /><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={input} /></div><button onClick={() => search()} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Ara</button></section>{isFetching && <p className="text-sm text-slate-500">Gümrük kayıtları aranıyor…</p>}{error && <p role="alert" className="text-sm text-rose-700">{errorText(error)}</p>}{data && <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-4 text-sm font-bold">{data.total} firma · {data.summary.buyers} alıcı · {data.summary.suppliers} tedarikçi · {data.summary.countries} ülke</div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Firma', 'Rol', 'Ülke', 'Sevkiyat', 'Son sevkiyat'].map((x) => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{data.sonuclar.map((result, index) => <tr key={`${result.rol}-${result.ad}-${result.ulke}-${index}`} onClick={() => setSelected(result)} className="cursor-pointer border-t hover:bg-indigo-50"><td className="p-3 font-bold">{result.ad}</td><td className="p-3">{result.rol}</td><td className="p-3">{result.ulke || '—'}</td><td className="p-3">{result.sevkiyat}</td><td className="p-3">{result.sonSevkiyatAyi || '—'}</td></tr>)}</tbody></table></div><div className="flex justify-between border-t p-3"><button disabled={!params?.offset} onClick={() => search(Math.max(0, (params?.offset ?? 0) - 50))} className="text-xs font-bold text-indigo-700">Önceki</button><button disabled={!data.dahaFazlaVar} onClick={() => search(data.nextOffset ?? 0)} className="text-xs font-bold text-indigo-700">Sonraki</button></div></section>}{selected && <TradeDetail item={selected} onClose={() => setSelected(null)} />}</div>;
}

function TradeDetail({ item, onClose }: { item: FirmaSonuc; onClose: () => void }) {
  return <CustomsCompanyDrawer company={{ name: item.ad, country: item.ulke, role: item.rol }} onClose={onClose} />;
}

function ContactCard({ name, country }: { name: string; country: string | null }) {
  const { data, isFetching } = useFirmaBilgileriQuery({ name, country });
  const contact = data?.items?.[name];
  return <section className={card}><h3 className="font-black">İletişim bilgileri</h3>{isFetching ? <p className="mt-2 text-xs text-slate-500">İletişim havuzu kontrol ediliyor…</p> : contact ? <div className="mt-2 space-y-2 text-sm">{contact.website && <p>Web: <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline">{contact.website}</a></p>}{contact.emails.length > 0 && <p>E-posta: {contact.emails.join(", ")}</p>}{contact.phones.length > 0 && <p>Telefon: {contact.phones.join(", ")}</p>}{contact.address && <p>Adres: {contact.address}</p>}{contact.people.map((person, index) => <p key={index}>{person.fullName} · {person.title || "İlgili kişi"}{person.email ? " · " + person.email : ""}</p>)}<p className="text-xs text-slate-500">Kaynak: {contact.sources.join(", ") || "İletişim havuzu"}</p></div> : <p className="mt-2 text-xs text-slate-500">Eşleşen iletişim kaydı bulunamadı.</p>}</section>;
}
