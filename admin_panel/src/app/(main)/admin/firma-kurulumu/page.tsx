'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Coins, Factory, FileText, ListOrdered, Mail, PackageSearch, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkUpsertSiteSettingsAdminMutation, useListSiteSettingsAdminQuery } from '@/integrations/hooks';
import { type PromatsUrunGtip, useFirmaUrunGtipKaydetMutation, useFirmaUrunGtipQuery } from '@/integrations/endpoints/admin/erp/firma_bulma.endpoints';
import { useFirmaNumaraDevriMutation, useFirmaNumaraSerisiQuery } from '@/integrations/endpoints/admin/erp/firma_kurulumu.endpoints';

const tabs = [
  { id: 'profil', label: 'Firma profili', icon: Building2, key: 'company_profile' },
  { id: 'urunler', label: 'Ürünler ve GTİP', icon: PackageSearch, key: '' },
  { id: 'teklif', label: 'Teklif kuralları', icon: FileText, key: 'promats_setup_quote' },
  { id: 'belgeler', label: 'Belgeler ve e-posta', icon: Mail, key: 'promats_setup_documents' },
  { id: 'numaralar', label: 'Numara serileri', icon: ListOrdered, key: '' },
  { id: 'atolyeler', label: 'Atölyeler', icon: Factory, key: 'promats_setup_workshops' },
  { id: 'kurlar', label: 'Para birimi ve kur', icon: Coins, key: 'promats_setup_currency' },
] as const;
type Tab = typeof tabs[number]['id'];
type Form = Record<string, string>;
const sections: Record<Exclude<Tab, 'urunler' | 'numaralar' | 'atolyeler' | 'kurlar'>, Array<{ title: string; fields: Array<[string, string]> }>> = {
  profil: [
    { title: 'Firma kimliği', fields: [['company_name', 'Kısa firma adı'], ['legal_name', 'Ticari unvan'], ['website', 'Web sitesi'], ['authorized_person', 'Teklif yetkilisi'], ['email', 'E-posta'], ['phone', 'Telefon']] },
    { title: 'Adres ve resmi bilgiler', fields: [['address', 'Adres'], ['district', 'İlçe'], ['city', 'Şehir'], ['tax_office', 'Vergi dairesi'], ['tax_number', 'Vergi numarası'], ['trade_registry_number', 'Ticaret sicil numarası'], ['mersis_number', 'MERSİS numarası'], ['bank_name', 'Banka adı'], ['iban', 'IBAN']] },
  ],
  teklif: [{ title: 'Teklif kuralları', fields: [['quote_prefix', 'Teklif numarası öneki'], ['validity_days', 'Geçerlilik süresi (gün)'], ['delivery_days', 'Teslim süresi (gün)'], ['incoterm', 'Varsayılan Incoterm'], ['payment_terms', 'Ödeme koşulu'], ['tax_policy', 'Vergi politikası'], ['minimum_margin_percent', 'Asgari kâr marjı (%)'], ['maximum_discount_percent', 'Azami indirim (%)'], ['approval_threshold', 'Onay eşiği'], ['full_carton_policy', 'Tam koli politikası'], ['full_pallet_policy', 'Tam palet politikası'], ['quote_footer', 'Teklif alt bilgi metni']] }],
  belgeler: [{ title: 'Belge ve e-posta varsayılanları', fields: [['document_language', 'Belge dili'], ['timezone', 'Saat dilimi'], ['from_name', 'Gönderen adı'], ['reply_to', 'Yanıt adresi'], ['quote_template', 'Teklif şablonu'], ['proforma_template', 'Proforma şablonu'], ['packing_template', 'Çeki listesi şablonu'], ['quote_email_text', 'Varsayılan teklif e-postası'], ['proforma_email_text', 'Varsayılan proforma e-postası'], ['logo_url', 'Firma logosu URL'], ['signature_url', 'Yetkili imzası URL'], ['stamp_url', 'Firma kaşesi URL']] }],
};
const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500';
const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
function asObject(value: unknown): Form {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item == null ? '' : String(item)]));
}
function errorText(error: unknown) { return error instanceof Error ? error.message : 'Kaydetme işlemi tamamlanamadı.'; }

