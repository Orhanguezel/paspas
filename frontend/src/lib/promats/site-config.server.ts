// Sadece server component'lerden import edilmelidir (fetchSetting server API'sini kullanır).
// PromatsPublicLayout (async server component) tarafından çağrılır; client bundle'a girmez.
import { fetchSetting } from '@/i18n/server';
import type { SiteConfig } from './api';

// site_settings tablosundan footer/header için gerekli ayarları çeker.
// Server-only: fetchSetting server API'sini kullanır, client bundle'a girmez.

function parseJsonObject(value: unknown): Record<string, string> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, string>;
  if (typeof value === 'string' && value.trim()) {
    try {
      const obj = JSON.parse(value);
      return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
    } catch {
      return {};
    }
  }
  return {};
}

function parseJsonString(value: unknown): string {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  if (s.startsWith('"')) {
    try {
      return String(JSON.parse(s));
    } catch {
      return s;
    }
  }
  return s;
}

export async function getSiteConfig(locale: string): Promise<SiteConfig> {
  const [contact, socials, logo, logoDark, copyright, ekatalog] = await Promise.all([
    fetchSetting('contact_info', locale),
    fetchSetting('socials', locale),
    fetchSetting('site_logo', locale),
    fetchSetting('site_logo_dark', locale),
    fetchSetting('footer_copyright', locale),
    fetchSetting('ekatalog_url', locale),
  ]);
  const c = parseJsonObject(contact?.value);
  return {
    contact: {
      address: c.address ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      whatsapp: c.whatsapp ?? '',
    },
    socials: parseJsonObject(socials?.value),
    logo: parseJsonString(logo?.value),
    logoDark: parseJsonString(logoDark?.value),
    copyright: parseJsonString(copyright?.value),
    ekatalogUrl: parseJsonString(ekatalog?.value),
  };
}
