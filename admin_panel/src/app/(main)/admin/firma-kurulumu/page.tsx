'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Coins, Factory, FileText, ListOrdered, Mail, PackageSearch, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkUpsertSiteSettingsAdminMutation, useListSiteSettingsAdminQuery } from '@/integrations/hooks';
import { type PromatsUrunGtip, useFirmaUrunGtipKaydetMutation, useFirmaUrunGtipQuery } from '@/integrations/endpoints/admin/erp/firma_bulma.endpoints';

const tabs = [
  { id: 'profil', label: 'Firma profili', icon: Building2, key: 'company_profile' },
  { id: 'urunler', label: 'Ürünler ve GTİP', icon: PackageSearch, key: '' },
  { id: 'teklif', label: 'Teklif kuralları', icon: FileText, key: 'promats_setup_quote' },
  { id: 'belgeler', label: 'Belgeler ve e-posta', icon: Mail, key: 'promats_setup_documents' },
  { id: 'numaralar', label: 'Numara serileri', icon: ListOrdered, key: 'promats_setup_numbers' },
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
    {tab === 'urunler' ? <ProductsTab/> : tab === 'numaralar' ? <RowsTab title="Numara serileri" hint="Belge türüne göre önek ve sıradaki numarayı kaydedin." form={form} setField={setField} columns={['Belge türü', 'Önek', 'Sıradaki numara']}/> : tab === 'atolyeler' ? <RowsTab title="Atölyeler" hint="Üretim atölyelerini ve adreslerini tanımlayın." form={form} setField={setField} columns={['Atölye adı', 'Kod', 'Adres']}/> : tab === 'kurlar' ? <CurrencyTab form={form} setField={setField}/> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-5">{sections[tab].map((section) => <section key={section.title} className={card}><h2 className="text-base font-black">{section.title}</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{section.fields.map(([field, label]) => <label key={field} className={`text-xs font-bold text-slate-600 ${['address','quote_footer','quote_email_text','proforma_email_text'].includes(field) ? 'md:col-span-2' : ''}`}>{label}{['address','quote_footer','quote_email_text','proforma_email_text'].includes(field) ? <textarea rows={3} value={form[field] ?? ''} onChange={(event) => setField(field, event.target.value)} className={input}/> : <input value={form[field] ?? ''} onChange={(event) => setField(field, event.target.value)} className={input}/>}</label>)}</div></section>)}</div><aside className={card}><h2 className="font-black">Kurulum durumu</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bu sayfa mevcut Promats ayarlarını gösterir. Vergi, iletişim ve banka bilgilerini gerçek şirket belgeleriyle doğrulayın.</p><Link href="/admin/firma-bulma" className="mt-4 inline-block text-sm font-bold text-blue-700">Firma Bulma’ya git →</Link></aside></div>}
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

function RowsTab({ title, hint, form, setField, columns }: { title: string; hint: string; form: Form; setField: (field: string, value: string) => void; columns: string[] }) {
  const rows = useMemo(() => { try { const value = JSON.parse(form.rows ?? '[]'); return Array.isArray(value) ? value as string[][] : []; } catch { return []; } }, [form.rows]);
  function change(next: string[][]) { setField('rows', JSON.stringify(next)); }
  return <section className={card}><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-slate-500">{hint}</p><div className="mt-4 space-y-3">{rows.map((row, index) => <div key={index} className="flex flex-wrap gap-2 rounded-xl border p-3">{columns.map((column, col) => <label key={column} className="min-w-[150px] flex-1 text-xs font-bold">{column}<input value={row[col] ?? ''} onChange={(event) => change(rows.map((item, i) => i === index ? columns.map((_, c) => c === col ? event.target.value : item[c] ?? '') : item))} className={input}/></label>)}<button onClick={() => change(rows.filter((_, i) => i !== index))} className="self-end rounded-lg border px-3 py-2 text-xs font-bold text-rose-700">Sil</button></div>)}</div><button onClick={() => change([...rows, columns.map(() => '')])} className="mt-4 rounded-lg border px-4 py-2 text-sm font-bold">Yeni satır ekle</button></section>;
}

function CurrencyTab({ form, setField }: { form: Form; setField: (field: string, value: string) => void }) {
  return <section className={card}><h2 className="font-black">Para birimi ve kur</h2><p className="mt-1 text-sm text-slate-500">Teklifler için kullanılacak para birimi ve manuel kur kayıtlarını burada tutun.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{[['default_currency','Varsayılan para birimi'],['base_currency','Ana para birimi'],['eur_rate','EUR kuru'],['usd_rate','USD kuru'],['rate_date','Kur tarihi']].map(([field,label]) => <label key={field} className="text-xs font-bold">{label}<input value={form[field] ?? ''} onChange={(event) => setField(field,event.target.value)} className={input}/></label>)}</div></section>;
}
