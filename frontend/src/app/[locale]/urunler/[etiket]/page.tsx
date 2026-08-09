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
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.seo?.description || stripHtml(product.detailContent?.description || product.hero.description),
    url: productUrl,
    image: [product.hero.image, product.sections.detailImage].filter(Boolean).map((image) => `${origin}${assetPath(image)}`),
    brand: { '@type': 'Brand', name: 'Promats' },
    additionalProperty: [
      ['Technical Specifications', product.detailContent?.technical],
      ['Use Cases', product.detailContent?.usage],
      ['Advantages', product.detailContent?.advantages],
      ['Material and Durability', product.detailContent?.material],
      ['Universal Design', product.detailContent?.universal],
    ].filter((item) => item[1]).map(([name, value]) => ({
      '@type': 'PropertyValue',
      name,
      value: stripHtml(value),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <PromatsProductDetail locale={locale} product={product} related={related} settings={settings} cards={cards} />
    </>
  );
}
