'use client';

// =============================================================
// FILE: src/app/(main)/admin/satin-alma/_components/satin-alma-client.tsx
// Paspas ERP — Satin Alma Siparisleri listesi
// =============================================================

import { useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCcw, Pencil, Trash2, Search, Eye } from 'lucide-react';
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
  const [deleteSiparis, deleteState] = useDeleteSatinAlmaAdminMutation();

  const items = data?.items ?? [];

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(s: SatinAlmaSiparisDto) { setEditing(s); setFormOpen(true); }

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
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" /> {t('admin.erp.satinAlma.newItem')}
          </Button>
        </div>
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.satinAlma.columns.siparisNo')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.tedarikci')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.siparisTarihi')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.termin')}</TableHead>
              <TableHead>{t('admin.erp.satinAlma.columns.durum')}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.satinAlma.notFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono font-medium">{s.siparisNo}</TableCell>
                <TableCell>
                  <Link href={`/admin/tedarikci/${s.tedarikciId}`} className="hover:underline">
                    {s.tedarikciAd ?? s.tedarikciId}
                  </Link>
                </TableCell>
                <TableCell>{s.siparisTarihi}</TableCell>
                <TableCell>{s.terminTarihi ?? '—'}</TableCell>
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

      <SatinAlmaForm open={formOpen} onClose={() => setFormOpen(false)} siparis={editing} />

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
