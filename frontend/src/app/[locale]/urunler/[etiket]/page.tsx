import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PromatsProductDetail from '@/components/promats/PromatsProductDetail';
import { assetPath, getProduct, getProducts, getSettings, getSpecialPage, stripHtml } from '@/lib/promats/api';
import { getPublicSiteOrigin } from '@/lib/site-config';
import { localeHref } from '@/lib/promats/links';
import { PROMATS_ORGANIZATION_ID } from '@/seo/promatsStructuredData';

const PROMATS_LOCALES = ['tr', 'en'] as const;

function productPageTitle(rawTitle: string, productName: string, locale: string): string {
  const title = (/promats/i.test(rawTitle) ? rawTitle : `${rawTitle} | Promats`).replace(/\s+/g, ' ').trim();
  const length = Array.from(title).length;
  if (length >= 30 && length <= 60) return title;
  const name = length > 60 ? productName : rawTitle.replace(/\s*\|\s*Promats\s*$/i, '').trim() || productName;
  const descriptor = locale === 'en' ? 'PVC Car Mat' : 'PVC Oto Paspas';
  return `${name} ${descriptor} | Promats`;
}

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
  const alternateLocale = locale === 'en' ? 'tr' : 'en';
  const [product, alternateProducts] = await Promise.all([
    getProduct(locale, etiket),
    getProducts(alternateLocale),
  ]);
  if (!product) return {};
  const rawDescription = product.seo?.description || stripHtml(product.hero.description || product.sections.conceptDescription);
  const description = `${product.name} — ${rawDescription}`.replace(/\s+/g, ' ').trim().slice(0, 155);
  const rawTitle = product.seo?.title || product.name;
  const title = productPageTitle(rawTitle, product.name, locale);
  // TR ve EN urun kayitlari ayri satirlarda tutuldugu icin ID'leri farklidir.
  // Katalogdaki ortak sira numarasi iki dilde ayni seriyi temsil eder.
  const alternateProduct = alternateProducts.find(
    (candidate) => candidate.id === product.id || candidate.sortOrder === product.sortOrder,
  );
  const selfPath = localeHref(locale, `/urunler/${product.slug}`);
  const alternatePath = alternateProduct
    ? localeHref(alternateLocale, `/urunler/${alternateProduct.slug}`)
    : '';
  const languages: Record<string, string> = { [locale]: selfPath };
  if (alternatePath) languages[alternateLocale] = alternatePath;
  languages['x-default'] = locale === 'tr' ? selfPath : alternatePath || selfPath;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: selfPath,
      languages,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{
        url: assetPath(product.hero.image || product.sections.detailImage),
        alt: product.name,
      }],
    },
    twitter: {
      card: 'summary_large_image',
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
  const propertyNames = locale === 'en'
    ? ['Front mat', 'Rear mat', 'Centre/rear mat', 'Set weight', 'Pack weight']
    : ['Ön paspas', 'Arka paspas', 'Orta/arka paspas', 'Takım ağırlığı', 'Koli ağırlığı'];
  const additionalProperty = product.sections.dimensions.flatMap((value, index) => {
    const normalized = value?.trim();
    return normalized ? [{ '@type': 'PropertyValue', name: propertyNames[index], value: normalized }] : [];
  });
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
        author: { '@id': PROMATS_ORGANIZATION_ID },
        publisher: { '@id': PROMATS_ORGANIZATION_ID },
        about: {
          '@type': 'Thing',
          '@id': `${productUrl}#series`,
          name: product.name,
          description,
          url: productUrl,
          ...(images.length > 0 ? { image: images } : {}),
          ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
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
