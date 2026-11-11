import type { Metadata } from 'next';

import { PromatsProductsPage, type UrunlerPageContent } from '@/components/promats/PromatsProductsPage';
import { getPageContent, getProducts } from '@/lib/promats/api';
import { buildPageMetadata } from '@/seo/serverMetadata';

const PROMATS_LOCALES = ['tr', 'en'] as const;

export const revalidate = 60;

export function generateStaticParams() {
  return PROMATS_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const [c, products] = await Promise.all([
    getPageContent<UrunlerPageContent>(locale, 'products'),
    getProducts(locale),
  ]);
  return buildPageMetadata({
    locale,
    pageKey: 'products',
    pathname: '/urunler',
    fallback: { ...c.meta, ogImage: products[0]?.hero.image || '/assets/images/product/maximum.png' },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [products, content] = await Promise.all([
    getProducts(locale),
    getPageContent<UrunlerPageContent>(locale, 'products'),
  ]);
  return <PromatsProductsPage locale={locale} products={products} content={content} />;
}
