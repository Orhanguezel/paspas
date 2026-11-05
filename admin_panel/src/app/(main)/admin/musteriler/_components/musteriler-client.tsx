'use client';

// =============================================================
// FILE: src/app/(main)/admin/musteriler/_components/musteriler-client.tsx
// Paspas ERP — Müşteriler liste sayfası
// =============================================================

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, RefreshCcw, Pencil, Trash2, Search, Eye, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useListMusterilerAdminQuery,
  useDeleteMusteriAdminMutation,
} from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import type { MusteriDto } from '@/integrations/shared/erp/musteriler.types';
import MusteriForm from './musteri-form';
import MusteriDetayClient from '../[id]/_components/musteri-detay-client';
import { useCompanyResearchListQuery } from '@/integrations/endpoints/admin/erp/crm_company_desk.endpoints';

function formatHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  }
}

export default function MusterilerClient({ crmMode = false }: { crmMode?: boolean }) {
  const { t } = useLocaleContext();
  const searchParams = useSearchParams();
  // URL'de tur parametresi yoksa varsayılan olarak sadece müşterileri göster
  const initialTur = searchParams.get('tur') ?? 'musteri';
  const [search, setSearch] = useState('');
  const [turFilter, setTurFilter] = useState(initialTur);
  const [crmView, setCrmView] = useState<'sirketler'|'arastirmalar'|'musteriler'>('sirketler');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MusteriDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MusteriDto | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(() => crmMode && /^[0-9a-f-]{36}$/i.test(searchParams.get('firma') ?? '') ? searchParams.get('firma') : null);

  const queryParams = {
    ...(search ? { search } : {}),
    ...(turFilter ? { tur: turFilter } : {}),
    ...(crmMode && crmView === 'musteriler' ? { musteriDurumu: 'aktif' } : {}),
    ...(crmMode ? { limit: 500 } : {}),
  };
  const { data, isLoading, isFetching, refetch } = useListMusterilerAdminQuery(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  );
  const [deleteMusteri, deleteState] = useDeleteMusteriAdminMutation();
  const { data: researchItems = [], isLoading: researchLoading } = useCompanyResearchListQuery(search, { skip: !crmMode || crmView !== 'arastirmalar' });

  const items = data?.items ?? [];

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(m: MusteriDto) { setEditing(m); setFormOpen(true); }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMusteri(deleteTarget.id).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.musteriler.singular') }));
    } catch (err: any) {
      const msg = err?.data?.error?.message;
      const reasons = err?.data?.error?.reasons as string[] | undefined;
      const turkceHata = msg === 'musteri_bagimliligi_var'
        ? `Bu müşteri silinemez: ${reasons?.join(', ') ?? 'ilişkili kayıtlar mevcut'}.`
        : undefined;
      toast.error(turkceHata ?? msg ?? t('admin.erp.common.deleteFailed'));
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {crmMode ? 'Satış ve CRM · İhracat Masası' : turFilter === 'musteri' ? t('admin.erp.musteriler.types.musteri')
              : turFilter === 'tedarikci' ? t('admin.erp.musteriler.types.tedarikci')
              : t('admin.erp.musteriler.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {crmMode && crmView === 'arastirmalar' ? `${researchItems.length} araştırma kaydı` : t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.musteriler.singular').toLowerCase() })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" /> {t('admin.erp.musteriler.newItem')}
          </Button>
        </div>
      </div>

      {crmMode && <div className="flex flex-wrap gap-2" role="tablist" aria-label="CRM görünümleri">
        {([['sirketler','Şirketler'],['arastirmalar','Araştırmalar'],['musteriler','Müşteriler']] as const).map(([value,label]) => <Button key={value} size="sm" variant={crmView===value?'default':'outline'} role="tab" aria-selected={crmView===value} onClick={()=>setCrmView(value)}>{label}</Button>)}
      </div>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.musteriler.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(!crmMode || crmView !== 'arastirmalar') && <Select
          value={turFilter || 'all'}
          onValueChange={(v) => setTurFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.erp.musteriler.filterAll')}</SelectItem>
            <SelectItem value="musteri">{t('admin.erp.musteriler.types.musteri')}</SelectItem>
            <SelectItem value="tedarikci">{t('admin.erp.musteriler.types.tedarikci')}</SelectItem>
          </SelectContent>
        </Select>}
      </div>

      {crmMode && crmView === 'arastirmalar' ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {researchLoading && <p className="text-sm text-muted-foreground">Araştırmalar yükleniyor…</p>}
        {!researchLoading && researchItems.length === 0 && <p className="text-sm text-muted-foreground">Araştırma kaydı bulunamadı.</p>}
        {researchItems.map(item => <button key={item.id} type="button" className="rounded-lg border bg-card p-4 text-left shadow-sm hover:border-primary" onClick={()=>setSelectedId(item.customer_id)}><strong className="text-sm">{item.company_name}</strong><p className="mt-1 line-clamp-3 text-sm">{item.finding}</p><div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{item.information_type==='research'?'Araştırma':'Müşteri beyanı'}</span><span>{item.source_label||item.source_url||'Kaynak belirtilmedi'}</span></div></button>)}
      </div> : <>
      {crmMode && <div className="grid gap-3 xl:hidden sm:grid-cols-2">
        {isLoading && Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40" />)}
        {!isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">{t('admin.erp.musteriler.notFound')}</p>}
        {!isLoading && items.map((m) => <article key={m.id} className="min-w-0 rounded-md border bg-card p-3 shadow-sm">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0"><h2 className="break-words font-semibold">{m.ad}</h2><p className="break-all font-mono text-xs text-muted-foreground">{m.kod}</p></div>
            <Badge variant={m.tur === 'tedarikci' ? 'secondary' : 'default'} className="shrink-0">{t(`admin.erp.musteriler.types.${m.tur}`)}</Badge>
          </div>
          {(m.musteriDurumu === 'aday' || m.musteriDurumu === 'pasif') && <p className="mt-1 text-xs text-muted-foreground">{m.musteriDurumu === 'aday' ? 'Aday' : 'Pasif'}</p>}
          <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">İlgili kişi</dt><dd className="min-w-0 break-words">{m.ilgiliKisi ?? '—'}</dd>
            <dt className="text-muted-foreground">Telefon</dt><dd className="min-w-0 break-all">{m.telefon ?? '—'}</dd>
            <dt className="text-muted-foreground">E-posta</dt><dd className="min-w-0 break-all">{m.email ?? '—'}</dd>
            <dt className="text-muted-foreground">Web sitesi</dt><dd className="min-w-0 break-all">{m.websiteUrl ? <a href={m.websiteUrl} target="_blank" rel="noreferrer" className="text-primary underline">{formatHost(m.websiteUrl)}</a> : '—'}</dd>
            <dt className="text-muted-foreground">Bayi segmenti</dt><dd className="min-w-0 break-words">{m.bayiSegment ? t(`admin.erp.musteriler.segments.${m.bayiSegment}`) : '—'}</dd>
            <dt className="text-muted-foreground">İskonto</dt><dd>{m.iskonto > 0 ? `%${m.iskonto}` : '—'}</dd>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedId(m.id)}><Eye className="mr-1 size-4" />Detay</Button>
            <Button variant="outline" size="sm" onClick={() => openEdit(m)}><Pencil className="mr-1 size-4" />Düzenle</Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteTarget(m)}><Trash2 className="mr-1 size-4" />Sil</Button>
          </div>
        </article>)}
      </div>}
      <div className={`w-full min-w-0 max-w-full overflow-x-auto rounded-md border ${crmMode ? 'hidden xl:block' : ''}`}>
        <Table className={crmMode ? 'table-fixed' : undefined}>
          {crmMode && <colgroup><col className="w-[9%]" /><col className="w-[7%]" /><col className="w-[17%]" /><col className="w-[9%]" /><col className="w-[10%]" /><col className="w-[13%]" /><col className="w-[9%]" /><col className="w-[8%]" /><col className="w-[6%]" /><col className="w-[12%]" /></colgroup>}
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.musteriler.columns.kod')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.form.tur')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.ad')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.ilgiliKisi')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.telefon')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.email')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.website')}</TableHead>
              <TableHead className={crmMode ? 'whitespace-normal leading-tight' : undefined}>{t('admin.erp.musteriler.columns.bayiSegment')}</TableHead>
              <TableHead className="text-right">{t('admin.erp.musteriler.columns.iskonto')}</TableHead>
              <TableHead className={crmMode ? 'w-auto' : 'w-20'} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 10 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}

            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.musteriler.notFound')}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && items.map((m) => (
              <TableRow key={m.id}>
                <TableCell className={crmMode ? 'break-all whitespace-normal font-mono text-xs' : 'font-mono text-xs whitespace-nowrap'}>{m.kod}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant={m.tur === 'tedarikci' ? 'secondary' : 'default'}>
                      {t(`admin.erp.musteriler.types.${m.tur}`)}
                    </Badge>
                    {m.musteriDurumu === 'aday' && (
                      <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700">Aday</Badge>
                    )}
                    {m.musteriDurumu === 'pasif' && (
                      <Badge variant="outline" className="text-muted-foreground">Pasif</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className={crmMode ? 'break-words whitespace-normal font-medium' : 'font-medium'}>{m.ad}</TableCell>
                <TableCell className={crmMode ? 'break-words whitespace-normal' : undefined}>{m.ilgiliKisi ?? '—'}</TableCell>
                <TableCell className={crmMode ? 'break-all whitespace-normal' : undefined}>{m.telefon ?? '—'}</TableCell>
                <TableCell className={crmMode ? 'break-all whitespace-normal' : undefined}>{m.email ?? '—'}</TableCell>
                <TableCell className={crmMode ? 'break-all whitespace-normal' : undefined}>
                  {m.websiteUrl ? (
                    <a className="text-primary hover:underline" href={m.websiteUrl} target="_blank" rel="noreferrer">
                      {formatHost(m.websiteUrl)}
                      {!crmMode && <ExternalLink className="ml-1 inline size-3" />}
                    </a>
                  ) : '—'}
                </TableCell>
                <TableCell className={crmMode ? 'break-words whitespace-normal' : undefined}>
                  {m.bayiSegment ? (
                    <Badge variant="outline">{t(`admin.erp.musteriler.segments.${m.bayiSegment}`)}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.iskonto > 0 ? `%${m.iskonto}` : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {crmMode ? <Button variant="ghost" size="icon-sm" aria-label={`${m.ad} detayını aç`} onClick={() => setSelectedId(m.id)}><Eye className="size-4" /></Button> : <Button variant="ghost" size="icon" asChild><Link href={`/admin/musteriler/${m.id}`}><Eye className="size-4" /></Link></Button>}
                    <Button variant="ghost" size={crmMode ? 'icon-sm' : 'icon'} aria-label={`${m.ad} düzenle`} onClick={() => openEdit(m)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size={crmMode ? 'icon-sm' : 'icon'}
                      aria-label={`${m.ad} sil`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(m)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div></>}

      <MusteriForm open={formOpen} onClose={() => setFormOpen(false)} musteri={editing} />

      {crmMode && selectedId && <div className="fixed inset-0 z-[90] bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}><aside role="dialog" aria-modal="true" aria-label="Müşteri 360 detayı" className="absolute inset-y-0 right-0 w-full max-w-[800px] overflow-x-hidden overflow-y-auto bg-slate-50 p-4 shadow-2xl sm:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">Müşteri 360</h2><Button variant="outline" size="icon" onClick={() => setSelectedId(null)} aria-label="Kapat"><X className="size-4"/></Button></div><MusteriDetayClient id={selectedId} embedded /></aside></div>}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.erp.musteriler.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.erp.common.deleteDescriptionIrreversible', { name: deleteTarget?.ad ?? '' })}
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
