'use client';

// =============================================================
// FILE: src/app/(main)/admin/satin-alma/_components/satin-alma-client.tsx
// Paspas ERP — Satin Alma Siparisleri listesi
// =============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Plus, RefreshCcw, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  useCheckCriticalStockAdminMutation,
  useGetSatinAlmaAdminQuery,
  useListSatinAlmaAdminQuery,
  useDeleteSatinAlmaAdminMutation,
} from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import type { SatinAlmaSiparisDto, SatinAlmaDurum } from '@/integrations/shared/erp/satin_alma.types';
import { SATIN_ALMA_DURUM_BADGE } from '@/integrations/shared/erp/satin_alma.types';
import SatinAlmaForm from './satin-alma-form';

interface SatinAlmaClientProps {
  initialTedarikciId?: string;
}

export default function SatinAlmaClient({ initialTedarikciId }: SatinAlmaClientProps) {
  const { t } = useLocaleContext();
  const [search, setSearch]       = useState('');
  const [durum, setDurum]         = useState<SatinAlmaDurum | 'hepsi'>('hepsi');
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<SatinAlmaSiparisDto | null>(null);
  const [deleteTarget, setDelete] = useState<SatinAlmaSiparisDto | null>(null);

  const DURUM_OPTIONS: Array<{ value: SatinAlmaDurum | 'hepsi'; label: string }> = [
    { value: 'hepsi',           label: t('admin.erp.common.allStatuses') },
    { value: 'taslak',          label: t('admin.erp.satinAlma.statuses.taslak') },
    { value: 'onaylandi',       label: t('admin.erp.satinAlma.statuses.onaylandi') },
    { value: 'siparis_verildi', label: t('admin.erp.satinAlma.statuses.siparis_verildi') },
    { value: 'kismen_teslim',   label: t('admin.erp.satinAlma.statuses.kismen_teslim') },
    { value: 'tamamlandi',      label: t('admin.erp.satinAlma.statuses.tamamlandi') },
    { value: 'iptal',           label: t('admin.erp.satinAlma.statuses.iptal') },
  ];

  const DURUM_LABELS: Record<SatinAlmaDurum, string> = {
    taslak: t('admin.erp.satinAlma.statuses.taslak'),
    onaylandi: t('admin.erp.satinAlma.statuses.onaylandi'),
    siparis_verildi: t('admin.erp.satinAlma.statuses.siparis_verildi'),
    kismen_teslim: t('admin.erp.satinAlma.statuses.kismen_teslim'),
    tamamlandi: t('admin.erp.satinAlma.statuses.tamamlandi'),
    iptal: t('admin.erp.satinAlma.statuses.iptal'),
  };

  const params = {
    ...(search ? { q: search } : {}),
    ...(initialTedarikciId ? { tedarikciId: initialTedarikciId } : {}),
    ...(durum !== 'hepsi' ? { durum } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useListSatinAlmaAdminQuery(params);
  const { data: editingDetail } = useGetSatinAlmaAdminQuery(editing?.id ?? '', {
    skip: !editing?.id,
  });
  const [deleteSiparis, deleteState] = useDeleteSatinAlmaAdminMutation();
  const [checkCriticalStock, checkState] = useCheckCriticalStockAdminMutation();

  const items = data?.items ?? [];
  const summary = useMemo(() => {
    const otomatik = items.filter((item) => item.aciklama?.includes('Kritik stok nedeniyle otomatik')).length;
    const acik = items.filter((item) => item.durum !== 'tamamlandi' && item.durum !== 'iptal').length;
    const teslimBekleyen = items.filter((item) => item.durum === 'siparis_verildi' || item.durum === 'kismen_teslim').length;
    return {
      total: data?.total ?? 0,
      otomatik,
      acik,
      teslimBekleyen,
    };
  }, [data?.total, items]);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(s: SatinAlmaSiparisDto) { setEditing(s); setFormOpen(true); }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function isAutomaticOrder(siparis: SatinAlmaSiparisDto) {
    return siparis.aciklama?.includes('Kritik stok nedeniyle otomatik') ?? false;
  }

  function resetFilters() {
    setSearch('');
    setDurum('hepsi');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSiparis(deleteTarget.id).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.satinAlma.singular') }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.deleteFailed'));
    } finally {
      setDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.satinAlma.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.satinAlma.singular').toLowerCase() })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await checkCriticalStock().unwrap();
                refetch();
                toast.success('Kritik stok kontrolü tamamlandı');
              } catch {
                toast.error('Kritik stok kontrolü başarısız');
              }
            }}
            disabled={checkState.isLoading}
          >
            <AlertCircle className={`mr-1 size-4${checkState.isLoading ? ' animate-spin' : ''}`} />
            Kritik Stok Kontrol
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" /> {t('admin.erp.satinAlma.newItem')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('admin.erp.satinAlma.summary.total')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('admin.erp.satinAlma.summary.open')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{summary.acik}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('admin.erp.satinAlma.summary.pendingDelivery')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{summary.teslimBekleyen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('admin.erp.satinAlma.summary.automatic')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums text-amber-600">{summary.otomatik}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.satinAlma.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={durum} onValueChange={(v) => setDurum(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURUM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          {t('admin.erp.satinAlma.resetFilters')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.satinAlma.columns.siparisNo')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.tedarikci')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.malzeme')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.siparisTarihi')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.termin')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.durum')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.satinAlma.notFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono font-medium">{s.siparisNo}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Link href={`/admin/tedarikci/${s.tedarikciId}`} className="hover:underline">
                      {s.tedarikciAd ?? s.tedarikciId}
                    </Link>
                    {isAutomaticOrder(s) && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t('admin.erp.satinAlma.badges.automatic')}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="min-w-[220px] space-y-1">
                    {(s.items?.length ?? 0) > 0 ? (
                      <>
                        {(s.items ?? []).slice(0, 2).map((item) => (
                          <div key={item.id} className="text-xs">
                            <span className="font-mono text-muted-foreground">{item.urunKod ?? item.urunId}</span>
                            {' '}
                            <span>{item.urunAd ?? item.urunId}</span>
                            <span className="text-muted-foreground">
                              {' '}· {item.miktar} {item.birim ?? ''}
                            </span>
                          </div>
                        ))}
                        {(s.items?.length ?? 0) > 2 && (
                          <div className="text-[11px] text-muted-foreground">
                            {t('admin.erp.satinAlma.moreItems', { count: String((s.items?.length ?? 0) - 2) })}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('admin.erp.satinAlma.noItems')}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(s.siparisTarihi)}</TableCell>
                <TableCell>{formatDate(s.terminTarihi)}</TableCell>
                <TableCell>
                  <Badge variant={SATIN_ALMA_DURUM_BADGE[s.durum]}>
                    {DURUM_LABELS[s.durum]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/satin-alma/${s.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDelete(s)}
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

      <SatinAlmaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        siparis={editing ? (editingDetail?.id === editing.id ? editingDetail : editing) : null}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.erp.satinAlma.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.siparisNo}</strong> {t('admin.erp.common.deleteDescription')}
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
