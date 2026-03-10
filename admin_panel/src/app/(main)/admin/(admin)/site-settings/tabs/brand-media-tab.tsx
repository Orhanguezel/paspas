// =============================================================
// FILE: src/components/admin/site-settings/tabs/BrandMediaTab.tsx
// guezelwebdesign – Brand / Media Settings Tab (GLOBAL '*')
// =============================================================

'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import {
  useGetSiteSettingAdminByKeyQuery,
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SiteSettingRow, SettingValue } from '@/integrations/shared';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/AdminImageUploadField';
import { resolveMediaUrl } from '@/lib/media-url';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ----------------------------- constants ----------------------------- */

const GLOBAL_LOCALE = '*' as const;

export const SITE_MEDIA_KEYS = [
  'site_logo',
  'site_logo_dark',
  'site_logo_light',
  'site_favicon',
  'site_apple_touch_icon',
  'site_app_icon_512',
  'site_og_default_image',
] as const;

type MediaKey = (typeof SITE_MEDIA_KEYS)[number];

const BRANDING_MEDIA_FIELD_BY_KEY: Partial<Record<MediaKey, string>> = {
  site_logo: 'logo_url',
  site_logo_light: 'logo_url',
  site_logo_dark: 'login_logo_url',
  site_favicon: 'favicon_32',
  site_apple_touch_icon: 'apple_touch_icon',
  site_og_default_image: 'og_image',
};

function isMediaKey(k: string): k is MediaKey {
  return (SITE_MEDIA_KEYS as readonly string[]).includes(k);
}

/** 
 * Labels are now fetched from i18n: admin.siteSettings.brandMedia.labels.*
 */

const previewConfig: Record<
  MediaKey,
  {
    aspect: '16x9' | '4x3' | '1x1';
    fit: 'cover' | 'contain';
  }
> = {
  site_logo: { aspect: '4x3', fit: 'contain' },
  site_logo_dark: { aspect: '4x3', fit: 'contain' },
  site_logo_light: { aspect: '4x3', fit: 'contain' },
  site_favicon: { aspect: '1x1', fit: 'contain' },
  site_apple_touch_icon: { aspect: '1x1', fit: 'contain' },
  site_app_icon_512: { aspect: '1x1', fit: 'contain' },
  site_og_default_image: { aspect: '16x9', fit: 'cover' },
};

/* ----------------------------- helpers ----------------------------- */

const safeStr = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

