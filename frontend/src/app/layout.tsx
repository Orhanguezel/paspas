/* eslint-disable @next/next/no-css-tags */
import './globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { brandFontVariableClassName } from '@/lib/fonts/brand-fonts';
import { fetchSetting } from '@/i18n/server';
import { fetchDesignTokens, fetchPromatsThemeTokens } from '@/lib/tokens/fetchTokens.server';
import { detectThemeMode } from '@/lib/tokens/detectThemeMode';
import { tokensToCSS } from '@/lib/tokens/tokensToCSS';
import {
  getDefaultTokenBranding,
  getHtmlMetaDescriptionForLocale,
  getPublicSiteOrigin,
  getRootLayoutTitleDefault,
  getRootLayoutTitleTemplate,
} from '@/lib/site-config';

export async function generateViewport(): Promise<Viewport> {
  let themeColor = getDefaultTokenBranding().theme_color;
  try {
    const row = await fetchSetting('design_tokens', '*', { revalidate: 300 });
    const raw = row?.value;
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    themeColor =
      obj?.branding?.theme_color || obj?.colors?.brand_primary || themeColor;
  } catch {
    // fallback to brand default
  }
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor,
  };
}

function extractUrl(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('{')) {
      try { return (JSON.parse(s) as { url?: string }).url || ''; } catch { return s; }
    }
    return s;
  }
  if (typeof val === 'object') return String((val as { url?: string }).url || '');
  return '';
}

const SUPPORTED_LOCALES = ['tr', 'en', 'de'];

function cssValue(value: string | undefined): string {
  return String(value || '').replace(/[;{}]/g, '').trim();
}

function cssUrlValue(value: string | undefined): string {
  const clean = cssValue(value).replace(/["\\\n\r]/g, '');
  return clean ? `url("${clean}")` : '';
}

function promatsTokensToCSS(tokens: Awaited<ReturnType<typeof fetchPromatsThemeTokens>>): string {
  if (!tokens) return '';
  const entries: Array<[string, string | undefined]> = [
    ['--pm-brand', tokens.brand],
    ['--pm-section-s2', tokens.sectionBg?.s2],
    ['--pm-section-s4', tokens.sectionBg?.s4],
    ['--pm-section-s5', tokens.sectionBg?.s5],
    ['--pm-section-s6', tokens.sectionBg?.s6],
    ['--pm-section-s7', tokens.sectionBg?.s7],
    ['--pm-section-s8', tokens.sectionBg?.s8],
    ['--pm-section-black', tokens.sectionBg?.black],
    ['--pm-header-black-bg', tokens.headerBlackBg],
    ['--pm-text-body', tokens.text?.body],
    ['--pm-text-heading', tokens.text?.heading],
    ['--pm-text-on-dark', tokens.text?.onDark],
    ['--pm-text-muted', tokens.text?.muted],
    ['--pm-text-pro', tokens.text?.pro],
    ['--pm-text-con', tokens.text?.con],
    ['--pm-hero-arrow-left', cssUrlValue(tokens.assets?.heroArrowLeft)],
    ['--pm-hero-arrow-right', cssUrlValue(tokens.assets?.heroArrowRight)],
  ];
  const vars = entries
    .map(([name, value]) => {
      const clean = name.startsWith('--pm-hero-arrow-') ? value : cssValue(value);
      return clean ? `${name}:${clean};` : '';
    })
    .filter(Boolean)
    .join('\n');

  return vars ? `:root,\n.promats-public {\n${vars}\n}` : '';
}

/** Extract locale from the request URL pathname (e.g. /en/about → "en") */
function resolveHtmlLang(): string {
  const fallback = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'tr';
  return SUPPORTED_LOCALES.includes(fallback) ? fallback : 'tr';
}

export async function generateMetadata(): Promise<Metadata> {
  const favicon = await fetchSetting('site_favicon', '*');
  const configuredFaviconUrl = extractUrl(favicon?.value);
  const basePath = (process.env.PROMATS_BASE_PATH || '').replace(/\/+$/, '');
  const faviconUrl = configuredFaviconUrl || `${basePath}/favicon.svg`;

  const gscVerification = await fetchSetting('google_site_verification', '*');
  const gscCode = String(gscVerification?.value || '').trim();
  const bingVerification = await fetchSetting('bing_site_verification', '*');
  const bingCode = String(
    process.env.BING_SITE_VERIFICATION ||
    process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ||
    bingVerification?.value ||
    '',
  ).trim();

  const metadata: Metadata = {
    metadataBase: new URL(getPublicSiteOrigin()),
    title: {
      default: getRootLayoutTitleDefault(),
      template: getRootLayoutTitleTemplate(),
    },
    manifest: `${basePath}/manifest.webmanifest`,
    icons: {
      icon: [
        { url: faviconUrl, type: configuredFaviconUrl ? undefined : 'image/svg+xml' },
        { url: `${basePath}/favicon/icon-192.png`, type: 'image/png', sizes: '192x192' },
      ],
      shortcut: `${basePath}/favicon.ico`,
      apple: { url: `${basePath}/favicon/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
    },
  };

  if (gscCode) {
    metadata.verification = {
      google: gscCode,
    };
  }

  if (bingCode) {
    metadata.verification = {
      ...metadata.verification,
      other: {
        ...(metadata.verification?.other || {}),
        'msvalidate.01': bingCode,
      },
    };
  }

  return metadata;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = resolveHtmlLang();
  const htmlDescription = getHtmlMetaDescriptionForLocale(lang);
  // Tema mode'u design_tokens içindeki bg_base luminance'ından hesapla (preset'ten gelir).
  // Kullanıcı manuel toggle yaparsa client-side override eder (localStorage).
  const [tokens, promatsThemeTokens] = await Promise.all([
    fetchDesignTokens(),
    fetchPromatsThemeTokens(),
  ]);
  const themeMode = detectThemeMode(tokens);
  const tokenCss = tokensToCSS(tokens);
  const promatsTokenCss = promatsTokensToCSS(promatsThemeTokens);
  return (
    <html
      lang={lang}
      data-theme={themeMode}
      data-scroll-behavior="smooth"
      className={brandFontVariableClassName}
      suppressHydrationWarning
    >
      <head>
        <style id="design-tokens" dangerouslySetInnerHTML={{ __html: tokenCss }} />
        {promatsTokenCss ? <style id="promats-theme-tokens" dangerouslySetInnerHTML={{ __html: promatsTokenCss }} /> : null}
        <meta name="description" content={htmlDescription} />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Promats legacy tema CSS'i (orijinal css.asp sirasi). `@import url()` Tailwind v4
            sonrasi gecersiz konuma dustugu icin <link> ile yukleniyor — bkz. globals.css notu. */}
        <link rel="stylesheet" href="/assets/css/vendor/font/stylesheet.css" />
        <link rel="stylesheet" href="/assets/css/vendor/icomoon/style.css" />
        <link rel="stylesheet" href="/assets/css/vendor/aos.css" />
        <link rel="stylesheet" href="/assets/css/vendor/bootstrap.css" />
        <link rel="stylesheet" href="/assets/css/22menu.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
