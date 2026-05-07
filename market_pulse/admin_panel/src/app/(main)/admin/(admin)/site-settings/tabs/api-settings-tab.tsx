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
  'livekit_url',
  'livekit_api_key',
  'livekit_api_secret',
  'firebase_project_id',
  'firebase_client_email',
  'firebase_private_key',
  'iyzipay_api_key',
  'iyzipay_secret_key',
  'iyzipay_base_url',
] as const;

type ApiKey = (typeof API_KEYS)[number];
type ApiForm = Record<ApiKey, string>;

const EMPTY_FORM: ApiForm = {
  google_client_id: '',
  google_client_secret: '',
  gtm_container_id: '',
  ga4_measurement_id: '',
  cookie_consent: '',
  livekit_url: '',
  livekit_api_key: '',
  livekit_api_secret: '',
  firebase_project_id: '',
  firebase_client_email: '',
  firebase_private_key: '',
  iyzipay_api_key: '',
  iyzipay_secret_key: '',
  iyzipay_base_url: '',
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
      for (const key of API_KEYS) {
        let value: SettingValue = form[key].trim();
        if (key === 'cookie_consent') {
          value = tryParseJsonOrString(form.cookie_consent);
        }
        await updateSetting({ key, value, locale: '*' }).unwrap();
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
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-serif text-2xl text-gm-text">
              {t('admin.siteSettings.api.title', null, 'API ve Entegrasyonlar')}
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              {t('admin.siteSettings.api.description', null, 'Üçüncü parti servis bağlantılarını ve anahtarları yönetin.')}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
              GLOBAL
            </Badge>
            {busy && (
              <Badge variant="outline" className="border-gm-border-soft bg-gm-surface text-gm-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                {t('admin.siteSettings.messages.loading', null, 'Yükleniyor...')}
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              title={t('admin.siteSettings.actions.refresh', null, 'Yenile')}
              className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-10 px-5 text-[10px] font-bold tracking-widest uppercase transition-all"
            >
              <RefreshCcw className="mr-2 size-3.5" />
              {t('admin.siteSettings.actions.refresh', null, 'Yenile')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-10">
        {/* Google Section */}
        <div className="space-y-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold border-b border-gm-border-soft pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
            Google OAuth & Analytics
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="google_client_id" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.googleClientId', null, 'Google Client ID')}
              </Label>
              <Input
                id="google_client_id"
                value={form.google_client_id}
                onChange={(e) => handleChange('google_client_id', e.target.value)}
                placeholder="Google OAuth Client ID"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_client_secret" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.googleClientSecret', null, 'Google Client Secret')}
              </Label>
              <Input
                id="google_client_secret"
                type="password"
                value={form.google_client_secret}
                onChange={(e) => handleChange('google_client_secret', e.target.value)}
                placeholder="Google OAuth Client Secret"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtm_container_id" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.gtmContainerId', null, 'GTM Container ID')}
              </Label>
              <Input
                id="gtm_container_id"
                value={form.gtm_container_id}
                onChange={(e) => handleChange('gtm_container_id', e.target.value)}
                placeholder="GTM-XXXXXXX"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga4_measurement_id" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.ga4MeasurementId', null, 'GA4 Measurement ID')}
              </Label>
              <Input
                id="ga4_measurement_id"
                value={form.ga4_measurement_id}
                onChange={(e) => handleChange('ga4_measurement_id', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
          </div>
        </div>

        {/* LiveKit Section */}
        <div className="space-y-6">
          <div className="border-b border-gm-border-soft pb-3 space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
              LiveKit (Sesli / Görüntülü Görüşme)
            </h3>
            <p className="text-[10px] font-serif italic text-gm-muted ml-4 opacity-80">
              Sunucu tarafı .env dosyasından okunur — bu alanlar referans amaçlı kayıt tutar.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="livekit_url" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.livekitUrl', null, 'LiveKit URL')}
              </Label>
              <Input
                id="livekit_url"
                value={form.livekit_url}
                onChange={(e) => handleChange('livekit_url', e.target.value)}
                placeholder="wss://your-project.livekit.cloud"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livekit_api_key" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.livekitApiKey', null, 'LiveKit API Key')}
              </Label>
              <Input
                id="livekit_api_key"
                value={form.livekit_api_key}
                onChange={(e) => handleChange('livekit_api_key', e.target.value)}
                placeholder="API Key"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="livekit_api_secret" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.livekitApiSecret', null, 'LiveKit API Secret')}
              </Label>
              <Input
                id="livekit_api_secret"
                type="password"
                value={form.livekit_api_secret}
                onChange={(e) => handleChange('livekit_api_secret', e.target.value)}
                placeholder="API Secret"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
          </div>
        </div>

        {/* Firebase Section */}
        <div className="space-y-6">
          <div className="border-b border-gm-border-soft pb-3 space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
              Firebase (Push Bildirim)
            </h3>
            <p className="text-[10px] font-serif italic text-gm-muted ml-4 opacity-80">
              Service account credentials .env dosyasından okunur — bu alanlar referans içindir.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firebase_project_id" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.firebaseProjectId', null, 'Firebase Project ID')}
              </Label>
              <Input
                id="firebase_project_id"
                value={form.firebase_project_id}
                onChange={(e) => handleChange('firebase_project_id', e.target.value)}
                placeholder="Project ID"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firebase_client_email" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.firebaseClientEmail', null, 'Firebase Client Email')}
              </Label>
              <Input
                id="firebase_client_email"
                value={form.firebase_client_email}
                onChange={(e) => handleChange('firebase_client_email', e.target.value)}
                placeholder="client@project.iam.gserviceaccount.com"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="firebase_private_key" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.firebasePrivateKey', null, 'Firebase Private Key')}
              </Label>
              <Textarea
                id="firebase_private_key"
                rows={4}
                value={form.firebase_private_key}
                onChange={(e) => handleChange('firebase_private_key', e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----\n..."
                disabled={busy}
                className="font-mono text-xs leading-relaxed bg-gm-bg-deep border-gm-border-soft rounded-2xl p-4 focus:ring-gm-gold/50 focus:border-gm-gold/50 text-gm-text transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* Iyzipay Section */}
        <div className="space-y-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold border-b border-gm-border-soft pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
            Iyzipay (Ödeme)
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="iyzipay_api_key" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.iyzipayApiKey', null, 'Iyzipay API Key')}
              </Label>
              <Input
                id="iyzipay_api_key"
                value={form.iyzipay_api_key}
                onChange={(e) => handleChange('iyzipay_api_key', e.target.value)}
                placeholder="API Key"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iyzipay_secret_key" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.iyzipaySecretKey', null, 'Iyzipay Secret Key')}
              </Label>
              <Input
                id="iyzipay_secret_key"
                type="password"
                value={form.iyzipay_secret_key}
                onChange={(e) => handleChange('iyzipay_secret_key', e.target.value)}
                placeholder="Secret Key"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="iyzipay_base_url" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block">
                {t('admin.siteSettings.api.iyzipayBaseUrl', null, 'Iyzipay Base URL')}
              </Label>
              <Input
                id="iyzipay_base_url"
                value={form.iyzipay_base_url}
                onChange={(e) => handleChange('iyzipay_base_url', e.target.value)}
                placeholder="https://sandbox-api.iyzipay.com"
                disabled={busy}
                className="h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all"
              />
            </div>
          </div>
        </div>

        {/* Cookie Consent */}
        <div className="space-y-6 pt-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold border-b border-gm-border-soft pb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gm-gold/50" />
            Diğer Ayarlar
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 ml-1">
              <Label htmlFor="cookie_consent" className="text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase block">
                {t('admin.siteSettings.api.cookieConsent', null, 'Çerez İzni Yapılandırması')}
              </Label>
              <code className="text-[9px] text-gm-muted/60 font-mono tracking-wide bg-gm-bg-deep px-2 py-0.5 rounded-lg border border-gm-border-soft">cookie_consent</code>
            </div>
            <Textarea
              id="cookie_consent"
              rows={6}
              value={form.cookie_consent}
              onChange={(e) => handleChange('cookie_consent', e.target.value)}
              placeholder={t('admin.siteSettings.api.cookieConsentPlaceholder', null, 'JSON veya metin')}
              disabled={busy}
              className="font-mono text-xs leading-relaxed bg-gm-bg-deep border-gm-border-soft rounded-2xl p-5 focus:ring-gm-gold/50 focus:border-gm-gold/50 text-gm-text transition-all resize-y"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-8 border-t border-gm-border-soft">
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={busy} 
            className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light h-12 px-10 text-[11px] font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] w-full md:w-auto"
          >
            {isSaving ? t('admin.siteSettings.actions.saving', null, 'Kaydediliyor...') : t('admin.siteSettings.actions.save', null, 'Tümünü Kaydet')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
