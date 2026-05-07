// =============================================================
// FILE: src/server/fetch-branding.ts
// Server-only utility — SSR'da branding config'i backend'den çeker
// =============================================================

import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';

type BrandConfig = {
  primaryHex: string;
  primaryHexDark: string;
  accentHex: string;
  accentHexDark: string;
  sidebarBgCss: string;
  logoUrl: string;
  faviconUrl: string;
};

function ensurePublicApiV1Base(raw: string): string {
  const base = raw.replace(/\/+$/, '');
  if (!base) return '';
  if (/\/api\/v\d+$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;
  return `${base}/api/v1`;
}

/**
 * Backend API base URL (server-side only).
 * PANEL_API_URL (origin) > NEXT_PUBLIC_API_URL > fallback — hepsi `/api/v1` ile biter.
 */
function getServerApiUrl(): string {
  const panel = (process.env.PANEL_API_URL || '').trim();
  if (panel) return ensurePublicApiV1Base(panel);

  const pub = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (pub) return ensurePublicApiV1Base(pub);

  return 'http://127.0.0.1:8086/api/v1';
}

/**
 * SSR'da `ui_admin_config` key'ini public endpoint üzerinden çeker,
 * `branding` alt-objesini döndürür.
 * Hata durumunda DEFAULT_BRANDING fallback döner.
 */
export async function fetchBrandingConfig(): Promise<AdminBrandingConfig> {
  try {
    const base = getServerApiUrl();
    const res = await fetch(`${base}/site_settings/ui_admin_config`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return DEFAULT_BRANDING;

    const data = await res.json();
    const value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    const branding = value?.branding;

    if (!branding || typeof branding !== 'object') return DEFAULT_BRANDING;

    return {
      ...DEFAULT_BRANDING,
      ...branding,
      meta: { ...DEFAULT_BRANDING.meta, ...(branding.meta && typeof branding.meta === 'object' ? branding.meta : {}) },
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export async function fetchBrandConfig(): Promise<BrandConfig> {
  const fallback: BrandConfig = {
    primaryHex: '#E8A598',
    primaryHexDark: '#D88D7E',
    accentHex: '#22c55e',
    accentHexDark: '#4ade80',
    sidebarBgCss: 'oklch(0.97 0.02 145)',
    logoUrl: '',
    faviconUrl: '',
  };

  try {
    const base = getServerApiUrl();
    const res = await fetch(`${base}/public/brand-config`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return fallback;
    const data = (await res.json()) as Partial<BrandConfig>;
    return {
      primaryHex: data.primaryHex || fallback.primaryHex,
      primaryHexDark: data.primaryHexDark || fallback.primaryHexDark,
      accentHex: data.accentHex || fallback.accentHex,
      accentHexDark: data.accentHexDark || fallback.accentHexDark,
      sidebarBgCss: data.sidebarBgCss || fallback.sidebarBgCss,
      logoUrl: data.logoUrl || fallback.logoUrl,
      faviconUrl: data.faviconUrl || fallback.faviconUrl,
    };
  } catch {
    return fallback;
  }
}
