'use client';

// =============================================================
// FILE: src/components/admin/site-settings/tabs/GeneralSettingsTab.tsx
// guezelwebdesign – Genel / UI Ayarları (GLOBAL '*' + Localized Override)
// - NO bootstrap
// - UI: UsersListClient pattern (Card + Filters + Table)
// - Modal yok: edit -> detail form link
// Route: /admin/site-settings/[id]?locale=tr|en|*
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SiteSetting, SettingValue } from '@/integrations/shared';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ----------------------------- config ----------------------------- */

const GENERAL_KEYS = [
  'contact_info',
  'socials',
  'businessHours',
  'company_profile',
  'ui_header',
] as const;

type GeneralKey = (typeof GENERAL_KEYS)[number];

const DEFAULTS_BY_KEY: Record<GeneralKey, SettingValue> = {
  contact_info: { phone: '', email: '', address: '', whatsapp: '' },
  socials: { instagram: '', facebook: '', linkedin: '', youtube: '', x: '' },
  businessHours: [
    { day: 'mon', open: '09:00', close: '18:00', closed: false },
    { day: 'tue', open: '09:00', close: '18:00', closed: false },
    { day: 'wed', open: '09:00', close: '18:00', closed: false },
    { day: 'thu', open: '09:00', close: '18:00', closed: false },
    { day: 'fri', open: '09:00', close: '18:00', closed: false },
    { day: 'sat', open: '10:00', close: '14:00', closed: false },
    { day: 'sun', open: '00:00', close: '00:00', closed: true },
  ],
  company_profile: { company_name: 'guezelwebdesign', slogan: '', about: '' },
  ui_header: {
    nav_home: 'Home',
    nav_products: 'Products',
    nav_services: 'Services',
    nav_contact: 'Contact',
    cta_label: 'Get Offer',
  },
};

function isGeneralKey(k: string): k is GeneralKey {
  return (GENERAL_KEYS as readonly string[]).includes(k);
}

function stringifyValuePretty(v: SettingValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v as any);
  }
}

function formatValuePreview(v: SettingValue | undefined): string {
  if (v === undefined) return '';
  const s = stringifyValuePretty(v);
  if (s.length <= 180) return s;
  return `${s.slice(0, 177)}...`;
}

type RowGroup = {
  key: GeneralKey;
  globalRow?: SiteSetting;
  localeRow?: SiteSetting;
  effectiveValue: SettingValue | undefined;
  effectiveSource: 'locale' | 'global' | 'none';
};

function buildGroups(rows: any, locale: string): RowGroup[] {
  const only = rows.filter((r: any) => r && isGeneralKey(r.key));
  const byKey = new Map<GeneralKey, { global?: SiteSetting; local?: SiteSetting }>();

  for (const r of only) {
    const key = r.key as GeneralKey;
    const entry = byKey.get(key) || {};
    if (r.locale === '*') entry.global = r;
    if (r.locale === locale) entry.local = r;
    byKey.set(key, entry);
  }

  return GENERAL_KEYS.map((k) => {
    const entry = byKey.get(k) || {};
    const effectiveSource: RowGroup['effectiveSource'] = entry.local
      ? 'locale'
      : entry.global
        ? 'global'
        : 'none';

    const effectiveValue =
      effectiveSource === 'locale'
        ? entry.local?.value
        : effectiveSource === 'global'
          ? entry.global?.value
          : undefined;

    return {
      key: k,
      globalRow: entry.global,
      localeRow: entry.local,
      effectiveSource,
      effectiveValue,
    };
  });
}

