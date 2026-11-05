'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, PackageCheck, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStatusQuery } from '@/integrations/hooks';
import { useCreateMalKabulAdminMutation } from '@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints';
import { useListSatinAlmaAdminQuery } from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import type { SatinAlmaKalemDto, SatinAlmaSiparisDto } from '@/integrations/shared/erp/satin_alma.types';

const OPEN = new Set(['onaylandi', 'siparis_verildi', 'kismen_teslim']);
type Line = { order: SatinAlmaSiparisDto; line: SatinAlmaKalemDto };
const integerUnit = (unit: string | null) => ['adet', 'takim', 'takım'].includes((unit ?? '').toLocaleLowerCase('tr-TR'));
const qty = (value: number) => value.toLocaleString('tr-TR', { maximumFractionDigits: 4 });

export default function DepoMalKabulClient() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Line | null>(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const submitting = useRef(false);
  const { data: status } = useStatusQuery();
  const roles = status?.user?.roles ?? (status?.user?.role ? [status.user.role] : []);
  const canSwitch = roles.includes('admin') || (roles.includes('operator') && roles.includes('satin_almaci'));
  const { data, isLoading, isFetching, error, refetch } = useListSatinAlmaAdminQuery({ limit: 500 });
  const [create] = useCreateMalKabulAdminMutation();
  const lines = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    return (data?.items ?? []).filter((order) => order.isActive && OPEN.has(order.durum))
      .flatMap((order) => (order.items ?? []).filter((line) => line.kalanMiktar > 0).map((line) => ({ order, line })))
      .filter(({ order, line }) => !query || [order.siparisNo, order.tedarikciAd, line.urunKod, line.urunAd].some((part) => part?.toLocaleLowerCase('tr-TR').includes(query)));
  }, [data?.items, search]);

  async function receive() {
    if (!selected || submitting.current) return;
    const normalized = amount.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) return toast.error('Geçerli bir miktar girin; en fazla 4 ondalık kullanılabilir.');
    const value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0 || value > selected.line.kalanMiktar || (integerUnit(selected.line.birim) && !Number.isInteger(value)))
      return toast.error(`Miktar 0’dan büyük, en fazla ${qty(selected.line.kalanMiktar)} ${selected.line.birim ?? 'adet'} olmalı.`);
    submitting.current = true; setSaving(true);
    const { order, line } = selected;
    const retryKey = `mal-kabul:${order.id}:${line.id}:${normalized}`;
    const requestId = sessionStorage.getItem(retryKey) || crypto.randomUUID();
    sessionStorage.setItem(retryKey, requestId);
    try {
      await create({ requestId, kaynakTipi: 'satin_alma', satinAlmaSiparisId: order.id, satinAlmaKalemId: line.id,
        urunId: line.urunId, tedarikciId: order.tedarikciId, gelenMiktar: value, kaliteDurumu: 'kabul', notlar: 'Mobil depo mal kabulü' }).unwrap();
      sessionStorage.removeItem(retryKey);
      const refreshed = await refetch().unwrap().catch(() => null);
      const current = refreshed?.items.flatMap((item) => item.items ?? []).find((item) => item.id === line.id);
      const remaining = current?.kalanMiktar ?? Math.max(0, line.kalanMiktar - value);
      const message = `${qty(value)} ${line.birim ?? 'adet'} teslim alındı. Kalan: ${qty(remaining)} ${line.birim ?? 'adet'}.`;
      setSuccess(message); toast.success(message); setSelected(null); setAmount('');
    } catch (reason) {
      const message = (reason as { data?: { error?: { message?: string } } })?.data?.error?.message;
      if (message === 'gelen_miktar_kalan_miktari_asiyor' || message === 'satin_alma_siparisi_acik_degil') {
        await refetch(); toast.error('Siparişin güncel kalanı değişti. Listeyi yenileyip tekrar deneyin.');
      } else toast.error(message ?? 'Teslimat kaydedilemedi. Aynı işlemi tekrar deneyebilirsiniz.');
    } finally { submitting.current = false; setSaving(false); }
  }

  return <div className="min-w-0 space-y-5 pb-8 text-base">
    <header className="flex items-start justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><PackageCheck className="size-7"/>Mal Kabul</h1><p className="mt-1 text-base text-muted-foreground">Açık sipariş teslimatları</p></div><Button type="button" variant="outline" size="icon" className="size-12 shrink-0" aria-label="Listeyi yenile" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={`size-5 ${isFetching ? 'animate-spin' : ''}`}/></Button></header>
    {canSwitch && <Link href="/admin/alan-sec" className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-base font-semibold"><ArrowLeft className="size-5"/>Alan değiştir</Link>}
    <label className="relative block"><Search className="absolute left-4 top-4 size-5 text-muted-foreground"/><span className="sr-only">Malzeme veya tedarikçi ara</span><Input className="h-14 rounded-xl pl-12 text-base" placeholder="Malzeme veya tedarikçi ara" value={search} onChange={(event) => setSearch(event.target.value)}/></label>
    {success && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-base font-semibold text-emerald-900">{success}</p>}
    {isLoading ? <p role="status">Açık teslimatlar yükleniyor…</p> : error ? <p role="alert">Siparişler yüklenemedi. Yeniden deneyin.</p> : lines.length === 0 ? <p className="rounded-xl border p-6 text-center">Teslim alınacak açık malzeme bulunmuyor.</p> : <div className="space-y-3">{lines.map((item) => <button key={item.line.id} type="button" onClick={() => { setSelected(item); setAmount(''); }} className="flex min-h-36 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border bg-card p-5 text-left shadow-sm active:bg-muted"><span className="min-w-0 space-y-1"><strong className="block break-words text-lg leading-snug">{item.line.urunAd ?? item.line.urunKod ?? 'Malzeme'}</strong><span className="block break-all text-sm text-muted-foreground">{item.line.urunKod}</span><span className="block break-words text-base">{item.order.tedarikciAd ?? 'Tedarikçi belirtilmedi'}</span><span className="block text-sm text-muted-foreground">Sipariş: {item.order.siparisNo}</span><span className="block pt-1 text-lg font-bold text-blue-700">Kalan: {qty(item.line.kalanMiktar)} {item.line.birim ?? 'adet'}</span></span><ArrowRight className="size-6 shrink-0"/></button>)}</div>}
    {selected && <div role="dialog" aria-modal="true" aria-label="Teslim alma formu" className="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-background p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]"><div className="mx-auto flex w-full max-w-xl flex-1 flex-col"><button type="button" onClick={() => !saving && setSelected(null)} className="mb-8 inline-flex min-h-12 items-center gap-2 self-start text-base font-semibold"><ArrowLeft className="size-5"/>Listeye dön</button><h2 className="break-words text-3xl font-bold leading-tight">{selected.line.urunAd ?? selected.line.urunKod ?? 'Malzeme'}</h2><p className="mt-2 break-all text-base text-muted-foreground">{selected.line.urunKod}</p><div className="mt-6 space-y-3 rounded-2xl bg-muted/60 p-5 text-base"><p><span className="text-muted-foreground">Tedarikçi:</span> <strong>{selected.order.tedarikciAd ?? '—'}</strong></p><p><span className="text-muted-foreground">Sipariş:</span> <strong>{selected.order.siparisNo}</strong></p><p className="text-xl"><span className="text-muted-foreground">Kalan:</span> <strong>{qty(selected.line.kalanMiktar)} {selected.line.birim ?? 'adet'}</strong></p></div><label htmlFor="received-amount" className="mt-8 block text-lg font-semibold">Teslim alınan miktar ({selected.line.birim ?? 'adet'})</label><Input id="received-amount" type="text" inputMode={integerUnit(selected.line.birim) ? 'numeric' : 'decimal'} autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Miktar girin" className="mt-3 h-16 rounded-xl text-2xl"/><div className="flex-1"/><Button type="button" onClick={() => void receive()} disabled={saving} className="mt-8 min-h-16 w-full rounded-xl text-lg font-bold">{saving ? 'Kaydediliyor…' : 'Teslimatı Onayla'}</Button></div></div>}
  </div>;
}
