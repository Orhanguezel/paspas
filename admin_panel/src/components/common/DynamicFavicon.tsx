'use client';

// =============================================================
// FILE: src/components/common/DynamicFavicon.tsx
// Client-side favicon updater — DB'den gelen branding ile favicon günceller
// SSR cache bypass edilir, değişiklikler anında yansır
// =============================================================

import { useEffect } from 'react';
import { useGetSiteSettingByKeyQuery } from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';
import { DEFAULT_BRANDING } from '@/config/app-config';

function updateFaviconLinks(favicon16: string, favicon32: string, appleTouchIcon: string) {
  // Helper: link elementi bul veya oluştur
  const getOrCreateLink = (rel: string, sizes?: string): HTMLLinkElement => {
    const selector = sizes
      ? `link[rel="${rel}"][sizes="${sizes}"]`
      : `link[rel="${rel}"]`;
    let link = document.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (sizes) link.setAttribute('sizes', sizes);
      document.head.appendChild(link);
    }
    return link;
  };

  // Favicon 16x16
  if (favicon16) {
    const link16 = getOrCreateLink('icon', '16x16');
    link16.href = resolveMediaUrl(favicon16);
    link16.type = favicon16.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  }

  // Favicon 32x32
  if (favicon32) {
    const link32 = getOrCreateLink('icon', '32x32');
    link32.href = resolveMediaUrl(favicon32);
    link32.type = favicon32.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  }

  // Genel icon (shortcut)
  if (favicon32 || favicon16) {
    const shortcut = getOrCreateLink('icon');
    shortcut.href = resolveMediaUrl(favicon32 || favicon16);
  }

  // Apple Touch Icon
  if (appleTouchIcon) {
    const apple = getOrCreateLink('apple-touch-icon');
    apple.href = resolveMediaUrl(appleTouchIcon);
  }
}

export function DynamicFavicon() {
  const { data: configRow } = useGetSiteSettingByKeyQuery('ui_admin_config');

  useEffect(() => {
    if (!configRow?.value) return;

    try {
      const raw = configRow.value;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const branding = parsed?.branding;

      if (!branding) return;

      const favicon16 = branding.favicon_16 || DEFAULT_BRANDING.favicon_16;
      const favicon32 = branding.favicon_32 || DEFAULT_BRANDING.favicon_32;
      const appleTouchIcon = branding.apple_touch_icon || DEFAULT_BRANDING.apple_touch_icon;

      updateFaviconLinks(favicon16, favicon32, appleTouchIcon);
    } catch {
      // Parse error — fallback
    }
  }, [configRow]);

  // Bu component görsel render yapmaz
  return null;
}
