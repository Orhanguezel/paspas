import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PromatsHakkimizdaPage } from '@/components/promats/PromatsHakkimizdaPage';
import PromatsStaticPage from '@/components/promats/PromatsStaticPage';
import hakkimizdaContent from '@/config/pages/hakkimizda-page.json';
import { assetPath, getSpecialPage, getSpecialPages, stripHtml } from '@/lib/promats/api';

const PROMATS_LOCALES = ['tr', 'en'] as const;

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
    const c = (hakkimizdaContent as Record<string, (typeof hakkimizdaContent)['en']>)[locale === 'en' ? 'en' : 'tr'];
    return {
      title: c.meta.title,
      description: c.meta.description,
      alternates: { canonical: `/${locale}/${etiket}`, languages: { tr: '/tr/hakkimizda', en: '/en/about-us' } },
      openGraph: { title: c.meta.title, description: c.meta.description, type: 'website', url: `/${locale}/${etiket}` },
    };
  }
  const page = await getSpecialPage(locale, etiket);
  if (!page) return {};
  const title = page.title || 'Promats';
  const description = stripHtml(page.detail).slice(0, 155);
  const images = page.image ? [assetPath(page.image)] : undefined;
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
      ...(images ? { images } : {}),
    },
  };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ locale: string; etiket: string }>;
}) {
  const { locale, etiket } = await params;
  if (isKurumsal(locale, etiket)) {
    return <PromatsHakkimizdaPage locale={locale} />;
  }
  const page = await getSpecialPage(locale, etiket);
  if (!page) notFound();
  return <PromatsStaticPage page={page} />;
}
