// =============================================================
// FILE: src/components/admin/site-settings/tabs/SmtpSettingsTab.tsx
// SMTP / E-posta Ayarları Tab (GLOBAL) – style aligned
// ✅ i18n enabled
// =============================================================

import React from 'react';
import { toast } from 'sonner';
import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useSendTestMailMutation,
} from '@/integrations/hooks';

import type { SettingValue, SiteSetting } from '@/integrations/shared';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export type SmtpSettingsTabProps = {
  locale: string; // UI badge için dursun, GLOBAL tab
};

const SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',
  'smtp_ssl',
] as const;

type SmtpKey = (typeof SMTP_KEYS)[number];

type SmtpForm = {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_ssl: boolean;
};

const EMPTY_FORM: SmtpForm = {
  smtp_host: '',
  smtp_port: '',
  smtp_username: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: '',
  smtp_ssl: false,
};

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function toBool(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const t = v.trim().toLowerCase();
    return t === '1' || t === 'true' || t === 'yes' || t === 'on';
  }
  return false;
}

function toMap(settings?: any) {
  const map = new Map<string, any>();
  if (settings) for (const s of settings) map.set(s.key, s);
  return map;
}

export const SmtpSettingsTab: React.FC<SmtpSettingsTabProps> = ({ locale }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: SMTP_KEYS as unknown as string[],
    // GLOBAL => locale göndermiyoruz
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [sendTestMail, { isLoading: isTesting }] = useSendTestMailMutation();

  const [form, setForm] = React.useState<SmtpForm>(EMPTY_FORM);
  const [testEmail, setTestEmail] = React.useState<string>('');

  React.useEffect(() => {
    const map = toMap(settings);
    const next: SmtpForm = { ...EMPTY_FORM };

    next.smtp_host = valueToString(map.get('smtp_host')?.value);
    next.smtp_port = valueToString(map.get('smtp_port')?.value);
    next.smtp_username = valueToString(map.get('smtp_username')?.value);
    next.smtp_password = valueToString(map.get('smtp_password')?.value);
    next.smtp_from_email = valueToString(map.get('smtp_from_email')?.value);
    next.smtp_from_name = valueToString(map.get('smtp_from_name')?.value);
    next.smtp_ssl = toBool(map.get('smtp_ssl')?.value);

    setForm(next);
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving || isTesting;

  const handleChange = (field: Exclude<SmtpKey, 'smtp_ssl'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSsl = () => {
    setForm((prev) => ({ ...prev, smtp_ssl: !prev.smtp_ssl }));
  };

  const handleSave = async () => {
    try {
      const updates: { key: SmtpKey; value: SettingValue }[] = [
        { key: 'smtp_host', value: form.smtp_host.trim() },
        { key: 'smtp_port', value: form.smtp_port.trim() || '' },
        { key: 'smtp_username', value: form.smtp_username.trim() },
        { key: 'smtp_password', value: form.smtp_password },
        { key: 'smtp_from_email', value: form.smtp_from_email.trim() },
        { key: 'smtp_from_name', value: form.smtp_from_name.trim() },
        { key: 'smtp_ssl', value: form.smtp_ssl },
      ];

      for (const u of updates) {
        await updateSetting({ key: u.key, locale: '*', value: u.value }).unwrap();
      }

      toast.success(t('admin.siteSettings.smtp.saved'));
      await refetch();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || t('admin.siteSettings.smtp.saved');
      toast.error(msg);
    }
  };

  const handleSendTest = async () => {
    try {
      const trimmedTest = testEmail.trim();
      const fromEmail = form.smtp_from_email.trim();

      if (trimmedTest) await sendTestMail({ to: trimmedTest }).unwrap();
      else if (fromEmail) await sendTestMail({ to: fromEmail }).unwrap();
      else await sendTestMail().unwrap();

      toast.success(t('admin.siteSettings.smtp.testSent'));
    } catch (err: any) {
      const msg = err?.data?.error?.details || err?.data?.error?.message || err?.message;
      toast.error(msg || t('admin.siteSettings.smtp.testSent'));
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.smtp.title')}</CardTitle>
            <CardDescription>{t('admin.siteSettings.smtp.description')}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t('admin.siteSettings.smtp.badge', { locale: locale || '—' })}</Badge>
            <Button type="button" variant="outline" size="sm" onClick={refetch} disabled={busy}>
              {t('admin.common.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {busy && (
          <div>
            <Badge variant="secondary">{t('admin.common.loading')}</Badge>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-host" className="text-sm">
              {t('admin.siteSettings.smtp.host')}
            </Label>
            <Input
              id="smtp-host"
              value={form.smtp_host}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.hostPlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="smtp-port" className="text-sm">
              {t('admin.siteSettings.smtp.port')}
            </Label>
            <Input
              id="smtp-port"
              value={form.smtp_port}
              onChange={(e) => handleChange('smtp_port', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.portPlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="flex items-end md:col-span-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="smtp-ssl"
                checked={form.smtp_ssl}
                onCheckedChange={handleToggleSsl}
                disabled={busy}
              />
              <Label htmlFor="smtp-ssl" className="text-sm">
                {t('admin.siteSettings.smtp.ssl')}
              </Label>
            </div>
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-username" className="text-sm">
              {t('admin.siteSettings.smtp.username')}
            </Label>
            <Input
              id="smtp-username"
              value={form.smtp_username}
              onChange={(e) => handleChange('smtp_username', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.usernamePlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-password" className="text-sm">
              {t('admin.siteSettings.smtp.password')}
            </Label>
            <Input
              id="smtp-password"
              type="password"
              value={form.smtp_password}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.passwordPlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-from-email" className="text-sm">
              {t('admin.siteSettings.smtp.fromEmail')}
            </Label>
            <Input
              id="smtp-from-email"
              value={form.smtp_from_email}
              onChange={(e) => handleChange('smtp_from_email', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.fromEmailPlaceholder')}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.smtp.fromEmailHelp')}
            </p>
          </div>

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="smtp-from-name" className="text-sm">
              {t('admin.siteSettings.smtp.fromName')}
            </Label>
            <Input
              id="smtp-from-name"
              value={form.smtp_from_name}
              onChange={(e) => handleChange('smtp_from_name', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.fromNamePlaceholder')}
              disabled={busy}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="test-email" className="text-sm">
              {t('admin.siteSettings.smtp.testEmail')}
            </Label>
            <Input
              id="test-email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={t('admin.siteSettings.smtp.testEmailPlaceholder')}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.smtp.testEmailHelp')}
            </p>
          </div>

          <div className="mt-3 flex justify-end gap-2 md:mt-0 md:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={handleSendTest}>
              {isTesting ? t('admin.siteSettings.smtp.sendingTest') : t('admin.siteSettings.smtp.sendTest')}
            </Button>

            <Button type="button" variant="default" disabled={busy} onClick={handleSave}>
              {isSaving ? t('admin.common.saving') : t('admin.common.save')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
