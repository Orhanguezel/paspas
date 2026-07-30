import type { Metadata } from 'next';

import PromatsHome from '@/components/promats/PromatsHome';
import { buildPageMetadata } from '@/seo/serverMetadata';
import {
  getBanners,
  getPageContent,
  getProducts,
  getSettings,
  getSpecialPage,
} from '@/lib/promats/api';

const PROMATS_LOCALES = ['tr', 'en'] as const;

export const revalidate = 60;

export function generateStaticParams() {
  return PROMATS_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const content = await getPageContent<{ meta: { title: string; description: string } }>(locale, 'home');
  return buildPageMetadata({
    locale, pageKey: 'home', pathname: '/',
    fallback: content.meta,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const featureSlug = locale === 'en' ? 'features' : 'ozellikler';
  const cardsSlug = locale === 'en' ? 'homepage-–-3-key-features' : 'anasayfa-3lu-ozellikler';
  const exportSlug = locale === 'en' ? 'homepage-export' : 'anasayfa-ihracat';

  const [banners, products, settings, whyPromats, features, homeCards, exportSection] = await Promise.all([
    getBanners(locale),
    getProducts(locale),
    getSettings(locale),
    getSpecialPage(locale, locale === 'en' ? 'why-promats' : 'neden-promats'),
    getSpecialPage(locale, featureSlug),
    getSpecialPage(locale, cardsSlug),
    getSpecialPage(locale, exportSlug),
  ]);

  return (
    <PromatsHome
      locale={locale}
      banners={banners}
      products={products}
      settings={settings}
      whyPromats={whyPromats}
      features={features}
      homeCards={homeCards}
      exportSection={exportSection}
    />
  );
}
