// =============================================================
// FILE: src/app/(main)/admin/(admin)/db/fullDb/full-db-import-panel.tsx
// =============================================================
'use client';

import React, { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { errorText } from '../shared/errorText';
import { askConfirm } from '../shared/confirm';
import { HelpHint } from '../shared/help-hint';
import { HelpBlock } from '../shared/help-block';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import {
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
} from '@/integrations/hooks';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Link2, FileText, Upload, HelpCircle, Lightbulb } from 'lucide-react';

type TabKey = 'text' | 'url' | 'file';

export const FullDbImportPanel: React.FC = () => {
  const t = useAdminT('admin.db.import');
  const [activeTab, setActiveTab] = useState<TabKey>('text');

  const [sqlText, setSqlText] = useState('');
  const [truncateText, setTruncateText] = useState(true);
  const [dryRunText, setDryRunText] = useState(false);

  const [url, setUrl] = useState('');
  const [truncateUrl, setTruncateUrl] = useState(true);
  const [dryRunUrl, setDryRunUrl] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [truncateFile, setTruncateFile] = useState(true);

  const [fileInputKey, setFileInputKey] = useState(0);

  const [importText, { isLoading: isImportingText }] = useImportSqlTextMutation();
  const [importUrl, { isLoading: isImportingUrl }] = useImportSqlUrlMutation();
  const [importFile, { isLoading: isImportingFile }] = useImportSqlFileMutation();

  const busy = isImportingText || isImportingUrl || isImportingFile;

  const handleSubmitText = async (e: FormEvent) => {
    e.preventDefault();
    if (!sqlText.trim()) return toast.error(t('text.required'));

    if (!dryRunText) {
      const truncateLabel = truncateText ? t('confirm.truncateYes') : t('confirm.truncateNo');
      const ok = askConfirm(
        t('confirm.text', { truncate: truncateLabel })
      );
      if (!ok) return;
    }

    try {
      const res = await importText({
        sql: sqlText,
        truncateBefore: truncateText,
        dryRun: dryRunText,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, t('error.text')),
        );
      }

      if (res.dryRun) toast.success(t('success.dryRun'));
      else {
        toast.success(t('success.text'));
        setSqlText('');
      }
    } catch (err: any) {
      toast.error(errorText(err, t('error.textGeneric')));
    }
  };

  const handleSubmitUrl = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return toast.error(t('url.required'));

    if (!dryRunUrl) {
      const truncateLabel = truncateUrl ? t('confirm.truncateYes') : t('confirm.truncateNo');
      const ok = askConfirm(
        t('confirm.url', { url, truncate: truncateLabel })
      );
      if (!ok) return;
    }

    try {
      const res = await importUrl({
        url: url.trim(),
        truncateBefore: truncateUrl,
        dryRun: dryRunUrl,
      }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, t('error.url')),
        );
      }

      if (res.dryRun) toast.success(t('success.dryRun'));
      else {
        toast.success(t('success.url'));
        setUrl('');
      }
    } catch (err: any) {
      toast.error(errorText(err, t('error.urlGeneric')));
    }
  };

  const handleSubmitFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error(t('file.required'));

    const truncateLabel = truncateFile ? t('confirm.truncateYes') : t('confirm.truncateNo');
    const ok = askConfirm(
      t('confirm.file', { file: file.name, truncate: truncateLabel })
    );
    if (!ok) return;

    try {
      const res = await importFile({ file, truncateBefore: truncateFile }).unwrap();

      if (!res?.ok) {
        return toast.error(
          errorText(res?.error || res?.message || res, t('error.file')),
        );
      }

      toast.success(t('success.file'));
      setFile(null);
      setFileInputKey((k) => k + 1);
    } catch (err: any) {
      toast.error(errorText(err, t('error.fileGeneric')));
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {t('title')}
            <HelpHint icon="question" title={t('helpTitle')} align="start">
              <HelpBlock headline={t('helpHeadline')}>
                <ul className="text-xs space-y-1 ml-4 list-disc">
                  <li>{t('helpDesc1')}</li>
                  <li>
                    <strong>Truncate</strong>: {t('helpDesc2')}
                  </li>
                  <li>
                    <strong>Dry run</strong>: {t('helpDesc3')}
                  </li>
                </ul>
              </HelpBlock>
            </HelpHint>
          </CardTitle>
        </div>

        {busy && (
          <Badge variant="secondary" className="animate-pulse gap-1.5 h-6 text-[10px] font-normal">
            <Loader2 className="size-3 animate-spin" />
            {t('processing')}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 text-destructive border border-destructive/10">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">
            <strong className="font-bold">{t('dangerLabel')}</strong> {t('warning')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
          <TabsList className="h-9 mb-4">
            <TabsTrigger value="text" className="text-xs px-4" disabled={busy}>
              <FileText className="size-3.5 mr-2" />
              {t('tabs.text')}
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs px-4" disabled={busy}>
              <Link2 className="size-3.5 mr-2" />
              {t('tabs.url')}
            </TabsTrigger>
            <TabsTrigger value="file" className="text-xs px-4" disabled={busy}>
              <Upload className="size-3.5 mr-2" />
              {t('tabs.file')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-0">
            <form onSubmit={handleSubmitText} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                  {t('text.label')} <span className="text-destructive">*</span>
                  <HelpHint icon="question" title={t('text.helpTitle')}>
                    <HelpBlock headline={t('text.helpHeadline')}>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>{t('text.helpDesc1')}</li>
                        <li>{t('text.helpDesc2')}</li>
                        <li>{t('text.helpDesc3')}</li>
                      </ul>
                    </HelpBlock>
                  </HelpHint>
                </Label>
                <Textarea
                  className="min-h-[200px] text-xs font-mono bg-muted/10"
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  placeholder={t('text.placeholder')}
                  disabled={busy}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-text-truncate"
                    checked={truncateText}
                    onCheckedChange={(v) => setTruncateText(!!v)}
                    disabled={busy}
                  />
                  <Label htmlFor="import-text-truncate" className="text-xs font-normal cursor-pointer flex items-center gap-1.5">
                    {t('truncate.label')}
                    <HelpHint icon="bulb" title={t('truncate.helpTitle')}>
                      <HelpBlock headline={t('truncate.helpHeadline')}>
                        <p className="text-xs leading-relaxed">{t('truncate.helpDesc')}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-text-dryrun"
                    checked={dryRunText}
                    onCheckedChange={(v) => setDryRunText(!!v)}
                    disabled={busy}
                  />
                  <Label htmlFor="import-text-dryrun" className="text-xs font-normal cursor-pointer flex items-center gap-1.5">
                    {t('dryRun.label')}
                    <HelpHint icon="question" title={t('dryRun.helpTitle')}>
                      <HelpBlock headline={t('dryRun.helpHeadline')}>
                        <p className="text-xs leading-relaxed">{t('dryRun.helpDesc')}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>
              </div>

              <Button type="submit" size="sm" variant="destructive" disabled={busy} className="h-8 text-xs min-w-[120px]">
                {isImportingText ? t('buttons.importing') : t('buttons.apply')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="url" className="mt-0">
            <form onSubmit={handleSubmitUrl} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                  {t('url.label')} <span className="text-destructive">*</span>
                  <HelpHint icon="question" title={t('url.helpTitle')}>
                    <HelpBlock headline={t('url.helpHeadline')}>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>{t('url.helpDesc1')}</li>
                        <li>{t('url.helpDesc2')}</li>
                        <li>{t('url.helpDesc3')}</li>
                      </ul>
                    </HelpBlock>
                  </HelpHint>
                </Label>
                <Input
                  type="url"
                  className="h-8 text-xs bg-muted/10"
                  placeholder={t('url.placeholder')}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={busy}
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-url-truncate"
                    checked={truncateUrl}
                    onCheckedChange={(v) => setTruncateUrl(!!v)}
                    disabled={busy}
                  />
                  <Label htmlFor="import-url-truncate" className="text-xs font-normal cursor-pointer flex items-center gap-1.5">
                    {t('truncate.label')}
                    <HelpHint icon="bulb" title={t('truncate.helpTitle')}>
                      <HelpBlock headline={t('truncate.helpHeadline')}>
                        <p className="text-xs leading-relaxed">{t('truncate.helpDesc')}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-url-dryrun"
                    checked={dryRunUrl}
                    onCheckedChange={(v) => setDryRunUrl(!!v)}
                    disabled={busy}
                  />
                  <Label htmlFor="import-url-dryrun" className="text-xs font-normal cursor-pointer flex items-center gap-1.5">
                    {t('dryRun.label')}
                    <HelpHint icon="question" title={t('dryRun.helpTitle')}>
                      <HelpBlock headline={t('dryRun.helpHeadline')}>
                        <p className="text-xs leading-relaxed">{t('dryRun.helpDescUrl')}</p>
                      </HelpBlock>
                    </HelpHint>
                  </Label>
                </div>
              </div>

              <Button type="submit" size="sm" variant="destructive" disabled={busy} className="h-8 text-xs min-w-[120px]">
                {isImportingUrl ? t('buttons.importing') : t('buttons.importFromUrl')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="file" className="mt-0">
            <form onSubmit={handleSubmitFile} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                  {t('file.label')} <span className="text-destructive">*</span>
                  <HelpHint icon="question" title={t('file.helpTitle')}>
                    <HelpBlock headline={t('file.helpHeadline')}>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>{t('file.helpDesc1')}</li>
                        <li>{t('file.helpDesc2')}</li>
                        <li>{t('file.helpDesc3')}</li>
                      </ul>
                    </HelpBlock>
                  </HelpHint>
                </Label>
                <div className="space-y-3">
                  <Input
                    key={fileInputKey}
                    type="file"
                    className="h-9 text-xs flex items-center bg-muted/10 cursor-pointer"
                    accept=".sql,.gz,.sql.gz"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={busy}
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-in fade-in slide-in-from-top-1">
                      <FileText className="size-3" />
                      {t('file.selected')} <code className="text-primary font-bold">{file.name}</code>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 italic">
                    <strong className="font-bold opacity-100 mr-1">{t('admin.common.note')}:</strong>
                    {t('file.note')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="import-file-truncate"
                  checked={truncateFile}
                  onCheckedChange={(v) => setTruncateFile(!!v)}
                  disabled={busy}
                />
                <Label htmlFor="import-file-truncate" className="text-xs font-normal cursor-pointer flex items-center gap-1.5">
                  {t('truncate.label')}
                  <HelpHint icon="bulb" title={t('truncate.helpTitle')}>
                    <HelpBlock headline={t('truncate.helpHeadline')}>
                      <p className="text-xs leading-relaxed">{t('truncate.helpDescFile')}</p>
                    </HelpBlock>
                  </HelpHint>
                </Label>
              </div>

              <Button type="submit" size="sm" variant="destructive" disabled={busy} className="h-8 text-xs min-w-[120px]">
                {isImportingFile ? t('buttons.importing') : t('buttons.importFromFile')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
