'use client';

// =============================================================
// FILE: src/app/(main)/admin/musteriler/_components/musteriler-client.tsx
// Paspas ERP — Müşteriler liste sayfası
// =============================================================

import { useState } from 'react';
import { Plus, RefreshCcw, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export default function MusterilerClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MusteriDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MusteriDto | null>(null);

  const { data, isLoading, isFetching, refetch } = useListMusterilerAdminQuery(
    search ? { search } : undefined,
  );
  const [deleteMusteri, deleteState] = useDeleteMusteriAdminMutation();

  const items = data?.items ?? [];

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(m: MusteriDto) { setEditing(m); setFormOpen(true); }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMusteri(deleteTarget.id).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.musteriler.singular') }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.deleteFailed'));
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.musteriler.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.musteriler.singular').toLowerCase() })}
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t('admin.erp.musteriler.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.musteriler.columns.kod')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.ad')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.ilgiliKisi')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.telefon')}</TableHead>
              <TableHead>{t('admin.erp.musteriler.columns.email')}</TableHead>
              <TableHead className="text-right">{t('admin.erp.musteriler.columns.iskonto')}</TableHead>
              <TableHead className="w-20" />
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
                  {t('admin.erp.musteriler.notFound')}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && items.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs whitespace-nowrap">{m.kod}</TableCell>
                <TableCell className="font-medium">{m.ad}</TableCell>
                <TableCell>{m.ilgiliKisi ?? '—'}</TableCell>
                <TableCell>{m.telefon ?? '—'}</TableCell>
                <TableCell>{m.email ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {m.iskonto > 0 ? `%${m.iskonto}` : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
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
      </div>

      <MusteriForm open={formOpen} onClose={() => setFormOpen(false)} musteri={editing} />

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
