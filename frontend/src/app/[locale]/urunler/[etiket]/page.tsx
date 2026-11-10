import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PromatsProductDetail from '@/components/promats/PromatsProductDetail';
import { assetPath, getProduct, getProducts, getSettings, getSpecialPage, stripHtml } from '@/lib/promats/api';
import { getPublicSiteOrigin } from '@/lib/site-config';
import { localeHref } from '@/lib/promats/links';

const PROMATS_LOCALES = ['tr', 'en'] as const;

export const revalidate = 60;

export async function generateStaticParams() {
  const params = await Promise.all(
    PROMATS_LOCALES.map(async (locale) => {
      const products = await getProducts(locale);
      return products.map((product) => ({ locale, etiket: product.slug }));
    }),
  );
  return params.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; etiket: string }>;
}): Promise<Metadata> {
  const { locale, etiket } = await params;
  const product = await getProduct(locale, etiket);
  if (!product) return {};
  const description = product.seo?.description || stripHtml(product.hero.description || product.sections.conceptDescription).slice(0, 155);
  return {
    title: product.seo?.title || product.name,
    description,
    alternates: {
      canonical: localeHref(locale, `/urunler/${product.slug}`),
    },
    openGraph: {
      title: product.seo?.title || product.name,
      description,
      type: 'website',
      images: [assetPath(product.hero.image || product.sections.detailImage)],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; etiket: string }>;
}) {
  const { locale, etiket } = await params;
  const cardsSlug = locale === 'en' ? 'homepage-–-3-key-features' : 'anasayfa-3lu-ozellikler';
  const [product, related, settings, cards] = await Promise.all([
    getProduct(locale, etiket),
    getProducts(locale),
    getSettings(locale),
    getSpecialPage(locale, cardsSlug),
  ]);

  if (!product) notFound();

  const origin = getPublicSiteOrigin().replace(/\/+$/, '');
  const productUrl = `${origin}${localeHref(locale, `/urunler/${product.slug}`)}`;
  const description = product.seo?.description || stripHtml(product.detailContent?.description || product.hero.description);
  const images = [product.hero.image, product.sections.detailImage]
    .filter(Boolean)
    .map((image) => `${origin}${assetPath(image)}`);
  const breadcrumbId = `${productUrl}#breadcrumb`;
  const productSeriesJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${productUrl}#webpage`,
        url: productUrl,
        name: product.name,
        description,
        inLanguage: locale === 'en' ? 'en' : 'tr',
        ...(images.length > 0
          ? {
              image: images,
              primaryImageOfPage: {
                '@type': 'ImageObject',
                url: images[0],
              },
            }
          : {}),
        breadcrumb: { '@id': breadcrumbId },
        about: {
          '@type': 'Thing',
          '@id': `${productUrl}#series`,
          name: product.name,
          description,
          url: productUrl,
          ...(images.length > 0 ? { image: images } : {}),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: locale === 'en' ? 'Home' : 'Ana Sayfa',
            item: `${origin}${localeHref(locale, '/')}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: locale === 'en' ? 'Products' : 'Ürünler',
            item: `${origin}${localeHref(locale, '/urunler')}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: productUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSeriesJsonLd) }} />
      <PromatsProductDetail locale={locale} product={product} related={related} settings={settings} cards={cards} />
    </>
  );
}
