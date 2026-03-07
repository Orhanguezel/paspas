import { FALLBACK_LOCALE } from './config';
import { LOCALE_CODES, type LocaleCode } from './generated-locales';

export const AVAILABLE_LOCALE_CODES = LOCALE_CODES as string[];

export function getDefaultLocaleCode(): string {
  if (AVAILABLE_LOCALE_CODES.includes(FALLBACK_LOCALE)) return FALLBACK_LOCALE;
  return AVAILABLE_LOCALE_CODES[0] || FALLBACK_LOCALE || 'tr';
}

export function getLocaleLabel(code: string, displayLocale = 'tr'): string {
  const normalized = String(code || '').trim().toLowerCase();
  if (!normalized) return '';
  try {
    const dn = new Intl.DisplayNames([displayLocale], { type: 'language' });
    const name = dn.of(normalized);
    return name ? `${name} (${normalized})` : normalized.toUpperCase();
  } catch {
    return normalized.toUpperCase();
  }
}

export type { LocaleCode };
