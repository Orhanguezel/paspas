'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Building2, ExternalLink, Package, TrendingUp, Truck, X } from 'lucide-react';
import { useFirmaBilgileriQuery, useFirmaDetayQuery, useFirmaGtipKaynaklariQuery } from '@/integrations/endpoints/admin/erp/firma_bulma.endpoints';

export type CustomsCompany = { name: string; role: 'alici' | 'tedarikci'; country: string | null; queryCountry?: string | null };

const number = new Intl.NumberFormat('tr-TR');
const section = 'rounded-2xl border border-slate-200 bg-white p-4 sm:p-5';
const date = (value: string | null | undefined) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toLocaleDateString('tr-TR');
};

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4"><strong className="block text-lg text-slate-950">{value}</strong><span className="text-xs font-semibold text-slate-500">{label}</span></div>;
}

export default function CustomsCompanyDrawer({ company, onClose }: { company: CustomsCompany; onClose: () => void }) {
  const [history, setHistory] = useState<CustomsCompany[]>([]);
  const drawerRef = useRef<HTMLElement>(null);
  const active = history.at(-1) ?? company;
  const detailCountry = active.queryCountry === undefined ? active.country : active.queryCountry;
  const { currentData: data, isFetching, isError } = useFirmaDetayQuery({ buyer: active.name, country: detailCountry, role: active.role });
  const contacts = useFirmaBilgileriQuery({ name: active.name, country: active.country });
  const ownProducts = useFirmaGtipKaynaklariQuery();
  const contact = contacts.currentData?.items?.[active.name];
  const peak = Math.max(1, ...(data?.timeline ?? []).map(row => row.shipments));
  const sharedCodes = (ownProducts.data?.codes ?? []).filter(source => data?.products.some(product => product.hsCode.startsWith(source.code)));

  useEffect(() => { drawerRef.current?.scrollTo({ top: 0 }); }, [active.name, active.role, detailCountry]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (history.length) setHistory(previous => previous.slice(0, -1));
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [history.length, onClose]);

  return createPortal(<div className="fixed inset-0 z-[120] flex justify-end bg-slate-950/55" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside ref={drawerRef} role="dialog" aria-modal="true" aria-label={`${active.name} gümrük firma kartı`} className="h-dvh w-full max-w-[760px] overflow-x-hidden overflow-y-auto bg-slate-50 shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start gap-3 border-b bg-white px-4 py-4 sm:px-6">
        {history.length > 0 && <button type="button" onClick={() => setHistory(previous => previous.slice(0, -1))} aria-label="Önceki firmaya dön" className="rounded-lg border p-2 hover:bg-slate-50"><ArrowLeft className="size-4" /></button>}
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Building2 className="size-5" /></div>
        <div className="min-w-0 flex-1"><h2 className="break-words text-lg font-bold text-slate-950">{active.name}</h2><p className="text-xs text-slate-500">{active.country ? `${active.queryCountry === null ? 'Sözlük ülkesi' : 'Ülke'}: ${active.country}` : 'Ülke belirtilmedi'} · {active.role === 'alici' ? 'Alıcı' : 'Tedarikçi'} · Gümrük firma kartı</p></div>
        <button type="button" onClick={onClose} aria-label="Gümrük firma kartını kapat" className="rounded-lg border p-2 hover:bg-slate-50"><X className="size-4" /></button>
      </header>
      <div className="space-y-4 p-4 sm:p-6">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Bu kart gümrük kayıtlarındaki firma adına göre açılır. Gümrük firması ile CRM firmasının aynı tüzel kişi olduğu doğrulanmış değildir. Sayılar kaynak kayıtlarını gösterir.</p>
        {isFetching && !data && <p role="status" className="text-sm">Gümrük firma kartı yükleniyor…</p>}
        {isError && <p role="alert" className="text-sm text-red-700">Firma ayrıntıları alınamadı.</p>}
        {data && data.totals.shipments === 0 && <p role="status" className="text-sm text-slate-600">Bu ad ve ülke için gümrük kaydı bulunamadı.</p>}
        {data && <>
          <section className={section}>
            <h3 className="font-bold text-slate-950">Promats ürünleriyle GTİP kesişimi</h3>
            <p className="mt-1 text-xs text-slate-500">Yalnız gösterilen gümrük ürün kodları ile Firma Kurulumu’nda kayıtlı Promats kodları karşılaştırılır. Kod kesişimi ürün satın alma niyetini kanıtlamaz.</p>
            {sharedCodes.length ? <div className="mt-3 flex flex-wrap gap-2">{sharedCodes.map(item => <span key={item.code} className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-800">{item.code} · {item.productNames.slice(0, 2).join(', ')}</span>)}</div> : <p className="mt-3 text-sm text-slate-500">{ownProducts.isFetching ? 'Ürün kodları kontrol ediliyor…' : ownProducts.isError ? 'Promats ürün kodları alınamadı.' : 'Gösterilen kayıtlarda ortak GTİP bulunmadı.'}</p>}
          </section>
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Kaynak kaydı" value={number.format(data.totals.shipments)} />
            <Stat label="Net ağırlık (kg)" value={data.totals.netWeight == null ? '—' : number.format(Math.round(data.totals.netWeight))} />
            <Stat label={active.role === 'alici' ? 'Tedarikçi' : 'Alıcı'} value={number.format(data.totals.suppliers)} />
            <Stat label="GTİP kodu" value={number.format(data.totals.products)} />
          </section>
          <section className={section}>
            <h3 className="flex items-center gap-2 font-bold text-slate-950"><TrendingUp className="size-4 text-indigo-600" />{active.role === 'alici' ? 'Dönemlere göre alım' : 'Dönemlere göre satış'}</h3>
            <div className="mt-3 space-y-2">{data.timeline.length ? data.timeline.map(row => <div key={row.period} className="flex items-center gap-3 text-sm"><span className="w-16 shrink-0 font-medium">{row.period}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${100 * row.shipments / peak}%` }} /></div><span className="w-14 text-right">{number.format(row.shipments)}</span></div>) : <p className="text-sm text-slate-500">Tarihli kayıt yok.</p>}</div>
            <p className="mt-3 text-xs text-slate-500">Veri aralığı: {date(data.totals.firstDate)} – {date(data.totals.lastDate)}</p>
          </section>
          <section className={section}>
            <h3 className="flex items-center gap-2 font-bold text-slate-950"><Truck className="size-4 text-indigo-600" />{active.role === 'alici' ? 'Kimden alıyor' : 'Kime satıyor'}</h3>
            <div className="mt-3 divide-y">{data.suppliers.length ? data.suppliers.map((row, index) => <button key={`${row.name}-${row.country}-${index}`} type="button" onClick={() => setHistory(previous => [...previous, { name: row.name, country: row.country, role: active.role === 'alici' ? 'tedarikci' : 'alici' }])} className="flex w-full flex-wrap items-center justify-between gap-2 py-2 text-left text-sm hover:text-indigo-700 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600" aria-label={`${row.name} gümrük firma kartını aç`}><span className="min-w-0 break-words font-medium">{row.name}<span className="ml-2 text-xs font-normal text-slate-500">{row.country || 'Ülke yok'}</span></span><span className="text-slate-500">{number.format(row.shipments)} kayıt</span></button>) : <p className="py-2 text-sm text-slate-500">Karşı firma kaydı yok.</p>}</div>
            {data.counterpartPage.hasMore && <p className="text-xs text-slate-500">İlk {data.suppliers.length} / {number.format(data.counterpartPage.total)} firma gösteriliyor.</p>}
          </section>
          <section className={section}>
            <h3 className="flex items-center gap-2 font-bold text-slate-950"><Package className="size-4 text-indigo-600" />{active.role === 'alici' ? 'Aldığı GTİP kodları' : 'Sattığı GTİP kodları'}</h3>
            <div className="mt-3 space-y-2">{data.products.length ? data.products.map(row => <div key={row.hsCode} className="flex flex-wrap justify-between gap-2 rounded-lg border bg-slate-50 p-2 text-sm"><span className="min-w-0 break-words"><strong>{row.hsCode}</strong>{row.description ? ` · ${row.description}` : ''}</span><span className="text-slate-500">{number.format(row.shipments)} kayıt</span></div>) : <p className="text-sm text-slate-500">GTİP kodu bulunamadı.</p>}</div>
            {data.productPage.hasMore && <p className="mt-2 text-xs text-slate-500">İlk {data.products.length} / {number.format(data.productPage.total)} kod gösteriliyor.</p>}
          </section>
          <section className={section}>
            <h3 className="font-bold text-slate-950">İletişim ve yetkililer</h3>
            {contacts.isFetching && !contact ? <p className="mt-2 text-sm text-slate-500">Bilinen iletişim kayıtları aranıyor…</p> : contact ? <div className="mt-3 space-y-2 break-words text-sm">
              {contact.website && <p>Web: <a href={contact.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-700 underline">{contact.website}<ExternalLink className="size-3" /></a></p>}
              {contact.emails.length > 0 && <p>E-posta: {contact.emails.join(', ')}</p>}
              {contact.phones.length > 0 && <p>Telefon: {contact.phones.join(', ')}</p>}
              {contact.address && <p>Adres: {contact.address}</p>}
              {contact.people.map((person, index) => <p key={`${person.fullName}-${index}`}>{person.fullName || 'İsim yok'}{person.title ? ` · ${person.title}` : ''}{person.email ? ` · ${person.email}` : ''}</p>)}
              <p className="text-xs text-slate-500">Kaynak: {contact.sources.join(', ') || 'İletişim havuzu'}</p>
            </div> : <p className="mt-2 text-sm text-slate-500">Eşleşen iletişim kaydı yok.</p>}
          </section>
          <section className={section}>
            <h3 className="font-bold text-slate-950">Son kaynak kayıtları</h3>
            <div className="mt-3 space-y-2">{data.shipments.items.length ? data.shipments.items.map(row => <div key={row.id} className="rounded-lg border p-3 text-sm"><p><strong>{row.hsCode}</strong> · {date(row.date)} · {active.role === 'alici' ? row.exporter || 'Tedarikçi yok' : row.buyer || 'Alıcı yok'}</p><p className="mt-1 break-words text-xs text-slate-500">{row.description || 'Açıklama yok'} · {row.source || 'Kaynak belirtilmedi'}</p></div>) : <p className="text-sm text-slate-500">Kaynak kaydı bulunamadı.</p>}</div>
            {data.shipments.hasMore && <p className="mt-2 text-xs text-slate-500">Son {data.shipments.items.length} / {number.format(data.shipments.total)} kayıt gösteriliyor.</p>}
          </section>
        </>}
      </div>
    </aside>
  </div>, document.body);
}
