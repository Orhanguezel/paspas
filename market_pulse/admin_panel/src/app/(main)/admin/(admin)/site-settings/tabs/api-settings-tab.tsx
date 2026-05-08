'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import type { SettingValue } from '@/integrations/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type ApiSettingsTabProps = {
  locale: string;
};

const API_KEYS = [
  'keepa_api_key',
  'keepa_daily_token_budget',
  'oxylabs_username',
  'oxylabs_password',
  'groq_api_key',
  'openai_api_key',
] as const;

type ApiKey = (typeof API_KEYS)[number];
type ApiForm = Record<ApiKey, string>;

const EMPTY_FORM: ApiForm = {
  keepa_api_key: '',
  keepa_daily_token_budget: '',
  oxylabs_username: '',
  oxylabs_password: '',
  groq_api_key: '',
  openai_api_key: '',
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

export const ApiSettingsTab: React.FC<ApiSettingsTabProps> = ({ locale }) => {
  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: API_KEYS as unknown as string[],
    locale: '*',
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
        const value: SettingValue = form[key].trim() as any;
        await updateSetting({ key, value, locale: '*' }).unwrap();
      }
      toast.success(t('admin.siteSettings.api.saved', null, 'API ayarları kaydedildi.'));
      await refetch();
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || t('admin.siteSettings.api.saveError', null, 'Kayıt hatası');
      toast.error(msg);
    }
  };

  const inputClass = 'h-12 bg-gm-bg-deep border-gm-border-soft rounded-2xl focus:ring-gm-gold/50 focus:border-gm-gold/50 text-sm font-mono text-gm-text transition-all';
  const labelClass = 'text-[10px] font-bold text-gm-muted tracking-[0.15em] uppercase ml-1 block';
  const sectionHeaderClass = 'text-[11px] font-bold uppercase tracking-[0.2em] text-gm-gold flex items-center gap-2';
  const dot = <span className="w-2 h-2 rounded-full bg-gm-gold/50" />;

  return (
    <Card className="bg-gm-surface/20 border-gm-border-soft rounded-[32px] overflow-hidden backdrop-blur-sm shadow-xl">
      <CardHeader className="bg-gm-surface/40 p-8 border-b border-gm-border-soft gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-serif text-2xl text-gm-text">
              API ve Entegrasyonlar
            </CardTitle>
            <CardDescription className="text-gm-muted font-serif italic opacity-80">
              Scraping, fiyat takibi ve yapay zeka servislerinin API anahtarları. DB'de boşsa .env değerleri kullanılır.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-gm-gold/30 bg-gm-gold/5 text-gm-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
              GLOBAL
            </Badge>
            {busy && (
              <Badge variant="outline" className="border-gm-border-soft bg-gm-surface text-gm-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                Yükleniyor...
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              className="rounded-full border-gm-border-soft hover:bg-gm-surface/40 hover:text-gm-text h-10 px-5 text-[10px] font-bold tracking-widest uppercase transition-all"
            >
              <RefreshCcw className="mr-2 size-3.5" />
              Yenile
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-10">

        {/* Keepa */}
        <div className="space-y-6">
          <div className="border-b border-gm-border-soft pb-3 space-y-1">
            <h3 className={sectionHeaderClass}>{dot} Keepa — Amazon Fiyat Geçmişi</h3>
            <p className="text-[10px] font-serif italic text-gm-muted ml-4 opacity-80">
              DB boşsa .env KEEPA_API_KEY devreye girer. Günlük token bütçesi aşılınca kuyruk atlanır.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="keepa_api_key" className={labelClass}>Keepa API Key</Label>
              <Input
                id="keepa_api_key"
                type="password"
                value={form.keepa_api_key}
                onChange={(e) => handleChange('keepa_api_key', e.target.value)}
                placeholder="Keepa API anahtarı"
                disabled={busy}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keepa_daily_token_budget" className={labelClass}>Günlük Token Bütçesi</Label>
              <Input
                id="keepa_daily_token_budget"
                type="number"
                min={0}
                value={form.keepa_daily_token_budget}
                onChange={(e) => handleChange('keepa_daily_token_budget', e.target.value)}
                placeholder="300"
                disabled={busy}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Oxylabs */}
        <div className="space-y-6">
          <div className="border-b border-gm-border-soft pb-3 space-y-1">
            <h3 className={sectionHeaderClass}>{dot} Oxylabs — Web Scraping</h3>
            <p className="text-[10px] font-serif italic text-gm-muted ml-4 opacity-80">
              DB boşsa .env OXYLABS_USERNAME / OXYLABS_PASSWORD devreye girer. Amazon arama ve inceleme kazıma için gereklidir.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="oxylabs_username" className={labelClass}>Kullanıcı Adı</Label>
              <Input
                id="oxylabs_username"
                value={form.oxylabs_username}
                onChange={(e) => handleChange('oxylabs_username', e.target.value)}
                placeholder="Oxylabs sub-user adı"
                disabled={busy}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oxylabs_password" className={labelClass}>Şifre</Label>
              <Input
                id="oxylabs_password"
                type="password"
                value={form.oxylabs_password}
                onChange={(e) => handleChange('oxylabs_password', e.target.value)}
                placeholder="Oxylabs şifresi"
                disabled={busy}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* AI */}
        <div className="space-y-6">
          <div className="border-b border-gm-border-soft pb-3 space-y-1">
            <h3 className={sectionHeaderClass}>{dot} Yapay Zeka (Groq / OpenAI)</h3>
            <p className="text-[10px] font-serif italic text-gm-muted ml-4 opacity-80">
              DB boşsa .env GROQ_API_KEY / OPENAI_API_KEY devreye girer. Önce Groq denenir, yoksa OpenAI.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="groq_api_key" className={labelClass}>Groq API Key</Label>
              <Input
                id="groq_api_key"
                type="password"
                value={form.groq_api_key}
                onChange={(e) => handleChange('groq_api_key', e.target.value)}
                placeholder="gsk_..."
                disabled={busy}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai_api_key" className={labelClass}>OpenAI API Key</Label>
              <Input
                id="openai_api_key"
                type="password"
                value={form.openai_api_key}
                onChange={(e) => handleChange('openai_api_key', e.target.value)}
                placeholder="sk-..."
                disabled={busy}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-8 border-t border-gm-border-soft">
          <Button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="rounded-full bg-gm-gold text-gm-bg hover:bg-gm-gold-light h-12 px-10 text-[11px] font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] w-full md:w-auto"
          >
            {isSaving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
