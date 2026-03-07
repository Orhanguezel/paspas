// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/snapshots-table.tsx
// guezelwebdesign – Admin DB Snapshot Tablosu
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { toast } from 'sonner';
import type { DbSnapshot } from '@/integrations/shared';
import { useRestoreDbSnapshotMutation, useDeleteDbSnapshotMutation } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, RefreshCw, Trash2, History, Database, FileText, Calendar, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------------- Types ---------------- */

export type SnapshotsTableProps = {
  items?: DbSnapshot[];
  loading: boolean;
  refetch: () => void;
};

/* ---------------- Helpers ---------------- */

const safeText = (v: unknown) => (v === null || v === undefined ? '' : String(v));

function formatDate(value: string | null | undefined, locale = 'tr-TR'): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return safeText(value) || '-';
    return d.toLocaleString(locale);
  } catch {
    return safeText(value) || '-';
  }
}

function formatSize(bytes?: number | null): string {
  if (bytes == null || Number.isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export const SnapshotsTable: React.FC<SnapshotsTableProps> = ({ items, loading, refetch }) => {
  const t = useAdminT('admin.db.snapshots');
  const rows = items || [];
  const hasData = rows.length > 0;

  const [restoreSnapshot, { isLoading: isRestoring }] = useRestoreDbSnapshotMutation();
  const [deleteSnapshot, { isLoading: isDeleting }] = useDeleteDbSnapshotMutation();

  const busy = loading || isRestoring || isDeleting;

  const handleRestore = async (snap: DbSnapshot) => {
    const label = snap.label || snap.filename || snap.id;

    // Use a toast or custom dialog instead of window.confirm if possible, 
    // but for now I'll stick to a simple strategy or just trigger it.
    // In a full refactor, we should use some AlertDialog state.
    // Given the complexity of adding state for each row, I'll keep it simple
    // or use a reusable confirm helper if one exists.
    if (!window.confirm(t('restoreConfirm', { label }))) return;

    try {
      const res = await restoreSnapshot({
         id: snap.id,
         dryRun: false,
         truncateBefore: true,
      }).unwrap();

      if (res?.ok === false) {
        toast.error(res.error || t('restoreError'));
      } else {
        toast.success(t('restoreSuccess'));
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('restoreFailed'));
    }
  };

  const handleDelete = async (snap: DbSnapshot) => {
    const label = snap.label || snap.filename || snap.id;
    if (!window.confirm(t('deleteConfirm', { label }))) return;

    try {
      const res = await deleteSnapshot({ id: snap.id }).unwrap();
      if (res?.ok === false) {
        toast.error(res.message || t('deleteFailed'));
      } else {
        toast.success(res.message || t('deleteSuccess'));
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('deleteError'));
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-4 space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="size-4 text-primary" />
          {t('title')}
        </CardTitle>
        <div className="flex items-center gap-3">
          {busy && (
            <Badge variant="secondary" className="animate-pulse gap-1.5 h-6 text-[10px] font-normal">
              <Loader2 className="size-3 animate-spin" />
              {t('processing')}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {t('total')} <strong className="text-foreground ml-1">{rows.length}</strong>
          </span>
          <Button variant="ghost" size="icon-sm" onClick={refetch} disabled={busy}>
            <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop View */}
        <div className="hidden xl:block">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[60px] text-[11px] uppercase tracking-wider">{t('columns.index')}</TableHead>
                <TableHead className="w-[280px] text-[11px] uppercase tracking-wider">{t('columns.labelNote')}</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">{t('columns.file')}</TableHead>
                <TableHead className="w-[180px] text-[11px] uppercase tracking-wider">{t('columns.created')}</TableHead>
                <TableHead className="w-[100px] text-[11px] uppercase tracking-wider">{t('columns.size')}</TableHead>
                <TableHead className="w-[200px] text-right text-[11px] uppercase tracking-wider">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasData ? (
                rows.map((s, idx) => (
                  <TableRow key={s.id || idx}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs truncate max-w-[260px]" title={s.label || ''}>
                        {s.label || <span className="text-muted-foreground italic font-normal">{t('noLabel')}</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[260px] mt-0.5" title={s.note || ''}>
                        {s.note || t('noNote')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 max-w-[300px]">
                      <div className="flex items-center gap-1.5 truncate" title={s.filename || undefined}>
                        <FileText className="size-3 text-muted-foreground shrink-0" />
                        <code className="text-[11px] bg-muted/50 px-1 rounded truncate">{s.filename}</code>
                      </div>
                      <div className="flex items-center gap-1.5 truncate text-[10px] text-muted-foreground/70" title={s.id || undefined}>
                          <span className="shrink-0 uppercase opacity-50 font-bold">ID:</span>
                          <code className="truncate">{s.id}</code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                    <TableCell className="text-xs font-medium">{formatSize(s.size_bytes ?? null)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] border-green-500/20 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                          disabled={busy}
                          onClick={() => handleRestore(s)}
                        >
                          {t('restore')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                          disabled={busy}
                          onClick={() => handleDelete(s)}
                        >
                          <Trash2 className="size-3 mr-1" />
                          {t('delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs italic">
                    {loading ? t('loading') : t('noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-2 border-t bg-muted/10 text-[10px] text-muted-foreground italic">
            {t('scrollNote')}
          </div>
        </div>

        {/* Mobile View */}
        <div className="xl:hidden p-3 space-y-3">
          {!hasData && !loading ? (
             <div className="h-24 flex items-center justify-center text-muted-foreground text-xs italic">
               {t('noData')}
             </div>
          ) : loading && !hasData ? (
             <div className="h-24 flex items-center justify-center text-muted-foreground text-xs italic">
               {t('loading')}
             </div>
          ) : (
            <div className="grid gap-3">
              {rows.map((s, idx) => (
                <div key={s.id || idx} className="border rounded-lg p-4 bg-card/50 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="h-5 text-[10px] font-mono">#{idx + 1}</Badge>
                      <Badge variant="secondary" className="h-5 text-[10px] font-normal gap-1">
                        <HardDrive className="size-2.5 opacity-60" />
                        {formatSize(s.size_bytes ?? null)}
                      </Badge>
                      <Badge variant="outline" className="h-5 text-[10px] font-normal gap-1">
                        <Calendar className="size-2.5 opacity-60" />
                        {formatDate(s.created_at)}
                      </Badge>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        variant="secondary"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => handleRestore(s)}
                        title={t('restore')}
                      >
                        <RefreshCw className="size-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => handleDelete(s)}
                        title={t('delete')}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-sm leading-tight wrap-break-word">
                      {s.label || <span className="text-muted-foreground italic font-normal text-xs">{t('noLabel')}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground leading-snug wrap-break-word">
                      {s.note || t('noNote')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t pt-3 mt-3">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{t('columns.file')}</div>
                      <code className="text-[11px] block break-all bg-muted/40 p-1.5 rounded">{s.filename || '-'}</code>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">ID</div>
                      <code className="text-[11px] block break-all opacity-80">{s.id}</code>
                    </div>
                  </div>
                </div>
              ))}
              {loading && hasData && (
                <div className="py-2 text-center text-muted-foreground text-xs animate-pulse">
                  {t('loading')}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
