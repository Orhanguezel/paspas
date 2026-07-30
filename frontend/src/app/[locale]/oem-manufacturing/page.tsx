import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PromatsOemPage, type OemPageContent } from '@/components/promats/PromatsOemPage';
import { getPageContent, getProducts } from '@/lib/promats/api';
import { buildPageMetadata } from '@/seo/serverMetadata';

// OEM sayfası yalnızca İngilizce yayında (B2B ihracat hedef kitlesi). TR yolu 404 döner.
const PROMATS_LOCALES = ['en'] as const;

export const revalidate = 60;

export function generateStaticParams() {
  return PROMATS_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'en') return {};
  const c = await getPageContent<OemPageContent>(locale, 'oem');
  return buildPageMetadata({
    locale, pageKey: 'oem', pathname: '/oem-manufacturing',
    fallback: { title: c.meta.title, description: c.meta.description },
  });
}

// AI platformlari (ChatGPT/Perplexity/Gemini) ve zengin sonuclar icin FAQ + Organization JSON-LD.
function buildJsonLd(c: OemPageContent) {
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Promats',
    description: c.meta.description,
    url: 'https://promats.com.tr/en/oem-manufacturing',
    email: 'export@promats.com.tr',
    foundingDate: '2017',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Başakşehir',
      addressRegion: 'İstanbul',
      addressCountry: 'TR',
    },
    areaServed: 'Worldwide',
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: 'OEM & Private Label PVC Car Mat Manufacturing',
      },
    },
  };
  return [faq, org];
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'en') notFound();

  const [products, content] = await Promise.all([
    getProducts(locale),
    getPageContent<OemPageContent>(locale, 'oem'),
  ]);
  const jsonLd = buildJsonLd(content);

  return (
    <>
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <PromatsOemPage locale={locale} products={products} content={content} />
    </>
  );
}
