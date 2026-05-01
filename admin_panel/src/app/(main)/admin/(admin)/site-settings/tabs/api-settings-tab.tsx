"use client";

import * as React from "react";

import { RefreshCcw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminTranslations } from "@/i18n";
import { useListSiteSettingsAdminQuery, useUpdateSiteSettingAdminMutation } from "@/integrations/hooks";
import {
  API_SETTING_KEYS,
  API_SETTING_SECTIONS,
  type ApiSettingField,
  type ApiSettingsForm,
  apiSettingsToForm,
  createEmptyApiSettingsForm,
  parseApiSettingValue,
} from "@/integrations/shared";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export type ApiSettingsTabProps = {
  locale: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;
  const data = "data" in error ? error.data : undefined;
  if (typeof data === "object" && data !== null) {
    const apiError = "error" in data ? data.error : undefined;
    if (typeof apiError === "object" && apiError !== null) {
      const message = "message" in apiError ? apiError.message : undefined;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  const message = "message" in error ? error.message : undefined;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function FieldControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ApiSettingField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const commonClassName =
    "border-border/70 bg-background/80 font-mono text-sm shadow-sm transition-colors focus-visible:border-primary/60 focus-visible:ring-primary/20";

  if (field.kind === "textarea") {
    return (
      <Textarea
        id={field.key}
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={`${commonClassName} resize-y text-xs leading-5`}
      />
    );
  }

  return (
    <Input
      id={field.key}
      type={field.kind === "password" ? "password" : field.kind === "number" ? "number" : "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      className={`h-11 ${commonClassName}`}
    />
  );
}

export const ApiSettingsTab: React.FC<ApiSettingsTabProps> = ({ locale }) => {
  const adminLocale = usePreferencesStore((state) => state.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const tr = React.useCallback((key: string, fallback: string) => t(key, undefined, fallback), [t]);

  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: [...API_SETTING_KEYS],
    locale: "*",
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [form, setForm] = React.useState<ApiSettingsForm>(() => createEmptyApiSettingsForm());

  React.useEffect(() => {
    setForm(apiSettingsToForm(settings));
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const handleChange = (field: ApiSettingField, value: string) => {
    setForm((previous) => ({ ...previous, [field.key]: value }));
  };

  const handleSave = async () => {
    try {
      for (const section of API_SETTING_SECTIONS) {
        for (const field of section.fields) {
          await updateSetting({
            key: field.key,
            value: parseApiSettingValue(form[field.key] ?? "", field),
            locale: "*",
          }).unwrap();
        }
      }

      toast.success(tr("admin.siteSettings.api.saved", "API ayarları kaydedildi."));
      await refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, tr("admin.siteSettings.api.saveError", "API ayarları kaydedilemedi.")));
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="gap-4 border-b bg-muted/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md border bg-background text-primary">
                <Sparkles className="size-4" />
              </span>
              <CardTitle className="text-base">{tr("admin.siteSettings.api.title", "API ve Entegrasyonlar")}</CardTitle>
            </div>
            <CardDescription>
              {tr(
                "admin.siteSettings.api.description",
                "Üçüncü parti servis bağlantılarını, analitik kodlarını ve yapay zeka anahtarlarını yönetin.",
              )}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">GLOBAL</Badge>
            {locale ? <Badge variant="outline">UI {locale}</Badge> : null}
            {busy ? <Badge variant="outline">{tr("admin.siteSettings.messages.loading", "Yükleniyor")}</Badge> : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              title={tr("admin.siteSettings.actions.refresh", "Yenile")}
            >
              <RefreshCcw className="size-4" />
              {tr("admin.siteSettings.actions.refresh", "Yenile")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 p-6">
        <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-muted-foreground text-sm">
          AI anahtarları site ayarlarında global olarak saklanır. Backend yardımcı modülü önce bu kayıtları, boşsa
          `.env` değerlerini kullanır; Test Merkezi ileride log özeti ve risk önerisi için bu hattı çağırabilir.
        </div>

        {API_SETTING_SECTIONS.map((section) => (
          <section key={section.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary/70" />
                  <h3 className="font-semibold text-sm uppercase tracking-wide">{section.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </div>
              {section.badge ? (
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                  {section.badge}
                </Badge>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.key} className={field.kind === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor={field.key} className="font-medium text-xs uppercase tracking-wide">
                      {field.label}
                    </Label>
                    <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {field.key}
                    </code>
                  </div>
                  <FieldControl
                    field={field}
                    value={form[field.key] ?? ""}
                    disabled={busy}
                    onChange={(value) => handleChange(field, value)}
                  />
                  {field.help ? <p className="text-muted-foreground text-xs">{field.help}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex justify-end border-t pt-6">
          <Button type="button" onClick={handleSave} disabled={busy} className="min-w-40">
            <Save className="size-4" />
            {isSaving
              ? tr("admin.siteSettings.actions.saving", "Kaydediliyor")
              : tr("admin.siteSettings.actions.save", "Tümünü Kaydet")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