export default function FirmaKurulumuPage() {
  const [tab, setTab] = useState<Tab>('profil');
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const keys = useMemo(() => tabs.map((item) => item.key).filter(Boolean), []);
  const { data: settings, isLoading, error } = useListSiteSettingsAdminQuery({ keys });
  const [upsert] = useBulkUpsertSiteSettingsAdminMutation();
  useEffect(() => { const hash = window.location.hash.slice(1); if (tabs.some((item) => item.id === hash)) setTab(hash as Tab); }, []);
  useEffect(() => {
    if (!settings) return;
    setForms((current) => {
      const next = { ...current };
      for (const row of settings) if (!dirty[row.key]) next[row.key] = asObject(row.value);
      return next;
    });
  }, [settings, dirty]);
  const selected = tabs.find((item) => item.id === tab)!;
  const form = forms[selected.key] ?? {};
  function setField(field: string, value: string) {
    setForms((current) => ({ ...current, [selected.key]: { ...current[selected.key], [field]: value } }));
    setDirty((current) => ({ ...current, [selected.key]: true }));
  }
  async function save() {
    if (!selected.key) return;
    if (tab === 'teklif' && form.quote_prefix && !/^[A-Z0-9-]{1,8}$/.test(form.quote_prefix.trim().toUpperCase())) return toast.error('Teklif öneki 1–8 harf, rakam veya kısa çizgi olmalı.');
    if (tab === 'teklif' && form.validity_days && (!Number.isInteger(Number(form.validity_days)) || Number(form.validity_days) < 1 || Number(form.validity_days) > 365)) return toast.error('Geçerlilik süresi 1–365 gün olmalı.');
    if (tab === 'kurlar' && form.default_currency && !['TRY','EUR','USD'].includes(form.default_currency)) return toast.error('Varsayılan para birimi TRY, EUR veya USD olmalı.');
    setBusy(true);
    try {
      await upsert({ items: [{ key: selected.key, value: form }] }).unwrap();
      setDirty((current) => ({ ...current, [selected.key]: false }));
      toast.success(`${selected.label} kaydedildi.`);
    } catch (reason) { toast.error(errorText(reason)); }
    finally { setBusy(false); }
  }
  return <main className="min-w-0 space-y-5 text-slate-900">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">Satış ve CRM / Firma Kurulumu</p><h1 className="mt-1 text-2xl font-black">Firma Kurulumu</h1><p className="mt-1 text-sm text-slate-500">Promats kimliğini, satış ürünlerini ve ticari varsayılanlarını yönetin.</p></div>{selected.key && <button type="button" onClick={() => void save()} disabled={busy || isLoading} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save size={16}/>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>}</header>
    <nav role="tablist" aria-label="Firma kurulumu bölümleri" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); window.history.replaceState(null, '', `#${id}`); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold ${tab === id ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={16}/>{label}</button>)}</nav>
    {isLoading && <p role="status" className="text-sm text-slate-500">Firma ayarları yükleniyor…</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Firma ayarları yüklenemedi.</p>}
    {tab === 'urunler' ? <ProductsTab/> : tab === 'numaralar' ? <NumberSeriesTab/> : tab === 'atolyeler' ? <WorkshopsTab form={form} setField={setField}/> : tab === 'kurlar' ? <CurrencyTab form={form} setField={setField}/> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-5">{sections[tab].map((section) => <section key={section.title} className={card}><h2 className="text-base font-black">{section.title}</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{section.fields.map(([field, label]) => <label key={field} className={`text-xs font-bold text-slate-600 ${['address','quote_footer','quote_email_text','proforma_email_text'].includes(field) ? 'md:col-span-2' : ''}`}>{label}{['address','quote_footer','quote_email_text','proforma_email_text'].includes(field) ? <textarea rows={3} value={form[field] ?? ''} onChange={(event) => setField(field, event.target.value)} className={input}/> : <input value={form[field] ?? ''} onChange={(event) => setField(field, event.target.value)} className={input}/>}</label>)}</div></section>)}</div><aside className={card}><h2 className="font-black">Kurulum durumu</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bu sayfa mevcut Promats ayarlarını gösterir. Vergi, iletişim ve banka bilgilerini gerçek şirket belgeleriyle doğrulayın.</p><Link href="/admin/firma-bulma" className="mt-4 inline-block text-sm font-bold text-blue-700">Firma Bulma’ya git →</Link></aside></div>}
  </main>;
}

