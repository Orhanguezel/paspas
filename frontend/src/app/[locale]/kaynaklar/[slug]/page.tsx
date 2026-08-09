import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PromatsArticleDetailPage, type ResourcesPageContent } from '@/components/promats/PromatsEditorialPages';
import { assetPath, getArticle, getArticles, getPageContent, stripHtml } from '@/lib/promats/api';
import { getPublicSiteOrigin } from '@/lib/site-config';
import { localeHref } from '@/lib/promats/links';

const PROMATS_LOCALES = ['tr', 'en'] as const;

export const revalidate = 60;

export async function generateStaticParams() {
  const params = await Promise.all(
    PROMATS_LOCALES.map(async (locale) => {
      const articles = await getArticles(locale);
      return articles.map((article) => ({ locale, slug: article.slug }));
    }),
  );
  return params.flat();
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(locale, slug);
  if (!article) return {};
  const description = article.metaDescription || article.excerpt || stripHtml(article.content).slice(0, 155);
  return {
    title: article.metaTitle || article.title,
    description,
    alternates: { canonical: localeHref(locale, `/kaynaklar/${article.slug}`) },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      images: article.image ? [assetPath(article.image)] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const [article, resources] = await Promise.all([
    getArticle(locale, slug),
    getPageContent<ResourcesPageContent>(locale, 'resources'),
  ]);
  if (!article) notFound();
  const origin = getPublicSiteOrigin();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.image ? [`${origin}${assetPath(article.image)}`] : undefined,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: 'Promats' },
    publisher: { '@type': 'Organization', name: 'Promats' },
    mainEntityOfPage: `${origin}${localeHref(locale, `/kaynaklar/${article.slug}`)}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PromatsArticleDetailPage locale={locale} article={article} backLabel={resources.backLabel} />
    </>
  );
}