function editHref(key: string, locale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(locale)}`;
}

function errMsg(err: any, fallback: string): string {
  return (
    err?.data?.error?.message ||
    err?.data?.message ||
    err?.message ||
    fallback
  );
}

/* ----------------------------- component ----------------------------- */

export type GeneralSettingsTabProps = {
  locale: string; // selected locale (tr/en/...)
};

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ locale }) => {
  const [search, setSearch] = React.useState('');

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  // list global + locale
  const listArgsGlobal = React.useMemo(() => {
    const q = search.trim() || undefined;
    return { locale: '*', q, keys: GENERAL_KEYS as unknown as string[] };
  }, [search]);

  const listArgsLocale = React.useMemo(() => {
    const q = search.trim() || undefined;
    return { locale, q, keys: GENERAL_KEYS as unknown as string[] };
  }, [locale, search]);

  const qGlobal = useListSiteSettingsAdminQuery(listArgsGlobal, { skip: !locale });
  const qLocale = useListSiteSettingsAdminQuery(listArgsLocale, { skip: !locale });

  const rowsMerged = React.useMemo(() => {
    const g = Array.isArray(qGlobal.data) ? qGlobal.data : [];
    const l = Array.isArray(qLocale.data) ? qLocale.data : [];
    return [...g, ...l];
  }, [qGlobal.data, qLocale.data]);

  const groups = React.useMemo(() => {
    const arr = Array.isArray(rowsMerged) ? rowsMerged : [];
    const s = search.trim().toLowerCase();

    const filtered =
      s && s.length >= 2
        ? arr.filter((r) => {
            if (!r || !isGeneralKey(r.key)) return false;
            const k = String(r.key || '').toLowerCase();
            const v = stringifyValuePretty(r.value as any).toLowerCase();
            return k.includes(s) || v.includes(s);
          })
        : arr.filter((r) => r && isGeneralKey(r.key));

    return buildGroups(filtered as SiteSetting[], locale);
  }, [rowsMerged, locale, search]);

  const busy =
    qGlobal.isLoading ||
    qLocale.isLoading ||
    qGlobal.isFetching ||
    qLocale.isFetching ||
    isSaving ||
    isDeleting;

  const refetchAll = async () => {
    await Promise.all([qGlobal.refetch(), qLocale.refetch()]);
  };

  const createOverrideFromGlobal = async (g: RowGroup) => {
    if (!g.globalRow) {
      toast.error(t('admin.siteSettings.general.missingGlobalError'));
      return;
    }

    try {
      await updateSetting({ key: g.key, locale, value: g.globalRow.value }).unwrap();
      toast.success(t('admin.siteSettings.general.overrideCreated', { key: g.key, locale }));
      await refetchAll();
    } catch (err: any) {
      toast.error(errMsg(err, t('admin.siteSettings.messages.error')));
    }
  };

  const restoreDefaults = async (key: GeneralKey, targetLocale: string) => {
    try {
      await updateSetting({
        key,
        locale: targetLocale,
        value: DEFAULTS_BY_KEY[key] as any,
      }).unwrap();
      toast.success(t('admin.siteSettings.general.defaultsRestored', { key, locale: targetLocale }));
      await refetchAll();
    } catch (err: any) {
      toast.error(errMsg(err, t('admin.siteSettings.messages.error')));
    }
  };

  const deleteRow = async (key: GeneralKey, targetLocale: string) => {
    const ok = window.confirm(t('admin.siteSettings.general.deleteConfirm', { key, locale: targetLocale }));
    if (!ok) return;

    try {
      await deleteSetting({ key, locale: targetLocale }).unwrap();
      toast.success(t('admin.siteSettings.general.deleted', { key, locale: targetLocale }));
      await refetchAll();
    } catch (err: any) {
      toast.error(errMsg(err, t('admin.siteSettings.messages.error')));
    }
  };

  const upsertEmptyGlobals = async () => {
    try {
      for (const k of GENERAL_KEYS) {
        const exists = groups.find((g) => g.key === k)?.globalRow;
        if (exists) continue;
        await updateSetting({ key: k, locale: '*', value: DEFAULTS_BY_KEY[k] as any }).unwrap();
      }
      toast.success(t('admin.siteSettings.general.globalBootstrapSuccess'));
      await refetchAll();
    } catch (err: any) {
      toast.error(errMsg(err, t('admin.siteSettings.messages.error')));
    }
  };

  function sourceBadge(src: RowGroup['effectiveSource']) {
    if (src === 'locale') return <Badge>{t('admin.siteSettings.general.sourceOverride')}</Badge>;
    if (src === 'global') return <Badge variant="secondary">{t('admin.siteSettings.general.sourceGlobal')}</Badge>;
    return <Badge variant="outline">{t('admin.siteSettings.general.sourceNone')}</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('admin.siteSettings.general.title')}</CardTitle>
              <CardDescription>
                {t('admin.siteSettings.general.description', { locale })}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t('admin.siteSettings.filters.language')}: {locale}</Badge>

              <Button
                type="button"
                variant="outline"
                onClick={refetchAll}
                disabled={busy}
                title={t('admin.siteSettings.filters.refreshButton')}
              >
                <RefreshCcw className="mr-2 size-4" />
                {t('admin.siteSettings.filters.refreshButton')}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={upsertEmptyGlobals}
                disabled={busy}
                title={t('admin.siteSettings.general.globalBootstrapTooltip')}
              >
                {t('admin.siteSettings.general.globalBootstrap')}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="general-search">{t('admin.siteSettings.filters.search')}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="general-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.siteSettings.general.searchPlaceholder')}
                className="pl-9"
                disabled={busy}
              />
            </div>
          </div>

          {/* Loading badge */}
          {busy ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge>
              <span className="text-xs text-muted-foreground">
                {t('admin.siteSettings.general.loadingNote')}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.siteSettings.general.recordsTitle')}</CardTitle>
          <CardDescription>
            {t('admin.siteSettings.general.managedKeys')}{' '}
            <span className="text-muted-foreground">
              {GENERAL_KEYS.map((k) => (
                <code key={k} className="mr-2">
                  {k}
                </code>
              ))}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[24%]">{t('admin.siteSettings.general.keyColumn')}</TableHead>
                  <TableHead className="w-[16%]">{t('admin.siteSettings.general.sourceColumn')}</TableHead>
                  <TableHead className="w-[40%]">{t('admin.siteSettings.general.effectiveColumn')}</TableHead>
                  <TableHead className="w-[20%] text-right">{t('admin.siteSettings.general.actionsColumn')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {groups.length ? (
                  groups.map((g) => {
                    const hasGlobal = Boolean(g.globalRow);
                    const hasLocal = Boolean(g.localeRow);

                    const editLocale = hasLocal ? locale : '*';
                    const canEdit = hasGlobal || hasLocal;

                    return (
                      <TableRow key={`group_${g.key}`}>
                        <TableCell className="align-top">
                          <div className="wrap-break-word font-mono text-sm font-medium">
                            {g.key}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {hasGlobal ? t('admin.siteSettings.general.globalExists') : t('admin.siteSettings.general.globalNotExists')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {hasLocal ? t('admin.siteSettings.general.localeExists', { locale }) : t('admin.siteSettings.general.localeNotExists', { locale })}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="align-top">
                          {sourceBadge(g.effectiveSource)}
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="max-w-md overflow-hidden wrap-break-word text-xs text-muted-foreground">
                            <code className="rounded bg-muted px-1.5 py-0.5">
                              {formatValuePreview(g.effectiveValue)}
                            </code>
                          </div>

                          {g.effectiveSource === 'global' && !hasLocal ? (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {t('admin.siteSettings.general.noOverrideNote', { locale })}
                            </div>
                          ) : null}
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button asChild variant="outline" size="sm" disabled={busy || !canEdit}>
                                <Link prefetch={false} href={editHref(g.key, editLocale)}>
                                  {t('admin.siteSettings.actions.edit')}
                                </Link>
                              </Button>

                              {!hasLocal && hasGlobal ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => createOverrideFromGlobal(g)}
                                  disabled={busy}
                                >
                                  {t('admin.siteSettings.general.overrideButton')}
                                </Button>
                              ) : null}

                              {hasGlobal || hasLocal ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreDefaults(g.key, hasLocal ? locale : '*')}
                                  disabled={busy}
                                  title={t('admin.siteSettings.general.restoreTooltip')}
                                >
                                  {t('admin.siteSettings.general.restoreButton')}
                                </Button>
                              ) : null}
                            </div>

                            {/* Delete buttons (global/local) */}
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteRow(g.key, '*')}
                                disabled={busy || !hasGlobal}
                                title={t('admin.siteSettings.general.deleteGlobalTooltip')}
                              >
                                {t('admin.siteSettings.general.deleteGlobal')}
                              </Button>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteRow(g.key, locale)}
                                disabled={busy || !hasLocal}
                                title={t('admin.siteSettings.general.deleteLocaleTooltip', { locale })}
                              >
                                {t('admin.siteSettings.general.deleteLocale')}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      {t('admin.siteSettings.general.noRecords')}
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={upsertEmptyGlobals}
                          disabled={busy}
                        >
                          {t('admin.siteSettings.general.globalBootstrap')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground">
            {t('admin.siteSettings.general.deleteTooltip')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

GeneralSettingsTab.displayName = 'GeneralSettingsTab';
