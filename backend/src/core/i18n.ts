// src/core/i18n.ts

import { db } from "@/db/client";
import { siteSettings } from "@/modules/siteSettings/schema";
import { eq } from "drizzle-orm";

export const LOCALES = ["tr", "en", "de"] as const;
export const DEFAULT_LOCALE = "tr";

export type SupportedLocale = (typeof LOCALES)[number];

let runtimeDefaultLocale: string = DEFAULT_LOCALE;
let localesLoaded = false;

export function normalizeLocale(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).trim().toLowerCase().replace("_", "-");
  if (!s) return null;
  const base = s.split("-")[0]?.trim();
  return base || null;
}

export function isSupported(locale?: string | null): boolean {
  const l = normalizeLocale(locale);
  return !!l && (LOCALES as readonly string[]).includes(l);
}

export function getRuntimeDefaultLocale(): string {
  return runtimeDefaultLocale;
}

function parseSettingValue(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed === "string") return parsed.trim() || null;
    return s;
  } catch {
    return s;
  }
}

export async function ensureLocalesLoadedFromSettings(): Promise<void> {
  if (localesLoaded) return;
  localesLoaded = true;
  try {
    const rows = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, "default_locale"))
      .limit(1);

    const fromDb = normalizeLocale(parseSettingValue(rows[0]?.value));
    if (fromDb && isSupported(fromDb)) {
      runtimeDefaultLocale = fromDb;
    }
  } catch {
    // Keep static defaults if DB is unavailable.
  }
}
