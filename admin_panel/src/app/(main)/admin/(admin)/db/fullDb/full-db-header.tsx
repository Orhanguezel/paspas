// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/full-db-header.tsx
// =============================================================
'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

import {
  useCreateDbSnapshotMutation,
  useExportSqlMutation,
  // useExportJsonMutation, // TODO: Backend endpoint not implemented yet
} from '@/integrations/hooks';

import { buildDownloadName, triggerDownload } from '../shared/download';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Database, Download, FileJson } from 'lucide-react';

export type FullDbHeaderProps = {
  onChanged?: () => void; // ✅ optional
};

export const FullDbHeader: React.FC<FullDbHeaderProps> = ({ onChanged }) => {
  const t = useAdminT('admin.db.fullDb');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  const [createSnapshot, { isLoading: isCreating }] = useCreateDbSnapshotMutation();
  const [exportSql, { isLoading: isExportingSql }] = useExportSqlMutation();
  // const [exportJson, { isLoading: isExportingJson }] = useExportJsonMutation(); // TODO: Not implemented

  const busy = isCreating || isExportingSql; // || isExportingJson;

  const handleCreateSnapshot = async () => {
    try {
      const body: { label?: string; note?: string } = {};
      if (label.trim()) body.label = label.trim();
      if (note.trim()) body.note = note.trim();

      const snap = await createSnapshot(body).unwrap();
      toast.success(t('snapshotCreated', { label: snap.label || snap.filename || snap.id }));

      setLabel('');
      setNote('');

      // ✅ call only if provided
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('snapshotError'));
    }
  };

  const handleExportSql = async () => {
    try {
      const blob = await exportSql().unwrap();
      triggerDownload(blob, buildDownloadName('db_backup', 'sql'));
      toast.success(t('exportSuccess'));
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.data?.error || err?.message || t('exportError'));
    }
  };

  const handleExportJson = async () => {
    // TODO: Backend JSON export endpoint not implemented yet
    toast.info(t('jsonNotImplemented'));
  };

  return (
    <Card className="border-none shadow-none bg-muted/20">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-6 justify-between">
          {/* Snapshot Creation Section */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-primary" />
                <h5 className="text-sm font-semibold">{t('title')}</h5>
              </div>
              <p className="text-xs text-muted-foreground">{t('description')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{t('snapshotLabel')}</Label>
                <Input
                  type="text"
                  className="h-8 text-xs bg-background"
                  placeholder={t('snapshotPlaceholder')}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="sm:col-span-5 space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{t('noteLabel')}</Label>
                <Input
                  type="text"
                  className="h-8 text-xs bg-background"
                  placeholder={t('notePlaceholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 text-xs w-full"
                  disabled={busy}
                  onClick={handleCreateSnapshot}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 size-3 animate-spin" />
                      {t('creating')}
                    </>
                  ) : (
                    t('createButton')
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="lg:hidden" />
          <div className="hidden lg:block w-px self-stretch bg-border/50" />

          {/* Export Section */}
          <div className="lg:w-72 space-y-4">
            <div className="space-y-1">
              <h6 className="text-xs font-semibold">{t('downloadTitle')}</h6>
              <p className="text-[11px] text-muted-foreground">{t('downloadDesc')}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1 min-w-[100px]"
                disabled={busy}
                onClick={handleExportSql}
              >
                {isExportingSql ? (
                  <Loader2 className="mr-2 size-3 animate-spin" />
                ) : (
                  <Download className="mr-2 size-3" />
                )}
                {isExportingSql ? t('sqlPreparing') : t('sqlButton')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1 min-w-[100px]"
                disabled={busy}
                onClick={handleExportJson}
              >
                <FileJson className="mr-2 size-3" />
                {t('jsonButton')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
