'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import {
  useDeleteIntegrationSettingsAdminMutation,
  useListIntegrationSettingsAdminQuery,
  useUpsertIntegrationSettingsAdminMutation,
} from '@/integrations/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type IntegrationSettingsTabProps = {
  locale: string;
};

type IntegrationItem = {
  provider: string;
  enabled: boolean;
  settings: Record<string, unknown>;
};

type DraftState = {
  enabled: boolean;
  settingsText: string;
};

const PRESET_PROVIDERS = [
  'geliver',
  'google',
  'google_maps',
  'facebook',
  'ai',
  'groq',
  'openai',
  'anthropic',
  'gemini',
  'cloudinary',
  'telegram',
  'iyzico',
] as const;

// Ayrı sekme olarak yönetilen AI sağlayıcıları
const AI_INDIVIDUAL_PROVIDERS = ['groq', 'openai', 'anthropic', 'gemini'];

const AI_PROVIDER_PRESETS: Record<
  string,
  { model: string; baseUrl: string; apiKeyLabel: string; apiKeyPlaceholder: string }
> = {
  openai: {
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-...',
  },
  anthropic: {
    model: 'claude-3-5-sonnet-20241022',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyLabel: 'Claude (Anthropic) API Key',
    apiKeyPlaceholder: 'sk-ant-...',
  },
  gemini: {
    model: 'gemini-1.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'AIza...',
  },
  groq: {
    model: 'llama-3.1-8b-instant',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyLabel: 'Groq API Key',
    apiKeyPlaceholder: 'gsk_...',
  },
  custom: {
    model: '',
    baseUrl: '',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'api key',
  },
};

function toDisplayName(provider: string): string {
  return provider
    .split('_')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');
}

function safeError(err: unknown, fallback: string): string {
  const e = err as any;
  return e?.data?.error?.message || e?.data?.message || e?.message || fallback;
}

function stringifySettings(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{}';
  }
}

function parseSettings(value: string): Record<string, unknown> {
  const raw = value.trim();
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Ayarlar JSON object olmalı.');
  }
  return parsed as Record<string, unknown>;
}

function parseSettingsSafe(value: string): Record<string, unknown> {
  try {
    return parseSettings(value);
  } catch {
    return {};
  }
}

function asText(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(s);
  }
  return false;
}

function getAiPreset(provider: string) {
  return AI_PROVIDER_PRESETS[provider] ?? AI_PROVIDER_PRESETS.custom;
}

