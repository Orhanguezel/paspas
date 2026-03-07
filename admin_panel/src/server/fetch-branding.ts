// =============================================================
// FILE: src/server/fetch-branding.ts
// Server-only utility — SSR'da branding config'i backend'den çeker
// =============================================================

import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';

/**
 * Backend API base URL (server-side only).
 * PANEL_API_URL > NEXT_PUBLIC_API_URL > fallback
 */
function getServerApiUrl(): string {
  const panel = (process.env.PANEL_API_URL || '').trim().replace(/\/+$/, '');
  if (panel) return `${panel}/api`;

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (base) return base;

  const pub = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (pub) return pub;

  return 'http://localhost:8078/api';
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

    if (!branding?.meta?.title) return DEFAULT_BRANDING;

    return {
      ...DEFAULT_BRANDING,
      ...branding,
      meta: { ...DEFAULT_BRANDING.meta, ...branding.meta },
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}
