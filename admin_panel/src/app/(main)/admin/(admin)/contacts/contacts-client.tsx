'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Inbox, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useListContactsAdminQuery, useUpdateContactAdminMutation } from '@/integrations/endpoints/admin/contacts_admin.endpoints';
import type { ContactDto, ContactStatus } from '@/integrations/shared';

const STATUS: Record<ContactStatus, string> = { new: 'Yeni', in_progress: 'İşlemde', closed: 'Kapalı' };

export default function ContactsClient() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContactStatus | undefined>();
  const [selected, setSelected] = useState<ContactDto>();
  const [note, setNote] = useState('');
  const { data = [], isLoading } = useListContactsAdminQuery({ search: search || undefined, status, limit: 100 });
  const [update, updateState] = useUpdateContactAdminMutation();

  async function save(nextStatus: ContactStatus) {
    if (!selected) return;
    const updated = await update({ id: selected.id, patch: { status: nextStatus, is_resolved: nextStatus === 'closed', admin_note: note || null } }).unwrap();
    setSelected(updated); setNote(updated.admin_note ?? ''); toast.success('İletişim mesajı güncellendi.');
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-semibold"><Inbox className="size-6" /> İletişim Mesajları</h1><p className="text-sm text-muted-foreground">Web sitesinden gelen genel iletişim kayıtları.</p></div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Ad, telefon, konu veya mesaj ara" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select className="h-10 rounded-md border bg-background px-3 text-sm" value={status ?? ''} onChange={(e) => setStatus((e.target.value || undefined) as ContactStatus | undefined)}><option value="">Tüm durumlar</option><option value="new">Yeni</option><option value="in_progress">İşlemde</option><option value="closed">Kapalı</option></select></div></CardHeader><CardContent className="space-y-2">{isLoading ? <p>Yükleniyor…</p> : data.length === 0 ? <p className="py-10 text-center text-muted-foreground">Kayıt bulunamadı.</p> : data.map((item) => <button key={item.id} className={`w-full rounded-lg border p-3 text-left hover:bg-muted/50 ${selected?.id === item.id ? 'border-primary bg-muted/40' : ''}`} onClick={() => { setSelected(item); setNote(item.admin_note ?? ''); }}><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{item.name}</div><div className="text-xs text-muted-foreground">{item.phone}{item.email ? ` · ${item.email}` : ''}</div></div><Badge variant={item.status === 'new' ? 'destructive' : 'secondary'}>{STATUS[item.status]}</Badge></div><div className="mt-2 line-clamp-2 text-sm">{item.subject || item.message || 'Konu belirtilmedi'}</div><div className="mt-2 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('tr-TR')}</div></button>)}</CardContent></Card>
        <Card className="h-fit lg:sticky lg:top-4"><CardHeader><CardTitle>Mesaj Detayı</CardTitle></CardHeader><CardContent>{!selected ? <p className="text-sm text-muted-foreground">Detay için bir kayıt seçin.</p> : <div className="space-y-4"><div><div className="font-semibold">{selected.name}</div><div className="text-sm text-muted-foreground">{selected.phone} · {selected.email || 'E-posta yok'}</div></div><div><div className="text-xs font-medium uppercase text-muted-foreground">Konu</div><p>{selected.subject || 'Belirtilmedi'}</p></div><div><div className="text-xs font-medium uppercase text-muted-foreground">Mesaj</div><p className="whitespace-pre-wrap text-sm">{selected.message || 'Mesaj yok'}</p></div><Textarea placeholder="Yönetici notu" value={note} onChange={(e) => setNote(e.target.value)} rows={5} /><div className="flex flex-wrap gap-2"><Button disabled={updateState.isLoading} variant="outline" onClick={() => save('in_progress')}>İşleme Al</Button><Button disabled={updateState.isLoading} onClick={() => save('closed')}>Kapat</Button></div></div>}</CardContent></Card>
      </div>
    </div>
  );
}
