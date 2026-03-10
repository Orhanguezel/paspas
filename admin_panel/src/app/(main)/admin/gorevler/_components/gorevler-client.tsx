'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, ClipboardList, Filter, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAdminListQuery } from '@/integrations/endpoints/admin/users/auth_admin.endpoints';
import {
  useCreateGorevAdminMutation,
  useDeleteGorevAdminMutation,
  useListGorevlerAdminQuery,
  useUpdateGorevAdminMutation,
} from '@/integrations/endpoints/admin/erp/gorevler_admin.endpoints';
import { useStatusQuery } from '@/integrations/endpoints/users/auth_public.endpoints';
import type { AuthStatusResponse } from '@/integrations/shared/users/auth.public';
import { normalizeMeFromStatus } from '@/integrations/shared/users/auth.public';
import type { GorevDto } from '@/integrations/shared/erp/gorevler.types';

const DURUM_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Durumlar' },
  { value: 'acik', label: 'Açık' },
  { value: 'devam_ediyor', label: 'Devam Ediyor' },
  { value: 'beklemede', label: 'Beklemede' },
  { value: 'tamamlandi', label: 'Tamamlandı' },
  { value: 'iptal', label: 'İptal' },
] as const;

const ONCELIK_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Öncelikler' },
  { value: 'dusuk', label: 'Düşük' },
  { value: 'normal', label: 'Normal' },
  { value: 'yuksek', label: 'Yüksek' },
  { value: 'kritik', label: 'Kritik' },
] as const;

const MODUL_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Modüller' },
  { value: 'satin_alma', label: 'Satın Alma' },
  { value: 'stoklar', label: 'Stoklar' },
  { value: 'satis_siparisleri', label: 'Satış Siparişleri' },
  { value: 'uretim_emirleri', label: 'Üretim Emirleri' },
  { value: 'makine_havuzu', label: 'Makine Havuzu' },
  { value: 'operator', label: 'Operatör' },
  { value: 'dashboard', label: 'Dashboard' },
] as const;

const ROLE_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Roller' },
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operatör' },
  { value: 'sevkiyatci', label: 'Sevkiyatçı' },
  { value: 'satin_almaci', label: 'Satın Almacı' },
] as const;

const TIP_OPTIONS = [
  { value: 'manuel', label: 'Manuel' },
  { value: 'kritik_stok', label: 'Kritik Stok' },
  { value: 'satin_alma', label: 'Satın Alma' },
  { value: 'uretim', label: 'Üretim' },
  { value: 'sevkiyat', label: 'Sevkiyat' },
  { value: 'audit', label: 'Audit' },
  { value: 'genel', label: 'Genel' },
] as const;

const BADGE_BY_STATUS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  acik: 'default',
  devam_ediyor: 'secondary',
  beklemede: 'outline',
  tamamlandi: 'default',
  iptal: 'destructive',
};

const BADGE_BY_PRIORITY: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  dusuk: 'outline',
  normal: 'secondary',
  yuksek: 'default',
  kritik: 'destructive',
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 16) : '';
}

