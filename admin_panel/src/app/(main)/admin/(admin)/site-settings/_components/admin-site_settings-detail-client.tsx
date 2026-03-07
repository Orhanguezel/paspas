'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/admin-site_settings-detail-client.tsx
// FINAL — Site Setting Detail (App Router)
// - Locale source: site_settings keys: app_locales + default_locale
// - URL sync: ?locale=xx or ?locale=*
// - NO bootstrap, shadcn/ui
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import type { SiteSetting, SettingValue } from '@/integrations/shared';
import {
  useGetSiteSettingAdminByKeyQuery,
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';
import { useAdminLocales } from '@/app/(main)/admin/_components/common/useAdminLocales';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { SiteSettingsForm } from './site-settings-form';
import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/AdminJsonEditor';
import { SeoStructuredForm } from '../tabs/structured/seo-structured-form';

import {
  ContactInfoStructuredForm,
  contactFormToObj,
  contactObjToForm,
  type ContactInfoFormState,
} from '../tabs/structured/contact-info-structured-form';

import {
  SocialsStructuredForm,
  socialsFormToObj,
  socialsObjToForm,
  type SocialsFormState,
} from '../tabs/structured/socials-structured-form';

import {
  CompanyProfileStructuredForm,
  companyFormToObj,
  companyObjToForm,
  type CompanyProfileFormState,
} from '../tabs/structured/company-profile-structured-form';

import {
  UiHeaderStructuredForm,
  uiHeaderFormToObj,
  uiHeaderObjToForm,
  type UiHeaderFormState,
} from '../tabs/structured/ui-header-structured-form';

import {
  BusinessHoursStructuredForm,
  businessHoursFormToObj,
  businessHoursObjToForm,
  type BusinessHoursFormState,
} from '../tabs/structured/business-hours-structured-form';

/* ----------------------------- helpers (same behavior as /pages) ----------------------------- */

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

function isSeoKey(key: string) {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  return k === 'seo' || k === 'site_seo' || k === 'site_meta_default';
}

const GENERAL_KEYS = [
  'contact_info',
  'socials',
  'businessHours',
  'company_profile',
  'ui_header',
] as const;
type GeneralKey = (typeof GENERAL_KEYS)[number];

function isGeneralKey(key: string): key is GeneralKey {
  return (GENERAL_KEYS as readonly string[]).includes(String(key || '').trim() as any);
}

function coerceSettingValue(input: any): any {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return input;
    const looksJson =
      (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
    if (!looksJson) return input;
    try {
      return JSON.parse(s);
    } catch {
      return input;
    }
  }

  return input;
}

/* ----------------------------- structured renderers ----------------------------- */

type StructuredRenderProps = {
  value: SettingValue;
  setValue: (next: any) => void;
  disabled?: boolean;
  settingKey: string;
  locale: string;
};

const JsonStructuredRenderer: React.FC<StructuredRenderProps> = ({ value, setValue, disabled }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const v = coerceSettingValue(value ?? {});
  return (
    <div className="space-y-3">
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        {t('admin.siteSettings.detail.structuredJson.noRenderer')}
      </div>

      <AdminJsonEditor
        label={t('admin.siteSettings.detail.structuredJson.label')}
        value={v ?? {}}
        onChange={(next) => setValue(next)}
        disabled={disabled}
        helperText={t('admin.siteSettings.detail.structuredJson.helperText')}
        height={340}
      />
    </div>
  );
};

const SeoStructuredRenderer: React.FC<StructuredRenderProps> = (p) => (
  <SeoStructuredForm
    settingKey={p.settingKey}
    locale={p.locale}
    value={p.value}
    setValue={p.setValue}
    disabled={p.disabled}
  />
);

const ContactStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ phone: '', email: '', address: '', whatsapp: '' }) as any,
    [],
  );
  const [form, setForm] = React.useState<ContactInfoFormState>(() => contactObjToForm(base, seed));

  React.useEffect(() => setForm(contactObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: ContactInfoFormState) => {
    setForm(next);
    setValue(contactFormToObj(next));
  };

  return (
    <ContactInfoStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const SocialsStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ instagram: '', facebook: '', linkedin: '', youtube: '', x: '' }) as any,
    [],
  );
  const [form, setForm] = React.useState<SocialsFormState>(() => socialsObjToForm(base, seed));

  React.useEffect(() => setForm(socialsObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: SocialsFormState) => {
    setForm(next);
    setValue(socialsFormToObj(next));
  };

  return (
    <SocialsStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const CompanyStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ company_name: 'guezelwebdesign', slogan: '', about: '' }) as any,
    [],
  );

  const [form, setForm] = React.useState<CompanyProfileFormState>(() =>
    companyObjToForm(base, seed),
  );
  React.useEffect(() => setForm(companyObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: CompanyProfileFormState) => {
    setForm(next);
    setValue(companyFormToObj(next));
  };

  return (
    <CompanyProfileStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const UiHeaderStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () =>
      ({
        nav_home: 'Home',
        nav_products: 'Products',
        nav_services: 'Services',
        nav_contact: 'Contact',
        cta_label: 'Get Offer',
      }) as any,
    [],
  );

  const [form, setForm] = React.useState<UiHeaderFormState>(() => uiHeaderObjToForm(base, seed));
  React.useEffect(() => setForm(uiHeaderObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: UiHeaderFormState) => {
    setForm(next);
    setValue(uiHeaderFormToObj(next));
  };

  return (
    <UiHeaderStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const BusinessHoursStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSettingValue(value);
    return Array.isArray(v) ? v : [];
  }, [value]);

  const seed = React.useMemo(
    () =>
      [
        { day: 'mon', open: '09:00', close: '18:00', closed: false },
        { day: 'tue', open: '09:00', close: '18:00', closed: false },
        { day: 'wed', open: '09:00', close: '18:00', closed: false },
        { day: 'thu', open: '09:00', close: '18:00', closed: false },
        { day: 'fri', open: '09:00', close: '18:00', closed: false },
        { day: 'sat', open: '10:00', close: '14:00', closed: false },
        { day: 'sun', open: '00:00', close: '00:00', closed: true },
      ] as any,
    [],
  );

  const [form, setForm] = React.useState<BusinessHoursFormState>(() =>
    businessHoursObjToForm(base, seed),
  );
  React.useEffect(() => setForm(businessHoursObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: BusinessHoursFormState) => {
    setForm(next);
    setValue(businessHoursFormToObj(next));
  };

  return (
    <BusinessHoursStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

/* ----------------------------- component ----------------------------- */

export default function SiteSettingsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const settingKey = React.useMemo(() => String(id || '').trim(), [id]);

  const {
    localeOptions: appLocaleOptions,
    defaultLocaleFromDb,
    loading: isLocalesLoading,
    fetching: isLocalesFetching,
  } = useAdminLocales();

  const localeOptions = React.useMemo(
    () => [{ value: '*', label: t('admin.siteSettings.detail.globalOption') }, ...appLocaleOptions],
    [appLocaleOptions, t],
  );

  const localeFromQuery = React.useMemo(() => {
    const q = sp.get('locale');
    return (q ?? '').trim();
  }, [sp]);

  const initialLocale = React.useMemo(() => {
    const qLocale = localeFromQuery === '*' ? '*' : toShortLocale(localeFromQuery);

    if (qLocale && localeOptions.some((x) => x.value === qLocale)) return qLocale;

    if (defaultLocaleFromDb && localeOptions.some((x) => x.value === defaultLocaleFromDb))
      return defaultLocaleFromDb;

    const firstNonGlobal = localeOptions.find((x) => x.value !== '*');
    return firstNonGlobal?.value || localeOptions?.[0]?.value || '';
  }, [localeFromQuery, localeOptions, defaultLocaleFromDb]);

  const [selectedLocale, setSelectedLocale] = React.useState<string>('');

  // init/repair selectedLocale
  React.useEffect(() => {
    if (!localeOptions.length) return;

    setSelectedLocale((prev) => {
      if (prev && localeOptions.some((x) => x.value === prev)) return prev;
      return initialLocale || '';
    });
  }, [localeOptions, initialLocale]);

  // keep URL in sync
  React.useEffect(() => {
    if (!settingKey || !selectedLocale) return;

    const cur = localeFromQuery === '*' ? '*' : toShortLocale(localeFromQuery);
    if (cur === selectedLocale) return;

    const qs = new URLSearchParams(Array.from(sp.entries()));
    qs.set('locale', selectedLocale);

    router.replace(`/admin/site-settings/${encodeURIComponent(settingKey)}?${qs.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingKey, selectedLocale]);

  // load row for key+locale (same pattern as /pages)
  const listArgs = React.useMemo(() => {
    if (!settingKey || !selectedLocale) return undefined;
    return { keys: [settingKey], locale: selectedLocale, limit: 10, offset: 0 };
  }, [settingKey, selectedLocale]);

  const {
    data: rows,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery(listArgs as any, { skip: !listArgs });

  const rowFromList: SiteSetting | null = React.useMemo(() => {
    const arr = Array.isArray(rows) ? (rows as SiteSetting[]) : [];
    const exact = arr.find(
      (r) => String(r?.key || '') === settingKey && String(r?.locale || '') === selectedLocale,
    );
    if (exact) return exact;

    const byKey = arr.find((r) => String(r?.key || '') === settingKey);
    return byKey || null;
  }, [rows, settingKey, selectedLocale]);

  // fallback-aware single read (shows effective locale row if selected locale doesn't exist)
  const resolvedQ = useGetSiteSettingAdminByKeyQuery(
    { key: settingKey, locale: selectedLocale },
    { skip: !settingKey || !selectedLocale },
  );

  const resolvedRow = (resolvedQ.data ?? null) as any as SiteSetting | null;

  const row: SiteSetting | null = rowFromList ?? resolvedRow;

  const effectiveLocale = React.useMemo(() => {
    const loc = (resolvedRow as any)?.locale;
    return loc === null || loc === undefined ? '' : String(loc).trim();
  }, [resolvedRow]);

  const isFallback =
    !rowFromList && !!resolvedRow && effectiveLocale && effectiveLocale !== selectedLocale;

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy =
    isLoading ||
    isFetching ||
    resolvedQ.isLoading ||
    resolvedQ.isFetching ||
    isSaving ||
    isDeleting ||
    isLocalesLoading ||
    isLocalesFetching;

  const handleSave = async (args: { key: string; locale: string; value: SettingValue }) => {
    try {
      if (String(args.key).toLowerCase() === 'site_meta_default' && args.locale === '*') {
        toast.error(t('admin.siteSettings.detail.siteMetaDefaultGlobalGuard'));
        return;
      }
      await updateSetting({ key: args.key, locale: args.locale, value: args.value }).unwrap();
      toast.success(t('admin.siteSettings.detail.updated', { key: args.key, locale: args.locale }));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.messages.error');
      toast.error(msg);
    }
  };

  const handleDelete = async (args: { key: string; locale?: string }) => {
    try {
      await deleteSetting({ key: args.key, locale: args.locale }).unwrap();
      toast.success(
        t('admin.siteSettings.detail.deleted', { key: args.key, locale: args.locale || '' }),
      );
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.messages.error');
      toast.error(msg);
    }
  };

  const renderStructured = React.useMemo(() => {
    if (!settingKey) return JsonStructuredRenderer;

    if (isSeoKey(settingKey)) {
      if (String(settingKey).toLowerCase() === 'site_meta_default') return JsonStructuredRenderer;
      return SeoStructuredRenderer;
    }

    if (isGeneralKey(settingKey)) {
      if (settingKey === 'contact_info') return ContactStructuredRenderer;
      if (settingKey === 'socials') return SocialsStructuredRenderer;
      if (settingKey === 'company_profile') return CompanyStructuredRenderer;
      if (settingKey === 'ui_header') return UiHeaderStructuredRenderer;
      if (settingKey === 'businessHours') return BusinessHoursStructuredRenderer;
    }

    return JsonStructuredRenderer;
  }, [settingKey]);

  const backHref = '/admin/site-settings';

  if (!settingKey) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.siteSettings.detail.keyMissingTitle')}</CardTitle>
            <CardDescription>{t('admin.siteSettings.detail.keyMissingDesc')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!busy && (!appLocaleOptions || appLocaleOptions.length === 0)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.siteSettings.detail.localesMissingTitle')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.detail.localesMissingDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link prefetch={false} href={backHref}>
                {t('admin.siteSettings.detail.localesMissingAction')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{t('admin.siteSettings.title')}</div>
          <h1 className="text-lg font-semibold">
            {t('admin.siteSettings.detail.editTitle')}: <code>{settingKey}</code>
          </h1>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link prefetch={false} href={backHref}>
              {t('admin.siteSettings.detail.backToList')}
            </Link>
          </Button>

          <div className="space-y-2">
            <Label>{t('admin.siteSettings.detail.localeLabel')}</Label>
            <Select
              value={selectedLocale || ''}
              onValueChange={(v) => setSelectedLocale(v === '*' ? '*' : toShortLocale(v))}
              disabled={busy || !localeOptions.length}
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder={t('admin.siteSettings.filters.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                {localeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={busy}
            title={t('admin.common.refresh')}
          >
            <RefreshCcw className="size-4" />
          </Button>

          {selectedLocale ? <Badge variant="secondary">{selectedLocale}</Badge> : null}
          {busy ? <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge> : null}
        </div>
      </div>

      {!selectedLocale ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          {t('admin.siteSettings.detail.loadingLocale')}
        </div>
      ) : (
        <div className="space-y-3">
          {isFallback ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {t('admin.siteSettings.detail.fallbackNotice', {
                selectedLocale,
                effectiveLocale,
              })}
            </div>
          ) : null}

          {!row && !busy ? (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              {t('admin.siteSettings.detail.noRecordNotice', { key: settingKey, locale: selectedLocale })}
            </div>
          ) : null}

          <SiteSettingsForm
            settingKey={settingKey}
            locale={selectedLocale}
            row={
              row
                ? ({
                    ...row,
                    value: coerceSettingValue((row as any).value),
                  } as any)
                : null
            }
            disabled={busy}
            initialMode="structured"
            onSave={handleSave}
            onDelete={async ({ key, locale }) => handleDelete({ key, locale })}
            renderStructured={(ctx) =>
              React.createElement(renderStructured as any, {
                value: ctx.value,
                setValue: ctx.setValue,
                disabled: ctx.disabled,
                settingKey,
                locale: selectedLocale,
              })
            }
          />
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {t('admin.siteSettings.detail.note')}
      </div>
    </div>
  );
}
