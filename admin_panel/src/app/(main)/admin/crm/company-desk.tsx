'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAddCompanyActivityMutation, useAddCompanyContactMutation, useAddCompanyResearchMutation, useCompanyDeskQuery, useSaveCompanyProductMutation, useSaveCompanyProfileMutation } from '@/integrations/endpoints/admin/erp/crm_company_desk.endpoints';

const groups = [
  { id: 'PROMATS', label: 'PROMATS · Oto paspas' },
  { id: 'MEFATECH', label: 'MEFATECH · Kar zinciri / SMARTPALET' },
  { id: 'WOGEN', label: 'WOGEN · Motosiklet topcase' },
] as const;
const fieldClass = 'w-full rounded-md border bg-background px-3 py-2 text-sm';

export default function CompanyDesk({ id }: { id: string }) {
  const { data, isLoading, isError, refetch } = useCompanyDeskQuery(id);
  const [addResearch] = useAddCompanyResearchMutation();
  const [addContact] = useAddCompanyContactMutation();
  const [saveProduct] = useSaveCompanyProductMutation();
  const [saveProfile] = useSaveCompanyProfileMutation();
  const [addActivity] = useAddCompanyActivityMutation();
  const [finding, setFinding] = useState('');
  const [source, setSource] = useState('');
  const [sourceType, setSourceType] = useState<'research' | 'customer_statement'>('research');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [actualSubject, setActualSubject] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try { await action(); toast.success(success); refetch(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Kayıt yapılamadı.'); }
    finally { setBusy(false); }
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">İhracat masası yükleniyor…</p>;
  if (isError || !data) return <p className="text-sm text-destructive">Firma araştırma bilgileri açılamadı.</p>;
  const planned = data.activities.filter(a => a.type === 'task' && !a.done);
  const actual = data.activities.filter(a => a.type !== 'task' || a.done);

  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Araştırma bulguları, müşteri beyanları, kişiler ve ürün ilgisi bu firma kartına bağlıdır. Taslak, gönderilmiş mesaj ve yanıt ayrı olaylardır.</p>
    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Firma profili</CardTitle></CardHeader><CardContent><form key={data.profile?.buyer_type ?? 'new'} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);run(()=>saveProfile({id,body:{buyerType:String(form.get('buyerType')||'').trim()||null,companyNote:String(form.get('companyNote')||'').trim()||null}}).unwrap(),'Firma profili kaydedildi.');}}><Input name="buyerType" defaultValue={data.profile?.buyer_type ?? ''} placeholder="Alıcı tipi (ör. distribütör)" /><Input name="companyNote" defaultValue={data.profile?.company_note ?? ''} placeholder="Firma özeti" /><Button size="sm" disabled={busy}>Kaydet</Button></form></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-3">
      {groups.map(group => {
        const product = data.products.find(p => p.product_group === group.id);
        return <Card key={group.id}><CardHeader className="pb-2"><CardTitle className="text-sm">{group.label}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <form key={product?.id ?? 'new'} className="space-y-2" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);run(()=>saveProduct({id,body:{productGroup:group.id,interestStatus:String(form.get('interestStatus')) as 'unknown'|'possible'|'confirmed'|'not_interested',currentSupplier:String(form.get('currentSupplier')||'').trim()||null,blocker:String(form.get('blocker')||'').trim()||null,purchaseTiming:String(form.get('purchaseTiming')||'').trim()||null,evidenceNote:String(form.get('evidenceNote')||'').trim()||null}}).unwrap(),'Ürün ilgisi kaydedildi.');}}>
          <select className={fieldClass} name="interestStatus" aria-label={`${group.id} ilgi durumu`} defaultValue={product?.interest_status ?? 'unknown'}>
            <option value="unknown">İlgi bilinmiyor</option><option value="possible">Olası uygunluk</option><option value="confirmed">Doğrulanmış ilgi</option><option value="not_interested">İlgilenmiyor</option>
          </select>
          <Input name="currentSupplier" defaultValue={product?.current_supplier ?? ''} placeholder="Mevcut tedarikçi" /><Input name="blocker" defaultValue={product?.blocker ?? ''} placeholder="Engel" /><Input name="purchaseTiming" defaultValue={product?.purchase_timing ?? ''} placeholder="Alım zamanı" /><Input name="evidenceNote" defaultValue={product?.evidence_note ?? ''} placeholder="İlgi kanıtı / açıklama" /><Button size="sm" variant="outline" disabled={busy}>Kaydet</Button>
          </form>
        </CardContent></Card>;
      })}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-sm">Yetkililer ({data.contacts.length})</CardTitle></CardHeader><CardContent className="space-y-3">
        {data.contacts.map(c => <div key={c.id} className="rounded-md border p-2 text-sm"><strong>{c.name}</strong> {c.title && <span className="text-muted-foreground">· {c.title}</span>}<p>{c.email || c.phone || 'İletişim bilgisi yok'}</p></div>)}
        <div className="grid gap-2 sm:grid-cols-2"><Input placeholder="Ad soyad" value={contactName} onChange={e=>setContactName(e.target.value)} /><Input placeholder="Görev" value={contactTitle} onChange={e=>setContactTitle(e.target.value)} /><Input className="sm:col-span-2" type="email" placeholder="E-posta" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} /></div>
        <Button size="sm" disabled={busy || !contactName.trim()} onClick={()=>run(async()=>{await addContact({id,body:{name:contactName.trim(),title:contactTitle.trim()||undefined,email:contactEmail.trim()||undefined}}).unwrap();setContactName('');setContactTitle('');setContactEmail('');},'Yetkili eklendi.')}>Kişi ekle</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Araştırmalar ({data.research.length})</CardTitle></CardHeader><CardContent className="space-y-3">
        {data.research.map(r => <div key={r.id} className="rounded-md border p-2 text-sm"><div className="mb-1 flex flex-wrap gap-1"><Badge variant="outline">{r.information_type === 'research' ? 'Araştırma' : 'Müşteri beyanı'}</Badge><Badge variant="secondary">{r.verification_status === 'verified' ? 'Doğrulandı' : r.verification_status === 'disputed' ? 'Çelişkili' : 'Doğrulanmadı'}</Badge></div><p>{r.finding}</p><p className="mt-1 text-xs text-muted-foreground">Kaynak: {r.source_url ? <a href={r.source_url} target="_blank" rel="noreferrer" className="underline">{r.source_label || r.source_url}</a> : r.source_label || 'Belirtilmedi'}{r.observed_at ? ` · ${r.observed_at.slice(0,10)}` : ''}</p></div>)}
        <select className={fieldClass} value={sourceType} onChange={e=>setSourceType(e.target.value as typeof sourceType)}><option value="research">Araştırma bulgusu</option><option value="customer_statement">Müşterinin söylediği</option></select>
        <textarea className={fieldClass} rows={3} placeholder="Bulgu veya müşteri beyanı" value={finding} onChange={e=>setFinding(e.target.value)} />
        <Input placeholder="Kaynak URL veya görüşme açıklaması" value={source} onChange={e=>setSource(e.target.value)} />
        <Button size="sm" disabled={busy || !finding.trim() || !source.trim()} onClick={()=>run(async()=>{await addResearch({id,body:{finding:finding.trim(),informationType:sourceType,...(source.startsWith('https://')?{sourceUrl:source.trim()}:{sourceLabel:source.trim()}),verificationStatus:'unverified'}}).unwrap();setFinding('');setSource('');},'Araştırma kaydedildi.')}>Bulgu ekle</Button>
      </CardContent></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-sm">Gerçekleşen temaslar ve sonuçlar</CardTitle></CardHeader><CardContent className="space-y-3">
        {actual.map(a=><div key={a.id} className="rounded-md border p-2 text-sm"><strong>{a.subject}</strong><p className="text-xs text-muted-foreground">{a.type} · {new Date(a.created_at).toLocaleDateString('tr-TR')}</p><p>{a.result || a.body || 'Sonuç kaydı yok'}</p></div>)}
        <Input placeholder="Görüşme konusu" value={actualSubject} onChange={e=>setActualSubject(e.target.value)} /><Input placeholder="Gerçekleşen sonuç" value={actualResult} onChange={e=>setActualResult(e.target.value)} />
        <Button size="sm" disabled={busy||!actualSubject.trim()||!actualResult.trim()} onClick={()=>run(async()=>{await addActivity({id,body:{type:'note',subject:actualSubject.trim(),result:actualResult.trim()}}).unwrap();setActualSubject('');setActualResult('');},'Temas kaydedildi.')}>Sonuç işle</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Planlanan sonraki işler</CardTitle></CardHeader><CardContent className="space-y-3">
        {planned.map(a=><div key={a.id} className="rounded-md border p-2 text-sm"><strong>{a.subject}</strong><p className="text-xs text-muted-foreground">{a.due_at ? new Date(a.due_at).toLocaleString('tr-TR') : 'Tarih belirlenmedi'}</p></div>)}
        <Input placeholder="Sonraki adım" value={taskSubject} onChange={e=>setTaskSubject(e.target.value)} /><Input type="datetime-local" aria-label="Takip tarihi" value={taskDate} onChange={e=>setTaskDate(e.target.value)} />
        <Button size="sm" disabled={busy||!taskSubject.trim()||!taskDate} onClick={()=>run(async()=>{await addActivity({id,body:{type:'task',subject:taskSubject.trim(),dueAt:new Date(taskDate).toISOString()}}).unwrap();setTaskSubject('');setTaskDate('');},'Takip planlandı.')}>Takip planla</Button>
      </CardContent></Card>
    </div>
  </div>;
}
