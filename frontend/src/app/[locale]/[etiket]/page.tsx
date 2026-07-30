import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import PromatsStaticPage from '@/components/promats/PromatsStaticPage';
import { assetPath, getSpecialPage, getSpecialPages, stripHtml } from '@/lib/promats/api';

const PROMATS_LOCALES = ['tr', 'en'] as const;

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
  const page = await getSpecialPage(locale, etiket);
  if (!page) notFound();
  return <PromatsStaticPage page={page} />;
}
