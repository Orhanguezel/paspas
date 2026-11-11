import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PromatsHakkimizdaPage, hakkimizdaFallback, type HakkimizdaContent } from '@/components/promats/PromatsHakkimizdaPage';
import PromatsStaticPage from '@/components/promats/PromatsStaticPage';
import { assetPath, getPageContentOptional, getSpecialPage, getSpecialPages, stripHtml } from '@/lib/promats/api';

const PROMATS_LOCALES = ['tr', 'en'] as const;
const DEFAULT_SHARE_IMAGE = '/userfiles/images/banner/sldier1icon-kopya.jpg';

// Kurumsal (Hakkımızda) sayfası artık modern pm-* tasarımıyla render edilir; DB özel sayfası
// yerine PromatsHakkimizdaPage. Slug locale'e göre: TR=hakkimizda, EN=about-us.
function isKurumsal(locale: string, etiket: string): boolean {
  return (locale === 'en' && etiket === 'about-us') || (locale !== 'en' && etiket === 'hakkimizda');
}

export const revalidate = 60;

export async function generateStaticParams() {
  const params = await Promise.all(
    PROMATS_LOCALES.map(async (locale) => {
      const pages = await getSpecialPages(locale);
      return pages
        .filter((page) => page.slug)
        .map((page) => ({ locale, etiket: page.slug as string }));
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
  if (isKurumsal(locale, etiket)) {
    const c = (await getPageContentOptional<HakkimizdaContent>(locale, 'hakkimizda')) ?? hakkimizdaFallback(locale);
    const description = locale === 'en'
      ? 'Learn about Promats, its PVC universal car mat manufacturing approach, corporate profile, capabilities and quality processes.'
      : 'Promats PVC universal oto paspas üretim yaklaşımı, kurumsal kimliği, temel yetkinlikleri ve kalite süreçleri hakkında bilgi edinin.';
    return {
      title: c.meta.title,
      description,
      alternates: {
        canonical: `/${locale}/${etiket}`,
        languages: { tr: '/tr/hakkimizda', en: '/en/about-us', 'x-default': '/tr/hakkimizda' },
      },
      openGraph: {
        title: c.meta.title,
        description,
        type: 'website',
        url: `/${locale}/${etiket}`,
        images: [DEFAULT_SHARE_IMAGE],
      },
      twitter: { card: 'summary_large_image', images: [DEFAULT_SHARE_IMAGE] },
    };
  }
  const page = await getSpecialPage(locale, etiket);
  if (!page) return {};
  const title = page.title || 'Promats';
  const description = stripHtml(page.detail).slice(0, 155);
  const images = [page.image ? assetPath(page.image) : DEFAULT_SHARE_IMAGE];
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/${page.slug || etiket}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      images,
    },
    twitter: { card: 'summary_large_image', images },
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ locale: string; etiket: string }>;
}) {
  const { locale, etiket } = await params;
  if (isKurumsal(locale, etiket)) {
    const content = await getPageContentOptional<HakkimizdaContent>(locale, 'hakkimizda');
    return <PromatsHakkimizdaPage locale={locale} content={content} />;
  }
  const page = await getSpecialPage(locale, etiket);
  if (!page) notFound();
  return <PromatsStaticPage page={page} />;
}
