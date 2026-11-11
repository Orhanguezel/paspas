import type { SiteConfig } from '@/lib/promats/api';
import { assetPath } from '@/lib/promats/api';
import { getPublicSiteOrigin } from '@/lib/site-config';

export const PROMATS_ORGANIZATION_ID = `${getPublicSiteOrigin().replace(/\/+$/, '')}/#organization`;
export const PROMATS_WEBSITE_ID = `${getPublicSiteOrigin().replace(/\/+$/, '')}/#website`;

function absoluteUrl(value: string, assetBase: '/assets' | '/userfiles' = '/assets') {
  const origin = getPublicSiteOrigin().replace(/\/+$/, '');
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${origin}${assetPath(raw, assetBase)}`;
}

export function organizationReference(siteConfig: SiteConfig) {
  const origin = getPublicSiteOrigin().replace(/\/+$/, '');
  const logo = absoluteUrl(siteConfig.logo || siteConfig.logoDark);
  const sameAs = Object.values(siteConfig.socials || {})
    .map((value) => String(value || '').trim())
    .filter((value) => /^https?:\/\//i.test(value));

  return {
    '@type': 'Organization',
    '@id': PROMATS_ORGANIZATION_ID,
    name: 'Promats',
    url: origin,
    ...(logo
      ? {
          logo: {
            '@type': 'ImageObject',
            url: logo,
          },
        }
      : {}),
    ...(siteConfig.contact.email ? { email: siteConfig.contact.email } : {}),
    ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
    ...(siteConfig.contact.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: siteConfig.contact.address,
            addressLocality: 'Başakşehir',
            addressRegion: 'İstanbul',
            addressCountry: 'TR',
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteReference() {
  const origin = getPublicSiteOrigin().replace(/\/+$/, '');
  return {
    '@type': 'WebSite',
    '@id': PROMATS_WEBSITE_ID,
    url: origin,
    name: 'Promats',
    publisher: { '@id': PROMATS_ORGANIZATION_ID },
    inLanguage: ['tr', 'en'],
  };
}

export function organizationLogoUrl(siteConfig: SiteConfig) {
  return absoluteUrl(siteConfig.logo || siteConfig.logoDark);
}
