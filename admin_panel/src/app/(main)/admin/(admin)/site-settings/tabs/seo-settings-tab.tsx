// =============================================================
// FILE: src/components/admin/site-settings/tabs/SeoSettingsTab.tsx
// guezelwebdesign – SEO Ayarları (GLOBAL '*' + Localized Override)
// ✅ MODAL KALDIRILDI
// - “Düzenle” artık /admin/site-settings/[id]?locale=... form sayfasına gider
//
// FIXES (korundu):
// - Locale change => refetch (stale view engeli)
// - RTK Query: refetchOnMountOrArgChange (global + locale)
// - Deterministic preview
// - site_meta_default GLOBAL(*) olamaz (override/create/restore guard)
//
// NEW:
// - Global OG default image (site_og_default_image, locale='*')
//   bu tab üzerinden de AdminImageUploadField ile yönetilebilir.
// =============================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SiteSetting, SettingValue } from '@/integrations/shared';

import { DEFAULT_SEO_GLOBAL, DEFAULT_SITE_META_DEFAULT_BY_LOCALE } from '@/seo/seoSchema';

import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* ----------------------------- helpers ----------------------------- */

function stringifyValuePretty(v: SettingValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function isSeoKey(key: string): boolean {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  if (!k) return false;

  return (
    k === 'seo' ||
    k === 'site_seo' ||
    k === 'site_meta_default' ||
    k.startsWith('seo_') ||
    k.startsWith('seo|') ||
    k.startsWith('site_seo|') ||
    k.startsWith('ui_seo') ||
    k.startsWith('ui_seo_')
  );
}

const PRIMARY_SEO_KEYS = ['seo', 'site_seo', 'site_meta_default'] as const;

function orderSeoKeys(keys: string[]): string[] {
  const uniqKeys = Array.from(new Set(keys.filter(Boolean)));
  const primary = PRIMARY_SEO_KEYS.filter((k) => uniqKeys.includes(k));
  const rest = uniqKeys
    .filter((k) => !PRIMARY_SEO_KEYS.includes(k as any))
    .sort((a, b) => a.localeCompare(b));
  return [...primary, ...rest];
}

type RowGroup = {
  key: string;
  globalRow?: SiteSetting; // locale='*'
  localeRow?: SiteSetting; // locale='{selected}'
  effectiveValue: SettingValue | undefined;
  effectiveSource: 'locale' | 'global' | 'none';
};

function buildGroups(rows: any, locale: string): RowGroup[] {
  const seoRows = rows.filter((r: any) => r && isSeoKey(r.key));
  const keys = orderSeoKeys(seoRows.map((r: any) => r.key));

  const byKey = new Map<string, { global?: SiteSetting; local?: SiteSetting }>();
  for (const r of seoRows) {
    const entry = byKey.get(r.key) || {};
    if (r.locale === '*') entry.global = r;
    if (r.locale === locale) entry.local = r;
    byKey.set(r.key, entry);
  }

  return keys.map((k) => {
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

function preview(v: SettingValue | undefined): string {
  if (v === undefined) return '';
  const pretty = stringifyValuePretty(v);
  if (pretty.length <= 180) return pretty;
  return pretty.slice(0, 180) + '...';
}

function isPrimaryKey(k: string) {
  return k === 'seo' || k === 'site_seo' || k === 'site_meta_default';
}

function getEditHref(key: string, targetLocale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(
    targetLocale,
  )}`;
}

/* ----- media helpers (OG default image) ----- */

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

/**
 * DB'de media value:
 *  - string url
 *  - object: { url: "..." }
 *  - stringified json: "{ "url": "..." }"
 */
function extractUrlFromSettingValue(v: SettingValue): string {
  if (v === null || v === undefined) return '';

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';

    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (!looksJson) return s;

    try {
      const parsed = JSON.parse(s);
      return safeStr((parsed as any)?.url) || '';
    } catch {
      return s;
    }
  }

  if (typeof v === 'object') {
    return safeStr((v as any)?.url) || '';
  }

  return '';
}

/** Save format: JSON object { url } */
function toMediaValue(url: string): SettingValue {
  const u = safeStr(url);
  if (!u) return null;
  return { url: u };
}

/**
 * Normalize image URL - if relative, try to make it absolute
 * Returns empty string if URL is invalid
 */
function normalizeImageUrl(rawUrl: string): string {
  const url = safeStr(rawUrl);
  if (!url) return '';

  // Already a full URL (http, https, data URI)
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('//')
  ) {
    return url;
  }

  // Relative URL detected - log warning for debugging
  if (typeof window !== 'undefined') {
    console.warn(
      `[SeoSettingsTab] Relative URL detected: "${url}". ` +
        'Database should store full URLs. Attempting to resolve...',
    );
  }

  // Try to construct full URL using NEXT_PUBLIC_SITE_URL (public panel URL)
  // This is where storage/assets are served from
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const base = publicSiteUrl.replace(/\/$/, '');

  try {
    // If URL starts with /, use it directly (absolute path)
    // Otherwise, assume it's in storage folder
    const fullUrl = url.startsWith('/') ? `${base}${url}` : `${base}/storage/${url}`;

    if (typeof window !== 'undefined') {
      console.info(`[SeoSettingsTab] Resolved "${url}" to: ${fullUrl}`);
    }
    return fullUrl;
  } catch (e) {
    console.error('[SeoSettingsTab] Failed to normalize URL:', e);
  }

  // Return original if all else fails
  return url;
}

/* ----------------------------- component ----------------------------- */

export type SeoSettingsTabProps = {
  locale: string; // selected locale from header
};

export const SeoSettingsTab: React.FC<SeoSettingsTabProps> = ({ locale }) => {
  const [search, setSearch] = useState('');
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const copyToClipboard = React.useCallback(
    async (text: string) => {
      const val = safeStr(text);
      if (!val) return;

      try {
        await navigator.clipboard.writeText(val);
        toast.success(t('admin.siteSettings.messages.copied'));
      } catch {
        toast.error(t('admin.siteSettings.messages.copyError'));
      }
    },
    [t],
  );

  // ✅ Query args
  const listArgsGlobal = useMemo(() => {
    const q = search.trim() || undefined;
    return { locale: '*', q };
  }, [search]);

  const listArgsLocale = useMemo(() => {
    const q = search.trim() || undefined;
    return { locale, q };
  }, [locale, search]);

  // OG default image (GLOBAL '*') – sadece site_og_default_image
  const ogArgs = useMemo(
    () => ({
      locale: '*',
      // IMPORTANT: "as const" KULLANMIYORUZ; ListParams.keys => string[]
      keys: ['site_og_default_image'],
      sort: 'key' as const,
      order: 'asc' as const,
      limit: 1,
      offset: 0,
    }),
    [],
  );

  // ✅ IMPORTANT: refetchOnMountOrArgChange fixes stale locale switching in this tab
  const qGlobal = useListSiteSettingsAdminQuery(listArgsGlobal, {
    skip: !locale,
    refetchOnMountOrArgChange: true,
  });

  const qLocale = useListSiteSettingsAdminQuery(listArgsLocale, {
    skip: !locale,
    refetchOnMountOrArgChange: true,
  });

  const qOg = useListSiteSettingsAdminQuery(ogArgs, {
    refetchOnMountOrArgChange: true,
  });

  const rowsMerged = useMemo(() => {
    const g = Array.isArray(qGlobal.data) ? qGlobal.data : [];
    const l = Array.isArray(qLocale.data) ? qLocale.data : [];
    return [...g, ...l];
  }, [qGlobal.data, qLocale.data]);

  const groups = useMemo(() => {
    const arr = rowsMerged || [];
    const s = search.trim().toLowerCase();

    const filtered =
      s && s.length >= 2
        ? arr.filter((r) => {
            const k = String(r?.key || '').toLowerCase();
            const v = stringifyValuePretty(r?.value as any).toLowerCase();
            return k.includes(s) || v.includes(s);
          })
        : arr;

    return buildGroups(filtered, locale);
  }, [rowsMerged, locale, search]);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy =
    qGlobal.isLoading ||
    qLocale.isLoading ||
    qOg.isLoading ||
    qGlobal.isFetching ||
    qLocale.isFetching ||
    qOg.isFetching ||
    isSaving ||
    isDeleting;

  const refetchAll = async () => {
    await Promise.all([qGlobal.refetch(), qLocale.refetch(), qOg.refetch()]);
  };

  // ✅ Locale changed => refetch; prevents “previous locale view”
  useEffect(() => {
    if (!locale) return;
    void refetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const deleteRow = async (key: string, targetLocale: string) => {
    const ok = window.confirm(
      t('admin.siteSettings.seo.deleteConfirm', { key, locale: targetLocale }),
    );
    if (!ok) return;

    try {
      await deleteSetting({ key, locale: targetLocale }).unwrap();
      toast.success(t('admin.siteSettings.seo.deleted', { key, locale: targetLocale }));
      await refetchAll();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.seo.deleteError');
      toast.error(msg);
    }
  };

  const createOverrideFromGlobal = async (g: RowGroup) => {
    if (!g.globalRow) {
      toast.error(t('admin.siteSettings.general.missingGlobalError'));
      return;
    }

    // site_meta_default should not be global-copied; it must be locale based
    if (g.key === 'site_meta_default') {
      toast.error(t('admin.siteSettings.seo.siteMetaDefaultGlobalError'));
      return;
    }

    try {
      await updateSetting({
        key: g.key,
        locale,
        value: g.globalRow.value,
      }).unwrap();

      toast.success(t('admin.siteSettings.seo.overrideCreated', { key: g.key, locale }));
      await refetchAll();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.seo.overrideError');
      toast.error(msg);
    }
  };

  const restoreDefaults = async (key: string, targetLocale: string) => {
    try {
      if (key === 'seo') {
        await updateSetting({ key, locale: targetLocale, value: DEFAULT_SEO_GLOBAL }).unwrap();
      } else if (key === 'site_seo') {
        // ✅ Artık site_seo için de aynı global schema kullanılıyor
        await updateSetting({ key, locale: targetLocale, value: DEFAULT_SEO_GLOBAL }).unwrap();
      } else if (key === 'site_meta_default') {
        if (targetLocale === '*') {
          toast.error(t('admin.siteSettings.seo.siteMetaDefaultMustBeLocale'));
          return;
        }
        const seed =
          DEFAULT_SITE_META_DEFAULT_BY_LOCALE[targetLocale] ||
          DEFAULT_SITE_META_DEFAULT_BY_LOCALE[locale] ||
          DEFAULT_SITE_META_DEFAULT_BY_LOCALE['de'];
        await updateSetting({ key, locale: targetLocale, value: seed }).unwrap();
      } else {
        toast.error(t('admin.siteSettings.seo.defaultNotDefined'));
        return;
      }

      toast.success(t('admin.siteSettings.seo.defaultsRestored', { key, locale: targetLocale }));
      await refetchAll();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.message ||
        t('admin.siteSettings.seo.defaultsRestoreError');
      toast.error(msg);
    }
  };

  const upsertEmptyGlobalDefaults = async () => {
    const keys = ['seo', 'site_seo'] as const;

    try {
      for (const k of keys) {
        const exists = groups.find((g) => g.key === k)?.globalRow;
        if (exists) continue;

        await updateSetting({
          key: k,
          locale: '*',
          value: DEFAULT_SEO_GLOBAL, // ✅ site_seo da aynı şemayı kullanıyor
        }).unwrap();
      }
      toast.success(t('admin.siteSettings.seo.defaultsCreated'));
      await refetchAll();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.message ||
        t('admin.siteSettings.seo.defaultsCreateError');
      toast.error(msg);
    }
  };

  const effectiveEditLocale = (g: RowGroup): string => {
    // Öncelik: locale override varsa locale, yoksa global
    const chosen = g.localeRow ? locale : g.globalRow ? '*' : locale;

    // site_meta_default asla '*' ile düzenlenmesin (form sayfasında da guard var)
    if (g.key === 'site_meta_default' && chosen === '*') return locale;
    return chosen;
  };

  const globalEditLocaleForKey = (key: string): string => {
    // site_meta_default global edit yok -> locale ile aç
    if (key === 'site_meta_default') return locale;
    return '*';
  };

  // ---------------- OG DEFAULT IMAGE (GLOBAL '*') STATE ----------------

  const ogRow: SiteSetting | null = useMemo(() => {
    const arr = Array.isArray(qOg.data) ? qOg.data : [];
    const row = arr.find((r) => r && r.key === 'site_og_default_image') || null;
    return (row as SiteSetting | null) ?? null;
  }, [qOg.data]);

  const ogUrl = useMemo(() => {
    if (!ogRow) return '';
    return normalizeImageUrl(extractUrlFromSettingValue(ogRow.value as SettingValue));
  }, [ogRow]);

  const handleOgChange = async (nextUrl: string) => {
    const u = safeStr(nextUrl);
    if (!u) return;

    try {
      await updateSetting({
        key: 'site_og_default_image',
        locale: '*',
        value: toMediaValue(u),
      }).unwrap();
      toast.success(t('admin.siteSettings.seo.ogUpdated'));
      await qOg.refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.message ||
        t('admin.siteSettings.seo.ogUpdateError');
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.seo.title')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.seo.description', { locale })}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t('admin.siteSettings.filters.language')}: {locale}</Badge>
            <Button type="button" variant="outline" size="sm" onClick={refetchAll} disabled={busy}>
              {t('admin.siteSettings.filters.refreshButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={upsertEmptyGlobalDefaults}
              disabled={busy}
              title={t('admin.siteSettings.seo.globalBootstrapTooltip')}
            >
              {t('admin.siteSettings.seo.globalBootstrap')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* OG DEFAULT IMAGE (GLOBAL '*') BLOĞU */}
        <div className="rounded-md border p-4">
          <div className="mb-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold">{t('admin.siteSettings.seo.ogDefaultImage')}</div>
              <div className="text-xs text-muted-foreground">
                {t('admin.siteSettings.seo.ogDefaultImageKey')}: <code>site_og_default_image</code> /{' '}
                <code>locale=&quot;*&quot;</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <AdminImageUploadField
              label=""
              helperText={
                <span className="text-xs text-muted-foreground">
                  {t('admin.siteSettings.seo.ogDefaultImageHelp', { key: 'site_og_default_image' })}
                </span>
              }
              bucket="public"
              folder="site-media"
              metadata={{ key: 'site_og_default_image', scope: 'site_settings', locale: '*' }}
              value={ogUrl}
              onChange={(u) => void handleOgChange(u)}
              disabled={busy}
              openLibraryHref="/admin/storage"
              previewAspect="16x9"
              previewObjectFit="cover"
            />

            {ogUrl && (
                <div className="space-y-2">
                  <div className="rounded-md border bg-muted/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t('admin.siteSettings.seo.savedUrlLabel')}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void copyToClipboard(ogUrl)}
                        disabled={busy}
                      >
                        {t('admin.siteSettings.actions.copy')}
                      </Button>
                    </div>
                    <code className="block wrap-break-word text-xs font-mono leading-relaxed">
                      {ogUrl}
                    </code>
                  </div>

                {/* Manual preview for debugging */}
                <div className="rounded-md border bg-muted/50 p-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    {t('admin.siteSettings.seo.previewLabel')}
                  </div>
                  <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded border bg-background">
                    <img
                      src={ogUrl}
                      alt={t('admin.siteSettings.seo.ogDefaultImageAlt')}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.error-message')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className =
                            'error-message flex h-full items-center justify-center text-xs text-muted-foreground';
                          errorDiv.textContent = t('admin.siteSettings.seo.imageLoadError');
                          parent.appendChild(errorDiv);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-search">{t('admin.siteSettings.filters.search')}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="seo-search"
              type="text"
              placeholder={t('admin.siteSettings.seo.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={busy}
              className="pl-9"
            />
          </div>
        </div>

        {busy && (
          <div>
            <Badge variant="secondary">{t('admin.siteSettings.messages.loading')}</Badge>
          </div>
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[20%]">{t('admin.siteSettings.seo.columns.key')}</TableHead>
                <TableHead className="w-[15%]">{t('admin.siteSettings.seo.columns.source')}</TableHead>
                <TableHead className="w-[35%]">{t('admin.siteSettings.seo.columns.effective')}</TableHead>
                <TableHead className="w-[30%] text-right">{t('admin.siteSettings.seo.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {groups.length ? (
                groups.map((g) => {
                  const hasGlobal = Boolean(g.globalRow);
                  const hasLocal = Boolean(g.localeRow);

                  const editLoc = effectiveEditLocale(g);
                  const editHref = getEditHref(g.key, editLoc);

                  return (
                    <React.Fragment key={`group_${g.key}`}>
                      {/* Group summary row */}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-mono text-sm font-semibold">{g.key}</TableCell>
                        <TableCell>
                          {g.effectiveSource === 'locale' ? (
                            <Badge variant="default">{t('admin.siteSettings.seo.override')}</Badge>
                          ) : g.effectiveSource === 'global' ? (
                            <Badge variant="secondary">{t('admin.siteSettings.seo.global')}</Badge>
                          ) : (
                            <Badge variant="outline">{t('admin.siteSettings.seo.none')}</Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="wrap-break-word overflow-hidden text-sm text-muted-foreground">
                            {preview(g.effectiveValue)}
                          </div>
                          {g.effectiveSource === 'global' && !hasLocal && (
                            <div className="mt-1 wrap-break-word text-xs text-muted-foreground">
                              {t('admin.siteSettings.seo.hasOverride', { locale })}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="align-top">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button asChild variant="outline" size="sm">
                                <Link href={editHref}>{t('admin.siteSettings.actions.edit')}</Link>
                              </Button>

                              {!hasLocal && hasGlobal && g.key !== 'site_meta_default' && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => createOverrideFromGlobal(g)}
                                  disabled={busy}
                                >
                                  {t('admin.siteSettings.seo.createOverride')}
                                </Button>
                              )}

                              {isPrimaryKey(g.key) && (hasGlobal || hasLocal) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreDefaults(g.key, hasLocal ? locale : '*')}
                                  disabled={busy}
                                  title={t('admin.siteSettings.seo.restoreTooltip')}
                                >
                                  {t('admin.siteSettings.actions.restore')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Global row */}
                      <TableRow>
                        <TableCell className="pl-8 text-sm text-muted-foreground">
                          {t('admin.siteSettings.seo.globalRow')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {hasGlobal ? t('admin.siteSettings.seo.existsYes') : t('admin.siteSettings.seo.existsNo')}
                        </TableCell>
                        <TableCell className="wrap-break-word overflow-hidden text-sm text-muted-foreground">
                          {hasGlobal ? preview(g.globalRow?.value) : '-'}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button asChild variant="outline" size="sm" disabled={!hasGlobal}>
                              <Link
                                href={getEditHref(g.key, globalEditLocaleForKey(g.key))}
                                aria-disabled={!hasGlobal}
                                tabIndex={!hasGlobal ? -1 : 0}
                              >
                                {t('admin.siteSettings.actions.edit')}
                              </Link>
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={busy || !hasGlobal}
                              onClick={() => deleteRow(g.key, '*')}
                              title={
                                g.key === 'site_meta_default'
                                  ? t('admin.siteSettings.seo.siteMetaDefaultGlobalDeleteHint')
                                  : ''
                              }
                            >
                              {t('admin.siteSettings.actions.delete')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Locale row */}
                      <TableRow>
                        <TableCell className="pl-8 text-sm text-muted-foreground">
                          {t('admin.siteSettings.seo.localeRow', { locale })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {hasLocal ? t('admin.siteSettings.seo.existsYes') : t('admin.siteSettings.seo.existsNo')}
                        </TableCell>
                        <TableCell className="wrap-break-word overflow-hidden text-sm text-muted-foreground">
                          {hasLocal ? preview(g.localeRow?.value) : '-'}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button asChild variant="outline" size="sm" disabled={!hasLocal}>
                              <Link
                                href={getEditHref(g.key, locale)}
                                aria-disabled={!hasLocal}
                                tabIndex={!hasLocal ? -1 : 0}
                              >
                                {t('admin.siteSettings.actions.edit')}
                              </Link>
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={busy || !hasLocal}
                              onClick={() => deleteRow(g.key, locale)}
                            >
                              {t('admin.siteSettings.actions.delete')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center">
                    <div className="text-sm text-muted-foreground">
                      {t('admin.siteSettings.seo.noRecords')}
                      <div className="mt-2">
                        {t('admin.siteSettings.seo.seedNote')}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="border-t p-3">
            <span className="text-xs text-muted-foreground">
              {t('admin.siteSettings.seo.note')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