export function IntegrationSettingsTab({ locale }: IntegrationSettingsTabProps) {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const listQ = useListIntegrationSettingsAdminQuery({ include_secrets: true });
  const [upsertIntegration, { isLoading: isSaving }] = useUpsertIntegrationSettingsAdminMutation();
  const [deleteIntegration, { isLoading: isDeleting }] = useDeleteIntegrationSettingsAdminMutation();

  const [drafts, setDrafts] = React.useState<Record<string, DraftState>>({});
  const [customProvider, setCustomProvider] = React.useState('');
  const [activeProvider, setActiveProvider] = React.useState<string>(PRESET_PROVIDERS[0]);

  const serverItems: IntegrationItem[] = React.useMemo(
    () => (Array.isArray(listQ.data) ? (listQ.data as IntegrationItem[]) : []),
    [listQ.data],
  );

  const providers = React.useMemo(() => {
    const discovered = serverItems.map((x) => String(x.provider || '').trim()).filter(Boolean);
    const merged = [...PRESET_PROVIDERS, ...discovered];
    return Array.from(new Set(merged))
      .filter((p) => p !== 'kargo')
      .sort((a, b) => a.localeCompare(b));
  }, [serverItems]);

  React.useEffect(() => {
    if (!providers.length) return;
    if (!providers.includes(activeProvider)) {
      setActiveProvider(providers[0]);
    }
  }, [providers, activeProvider]);

  React.useEffect(() => {
    if (!providers.length) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const provider of providers) {
        const existing = serverItems.find((x) => x.provider === provider);
        if (existing) {
          // Server'dan gelen data varsa her zaman güncelle (refresh sonrası kayıp önlenir)
          next[provider] = {
            enabled: Boolean(existing.enabled),
            settingsText: stringifySettings(existing.settings ?? {}),
          };
        } else if (!next[provider]) {
          // Server'da yoksa ve draft da yoksa boş başlat
          next[provider] = { enabled: false, settingsText: '{}' };
        }
      }
      return next;
    });
  }, [providers, serverItems]);

  const busy = listQ.isLoading || listQ.isFetching || isSaving || isDeleting;

  const updateDraft = (provider: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({
      ...prev,
      [provider]: {
        enabled: prev[provider]?.enabled ?? false,
        settingsText: prev[provider]?.settingsText ?? '{}',
        ...patch,
      },
    }));
  };

  const updateSettingField = (provider: string, field: string, value: unknown) => {
    const current = drafts[provider] ?? { enabled: false, settingsText: '{}' };
    const settings = parseSettingsSafe(current.settingsText);

    settings[field] = value;
    updateDraft(provider, { settingsText: stringifySettings(settings) });
  };

  const onSaveProvider = async (provider: string) => {
    const draft = drafts[provider];
    if (!draft) return;

    try {
      const settings = parseSettings(draft.settingsText);
      await upsertIntegration({
        provider,
        enabled: draft.enabled,
        settings,
      }).unwrap();
      toast.success(`${toDisplayName(provider)} ayarları kaydedildi.`);
    } catch (err) {
      toast.error(safeError(err, `${toDisplayName(provider)} ayarları kaydedilemedi.`));
    }
  };

  const onResetProvider = (provider: string) => {
    const item = serverItems.find((x) => x.provider === provider);
    updateDraft(provider, {
      enabled: Boolean(item?.enabled),
      settingsText: stringifySettings(item?.settings ?? {}),
    });
  };

  const onDeleteProvider = async (provider: string) => {
    if (!window.confirm(`"${provider}" provider ayarları silinsin mi?`)) return;
    try {
      await deleteIntegration(provider).unwrap();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
      toast.success(`${toDisplayName(provider)} ayarları silindi.`);
    } catch (err) {
      toast.error(safeError(err, `${toDisplayName(provider)} ayarları silinemedi.`));
    }
  };

  const onAddProvider = () => {
    const normalized = customProvider.trim().toLowerCase().replace(/\s+/g, '_');
    if (!normalized) return;
    if (!/^[a-z0-9][a-z0-9_-]{1,48}$/.test(normalized)) {
      toast.error('Provider adı geçersiz. Örn: custom_api');
      return;
    }
    if (!drafts[normalized]) {
      updateDraft(normalized, { enabled: false, settingsText: '{}' });
    }
    setActiveProvider(normalized);
    setCustomProvider('');
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Entegrasyon Ayarları</CardTitle>
            <CardDescription>
              Kargo, Geliver, Google, Facebook, Google Maps, Yapay Zeka, Cloudinary, Telegram gibi
              3. taraf API ayarlarını tek yerden yönetin.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t('admin.siteSettings.badges.global')}</Badge>
            {locale ? <Badge variant="outline">UI: {locale}</Badge> : null}
            {busy ? <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge> : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => listQ.refetch()}
              disabled={busy}
              title={t('admin.siteSettings.actions.refresh')}
            >
              <RefreshCcw className={busy ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border p-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="custom-provider">Yeni Provider Ekle</Label>
              <Input
                id="custom-provider"
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                placeholder="ornek_api"
                disabled={busy}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={onAddProvider} disabled={busy || !customProvider.trim()}>
                Ekle
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeProvider} onValueChange={setActiveProvider}>
          <div className="-mx-2 overflow-x-auto px-2 md:mx-0 md:overflow-x-visible md:px-0">
            <TabsList className="inline-flex min-w-full flex-nowrap justify-start md:flex-wrap">
              {providers.map((provider) => (
                <TabsTrigger key={provider} value={provider} className="whitespace-nowrap">
                  {toDisplayName(provider)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {providers.map((provider) => {
            const draft = drafts[provider] ?? { enabled: false, settingsText: '{}' };

            return (
              <TabsContent key={provider} value={provider} className="mt-4">
                <div className="rounded-md border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{toDisplayName(provider)}</h4>
                      <Badge variant="outline">{provider}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Aktif</Label>
                      <Switch
                        checked={draft.enabled}
                        onCheckedChange={(val) => updateDraft(provider, { enabled: val })}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  {provider === 'ai' ? (
                    <div className="space-y-4">
                      {(() => {
                        const settings = parseSettingsSafe(draft.settingsText);
                        return (
                          <>
                            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                              Her AI sağlayıcısını (Groq, OpenAI, Anthropic, Gemini) ayrı sekmelerde yapılandırın.
                              Burada hangi sırayla deneneceğini ve genel ayarları belirleyin.
                            </div>

                            <div className="space-y-2">
                              <Label>Sağlayıcı Öncelik Sırası</Label>
                              <Input
                                value={asText(settings.provider_order)}
                                onChange={(e) => updateSettingField(provider, 'provider_order', e.target.value)}
                                placeholder="groq,openai,anthropic,gemini"
                                disabled={busy}
                              />
                              <p className="text-xs text-muted-foreground">
                                Virgülle ayrılmış sıra. İlk aktif &amp; anahtarlı sağlayıcı kullanılır; başarısız olursa sıradakine geçilir.
                              </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Temperature (varsayılan)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="2"
                                  value={asText(settings.temperature)}
                                  onChange={(e) =>
                                    updateSettingField(provider, 'temperature', e.target.value ? Number(e.target.value) : '')
                                  }
                                  placeholder="0.7"
                                  disabled={busy}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Max Tokens (varsayılan)</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={asText(settings.max_tokens)}
                                  onChange={(e) =>
                                    updateSettingField(provider, 'max_tokens', e.target.value ? Number(e.target.value) : '')
                                  }
                                  placeholder="2500"
                                  disabled={busy}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Sistem Promptu (opsiyonel)</Label>
                              <Textarea
                                rows={5}
                                value={asText(settings.system_prompt)}
                                onChange={(e) => updateSettingField(provider, 'system_prompt', e.target.value)}
                                placeholder="Asistan davranış kuralları..."
                                disabled={busy}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : AI_INDIVIDUAL_PROVIDERS.includes(provider) ? (
                    <div className="space-y-4">
                      {(() => {
                        const settings = parseSettingsSafe(draft.settingsText);
                        const preset   = getAiPreset(provider);
                        return (
                          <>
                            <div className="space-y-2">
                              <Label>{preset.apiKeyLabel}</Label>
                              <Input
                                type="password"
                                value={asText(settings.api_key)}
                                onChange={(e) => updateSettingField(provider, 'api_key', e.target.value)}
                                placeholder={preset.apiKeyPlaceholder}
                                disabled={busy}
                              />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Model</Label>
                                <Input
                                  value={asText(settings.model)}
                                  onChange={(e) => updateSettingField(provider, 'model', e.target.value)}
                                  placeholder={preset.model}
                                  disabled={busy}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Base URL</Label>
                                <Input
                                  value={asText(settings.base_url)}
                                  onChange={(e) => updateSettingField(provider, 'base_url', e.target.value)}
                                  placeholder={preset.baseUrl}
                                  disabled={busy}
                                />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : provider === 'geliver' ? (
                    <div className="space-y-4">
                      {(() => {
                        const settings = parseSettingsSafe(draft.settingsText);
                        return (
                          <>
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                              Geliver gönderici adresinde mahalle bilgisi zorunlu olabilir.
                              Adres alanlarını eksiksiz doldur.
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Geliver API Token / Key</Label>
                                <Input
                                  type="password"
                                  value={asText(settings.geliver_api_token || settings.api_key)}
                                  onChange={(e) => {
                                    updateSettingField(provider, 'geliver_api_token', e.target.value);
                                    updateSettingField(provider, 'api_key', e.target.value);
                                  }}
                                  placeholder="Geliver API token"
                                  disabled={busy}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Sender Address ID</Label>
                                <Input
                                  value={asText(settings.geliver_sender_address_id || settings.sender_address_id)}
                                  onChange={(e) => {
                                    updateSettingField(provider, 'geliver_sender_address_id', e.target.value);
                                    updateSettingField(provider, 'sender_address_id', e.target.value);
                                  }}
                                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                  disabled={busy}
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Base URL</Label>
                                <Input
                                  value={asText(settings.base_url)}
                                  onChange={(e) => updateSettingField(provider, 'base_url', e.target.value)}
                                  placeholder="https://api.geliver.io"
                                  disabled={busy}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Webhook URL</Label>
                                <Input
                                  value={asText(settings.geliver_webhook_url || settings.webhook_url)}
                                  onChange={(e) => {
                                    updateSettingField(provider, 'geliver_webhook_url', e.target.value);
                                    updateSettingField(provider, 'webhook_url', e.target.value);
                                  }}
                                  placeholder="https://.../api/..."
                                  disabled={busy}
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Webhook Header Name</Label>
                                <Input
                                  value={asText(settings.geliver_webhook_header_name || settings.webhook_header_name)}
                                  onChange={(e) => {
                                    updateSettingField(provider, 'geliver_webhook_header_name', e.target.value);
                                    updateSettingField(provider, 'webhook_header_name', e.target.value);
                                  }}
                                  placeholder="Sportoonline"
                                  disabled={busy}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Webhook Header Secret</Label>
                                <Input
                                  type="password"
                                  value={asText(settings.geliver_webhook_header_secret || settings.webhook_header_secret)}
                                  onChange={(e) => {
                                    updateSettingField(provider, 'geliver_webhook_header_secret', e.target.value);
                                    updateSettingField(provider, 'webhook_header_secret', e.target.value);
                                  }}
                                  placeholder="gizli-key"
                                  disabled={busy}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between rounded-md border p-3">
                              <div>
                                <div className="text-sm font-medium">Test Modu</div>
                                <div className="text-xs text-muted-foreground">
                                  Açıkken gerçek kargo oluşturulmaz.
                                </div>
                              </div>
                              <Switch
                                checked={asBool(settings.geliver_test_mode || settings.test_mode)}
                                onCheckedChange={(checked) => {
                                  updateSettingField(provider, 'geliver_test_mode', checked ? 'on' : '');
                                  updateSettingField(provider, 'test_mode', checked);
                                }}
                                disabled={busy}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor={`settings-${provider}`}>Ayarlar (JSON Object)</Label>
                      <Textarea
                        id={`settings-${provider}`}
                        rows={10}
                        value={draft.settingsText}
                        onChange={(e) => updateDraft(provider, { settingsText: e.target.value })}
                        placeholder='{"api_key":"...", "base_url":"..."}'
                        disabled={busy}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" onClick={() => onSaveProvider(provider)} disabled={busy}>
                      Kaydet
                    </Button>
                    <Button type="button" variant="outline" onClick={() => onResetProvider(provider)} disabled={busy}>
                      Geri Al
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => onDeleteProvider(provider)} disabled={busy}>
                      Sil
                    </Button>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
