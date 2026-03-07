// =============================================================
// FILE: src/config/app-config.ts
// Admin Panel Config — DB'den gelen branding verileri için fallback
// =============================================================

import packageJson from '../../package.json';
import { FALLBACK_LOCALE } from '@/i18n/config';

const currentYear = new Date().getFullYear();

export type AdminBrandingConfig = {
  app_name: string;
  app_copyright: string;
  html_lang: string;
  theme_color: string;
  logo_url: string;
  login_logo_url: string;
  favicon_16: string;
  favicon_32: string;
  apple_touch_icon: string;
  meta: {
    title: string;
    description: string;
    og_url: string;
    og_title: string;
    og_description: string;
    og_image: string;
    twitter_card: string;
  };
};

export const DEFAULT_BRANDING: AdminBrandingConfig = {
  app_name: 'Promats Üretim ERP',
  app_copyright: 'Promats Universal Paspaslar',
  html_lang: FALLBACK_LOCALE,
  theme_color: '#2563eb',
  logo_url: '',
  login_logo_url: '',
  favicon_16: '/favicon/favicon.svg',
  favicon_32: '/favicon/favicon.svg',
  apple_touch_icon: '/apple/apple-touch-icon.png',
  meta: {
    title: 'Promats Üretim ERP',
    description:
      'Promats Universal Paspaslar üretim yönetim paneli. Siparişler, üretim emirleri, stok ve satın alma yönetimi.',
    og_url: 'https://promats.com.tr/admin',
    og_title: 'Promats Üretim ERP',
    og_description:
      'Promats Universal Paspaslar ERP paneli ile üretim ve sipariş yönetimini merkezi olarak yapın.',
    og_image: '/logo/og-image.png',
    twitter_card: 'summary_large_image',
  },
};

export const APP_CONFIG = {
  name: DEFAULT_BRANDING.app_name,
  version: packageJson.version,
  copyright: `© ${currentYear}, ${DEFAULT_BRANDING.app_copyright}.`,
  meta: {
    title: DEFAULT_BRANDING.meta.title,
    description: DEFAULT_BRANDING.meta.description,
  },
  branding: DEFAULT_BRANDING,
} as const;