function getEditHref(key: string, targetLocale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(
    targetLocale,
  )}`;
}

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

    // JSON gibi görünüyorsa parse et
    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));

    if (looksJson) {
      try {
        const parsed = JSON.parse(s);
        const url = safeStr((parsed as any)?.url);
        if (url) return url;
      } catch {
        // Parse hatası, direkt string olarak kullan
      }
    }

    // JSON değilse veya parse edemediyse, direkt URL olarak kabul et
    return s;
  }

  if (typeof v === 'object' && v !== null) {
    const url = safeStr((v as any)?.url);
    if (url) return url;
  }

  return '';
}

/** Save format: JSON object { url } */
function toMediaValue(url: string): SettingValue {
  const u = safeStr(url);
  if (!u) return null;
  return { url: u };
}

function parseJsonObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' && value !== null ? (value as Record<string, any>) : {};
}

function getBrandingFallbackUrl(configValue: unknown, key: MediaKey): string {
  const config = parseJsonObject(configValue);
  const branding = parseJsonObject(config.branding);
  const meta = parseJsonObject(branding.meta);

  if (key === 'site_og_default_image') {
    return safeStr(meta.og_image);
  }

  const field = BRANDING_MEDIA_FIELD_BY_KEY[key];
  if (!field) return '';

  return safeStr(branding[field]);
}

/* ----------------------------- component ----------------------------- */

export type BrandMediaTabProps = {
  locale: string;
};

export const BrandMediaTab: React.FC<BrandMediaTabProps> = ({ locale }) => {
  const t = useAdminT();
  const { data: brandingConfigRow } = useGetSiteSettingAdminByKeyQuery(
    { key: 'ui_admin_config', locale: '*' },
    { refetchOnMountOrArgChange: true },
  );

  // We fetch BOTH global '*' and the selected locale to handle overrides
  const listArgsGlobal = useMemo(() => ({
    locale: '*',
    keys: [...SITE_MEDIA_KEYS],
    sort: 'key' as const,
    order: 'asc' as const,
    limit: 200,
    offset: 0,
  }), []);

  const listArgsLocale = useMemo(() => ({
    locale,
    keys: [...SITE_MEDIA_KEYS],
    sort: 'key' as const,
    order: 'asc' as const,
    limit: 200,
    offset: 0,
  }), [locale]);

  const qGlobal = useListSiteSettingsAdminQuery(listArgsGlobal, {
    refetchOnMountOrArgChange: true,
  });

  const qLocale = useListSiteSettingsAdminQuery(listArgsLocale, {
    refetchOnMountOrArgChange: true,
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy = qGlobal.isLoading || qGlobal.isFetching || qLocale.isLoading || qLocale.isFetching || isSaving || isDeleting;

  const refetchAll = useCallback(async () => {
    // Note: manual refetch is rarely needed because qLocale refetches on arg change,
    // but we keep this for the Refresh button.
    await Promise.all([qGlobal.refetch(), qLocale.refetch()]);
  }, [qGlobal.refetch, qLocale.refetch]);

  // ✅ DELETED: Redundant useEffect that caused an infinite re-fetch/re-render loop. 
  // qLocale already has { locale } in args, so useListSiteSettingsAdminQuery 
  // with refetchOnMountOrArgChange: true handles the update automatically.

  const byKey = useMemo(() => {
    const map = new Map<MediaKey, SiteSettingRow | null>();
    for (const k of SITE_MEDIA_KEYS) map.set(k, null);

    const gData = qGlobal.data || [];
    const lData = qLocale.data || [];

    // Priority: locale row > global row
    for (const k of SITE_MEDIA_KEYS) {
      const lRow =
        locale === '*'
          ? null
          : lData.find((r) => {
              if (!r || r.key !== k) return false;
              const rowLocale = safeStr((r as any).locale);
              return rowLocale !== '' && rowLocale === locale.trim();
            });

      const gRow = gData.find((r) => {
        if (!r || r.key !== k) return false;
        const rowLocale = safeStr((r as any).locale);
        // locale column'u olmayan seed/şema için boş locale'i global kabul et
        return rowLocale === '' || rowLocale === '*';
      });

      map.set(k, lRow || gRow || null);
    }

    return map;
  }, [qGlobal.data, qLocale.data, locale]);

  const quickUpload = useCallback(
    async (key: MediaKey, url: string) => {
      const u = safeStr(url);
      if (!u) return;

      try {
        const label = t(`admin.siteSettings.brandMedia.labels.${key}` as any);
        if (BRANDING_MEDIA_FIELD_BY_KEY[key]) {
          const config = parseJsonObject(brandingConfigRow?.value);
          const branding = parseJsonObject(config.branding);
          const meta = parseJsonObject(branding.meta);
          const field = BRANDING_MEDIA_FIELD_BY_KEY[key] as string;

          const nextBranding = {
            ...branding,
            ...(key === 'site_og_default_image'
              ? { meta: { ...meta, og_image: u } }
              : { [field]: u }),
          };

          await updateSetting({
            key: 'ui_admin_config',
            locale: '*',
            value: {
              ...config,
              branding: nextBranding,
            },
          }).unwrap();
        } else {
          await updateSetting({ key, locale, value: toMediaValue(u) }).unwrap();
        }
        toast.success(t('admin.siteSettings.brandMedia.updated', { label }));
        await refetchAll();
      } catch (err: any) {
        const label = t(`admin.siteSettings.brandMedia.labels.${key}` as any);
        toast.error(
          err?.data?.error?.message ||
            err?.message ||
            t('admin.siteSettings.brandMedia.updateError', { label }),
        );
      }
    },
    [updateSetting, refetchAll, t, locale, brandingConfigRow?.value],
  );

  const deleteRow = useCallback(
    async (key: MediaKey) => {
      const row = byKey.get(key);
      const targetLocale = row?.locale || locale;
      const ok = window.confirm(t('admin.siteSettings.brandMedia.deleteConfirm', { key, locale: targetLocale }));
      if (!ok) return;

      try {
        if (BRANDING_MEDIA_FIELD_BY_KEY[key]) {
          const config = parseJsonObject(brandingConfigRow?.value);
          const branding = parseJsonObject(config.branding);
          const meta = parseJsonObject(branding.meta);
          const field = BRANDING_MEDIA_FIELD_BY_KEY[key] as string;

          const nextBranding =
            key === 'site_og_default_image'
              ? { ...branding, meta: { ...meta, og_image: '' } }
              : { ...branding, [field]: '' };

          await updateSetting({
            key: 'ui_admin_config',
            locale: '*',
            value: {
              ...config,
              branding: nextBranding,
            },
          }).unwrap();
        } else {
          await deleteSetting({ key, locale: targetLocale }).unwrap();
        }
        toast.success(t('admin.common.deleted', { item: key }));
        await refetchAll();
      } catch (err: any) {
        toast.error(err?.data?.error?.message || err?.message || t('admin.siteSettings.brandMedia.deleteError'));
      }
    },
    [deleteSetting, refetchAll, t, byKey, locale, brandingConfigRow?.value, updateSetting],
  );

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.brandMedia.title')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.brandMedia.description')}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-blue-500" />
              {t('admin.siteSettings.filters.language')}: {locale}
            </Badge>

            {/* If all displayed media rows are global, and we are on a specific locale, show fallback hint */}
            {locale !== '*' && Array.from(byKey.values()).every(r => !r || r.locale === '*') && (
              <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">
                {t('admin.siteSettings.messages.usingGlobalFallback')}
              </Badge>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refetchAll}
              disabled={busy}
            >
              {t('admin.siteSettings.actions.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {busy && (
          <Badge variant="secondary">{t('admin.siteSettings.messages.loading')}</Badge>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_MEDIA_KEYS.map((k) => {
            const row = byKey.get(k) ?? null;
            const hasRow = Boolean(row);
            const rowLocale = safeStr((row as any)?.locale);
            const isOverride = rowLocale !== '' && rowLocale !== '*';

            const rowValue = (row?.value ?? null) as SettingValue;
            const brandingFallbackUrl = getBrandingFallbackUrl(brandingConfigRow?.value, k);
            const rawUrl = resolveMediaUrl(
              extractUrlFromSettingValue(rowValue) || brandingFallbackUrl,
            );

            const cfg = previewConfig[k];

            return (
              <Card key={`media_${k}`} className="overflow-hidden">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">
                      {t(`admin.siteSettings.brandMedia.labels.${k}` as any)}
                    </CardTitle>
                    <div className="flex gap-1">
                      {row && isOverride && (
                        <Badge variant="default" className="mr-1 text-[10px] h-5">{t('admin.siteSettings.seo.override')}</Badge>
                      )}
                      <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                        <Link href={getEditHref(k, rowLocale || '*')}>{t('admin.siteSettings.actions.edit')}</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={busy || !hasRow}
                        onClick={() => void deleteRow(k)}
                      >
                        {t('admin.siteSettings.actions.delete')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 pt-0">
                  <AdminImageUploadField
                    label=""
                    bucket="public"
                    folder="site-media"
                    metadata={{ key: k, scope: 'site_settings', locale: rowLocale || '*' }}
                    value={rawUrl}
                    onChange={(nextUrl) => void quickUpload(k, nextUrl)}
                    disabled={busy}
                    openLibraryHref="/admin/storage"
                    previewAspect={cfg.aspect}
                    previewObjectFit={cfg.fit}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

BrandMediaTab.displayName = 'BrandMediaTab';
