'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/api-settings-tab.tsx
// API & Entegrasyon Ayarları (GLOBAL)
// - Shadcn/ui components
// - Responsive design
// - TypeScript safe
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SettingValue, SiteSetting } from '@/integrations/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type ApiSettingsTabProps = {
  locale: string;
};

const API_KEYS = [
  'google_client_id',
  'google_client_secret',
  'gtm_container_id',
  'ga4_measurement_id',
  'cookie_consent',
] as const;

type ApiKey = (typeof API_KEYS)[number];
type ApiForm = Record<ApiKey, string>;

const EMPTY_FORM: ApiForm = {
  google_client_id: '',
  google_client_secret: '',
  gtm_container_id: '',
  ga4_measurement_id: '',
  cookie_consent: '',
};

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function toMap(settings?: any) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

function tryParseJsonOrString(input: string): SettingValue {
  const s = String(input ?? '').trim();
  if (!s) return '' as any;
  try {
    return JSON.parse(s) as any;
  } catch {
    return s as any;
  }
}

export const ApiSettingsTab: React.FC<ApiSettingsTabProps> = ({ locale }) => {
  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: API_KEYS as unknown as string[],
    locale: '*', // ✅ Global settings
  } as any);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [form, setForm] = React.useState<ApiForm>(EMPTY_FORM);

  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  React.useEffect(() => {
    const map = toMap(settings);
    const next: ApiForm = { ...EMPTY_FORM };
    API_KEYS.forEach((k) => {
      next[k] = valueToString(map.get(k)?.value);
    });
    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const handleChange = (field: ApiKey, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    try {
      const updates: { key: ApiKey; value: SettingValue }[] = [
        { key: 'google_client_id', value: form.google_client_id.trim() },
        { key: 'google_client_secret', value: form.google_client_secret.trim() },
        { key: 'gtm_container_id', value: form.gtm_container_id.trim() },
        { key: 'ga4_measurement_id', value: form.ga4_measurement_id.trim() },
        { key: 'cookie_consent', value: tryParseJsonOrString(form.cookie_consent) },
      ];

      for (const u of updates) {
        await updateSetting({ key: u.key, value: u.value, locale: '*' }).unwrap();
      }

      toast.success(t('admin.siteSettings.api.saved'));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.api.saveError');
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.api.title')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.api.description')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t('admin.siteSettings.api.badge')}</Badge>
            {locale && <Badge variant="outline">{t('admin.siteSettings.api.uiBadge', { locale })}</Badge>}
            {busy && <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              title={t('admin.siteSettings.actions.refresh')}
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground">
          {t('admin.siteSettings.api.note')}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Google Client ID */}
          <div className="space-y-2">
            <Label htmlFor="google_client_id">
              {t('admin.siteSettings.api.googleClientId')}
              <code className="ml-2 text-xs text-muted-foreground">(google_client_id)</code>
            </Label>
            <Input
              id="google_client_id"
              value={form.google_client_id}
              onChange={(e) => handleChange('google_client_id', e.target.value)}
              placeholder="Google OAuth Client ID"
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.api.googleClientIdHelp')}
            </p>
          </div>

          {/* Google Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="google_client_secret">
              {t('admin.siteSettings.api.googleClientSecret')}
              <code className="ml-2 text-xs text-muted-foreground">(google_client_secret)</code>
            </Label>
            <Input
              id="google_client_secret"
              type="password"
              value={form.google_client_secret}
              onChange={(e) => handleChange('google_client_secret', e.target.value)}
              placeholder="Google OAuth Client Secret"
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.api.googleClientSecretHelp')}
            </p>
          </div>

          {/* GTM Container ID */}
          <div className="space-y-2">
            <Label htmlFor="gtm_container_id">
              {t('admin.siteSettings.api.gtmContainerId')}
              <code className="ml-2 text-xs text-muted-foreground">(gtm_container_id)</code>
            </Label>
            <Input
              id="gtm_container_id"
              value={form.gtm_container_id}
              onChange={(e) => handleChange('gtm_container_id', e.target.value)}
              placeholder={t('admin.siteSettings.api.gtmContainerIdPlaceholder')}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.api.gtmContainerIdHelp')}
            </p>
          </div>

          {/* GA4 Measurement ID */}
          <div className="space-y-2">
            <Label htmlFor="ga4_measurement_id">
              {t('admin.siteSettings.api.ga4MeasurementId')}
              <code className="ml-2 text-xs text-muted-foreground">(ga4_measurement_id)</code>
            </Label>
            <Input
              id="ga4_measurement_id"
              value={form.ga4_measurement_id}
              onChange={(e) => handleChange('ga4_measurement_id', e.target.value)}
              placeholder={t('admin.siteSettings.api.ga4MeasurementIdPlaceholder')}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.api.ga4MeasurementIdHelp')}
            </p>
          </div>
        </div>

        {/* Cookie Consent - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="cookie_consent">
            {t('admin.siteSettings.api.cookieConsent')}
            <code className="ml-2 text-xs text-muted-foreground">(cookie_consent)</code>
          </Label>
          <Textarea
            id="cookie_consent"
            rows={10}
            value={form.cookie_consent}
            onChange={(e) => handleChange('cookie_consent', e.target.value)}
            placeholder={t('admin.siteSettings.api.cookieConsentPlaceholder')}
            disabled={busy}
            className="font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            {t('admin.siteSettings.api.cookieConsentHelp')}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={busy}>
            {isSaving ? t('admin.siteSettings.actions.saving') : t('admin.siteSettings.actions.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
