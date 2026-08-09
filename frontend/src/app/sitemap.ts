import { MetadataRoute } from 'next';
import { getPublicSiteOrigin } from '@/lib/site-config';
import { getArticles, getProducts } from '@/lib/promats/api';
import { localizedPromatsPath } from '@/lib/promats/links';

const BASE_URL = getPublicSiteOrigin();

const LOCALES = ['tr', 'en'] as const;
const DEFAULT_LOCALE = 'tr';

const STATIC_PAGES = [
  '',
  '/iletisim',
  '/urunler',
  '/uretim',
  '/kaynaklar',
  '/blog',
  '/faqs',
] as const;

const LOCALE_ONLY_PAGES = {
  tr: ['/hakkimizda', '/gizlilik', '/kvkk', '/kullanim-sartlari', '/cerez-politikasi'],
  en: ['/about-us', '/privacy-policy', '/privacy-notice', '/terms', '/cookie-policy', '/legal-notice'],
} as const;

// Yalnizca EN'de var olan sayfalar (TR yolu 404 doner) — hreflang alternatifi verilmez.
const EN_ONLY_PAGES = ['/oem-manufacturing'] as const;

function buildAlternates(path: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${BASE_URL}/${loc}${localizedPromatsPath(loc, path)}`;
  }
  languages['x-default'] = `${BASE_URL}/${DEFAULT_LOCALE}${path}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const dynamicEntries = await Promise.all(
    LOCALES.map(async (locale) => {
      try {
        const [products, articles] = await Promise.all([
          getProducts(locale),
          getArticles(locale),
        ]);

        return [
          ...products.map((product) => ({
            url: `${BASE_URL}/${locale}${localizedPromatsPath(locale, `/urunler/${product.slug}`)}`,
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.85,
          })),
          ...articles.map((article) => ({
            url: `${BASE_URL}/${locale}${localizedPromatsPath(locale, `/kaynaklar/${article.slug}`)}`,
            lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
          })),
        ];
      } catch {
        return [];
      }
    }),
  );

  const staticEntries = LOCALES.flatMap((locale) =>
    STATIC_PAGES.map((page) => ({
      url: `${BASE_URL}/${locale}${localizedPromatsPath(locale, page)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1 : 0.8,
      alternates: buildAlternates(page),
    })),
  );

  const enOnlyEntries = EN_ONLY_PAGES.map((page) => ({
    url: `${BASE_URL}/en${page}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const partnerEntry = {
    url: `${BASE_URL}/en/become-a-partner`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  };

  const localeOnlyEntries = LOCALES.flatMap((locale) =>
    LOCALE_ONLY_PAGES[locale].map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  );

  return [...staticEntries, ...localeOnlyEntries, ...enOnlyEntries, partnerEntry, ...dynamicEntries.flat()];
}
