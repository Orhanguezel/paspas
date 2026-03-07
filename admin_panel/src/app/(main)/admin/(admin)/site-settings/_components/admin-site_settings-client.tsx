'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/admin-site_settings-client.tsx
// FINAL — Admin Site Settings Client (shadcn/ui theme, UsersListClient layout)
// - NO bootstrap classes
// - Tabs + Filters card + Content card
// - list/global_list use SiteSettingsList (shadcn)
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { Search, RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { AVAILABLE_LOCALE_CODES, getLocaleLabel } from '@/i18n/localeCatalog';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { SiteSettingsList } from './site-settings-list';

// tabs (content sources)
import { GeneralSettingsTab } from '../tabs/general-settings-tab';
import { SeoSettingsTab } from '../tabs/seo-settings-tab';
import { SmtpSettingsTab } from '../tabs/smtp-settings-tab';
import { CloudinarySettingsTab } from '../tabs/cloudinary-settings-tab';
import { BrandMediaTab } from '../tabs/brand-media-tab';
import { ApiSettingsTab } from '../tabs/api-settings-tab';
import { LocalesSettingsTab } from '../tabs/locales-settings-tab';
import { BrandingSettingsTab } from '../tabs/branding-settings-tab';

import type { SiteSetting } from '@/integrations/shared';
import {
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
  useListSiteSettingsAdminQuery,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';

/* ----------------------------- helpers ----------------------------- */

type SettingsTab =
  | 'list'
  | 'global_list'
  | 'general'
  | 'seo'
  | 'smtp'
  | 'cloudinary'
  | 'brand_media'
  | 'api'
  | 'locales'
  | 'branding';

type LocaleOption = { value: string; label: string; isDefault?: boolean; isActive?: boolean };

function safeStr(v: unknown) {
  return v === null || v === undefined ? '' : String(v);
}

function getErrMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m1b = anyErr?.data?.error;
  if (typeof m1b === 'string' && m1b.trim()) return m1b;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return fallback;
}

function buildLocalesOptions(appLocales: any[] | undefined, defaultLocale: any): LocaleOption[] {
  const items = Array.isArray(appLocales) ? appLocales : [];
  const def = typeof defaultLocale === 'string' ? defaultLocale : safeStr(defaultLocale);

  const sorted = [...items].sort((a, b) => {
    const aa = a?.is_active === false ? 1 : 0;
    const bb = b?.is_active === false ? 1 : 0;
    if (aa !== bb) return aa - bb;
    return String(a?.code || '').localeCompare(String(b?.code || ''));
  });

  const mapped: LocaleOption[] = sorted
    .filter((x) => x?.code)
    .map((x) => {
      const code = String(x.code);
      const labelBase = x.label ? `${x.label} (${code})` : code;
      return {
        value: code,
        label: labelBase,
        isDefault: x.is_default === true,
        isActive: x.is_active !== false,
      };
    });

  if (!mapped.length) {
    const fallback = (def || FALLBACK_LOCALE).trim();
    const base = AVAILABLE_LOCALE_CODES.length ? AVAILABLE_LOCALE_CODES : [fallback];
    return base.map((code) => ({
      value: code,
      label: getLocaleLabel(code, FALLBACK_LOCALE),
      isDefault: code === fallback,
      isActive: true,
    }));
  }
  return mapped;
}

function pickInitialLocale(appLocales: any[] | undefined, defaultLocale: any): string {
  const items = Array.isArray(appLocales) ? appLocales : [];
  const def =
    typeof defaultLocale === 'string' ? defaultLocale.trim() : safeStr(defaultLocale).trim();

  if (def) return def;

  const firstActive = items.find((x) => x?.is_active !== false && x?.code)?.code;
  return firstActive ? String(firstActive) : FALLBACK_LOCALE;
}

function editHref(key: string, locale: string) {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(locale)}`;
}

/* ----------------------------- list panels ----------------------------- */

function ListPanel({
  locale,
  search,
  onDeleteRow,
}: {
  locale: string; // selected locale OR '*'
  search: string;
  onDeleteRow: (row: SiteSetting) => void;
}) {
  const qArgs = React.useMemo(() => {
    const q = search.trim() || undefined;
    return {
      locale,
      q,
      sort: 'key' as const,
      order: 'asc' as const,
      limit: 200,
      offset: 0,
    };
  }, [locale, search]);

  const listQ = useListSiteSettingsAdminQuery(qArgs, {
    skip: !locale,
    refetchOnMountOrArgChange: true,
  });

  const loading = listQ.isLoading || listQ.isFetching;

  return (
    <SiteSettingsList
      settings={(listQ.data ?? []) as SiteSetting[]}
      loading={loading}
      selectedLocale={locale}
      onDelete={onDeleteRow}
      getEditHref={(s) => editHref(String(s.key || ''), locale)}
    />
  );
}

/* ----------------------------- main component ----------------------------- */

export default function AdminSiteSettingsClient() {
  const localesQ = useGetAppLocalesAdminQuery();
  const defaultLocaleQ = useGetDefaultLocaleAdminQuery();

  const localeOptions: LocaleOption[] = React.useMemo(
    () => buildLocalesOptions(localesQ.data as any, defaultLocaleQ.data as any),
    [localesQ.data, defaultLocaleQ.data],
  );

  const initialLocale = React.useMemo(
    () => pickInitialLocale(localesQ.data as any, defaultLocaleQ.data as any),
    [localesQ.data, defaultLocaleQ.data],
  );

  const [tab, setTab] = React.useState<SettingsTab>('general');
  const [search, setSearch] = React.useState('');
  const [locale, setLocale] = React.useState<string>('');
  const [localeTouched, setLocaleTouched] = React.useState<boolean>(false);

  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  React.useEffect(() => {
    if (!localeTouched && adminLocale) {
      setLocale(adminLocale);
    }
  }, [adminLocale, localeTouched, initialLocale]);

  React.useEffect(() => {
    if (!locale && !localeTouched && initialLocale) {
      setLocale(initialLocale);
    }
  }, [initialLocale, locale, localeTouched]);

  const headerLoading =
    localesQ.isFetching ||
    defaultLocaleQ.isFetching ||
    localesQ.isLoading ||
    defaultLocaleQ.isLoading;

  const disabled = headerLoading || isDeleting;

  const onRefresh = async () => {
    try {
      await Promise.all([localesQ.refetch(), defaultLocaleQ.refetch()]);
      toast.success(t('admin.siteSettings.filters.refreshed'));
    } catch (err) {
      toast.error(getErrMessage(err, t('admin.siteSettings.messages.error')));
    }
  };

  const handleDeleteRow = async (row: SiteSetting) => {
    const key = String(row?.key || '').trim();
    const rowLocale = row?.locale ? String(row.locale) : undefined;
    if (!key) return;

    const ok = window.confirm(
      t('admin.siteSettings.list.deleteConfirm', { key, locale: rowLocale || locale || '—' }),
    );
    if (!ok) return;

    try {
      await deleteSetting({ key, locale: rowLocale ?? undefined }).unwrap();
      toast.success(t('admin.siteSettings.messages.deleted'));
    } catch (err) {
      toast.error(getErrMessage(err, t('admin.siteSettings.messages.error')));
    }
  };

  const localeReady = Boolean(locale && locale.trim());
  const isGlobalTab = tab === 'global_list' || tab === 'smtp' || tab === 'locales';

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden px-2 pb-6 md:px-0 md:pb-0">
      {/* PAGE HEAD (UsersListClient style) */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('admin.siteSettings.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('admin.siteSettings.description')}
        </p>
      </div>

      {/* FILTERS (UsersListClient style) */}
      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('admin.siteSettings.filters.title')}</CardTitle>
          <CardDescription>{t('admin.siteSettings.filters.description')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="w-full flex-1 space-y-2">
              <Label htmlFor="q">{t('admin.siteSettings.filters.search')}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('admin.siteSettings.filters.searchPlaceholder')}
                  className="w-full pl-9"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="w-full space-y-2 lg:w-56">
              <Label>{t('admin.siteSettings.filters.language')}</Label>
              <Select
                value={localeReady ? locale : ''}
                onValueChange={(v) => {
                  setLocaleTouched(true);
                  setLocale(v);
                }}
                disabled={disabled || isGlobalTab}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      isGlobalTab
                        ? t('admin.siteSettings.filters.globalPlaceholder')
                        : t('admin.siteSettings.filters.selectLanguage')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(localeOptions ?? []).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                      {o.isDefault ? ` • ${t('admin.siteSettings.filters.defaultSuffix')}` : ''}
                      {o.isActive === false ? ` • ${t('admin.siteSettings.filters.inactiveSuffix')}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isGlobalTab ? (
                <div className="text-xs text-muted-foreground">
                  {t('admin.siteSettings.filters.languageDisabledNote')}
                </div>
              ) : null}
            </div>

            <div className="flex w-full gap-2 lg:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={onRefresh}
                disabled={disabled}
                title={t('admin.siteSettings.filters.refreshButton')}
                className="flex-1 lg:flex-initial"
              >
                <RefreshCcw className="size-4" />
                <span className="ml-2 lg:hidden">{t('admin.siteSettings.filters.refreshButton')}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  if (!isGlobalTab) {
                    setLocaleTouched(false);
                    setLocale(initialLocale);
                  }
                }}
                disabled={disabled}
                className="flex-1 lg:flex-initial"
              >
                {t('admin.siteSettings.filters.resetButton')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONTENT */}
      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('admin.siteSettings.management.title')}</CardTitle>
              <CardDescription>
                {tab === 'list' ? t('admin.siteSettings.management.localeRecords') : null}
                {tab === 'global_list' ? t('admin.siteSettings.management.globalRecords') : null}
                {tab === 'general' ? t('admin.siteSettings.general.title') : null}
                {tab === 'seo' ? t('admin.siteSettings.tabs.seo') : null}
                {tab === 'smtp' ? t('admin.siteSettings.tabs.smtp') : null}
                {tab === 'cloudinary' ? t('admin.siteSettings.cloudinary.title') : null}
                {tab === 'brand_media' ? t('admin.siteSettings.brandMedia.title') : null}
                {tab === 'api' ? t('admin.siteSettings.api.title') : null}
                {tab === 'locales' ? t('admin.siteSettings.locales.title') : null}
                {tab === 'branding' ? t('admin.siteSettings.branding.title') : null}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {isGlobalTab ? <Badge variant="secondary">{t('admin.siteSettings.badges.global')}</Badge> : null}
              {!isGlobalTab && localeReady ? <Badge variant="secondary">{locale}</Badge> : null}
              {disabled ? <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!localeReady ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {t('admin.siteSettings.management.loadingMeta')}
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as SettingsTab)}>
              <div className="-mx-2 overflow-x-auto px-2 md:mx-0 md:overflow-x-visible md:px-0">
                <TabsList className="inline-flex min-w-full flex-nowrap justify-start md:flex-wrap">
                  <TabsTrigger value="list" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.list')}
                  </TabsTrigger>
                  <TabsTrigger value="global_list" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.globalList')}
                  </TabsTrigger>
                  <TabsTrigger value="general" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.general')}
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.seo')}
                  </TabsTrigger>
                  <TabsTrigger value="smtp" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.smtp')}
                  </TabsTrigger>
                  <TabsTrigger value="cloudinary" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.cloudinary')}
                  </TabsTrigger>
                  <TabsTrigger value="brand_media" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.brandMedia')}
                  </TabsTrigger>
                  <TabsTrigger value="api" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.api')}
                  </TabsTrigger>
                  <TabsTrigger value="locales" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.locales')}
                  </TabsTrigger>
                  <TabsTrigger value="branding" className="whitespace-nowrap">
                    {t('admin.siteSettings.tabs.branding')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="mt-4">
                <ListPanel locale={locale} search={search} onDeleteRow={handleDeleteRow} />
              </TabsContent>

              <TabsContent value="global_list" className="mt-4">
                <ListPanel locale="*" search={search} onDeleteRow={handleDeleteRow} />
              </TabsContent>

              <TabsContent value="general" className="mt-4">
                <GeneralSettingsTab locale={locale} />
              </TabsContent>

              <TabsContent value="seo" className="mt-4">
                <SeoSettingsTab locale={locale} />
              </TabsContent>

              <TabsContent value="smtp" className="mt-4">
                <SmtpSettingsTab locale={locale} />
              </TabsContent>

              <TabsContent value="cloudinary" className="mt-4">
                <CloudinarySettingsTab locale={locale} />
              </TabsContent>

              <TabsContent value="brand_media" className="mt-4">
                <BrandMediaTab locale={locale} />
              </TabsContent>

              <TabsContent value="api" className="mt-4">
                <ApiSettingsTab locale={locale} />
              </TabsContent>

              <TabsContent value="locales" className="mt-4">
                <LocalesSettingsTab />
              </TabsContent>

              <TabsContent value="branding" className="mt-4">
                <BrandingSettingsTab locale={locale} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
