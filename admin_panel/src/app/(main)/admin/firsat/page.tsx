'use client';

import { useMemo, useState } from 'react';
import { AlarmClock, LayoutGrid, List, Plus, Target, TrendingUp, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  type CrmDeal, type CrmStage, useCrmPipelinesQuery, useCrmDealsQuery, useCrmDealQuery,
  useCrmCreateDealMutation, useCrmUpdateDealMutation, useCrmMoveDealMutation,
  useCrmLossReasonsQuery, useCrmDealActivitiesQuery, useCrmAddActivityMutation,
  useCrmCustomersForDealsQuery,
} from '@/integrations/endpoints/admin/erp/crm_firsatlar.endpoints';

const money = (amount: number, currency: string) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY', maximumFractionDigits: 0 }).format(Number(amount) || 0);
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString('tr-TR') : '—';
const errorText = (error: unknown) => {
  const data = error && typeof error === 'object' && 'data' in error ? (error as { data?: { error?: { message?: string } } }).data : null;
  return data?.error?.message ?? 'İşlem tamamlanamadı.';
};

export default function FirsatPage() {
  const [view, setView] = useState<'pano' | 'liste'>('pano');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CrmDeal | null>(null);
  const [pendingStage, setPendingStage] = useState<{ id: string; stage: CrmStage } | null>(null);
  const [lossReason, setLossReason] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [form, setForm] = useState({ title: '', musteriId: '', amount: '', currency: 'TRY', expectedCloseDate: '', source: '', stageId: '', nextAction: '', nextActionDate: '' });
  const { data: pipelines = [] } = useCrmPipelinesQuery();
  const { data, isLoading, isFetching, refetch } = useCrmDealsQuery({ limit: 500 });
  const { data: reasons = [] } = useCrmLossReasonsQuery();
  const { data: customers } = useCrmCustomersForDealsQuery();
  const [createDeal, createState] = useCrmCreateDealMutation();
  const [updateDeal, updateState] = useCrmUpdateDealMutation();
  const [moveDeal] = useCrmMoveDealMutation();
  const stages = pipelines[0]?.stages ?? [];
  const deals = useMemo(() => (data?.items ?? []).filter((item) => `${item.title} ${item.musteri_adi ?? ''}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))), [data, query]);
  const openDeals = deals.filter((deal) => deal.status === 'open' || deal.status === 'on_hold');
  const grouped = stages.map((stage) => ({ stage, items: (view === 'pano' ? openDeals : deals).filter((deal) => deal.stage_id === stage.id) }));
  const due = openDeals.filter((deal) => deal.expected_close_date && new Date(deal.expected_close_date) < new Date()).length;
  const won = deals.filter((deal) => deal.status === 'won').length;

  function edit(deal?: CrmDeal) {
    setEditing(deal ?? null);
    setForm({ title: deal?.title ?? '', musteriId: deal?.musteri_id ?? '', amount: deal ? String(deal.amount) : '', currency: deal?.currency ?? 'TRY', expectedCloseDate: deal?.expected_close_date?.slice(0, 10) ?? '', source: deal?.source ?? '', stageId: deal?.stage_id ?? stages[0]?.id ?? '', nextAction: deal?.next_action ?? '', nextActionDate: deal?.next_action_date?.slice(0, 10) ?? '' });
    setFormOpen(true);
  }
  async function save() {
    if (!form.title.trim()) return toast.error('Fırsat başlığı gerekli.');
    try {
      const body = { title: form.title.trim(), musteriId: form.musteriId || null, amount: Number(form.amount) || 0, currency: form.currency, expectedCloseDate: form.expectedCloseDate || null, source: form.source || null, nextAction: form.nextAction || null, nextActionDate: form.nextActionDate || null };
      if (editing) await updateDeal({ id: editing.id, body }).unwrap();
      else await createDeal({ ...body, stageId: form.stageId || undefined }).unwrap();
      setFormOpen(false); toast.success('Fırsat kaydedildi.');
    } catch (error) { toast.error(errorText(error)); }
  }
  async function changeStage(id: string, stage: CrmStage) {
    if (stage.is_lost || stage.name === 'Ertelendi') { setPendingStage({ id, stage }); return; }
    try { await moveDeal({ id, stageId: stage.id }).unwrap(); toast.success('Aşama güncellendi.'); }
    catch (error) { toast.error(errorText(error)); }
  }
  async function confirmLoss() {
    if (!pendingStage || (pendingStage.stage.is_lost && !lossReason)) return toast.error('Kaybetme nedeni seçin.');
    if (pendingStage.stage.name === 'Ertelendi' && !followupDate) return toast.error('Takip tarihi seçin.');
    try { await moveDeal({ id: pendingStage.id, stageId: pendingStage.stage.id, lostReasonId: pendingStage.stage.is_lost ? lossReason : undefined, nextActionDate: pendingStage.stage.name === 'Ertelendi' ? followupDate : undefined }).unwrap(); setPendingStage(null); setLossReason(''); setFollowupDate(''); toast.success('Aşama güncellendi.'); }
    catch (error) { toast.error(errorText(error)); }
  }
  return <main className="space-y-5 text-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold text-slate-500">Satış / Fırsat ve Pipeline</p><h1 className="mt-1 text-2xl font-black">Fırsat ve Pipeline</h1><p className="text-sm text-slate-500">Satış hattındaki her iş, aşaması, tutarı ve sıradaki adımıyla tek panoda.</p></div>
      <button onClick={() => edit()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Yeni fırsat</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {([{ Icon: Target, label: 'Açık fırsat', value: openDeals.length }, { Icon: TrendingUp, label: 'Ağırlıklı toplam', value: Object.entries(openDeals.reduce<Record<string, number>>((totals, deal) => ({ ...totals, [deal.currency]: (totals[deal.currency] || 0) + Number(deal.amount || 0) * Number(deal.probability || 0) / 100 }), {})).map(([currency, amount]) => money(amount, currency)).join(' · ') || '—' }, { Icon: AlarmClock, label: 'Geciken kapanış', value: due }, { Icon: Trophy, label: 'Kazanılan', value: won }]).map(({ Icon, label, value }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Icon size={17} /> {label}</div><div className="mt-2 text-2xl font-black">{String(value)}</div></div>)}
    </div>
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex rounded-xl border p-0.5"><button onClick={() => setView('pano')} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${view === 'pano' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}><LayoutGrid size={14} /> Pano</button><button onClick={() => setView('liste')} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${view === 'liste' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}><List size={14} /> Liste</button></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Fırsat veya firma ara" className="min-w-48 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <button onClick={() => refetch()} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">{isFetching ? 'Yenileniyor…' : 'Yenile'}</button>
    </div>
    {isLoading ? <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500">Fırsatlar yükleniyor…</div> : view === 'pano' ? <div className="flex gap-3 overflow-x-auto pb-4">{grouped.filter(({ stage }) => !stage.is_won && !stage.is_lost).map(({ stage, items }) => <section key={stage.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) void changeStage(id, stage); }} className="min-h-[370px] min-w-[235px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-2.5"><div className="mb-3 flex items-center justify-between rounded-xl border bg-white p-2.5 text-sm font-bold"><span className="truncate">{stage.name}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{items.length}</span></div><div className="space-y-2">{items.map((deal) => <button key={deal.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', deal.id)} onClick={() => setSelectedId(deal.id)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-indigo-300"><div className="text-sm font-bold">{deal.title}</div><div className="mt-1 text-xs text-slate-500">{deal.musteri_adi || 'Firma belirtilmedi'}</div><div className="mt-3 flex justify-between text-xs"><strong>{money(deal.amount, deal.currency)}</strong><span>%{deal.probability ?? stage.probability}</span></div><div className="mt-1 text-[11px] text-slate-500">Beklenen kapanış: {date(deal.expected_close_date)}</div></button>)}</div></section>)}</div> : <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Fırsat', 'Firma', 'Aşama', 'Tutar', 'Olasılık', 'Beklenen kapanış', 'Güncellendi'].map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{deals.map((deal) => <tr key={deal.id} onClick={() => setSelectedId(deal.id)} className="cursor-pointer border-t hover:bg-indigo-50"><td className="p-3 font-bold">{deal.title}</td><td className="p-3">{deal.musteri_adi || '—'}</td><td className="p-3">{deal.stage_name}</td><td className="p-3">{money(deal.amount, deal.currency)}</td><td className="p-3">%{deal.probability ?? 0}</td><td className="p-3">{date(deal.expected_close_date)}</td><td className="p-3">{date(deal.updated_at)}</td></tr>)}</tbody></table>{!deals.length && <p className="p-8 text-center text-sm text-slate-500">Fırsat bulunamadı.</p>}</div>}
    {selectedId && <DealDrawer id={selectedId} stages={stages} onClose={() => setSelectedId(null)} onEdit={(deal) => { setSelectedId(null); edit(deal); }} onStage={changeStage} />}
    {formOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Fırsat formu" className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-4 flex justify-between"><h2 className="text-lg font-black">{editing ? 'Fırsatı düzenle' : 'Yeni fırsat'}</h2><button onClick={() => setFormOpen(false)} aria-label="Kapat"><X size={20} /></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2 text-xs font-bold">Başlık<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label><label className="sm:col-span-2 text-xs font-bold">Firma<select value={form.musteriId} onChange={(e) => setForm({ ...form, musteriId: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm"><option value="">Firma seçin</option>{customers?.items?.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}</select></label><label className="text-xs font-bold">Tahmini tutar<input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label><label className="text-xs font-bold">Para birimi<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm">{['TRY', 'EUR', 'USD', 'GBP'].map((c) => <option key={c}>{c}</option>)}</select></label><label className="text-xs font-bold">Beklenen kapanış<input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label>{!editing && <label className="text-xs font-bold">Aşama<select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm">{stages.filter((s) => !s.is_won && !s.is_lost && s.name !== 'Ertelendi').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}<label className="sm:col-span-2 text-xs font-bold">Kaynak<input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label><label className="sm:col-span-2 text-xs font-bold">Sıradaki adım<input value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label><label className="sm:col-span-2 text-xs font-bold">Sıradaki adım tarihi<input type="date" value={form.nextActionDate} onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })} className="mt-1 w-full rounded-lg border p-2.5 text-sm" /></label></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm">Vazgeç</button><button onClick={() => void save()} disabled={createState.isLoading || updateState.isLoading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Kaydet</button></div></section></div>}
    {pendingStage && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-label="Kaybetme nedeni" className="w-full max-w-md rounded-2xl bg-white p-5"><h2 className="text-lg font-black">{pendingStage.stage.is_lost ? "Kaybetme nedeni" : "Takip tarihi"}</h2>{pendingStage.stage.is_lost ? <><p className="mt-1 text-sm text-slate-500">Kaybedildi aşamasına geçmek için neden seçin.</p><select value={lossReason} onChange={(e) => setLossReason(e.target.value)} className="mt-4 w-full rounded-lg border p-2.5"><option value="">Neden seçin</option>{reasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.name}</option>)}</select></> : <><p className="mt-1 text-sm text-slate-500">Ertelenen fırsat için takip tarihi seçin.</p><input type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} className="mt-4 w-full rounded-lg border p-2.5" /></>}<div className="mt-4 flex justify-end gap-2"><button onClick={() => setPendingStage(null)} className="rounded-lg border px-4 py-2 text-sm">Vazgeç</button><button onClick={() => void confirmLoss()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white">Kaydet</button></div></section></div>}
  </main>;
}

function DealDrawer({ id, stages, onClose, onEdit, onStage }: { id: string; stages: CrmStage[]; onClose: () => void; onEdit: (deal: CrmDeal) => void; onStage: (id: string, stage: CrmStage) => void }) {
  const { data: deal } = useCrmDealQuery(id);
  const { data: activities = [] } = useCrmDealActivitiesQuery(id);
  const [activityType, setActivityType] = useState('note');
  const [activityText, setActivityText] = useState('');
  const [addActivity, state] = useCrmAddActivityMutation();
  async function add() { if (!activityText.trim()) return; try { await addActivity({ id, type: activityType, subject: activityText.trim() }).unwrap(); setActivityText(''); toast.success('Aktivite eklendi.'); } catch (error) { toast.error(errorText(error)); } }
  return <div className="fixed inset-0 z-[90] bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside role="dialog" aria-modal="true" aria-label="Fırsat detayı" className="absolute inset-y-0 right-0 w-full max-w-[720px] overflow-y-auto bg-slate-50 p-4 shadow-2xl sm:p-6"><div className="mb-4 flex justify-between"><h2 className="text-xl font-black">Fırsat detayı</h2><button onClick={onClose} aria-label="Kapat" className="rounded-lg border bg-white p-2"><X size={18} /></button></div>{deal && <><section className="rounded-2xl border bg-white p-5"><div className="flex justify-between gap-3"><div><h3 className="text-lg font-black">{deal.title}</h3><p className="text-sm text-slate-500">{deal.musteri_adi || 'Firma belirtilmedi'}</p></div><button onClick={() => onEdit(deal)} className="self-start rounded-lg border px-3 py-2 text-xs font-bold">Düzenle</button></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Tutar</span><br /><strong>{money(deal.amount, deal.currency)}</strong></p><p><span className="text-slate-500">Olasılık</span><br /><strong>%{deal.probability ?? 0}</strong></p><p><span className="text-slate-500">Kapanış</span><br /><strong>{date(deal.expected_close_date)}</strong></p><p><span className="text-slate-500">Kaynak</span><br /><strong>{deal.source || '—'}</strong></p><p><span className="text-slate-500">Sıradaki adım</span><br /><strong>{deal.next_action || '—'}</strong></p><p><span className="text-slate-500">Takip tarihi</span><br /><strong>{date(deal.next_action_date)}</strong></p></div><label className="mt-4 block text-xs font-bold">Aşama<select value={deal.stage_id} onChange={(e) => { const stage = stages.find((s) => s.id === e.target.value); if (stage) onStage(id, stage); }} className="mt-1 w-full rounded-lg border p-2.5 text-sm">{stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>{deal.lost_reason && <p className="mt-3 text-xs text-rose-700">Kaybetme nedeni: {deal.lost_reason}</p>}</section><section className="mt-4 rounded-2xl border bg-white p-5"><h3 className="font-black">Aktiviteler</h3><div className="mt-3 flex gap-2"><select value={activityType} onChange={(e) => setActivityType(e.target.value)} className="rounded-lg border p-2 text-xs">{[['note', 'Not'], ['call', 'Arama'], ['meeting', 'Görüşme'], ['email', 'E-posta'], ['whatsapp', 'WhatsApp'], ['task', 'Görev']].map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select><input value={activityText} onChange={(e) => setActivityText(e.target.value)} placeholder="Aktivite açıklaması" className="min-w-0 flex-1 rounded-lg border p-2 text-sm" /><button onClick={() => void add()} disabled={state.isLoading} className="rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white">Ekle</button></div><div className="mt-4 space-y-2">{activities.map((item) => <article key={item.id} className="rounded-xl border bg-slate-50 p-3"><div className="text-sm font-bold">{item.subject}</div><div className="text-xs text-slate-500">{item.type} · {date(item.created_at)}{item.owner_name ? ` · ${item.owner_name}` : ''}</div>{item.body && <p className="mt-1 text-sm">{item.body}</p>}</article>)}{!activities.length && <p className="text-sm text-slate-500">Henüz aktivite yok.</p>}</div></section></>}</aside></div>;
}