function ProductsTab() {
  const { data, isLoading, error } = useFirmaUrunGtipQuery();
  const [save, state] = useFirmaUrunGtipKaydetMutation();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Record<string, { code: string; source: string }>>({});
  const [page, setPage] = useState(0);
  const items = data?.items ?? [];
  const filtered = items.filter((item) => `${item.ad} ${item.kod} ${item.gtipKodu ?? ''}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
  const visible = filtered.slice(page * 30, (page + 1) * 30);
  async function persist(item: PromatsUrunGtip) {
    const edit = editing[item.id] ?? { code: item.gtipKodu ?? '', source: item.kaynak ?? '' };
    if (edit.code && !/^\d{6,12}$/.test(edit.code)) return toast.error('GTİP 6–12 rakam olmalı.');
    if (edit.source.trim().length < 3) return toast.error('Kodun kaynağını veya doğrulama belgesini yazın.');
    try { await save({ id: item.id, gtipKodu: edit.code, kaynak: edit.source.trim() }).unwrap(); toast.success(`${item.ad} GTİP eşlemesi kaydedildi.`); }
    catch (reason) { toast.error(errorText(reason)); }
  }
  return <section className={card}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black">Ürünler ve GTİP kodları</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">Promats satış ürünlerinin kanıtlı GTİP kodlarını kaydedin. Firma Bulma yalnız bu ürünlerin HS6 aileleriyle tarama yapar.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{items.filter((item) => item.gtipKodu).length} / {items.length} ürün kodlu</span></div><label className="relative mt-4 block"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><span className="sr-only">Ürün ara</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Ürün adı, stok kodu veya GTİP ara" className={`${input} pl-10`}/></label>{isLoading && <p className="mt-4 text-sm">Ürünler yükleniyor…</p>}{error && <p role="alert" className="mt-4 text-sm text-rose-700">Ürünler yüklenemedi.</p>}<div className="mt-4 overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Ürün</th><th className="p-3">Stok kodu</th><th className="p-3">GTİP / HS kodu</th><th className="p-3">Kodun kaynağı</th><th className="p-3">İşlem</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-semibold">{item.ad}</td><td className="p-3">{item.kod}</td><td className="p-3"><input aria-label={`${item.ad} GTİP`} inputMode="numeric" maxLength={12} value={editing[item.id]?.code ?? item.gtipKodu ?? ''} onChange={(event) => setEditing((current) => ({ ...current, [item.id]: { code: event.target.value.replace(/\D/g, ''), source: current[item.id]?.source ?? item.kaynak ?? '' } }))} className={input} placeholder="6–12 rakam"/></td><td className="p-3"><input aria-label={`${item.ad} kod kaynağı`} value={editing[item.id]?.source ?? item.kaynak ?? ''} onChange={(event) => setEditing((current) => ({ ...current, [item.id]: { code: current[item.id]?.code ?? item.gtipKodu ?? '', source: event.target.value } }))} className={input} placeholder="Gümrük beyannamesi / ürün belgesi"/></td><td className="p-3"><button disabled={state.isLoading || !editing[item.id]} onClick={() => void persist(item)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Kaydet</button></td></tr>)}</tbody></table></div>{!isLoading && !filtered.length && <p className="mt-4 text-sm text-slate-500">Satış ürünü bulunamadı.</p>}{filtered.length > 30 && <div className="mt-3 flex items-center justify-between text-sm"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Önceki</button><span>{page + 1} / {Math.ceil(filtered.length / 30)}</span><button disabled={(page + 1) * 30 >= filtered.length} onClick={() => setPage(page + 1)}>Sonraki</button></div>}</section>;
}

function NumberSeriesTab() {
  const { data, isLoading, error } = useFirmaNumaraSerisiQuery();
  const [advance, state] = useFirmaNumaraDevriMutation();
  const [last, setLast] = useState('');
  const series = data?.series[0];
  async function submit() {
    const value = Number(last);
    if (!last || !Number.isSafeInteger(value) || value < (series?.lastUsed ?? 0)) return toast.error('Son kullanılan numara mevcut sayaçtan küçük olamaz.');
    try { await advance({ year: data!.year, lastUsed: value }).unwrap(); setLast(''); toast.success('Teklif sayacı ileri alındı.'); }
    catch (reason) { toast.error(errorText(reason)); }
  }
  return <section className={card}><h2 className="font-black">Numara serileri</h2><p className="mt-1 text-sm text-slate-500">{data?.year ?? new Date().getFullYear()} yılı teklif sayacı. Eski tekliflerin numaraları korunur.</p><p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">Excel devrinde son kullanılan numarayı girin. Sayaç yalnız ileri alınabilir; geri almak verilmiş numarayı yeniden kullanabilir.</p>{isLoading && <p className="mt-4 text-sm">Sayaç yükleniyor…</p>}{error && <p className="mt-4 text-sm text-rose-700">Sayaç okunamadı.</p>}{series && <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border p-4"><div className="min-w-[130px] flex-1"><strong className="block text-sm">Teklif</strong><span className="text-xs text-slate-500">Sıradaki numara: <b>{series.next}</b></span></div><label className="text-xs font-bold">Excel’de son kullanılan numara<input type="number" min={series.lastUsed} value={last} onChange={(event) => setLast(event.target.value)} className={input}/></label><button onClick={() => void submit()} disabled={state.isLoading || !last} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">Devret</button></div>}<p className="mt-3 text-xs text-slate-500">Öneki Teklif kuralları bölümünde değiştirebilirsiniz.</p></section>;
}

type Workshop = { kod: string; ad: string; kapasite: string; aktif: boolean };
function WorkshopsTab({ form, setField }: { form: Form; setField: (field: string, value: string) => void }) {
  const rows = useMemo<Workshop[]>(() => { try { const value = JSON.parse(form.rows ?? '[]'); return Array.isArray(value) ? value.filter((row) => row && typeof row === 'object' && !Array.isArray(row)) as Workshop[] : []; } catch { return []; } }, [form.rows]);
  const [draft, setDraft] = useState({ kod: '', ad: '', kapasite: '' });
  const change = (next: Workshop[]) => setField('rows', JSON.stringify(next));
  const capacity = rows.filter((row) => row.aktif && row.kapasite !== '').reduce((sum, row) => sum + Number(row.kapasite || 0), 0);
  const unknown = rows.filter((row) => row.aktif && row.kapasite === '').length;
  function add() {
    if (!draft.kod.trim() || !draft.ad.trim()) return toast.error('Atölye kodu ve adı gerekli.');
    if (rows.some((row) => row.kod.toLocaleLowerCase('tr') === draft.kod.trim().toLocaleLowerCase('tr'))) return toast.error('Atölye kodu zaten var.');
    if (draft.kapasite && (Number(draft.kapasite) < 0 || !Number.isFinite(Number(draft.kapasite)))) return toast.error('Kapasite sıfır veya pozitif olmalı.');
    change([...rows, { kod: draft.kod.trim(), ad: draft.ad.trim(), kapasite: draft.kapasite, aktif: true }]);
    setDraft({ kod: '', ad: '', kapasite: '' });
  }
  return <section className={card}><h2 className="font-black">Atölyeler</h2><p className="mt-1 text-sm text-slate-500">Üretim yerleri ve günlük adam-gün kapasiteleri.</p><p className="mt-4 rounded-xl border bg-slate-50 p-3 text-xs">Toplam günlük kapasite: <b>{capacity} adam-gün</b>{unknown > 0 && <span className="ml-2 text-amber-800">· {unknown} atölyenin kapasitesi girilmedi; sıfır sayılmadı.</span>}</p><div className="mt-4 space-y-2">{rows.map((row,index) => <div key={row.kod} className="flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm"><strong className="min-w-[110px]">{row.kod}</strong><span className="min-w-[130px] flex-1">{row.ad}</span><label className="text-xs">Kapasite<input type="number" min="0" step="0.01" value={row.kapasite} onChange={(event) => change(rows.map((item,i) => i === index ? { ...item, kapasite: event.target.value } : item))} className={`${input} w-28`}/></label><button onClick={() => change(rows.map((item,i) => i === index ? { ...item, aktif: !item.aktif } : item))} className="rounded-lg border px-3 py-2 text-xs font-bold">{row.aktif ? 'Aktif' : 'Pasif'}</button><button onClick={() => change(rows.filter((_,i) => i !== index))} className="rounded-lg border px-3 py-2 text-xs font-bold text-rose-700">Sil</button></div>)}</div><div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-[1fr_2fr_1fr_auto]"><label className="text-xs font-bold">Kod<input value={draft.kod} onChange={(event) => setDraft({ ...draft, kod: event.target.value })} className={input}/></label><label className="text-xs font-bold">Atölye adı<input value={draft.ad} onChange={(event) => setDraft({ ...draft, ad: event.target.value })} className={input}/></label><label className="text-xs font-bold">Adam-gün<input type="number" min="0" step="0.01" value={draft.kapasite} onChange={(event) => setDraft({ ...draft, kapasite: event.target.value })} className={input}/></label><button onClick={add} className="self-end rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white">Ekle</button></div><p className="mt-3 text-xs text-slate-500">Atölyeleri ekledikten sonra üstteki Kaydet düğmesine basın.</p></section>;
}

type Rate = { source: string; target: string; rate: string; date: string };
function CurrencyTab({ form, setField }: { form: Form; setField: (field: string, value: string) => void }) {
  const rates = useMemo<Rate[]>(() => { try { const value = JSON.parse(form.rates ?? '[]'); return Array.isArray(value) ? value as Rate[] : []; } catch { return []; } }, [form.rates]);
  const [draft, setDraft] = useState<Rate>({ source: 'USD', target: 'EUR', rate: '', date: new Date().toISOString().slice(0, 10) });
  function add() {
    if (draft.source === draft.target || !draft.date || draft.date > new Date().toISOString().slice(0, 10) || !(Number(draft.rate) > 0)) return toast.error('İki farklı para birimi, geçmiş veya bugün tarihi ve pozitif kur girin.');
    setField('rates', JSON.stringify([...rates.filter((row) => !(row.source === draft.source && row.target === draft.target && row.date === draft.date)), draft]));
    setDraft({ ...draft, rate: '' });
  }
  return <section className={card}><h2 className="font-black">Para birimi ve kur</h2><p className="mt-1 text-sm text-slate-500">Kur tarihli referans olarak kaydedilir. Mevcut teklif tutarları seçilen para biriminde saklanır; kurla otomatik dönüşüm yapılmaz.</p><label className="mt-4 block max-w-xs text-xs font-bold">Varsayılan teklif para birimi<select value={form.default_currency ?? ''} onChange={(event) => setField('default_currency', event.target.value)} className={input}><option value="">Seçin</option>{['TRY','EUR','USD'].map((code) => <option key={code}>{code}</option>)}</select></label><div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">{(['source','target'] as const).map((field) => <label key={field} className="text-xs font-bold">{field === 'source' ? '1 birim' : 'Karşılık'}<select value={draft[field]} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} className={input}>{['TRY','EUR','USD'].map((code) => <option key={code}>{code}</option>)}</select></label>)}<label className="text-xs font-bold">Kur<input type="number" min="0.000001" step="0.000001" value={draft.rate} onChange={(event) => setDraft({ ...draft, rate: event.target.value })} className={input}/></label><label className="text-xs font-bold">Tarih<input type="date" max={new Date().toISOString().slice(0, 10)} value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className={input}/></label><button onClick={add} className="self-end rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white">Ekle</button></div><div className="mt-4 space-y-2">{rates.slice().sort((a,b) => b.date.localeCompare(a.date)).map((rate) => <div key={`${rate.source}-${rate.target}-${rate.date}`} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"><strong>{rate.source} → {rate.target}</strong><span className="flex-1">{rate.rate}</span><span>{rate.date}</span><button onClick={() => setField('rates', JSON.stringify(rates.filter((item) => item !== rate)))} className="text-xs font-bold text-rose-700">Sil</button></div>)}</div><p className="mt-3 text-xs text-slate-500">Kurları ekledikten sonra üstteki Kaydet düğmesine basın.</p></section>;
}
