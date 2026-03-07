'use client';

import { useMemo } from 'react';
import { useGetSiteSettingByKeyQuery } from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';
import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';

export function useLoginBranding() {
  const { data: configRow } = useGetSiteSettingByKeyQuery('ui_admin_config');

  return useMemo(() => {
    let branding: AdminBrandingConfig = DEFAULT_BRANDING;
    try {
      const raw = configRow?.value;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const b = parsed?.branding;
      if (b) {
        branding = { ...DEFAULT_BRANDING, ...b, meta: { ...DEFAULT_BRANDING.meta, ...b.meta } };
      }
    } catch {
      // fallback
    }

    const loginLogo = branding.login_logo_url || branding.logo_url;
    const appName = branding.app_name || DEFAULT_BRANDING.app_name;
    const resolvedLogo = loginLogo ? resolveMediaUrl(loginLogo) : '';

    return { branding, loginLogo: resolvedLogo, appName };
  }, [configRow]);
}
