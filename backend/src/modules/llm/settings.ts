import { inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { siteSettings } from "@/modules/siteSettings/schema";

export type LlmProvider = "openai" | "anthropic" | "groq" | "azure" | "local";

export type LlmRuntimeSettings = {
  defaultProvider: LlmProvider;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  openaiApiKey: string;
  openaiApiBase: string;
  anthropicApiKey: string;
  groqApiKey: string;
  groqApiBase: string;
};

const AI_SETTING_KEYS = [
  "ai_default_provider",
  "ai_default_model",
  "ai_temperature",
  "ai_max_tokens",
  "openai_api_key",
  "openai_api_base",
  "anthropic_api_key",
  "groq_api_key",
  "groq_api_base",
] as const;

function parseDbValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function settingString(map: Map<string, unknown>, key: string, fallback = "") {
  const value = map.get(key);
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function settingNumber(map: Map<string, unknown>, key: string, fallback: number) {
  const value = Number(settingString(map, key, ""));
  return Number.isFinite(value) ? value : fallback;
}

function normalizeProvider(value: string): LlmProvider {
  if (value === "openai" || value === "anthropic" || value === "groq" || value === "azure" || value === "local") {
    return value;
  }
  return "anthropic";
}

async function readAiSettingsMap() {
  const rows = await db
    .select({ key: siteSettings.key, value: siteSettings.value })
    .from(siteSettings)
    .where(inArray(siteSettings.key, [...AI_SETTING_KEYS]));

  const map = new Map<string, unknown>();
  for (const row of rows) {
    map.set(row.key, parseDbValue(row.value));
  }
  return map;
}

export async function getLlmRuntimeSettings(): Promise<LlmRuntimeSettings> {
  const map = await readAiSettingsMap();
  const defaultProvider = normalizeProvider(
    settingString(map, "ai_default_provider", process.env.AI_DEFAULT_PROVIDER || "anthropic").trim().toLowerCase(),
  );

  return {
    defaultProvider,
    defaultModel: settingString(map, "ai_default_model", process.env.AI_DEFAULT_MODEL || "claude-haiku-4-5"),
    temperature: settingNumber(map, "ai_temperature", Number(process.env.AI_TEMPERATURE ?? 0.2)),
    maxTokens: settingNumber(map, "ai_max_tokens", Number(process.env.AI_MAX_TOKENS ?? 1200)),
    openaiApiKey: settingString(map, "openai_api_key", process.env.OPENAI_API_KEY || ""),
    openaiApiBase: settingString(map, "openai_api_base", process.env.OPENAI_API_BASE || "https://api.openai.com/v1"),
    anthropicApiKey: settingString(map, "anthropic_api_key", process.env.ANTHROPIC_API_KEY || ""),
    groqApiKey: settingString(map, "groq_api_key", process.env.GROQ_API_KEY || ""),
    groqApiBase: settingString(map, "groq_api_base", process.env.GROQ_API_BASE || "https://api.groq.com/openai/v1"),
  };
}
