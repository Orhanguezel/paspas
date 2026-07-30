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
import {
  Braces, ChevronRight, Cloud, Database, Globe2, ImageIcon, Languages,
  Mail, Palette, RefreshCcw, Search, Settings2, ShieldCheck,
} from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { AVAILABLE_LOCALE_CODES, getLocaleLabel } from '@/i18n/localeCatalog';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
import { PromatsSeoSettings } from '../tabs/promats-seo-settings';
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
  const menuItems: { value: SettingsTab; label: string; description: string; icon: typeof Settings2 }[] = [
    { value: 'general', label: t('admin.siteSettings.tabs.general'), description: t('admin.siteSettings.general.title'), icon: Settings2 },
    { value: 'branding', label: t('admin.siteSettings.tabs.branding'), description: t('admin.siteSettings.branding.title'), icon: ShieldCheck },
    { value: 'brand_media', label: t('admin.siteSettings.tabs.brandMedia'), description: t('admin.siteSettings.brandMedia.title'), icon: ImageIcon },
    { value: 'seo', label: t('admin.siteSettings.tabs.seo'), description: 'Arama motoru ve sayfa meta ayarları', icon: Globe2 },
    { value: 'api', label: t('admin.siteSettings.tabs.api'), description: t('admin.siteSettings.api.title'), icon: Braces },
    { value: 'smtp', label: t('admin.siteSettings.tabs.smtp'), description: 'E-posta sunucusu ve gönderim ayarları', icon: Mail },
    { value: 'cloudinary', label: t('admin.siteSettings.tabs.cloudinary'), description: t('admin.siteSettings.cloudinary.title'), icon: Cloud },
    { value: 'locales', label: t('admin.siteSettings.tabs.locales'), description: t('admin.siteSettings.locales.title'), icon: Languages },
    { value: 'list', label: t('admin.siteSettings.tabs.list'), description: t('admin.siteSettings.management.localeRecords'), icon: Database },
    { value: 'global_list', label: t('admin.siteSettings.tabs.globalList'), description: t('admin.siteSettings.management.globalRecords'), icon: Palette },
  ];
  const activeMenu = menuItems.find((item) => item.value === tab) ?? menuItems[0];

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 md:flex-row md:items-end">
        <div>
          <Badge variant="outline" className="mb-3">Sistem Yapılandırması</Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{t('admin.siteSettings.title')}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">{t('admin.siteSettings.description')}</p>
        </div>
        <div className="flex w-full items-end gap-2 md:w-auto">
          <div className="min-w-52 flex-1 space-y-1.5">
            <Label>{t('admin.siteSettings.filters.language')}</Label>
            <Select value={localeReady ? locale : ''} onValueChange={(value) => {
              setLocaleTouched(true);
              setLocale(value);
            }} disabled={disabled || isGlobalTab}>
              <SelectTrigger><SelectValue placeholder={t('admin.siteSettings.filters.selectLanguage')} /></SelectTrigger>
              <SelectContent>
                {localeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}{option.isDefault ? ' • Varsayılan' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={() => void onRefresh()} disabled={disabled} title={t('admin.siteSettings.filters.refreshButton')}>
            <RefreshCcw className={cn('size-4', headerLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20 p-4">
              <CardTitle className="text-sm">Ayar Kategorileri</CardTitle>
              <CardDescription>Yönetmek istediğiniz alanı seçin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {menuItems.map((item) => {
                const active = item.value === tab;
                return (
                  <button key={item.value} type="button" onClick={() => setTab(item.value)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left transition-colors',
                      active ? 'border-primary/20 bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}>
                    <item.icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-sm">{item.label}</span>
                    </span>
                    {active && <ChevronRight className="size-4 shrink-0" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>
          <div className="mt-3 rounded-xl border border-dashed bg-muted/20 p-4 text-muted-foreground text-xs">
            Global ayarlar bütün dillerde ortaktır. Diğer kategoriler üstte seçilen dile göre düzenlenir.
          </div>
        </aside>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <activeMenu.icon className="size-5 text-primary" />
                  {activeMenu.label}
                </CardTitle>
                <CardDescription className="mt-1">{activeMenu.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                {isGlobalTab ? <Badge>Global</Badge> : <Badge variant="outline">{locale.toUpperCase()}</Badge>}
                {disabled && <Badge variant="secondary">{t('admin.siteSettings.messages.loading')}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {!localeReady ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                {t('admin.siteSettings.management.loadingMeta')}
              </div>
            ) : (
              <>
                {(tab === 'list' || tab === 'global_list') && (
                  <div className="mb-5 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={search} onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('admin.siteSettings.filters.searchPlaceholder')} className="pl-9" />
                    </div>
                    <Button variant="outline" onClick={() => setSearch('')}>{t('admin.siteSettings.filters.resetButton')}</Button>
                  </div>
                )}
                {tab === 'list' && <ListPanel locale={locale} search={search} onDeleteRow={handleDeleteRow} />}
                {tab === 'global_list' && <ListPanel locale="*" search={search} onDeleteRow={handleDeleteRow} />}
                {tab === 'general' && <GeneralSettingsTab locale={locale} />}
                {tab === 'seo' && (
                  <div className="space-y-6">
                    <PromatsSeoSettings locale={locale} />
                    <details className="rounded-lg border">
                      <summary className="cursor-pointer px-4 py-3 font-medium text-sm">Gelişmiş / eski SEO kayıtları</summary>
                      <div className="border-t p-4"><SeoSettingsTab locale={locale} /></div>
                    </details>
                  </div>
                )}
                {tab === 'smtp' && <SmtpSettingsTab locale={locale} />}
                {tab === 'cloudinary' && <CloudinarySettingsTab locale={locale} />}
                {tab === 'brand_media' && <BrandMediaTab locale={locale} />}
                {tab === 'api' && <ApiSettingsTab locale={locale} />}
                {tab === 'locales' && <LocalesSettingsTab />}
                {tab === 'branding' && <BrandingSettingsTab locale={locale} />}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
