'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklifler/_components/teklifler-client.tsx
// Paspas ERP — Teklifler liste sayfası
// =============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, RefreshCcw, Eye, Trash2, Search, FileSignature, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useListTekliflerAdminQuery,
  useDeleteTeklifAdminMutation,
} from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import type { TeklifDto, TeklifDurum } from '@/integrations/shared/erp/teklifler.types';
import { TEKLIF_DURUM_BADGE } from '@/integrations/shared/erp/teklifler.types';
import TeklifCreateDialog from './teklif-create-dialog';
import { useListUsersAdminQuery } from '@/integrations/endpoints/admin/users/auth_admin.endpoints';

const DURUM_VALUES: TeklifDurum[] = [
  'taslak', 'onay_bekliyor', 'gonderildi', 'goruntulendi', 'revizyon', 'kabul', 'red', 'suresi_doldu',
];
const PAGE_SIZE=50, STORAGE_KEY='paspas.teklifler.savedFilters';
type SavedFilter={name:string;search:string;durum:TeklifDurum|'hepsi';owner:string;currency:string;dil:string};

export default function TekliflerClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState('');
  const [durum, setDurum] = useState<TeklifDurum | 'hepsi'>('hepsi');
  const [owner,setOwner]=useState('hepsi'),[currency,setCurrency]=useState('hepsi'),[dil,setDil]=useState('hepsi'),[offset,setOffset]=useState(0),[savedName,setSavedName]=useState(''),[savedFilters,setSavedFilters]=useState<SavedFilter[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeklifDto | null>(null);

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== 'hepsi' ? { durum } : {}),
    ...(owner!=='hepsi'?{ownerUserId:owner}:{}),...(currency!=='hepsi'?{paraBirimi:currency as 'TRY'|'USD'|'EUR'}:{}),...(dil!=='hepsi'?{dil:dil as 'tr'|'en'|'de'}:{}),limit:PAGE_SIZE,offset,sort:'updated_at' as const,order:'desc' as const,
  };

  const { data, isLoading, isFetching, refetch } = useListTekliflerAdminQuery(params);
  const [deleteTeklif, deleteState] = useDeleteTeklifAdminMutation();
  const {data:users=[]}=useListUsersAdminQuery(undefined);
  useEffect(()=>{try{setSavedFilters(JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]'));}catch{setSavedFilters([]);}},[]);
  const saveFilter=()=>{if(!savedName.trim())return;const next=[...savedFilters.filter(x=>x.name!==savedName.trim()),{name:savedName.trim(),search,durum,owner,currency,dil}];setSavedFilters(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next));setSavedName('');};
  const applySaved=(name:string)=>{const x=savedFilters.find(f=>f.name===name);if(x){setSearch(x.search);setDurum(x.durum);setOwner(x.owner);setCurrency(x.currency);setDil(x.dil);setOffset(0);}};

  const items = data?.items ?? [];

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTeklif(deleteTarget.id).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.teklifler.singular') }));
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(
        message === 'sadece_taslak_silinir'
          ? t('admin.erp.teklifler.form.taslakDisindaBilgi')
          : (message ?? t('admin.erp.common.deleteFailed')),
      );
    } finally {
      setDeleteTarget(null);
    }
  }

  const TRY = (n: number, currency: string) =>
    n.toLocaleString('tr-TR', { style: 'currency', currency: currency || 'TRY' });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.teklifler.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.teklifler.singular').toLowerCase() })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" /> {t('admin.erp.teklifler.newItem')}
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.teklifler.searchPlaceholder')}
            value={search}
            onChange={(e) => {setSearch(e.target.value);setOffset(0);}}
          />
        </div>
        <Select value={durum} onValueChange={(v) => { setDurum(v as TeklifDurum | 'hepsi'); setOffset(0); }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">{t('admin.erp.teklifler.statuses.hepsi')}</SelectItem>
            {DURUM_VALUES.map((d) => (
              <SelectItem key={d} value={d}>{t(`admin.erp.teklifler.statuses.${d}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={owner} onValueChange={(v)=>{setOwner(v);setOffset(0);}}><SelectTrigger className="w-44"><SelectValue placeholder="Sorumlu" /></SelectTrigger><SelectContent><SelectItem value="hepsi">Tüm sorumlular</SelectItem>{users.map(u=><SelectItem key={u.id} value={u.id}>{u.full_name||u.email||u.id}</SelectItem>)}</SelectContent></Select>
        <Select value={currency} onValueChange={(v)=>{setCurrency(v);setOffset(0);}}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hepsi">Tüm para</SelectItem>{['TRY','USD','EUR'].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
        <Select value={dil} onValueChange={(v)=>{setDil(v);setOffset(0);}}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hepsi">Tüm dil</SelectItem>{['tr','en','de'].map(x=><SelectItem key={x} value={x}>{x.toUpperCase()}</SelectItem>)}</SelectContent></Select>
        <Select onValueChange={applySaved}><SelectTrigger className="w-44"><SelectValue placeholder="Kayıtlı filtre" /></SelectTrigger><SelectContent>{savedFilters.map(x=><SelectItem key={x.name} value={x.name}>{x.name}</SelectItem>)}</SelectContent></Select>
        <div className="flex"><Input className="w-36" placeholder="Filtre adı" value={savedName} onChange={e=>setSavedName(e.target.value)}/><Button variant="outline" size="icon" onClick={saveFilter}><Save className="size-4"/></Button></div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.teklifler.columns.teklifNo')}</TableHead>
              <TableHead>Rev.</TableHead>
              <TableHead>{t('admin.erp.teklifler.columns.musteri')}</TableHead>
              <TableHead>{t('admin.erp.teklifler.columns.durum')}</TableHead>
              <TableHead className="text-right">{t('admin.erp.teklifler.columns.genelToplam')}</TableHead>
              <TableHead>{t('admin.erp.teklifler.columns.gecerlilik')}</TableHead>
              <TableHead>Sorumlu</TableHead><TableHead>Son işlem</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.teklifler.notFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((tk) => (
              <TableRow key={tk.id}>
                <TableCell className="font-mono font-medium">
                  <Link href={`/admin/teklifler/${tk.id}`} className="flex items-center gap-1.5 hover:underline">
                    <FileSignature className="size-3.5 text-muted-foreground" />
                    {tk.teklifNo}
                  </Link>
                </TableCell>
                <TableCell>R{tk.revizyonNo}</TableCell>
                <TableCell className="font-medium">{tk.musteriAd ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={TEKLIF_DURUM_BADGE[tk.durum]}>
                    {t(`admin.erp.teklifler.statuses.${tk.durum}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {TRY(tk.genelToplam, tk.paraBirimi)}
                </TableCell>
                <TableCell>{tk.gecerlilikTarihi ?? '—'}</TableCell>
                <TableCell className="text-xs">{tk.ownerName??'—'}</TableCell><TableCell className="text-xs text-muted-foreground">{tk.updatedAt ? tk.updatedAt.slice(0, 10) : '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/teklifler/${tk.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(tk)}
                      disabled={tk.durum !== 'taslak'}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 text-sm"><span>{data?.total?`${offset+1}-${Math.min(offset+PAGE_SIZE,data.total)} / ${data.total}`:'0 / 0'}</span><Button size="icon" variant="outline" disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-PAGE_SIZE))}><ChevronLeft className="size-4"/></Button><Button size="icon" variant="outline" disabled={offset+PAGE_SIZE>=(data?.total??0)} onClick={()=>setOffset(offset+PAGE_SIZE)}><ChevronRight className="size-4"/></Button></div>

      <TeklifCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.erp.teklifler.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.erp.common.deleteDescriptionIrreversible', { name: deleteTarget?.teklifNo ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteState.isLoading ? t('admin.erp.common.deleting') : t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
