import type { Metadata } from 'next';

import { PromatsArticlesPage, type ResourcesPageContent } from '@/components/promats/PromatsEditorialPages';
import { getArticles, getPageContent } from '@/lib/promats/api';
import { buildPageMetadata } from '@/seo/serverMetadata';

const PROMATS_LOCALES = ['tr', 'en'] as const;

export const revalidate = 60;

export function generateStaticParams() {
  return PROMATS_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const content = await getPageContent<ResourcesPageContent>(locale, 'resources');
  return buildPageMetadata({ locale, pageKey: 'resources', pathname: '/kaynaklar', fallback: content.meta });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [articles, content] = await Promise.all([
    getArticles(locale),
    getPageContent<ResourcesPageContent>(locale, 'resources'),
  ]);
  return <PromatsArticlesPage locale={locale} articles={articles} content={content} />;
}
