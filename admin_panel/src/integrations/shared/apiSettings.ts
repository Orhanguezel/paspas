import type { SettingValue, SiteSettingRow } from "@/integrations/shared/siteSettings";

export type ApiSettingFieldKind = "text" | "password" | "textarea" | "number";

export type ApiSettingField = {
  key: string;
  label: string;
  placeholder?: string;
  help?: string;
  kind?: ApiSettingFieldKind;
  json?: boolean;
};

export type ApiSettingSection = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  fields: ApiSettingField[];
};

export const API_SETTING_SECTIONS: readonly ApiSettingSection[] = [
  {
    id: "ai",
    title: "Yapay Zeka",
    description: "Test Merkezi risk notları, log özetleri ve ileride otomatik teşhis akışları için LLM servisleri.",
    badge: "TEST HAZIR",
    fields: [
      {
        key: "ai_default_provider",
        label: "Varsayılan provider",
        placeholder: "anthropic | openai | groq",
        help: "Backend AI yardımcıları provider seçilmezse bu değeri kullanır.",
      },
      {
        key: "ai_default_model",
        label: "Varsayılan model",
        placeholder: "claude-haiku-4-5 / gpt-4.1-mini / llama-3.3-70b-versatile",
      },
      {
        key: "ai_temperature",
        label: "Temperature",
        placeholder: "0.2",
        kind: "number",
      },
      {
        key: "ai_max_tokens",
        label: "Maksimum token",
        placeholder: "1200",
        kind: "number",
      },
      {
        key: "anthropic_api_key",
        label: "Anthropic API Key",
        placeholder: "sk-ant-...",
        kind: "password",
      },
      {
        key: "openai_api_key",
        label: "OpenAI API Key",
        placeholder: "sk-...",
        kind: "password",
      },
      {
        key: "openai_api_base",
        label: "OpenAI Base URL",
        placeholder: "https://api.openai.com/v1",
      },
      {
        key: "groq_api_key",
        label: "Groq API Key",
        placeholder: "gsk_...",
        kind: "password",
      },
      {
        key: "groq_api_base",
        label: "Groq Base URL",
        placeholder: "https://api.groq.com/openai/v1",
      },
    ],
  },
  {
    id: "google",
    title: "Google OAuth & Analytics",
    description: "Giriş, etiket yöneticisi ve analitik bağlantıları.",
    fields: [
      { key: "google_client_id", label: "Google Client ID", placeholder: "Google OAuth Client ID" },
      {
        key: "google_client_secret",
        label: "Google Client Secret",
        placeholder: "Google OAuth Client Secret",
        kind: "password",
      },
      { key: "gtm_container_id", label: "GTM Container ID", placeholder: "GTM-XXXXXXX" },
      { key: "ga4_measurement_id", label: "GA4 Measurement ID", placeholder: "G-XXXXXXXXXX" },
    ],
  },
  {
    id: "privacy",
    title: "Diğer Ayarlar",
    description: "Global entegrasyon davranışları ve JSON yapılandırmaları.",
    fields: [
      {
        key: "cookie_consent",
        label: "Çerez izni yapılandırması",
        placeholder: "JSON veya metin",
        kind: "textarea",
        json: true,
      },
    ],
  },
] as const;

export const API_SETTING_KEYS = API_SETTING_SECTIONS.flatMap((section) => section.fields.map((field) => field.key));

export type ApiSettingsForm = Record<string, string>;

export function createEmptyApiSettingsForm(): ApiSettingsForm {
  return Object.fromEntries(API_SETTING_KEYS.map((key) => [key, ""]));
}

export function valueToApiSettingString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function apiSettingsToMap(settings?: SiteSettingRow[]) {
  const map = new Map<string, SiteSettingRow>();
  for (const setting of settings ?? []) {
    map.set(setting.key, setting);
  }
  return map;
}

export function apiSettingsToForm(settings?: SiteSettingRow[]): ApiSettingsForm {
  const map = apiSettingsToMap(settings);
  const next = createEmptyApiSettingsForm();
  for (const key of API_SETTING_KEYS) {
    next[key] = valueToApiSettingString(map.get(key)?.value);
  }
  return next;
}

export function parseApiSettingValue(input: string, field?: ApiSettingField): SettingValue {
  const value = String(input ?? "").trim();
  if (!value) return "";
  if (!field?.json) return value;
  try {
    return JSON.parse(value) as SettingValue;
  } catch {
    return value;
  }
}