export default function GorevlerClient() {
  const statusQ = useStatusQuery();
  const me = normalizeMeFromStatus(statusQ.data as AuthStatusResponse | undefined);
  const userIsAdmin = me?.isAdmin ?? false;

  const [q, setQ] = useState('');
  const [durum, setDurum] = useState('hepsi');
  const [oncelik, setOncelik] = useState('hepsi');
  const [modul, setModul] = useState('hepsi');
  const [atananRol, setAtananRol] = useState('hepsi');
  const [sadeceBenim, setSadeceBenim] = useState(false);
  const [gecikenOnly, setGecikenOnly] = useState(false);
  const [editing, setEditing] = useState<GorevDto | null>(null);
  const [open, setOpen] = useState(false);

  const params = {
    ...(q ? { q } : {}),
    ...(durum !== 'hepsi' ? { durum } : {}),
    ...(oncelik !== 'hepsi' ? { oncelik } : {}),
    ...(modul !== 'hepsi' ? { modul } : {}),
    ...(atananRol !== 'hepsi' ? { atananRol } : {}),
    ...(sadeceBenim ? { sadeceBenim: true } : {}),
    ...(gecikenOnly ? { gecikenOnly: true } : {}),
    limit: 100,
  };

  const gorevlerQ = useListGorevlerAdminQuery(params);
  const usersQ = useAdminListQuery({ limit: 200, offset: 0, sort: 'created_at', order: 'desc' });
  const [createGorev, createState] = useCreateGorevAdminMutation();
  const [updateGorev, updateState] = useUpdateGorevAdminMutation();
  const [deleteGorev, deleteState] = useDeleteGorevAdminMutation();

  const users = usersQ.data ?? [];
  const items = gorevlerQ.data?.items ?? [];
  const summary = gorevlerQ.data?.summary;

  const isBusy = createState.isLoading || updateState.isLoading || deleteState.isLoading;

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(item: GorevDto) {
    setEditing(item);
    setOpen(true);
  }

  async function handleQuickStatus(item: GorevDto, nextStatus: GorevDto['durum']) {
    try {
      await updateGorev({ id: item.id, body: { durum: nextStatus } }).unwrap();
      toast.success('Görev durumu güncellendi.');
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? 'Görev güncellenemedi.');
    }
  }

  async function handleDelete(item: GorevDto) {
    if (!window.confirm(`"${item.baslik}" görevini silmek istiyor musunuz?`)) return;
    try {
      await deleteGorev({ id: item.id }).unwrap();
      toast.success('Görev silindi.');
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? 'Görev silinemedi.');
    }
  }

  const countLabel = useMemo(() => `${gorevlerQ.data?.total ?? 0} görev`, [gorevlerQ.data?.total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Görevler</h1>
          <p className="text-sm text-muted-foreground">
            {userIsAdmin ? 'Tüm kullanıcılara atanan görevler' : 'Size ve rolünüze atanan görevler'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => gorevlerQ.refetch()} disabled={gorevlerQ.isFetching}>
            <RefreshCcw className={`mr-2 size-4${gorevlerQ.isFetching ? ' animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Yeni Görev
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Toplam" value={String(summary?.toplam ?? 0)} icon={ClipboardList} />
        <SummaryCard title="Açık" value={String(summary?.acik ?? 0)} icon={Filter} />
        <SummaryCard title="Bugün Terminli" value={String(summary?.bugunTerminli ?? 0)} icon={CalendarClock} />
        <SummaryCard title="Geciken" value={String(summary?.geciken ?? 0)} icon={CalendarClock} critical />
        <SummaryCard title="Tamamlanan" value={String(summary?.tamamlanan ?? 0)} icon={CheckCircle2} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_180px_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Başlık, açıklama veya modül ara" value={q} onChange={(event) => setQ(event.target.value)} />
        </div>
        <Select value={durum} onValueChange={setDurum}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{DURUM_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={oncelik} onValueChange={setOncelik}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ONCELIK_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={modul} onValueChange={setModul}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{MODUL_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={atananRol} onValueChange={setAtananRol}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ROLE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button variant={sadeceBenim ? 'default' : 'outline'} size="sm" onClick={() => setSadeceBenim((value) => !value)}>
          {userIsAdmin ? 'Sadece bana atananlar' : 'Yalnızca doğrudan bana atananlar'}
        </Button>
        <Button variant={gecikenOnly ? 'destructive' : 'outline'} size="sm" onClick={() => setGecikenOnly((value) => !value)}>
          Sadece gecikenler
        </Button>
        <span className="text-muted-foreground">{countLabel}</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Atanan</TableHead>
              <TableHead>Modül</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Öncelik</TableHead>
              <TableHead>Termin</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gorevlerQ.isLoading && Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`gorev-skeleton-${index}`}>
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <TableCell key={`gorev-skeleton-cell-${cellIndex}`}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!gorevlerQ.isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Henüz görev kaydı yok.
                </TableCell>
              </TableRow>
            )}
            {!gorevlerQ.isLoading && items.map((item) => (
              <TableRow key={item.id} className={item.gecikti ? 'bg-red-50/60' : undefined}>
                <TableCell>
                  <div className="space-y-0.5">
                    <button className="text-left font-medium hover:underline" onClick={() => openEdit(item)}>
                      {item.baslik}
                    </button>
                    <div className="line-clamp-1 max-w-[360px] text-xs text-muted-foreground">{item.aciklama ?? 'Açıklama yok'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5 text-sm">
                    <div>{item.atananKullaniciAd ?? 'Atanmamış'}</div>
                    <div className="text-xs text-muted-foreground">{item.atananRol ?? '—'}</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{item.modul ?? 'Genel'}</TableCell>
                <TableCell>
                  <Badge variant={BADGE_BY_STATUS[item.durum] ?? 'outline'}>{item.durum.replaceAll('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={BADGE_BY_PRIORITY[item.oncelik] ?? 'outline'}>{item.oncelik}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{formatDateTime(item.terminTarihi)}</div>
                  {item.gecikti ? <div className="text-xs font-medium text-destructive">Termin geçti</div> : null}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {item.durum !== 'tamamlandi' ? (
                      <Button variant="outline" size="sm" onClick={() => handleQuickStatus(item, 'tamamlandi')}>
                        Tamamla
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleQuickStatus(item, 'acik')}>
                        Geri Aç
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>Düzenle</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} disabled={isBusy}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <GorevFormSheet
        open={open}
        onClose={() => setOpen(false)}
        item={editing}
        users={users.map((user) => ({ id: user.id, label: user.full_name ?? user.email ?? '' }))}
        onCreate={createGorev}
        onUpdate={updateGorev}
        busy={isBusy}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  critical = false,
}: {
  title: string;
  value: string;
  icon: typeof ClipboardList;
  critical?: boolean;
}) {
  return (
    <Card className={critical ? 'border-red-200 bg-red-50/60' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className={`size-4 ${critical ? 'text-destructive' : 'text-muted-foreground'}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function GorevFormSheet({
  open,
  onClose,
  item,
  users,
  onCreate,
  onUpdate,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  item: GorevDto | null;
  users: Array<{ id: string; label: string }>;
  onCreate: ReturnType<typeof useCreateGorevAdminMutation>[0];
  onUpdate: ReturnType<typeof useUpdateGorevAdminMutation>[0];
  busy: boolean;
}) {
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tip, setTip] = useState('manuel');
  const [modul, setModul] = useState('dashboard');
  const [atananKullaniciId, setAtananKullaniciId] = useState('none');
  const [atananRol, setAtananRol] = useState('none');
  const [durum, setDurum] = useState('acik');
  const [oncelik, setOncelik] = useState('normal');
  const [terminTarihi, setTerminTarihi] = useState('');

  useEffect(() => {
    if (!open) return;
    setBaslik(item?.baslik ?? '');
    setAciklama(item?.aciklama ?? '');
    setTip(item?.tip ?? 'manuel');
    setModul(item?.modul ?? 'dashboard');
    setAtananKullaniciId(item?.atananKullaniciId ?? 'none');
    setAtananRol(item?.atananRol ?? 'none');
    setDurum(item?.durum ?? 'acik');
    setOncelik(item?.oncelik ?? 'normal');
    setTerminTarihi(toDateInputValue(item?.terminTarihi ?? null));
  }, [item, open]);

  async function handleSubmit() {
    if (!baslik.trim()) {
      toast.error('Başlık zorunlu.');
      return;
    }

    const body = {
      baslik: baslik.trim(),
      aciklama: aciklama.trim() || undefined,
      tip,
      modul: modul === 'hepsi' ? undefined : modul,
      atananKullaniciId: atananKullaniciId === 'none' ? undefined : atananKullaniciId,
      atananRol: atananRol === 'none' ? undefined : atananRol,
      durum,
      oncelik,
      terminTarihi: terminTarihi ? new Date(terminTarihi).toISOString() : undefined,
    };

    try {
      if (item) {
        await onUpdate({ id: item.id, body }).unwrap();
        toast.success('Görev güncellendi.');
      } else {
        await onCreate(body).unwrap();
        toast.success('Görev oluşturuldu.');
      }
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? 'Görev kaydedilemedi.');
    }
  }

  return (
    <Sheet open={open} onOpenChange={(state) => !state && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{item ? 'Görev Düzenle' : 'Yeni Görev'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <div className="space-y-1">
            <Label>Başlık</Label>
            <Input value={baslik} onChange={(event) => setBaslik(event.target.value)} placeholder="Görev başlığı" />
          </div>
          <div className="space-y-1">
            <Label>Açıklama</Label>
            <Textarea value={aciklama} onChange={(event) => setAciklama(event.target.value)} rows={4} placeholder="Görevin detayını yazın" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Tip</Label>
              <Select value={tip} onValueChange={setTip}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIP_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Modül</Label>
              <Select value={modul} onValueChange={setModul}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODUL_OPTIONS.filter((option) => option.value !== 'hepsi').map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Atanan Kullanıcı</Label>
              <Select value={atananKullaniciId} onValueChange={setAtananKullaniciId}>
                <SelectTrigger><SelectValue placeholder="Kullanıcı seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Atama yok</SelectItem>
                  {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Atanan Rol</Label>
              <Select value={atananRol} onValueChange={setAtananRol}>
                <SelectTrigger><SelectValue placeholder="Rol seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Rol yok</SelectItem>
                  {ROLE_OPTIONS.filter((option) => option.value !== 'hepsi').map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Durum</Label>
              <Select value={durum} onValueChange={setDurum}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DURUM_OPTIONS.filter((option) => option.value !== 'hepsi').map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Öncelik</Label>
              <Select value={oncelik} onValueChange={setOncelik}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ONCELIK_OPTIONS.filter((option) => option.value !== 'hepsi').map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Termin</Label>
              <Input type="datetime-local" value={terminTarihi} onChange={(event) => setTerminTarihi(event.target.value)} />
            </div>
          </div>
        </div>
        <SheetFooter className="border-t px-4 py-4 sm:px-6">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={handleSubmit} disabled={busy}>{item ? 'Güncelle' : 'Kaydet'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
