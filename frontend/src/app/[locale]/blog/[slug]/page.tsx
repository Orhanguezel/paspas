import React from 'react';
import type { Metadata } from 'next';
import BlogDetails from '@/components/containers/blog/BlogDetails';
import Banner from '@/layout/banner/Breadcrum';
import { safeStr, titleFromSlug, excerpt } from '@/integrations/shared';
import { normPath, absUrlJoin } from '@/integrations/shared';
import { buildMetadataFromSeo, fetchSeoObject, fetchCustomPagePublicBySlug } from '@/seo/server';
import JsonLd from '@/seo/JsonLd';
import { articleSchema, breadcrumbSchema, faqSchema, graph } from '@/seo/jsonld';
import FaqAccordion from '@/components/common/FaqAccordion';
import { getEditorialTeamName, getPublicAppName, getPublicSiteOrigin } from '@/lib/site-config';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = (await params) as { locale: string; slug: string };
  const locale = safeStr(p?.locale) || 'de';
  const slug = safeStr(p?.slug);

  const pathname = normPath(`/blog/${slug || ''}`);

  const [seo, page] = await Promise.all([
    fetchSeoObject(locale),
    slug ? fetchCustomPagePublicBySlug({ slug, locale }) : Promise.resolve(null),
  ]);

  const base = await buildMetadataFromSeo(seo, { locale, pathname });

  const pageTitle =
    safeStr(page?.meta_title) || safeStr(page?.title) || titleFromSlug(slug, 'Blog Detail');

  const rawDesc =
    safeStr(page?.meta_description) ||
    safeStr(page?.summary) ||
    safeStr(page?.content_html) ||
    safeStr((page as any)?.content) ||
    '';
  const pageDescription = rawDesc ? excerpt(rawDesc, 180) : '';

  const imageRaw =
    safeStr(page?.featured_image) ||
    (Array.isArray((page as any)?.images) ? safeStr((page as any).images[0]) : '');

  const baseUrl = base.metadataBase?.toString() || '';
  const imageAbs = imageRaw ? absUrlJoin(baseUrl, imageRaw) : '';

  return {
    ...base,
    title: pageTitle,
    ...(pageDescription ? { description: pageDescription } : {}),
    openGraph: {
      ...(base.openGraph || {}),
      title: pageTitle,
      ...(pageDescription ? { description: pageDescription } : {}),
      ...(imageAbs ? { images: [{ url: imageAbs }] } : {}),
    },
    twitter: {
      ...(base.twitter || {}),
      ...(imageAbs ? { images: [imageAbs] } : {}),
    },
  };
}

export default async function BlogDetailsPage({ params }: PageProps) {
  const p = (await params) as { locale: string; slug: string };
  const locale = safeStr(p?.locale) || 'tr';
  const slug = safeStr(p?.slug);
  const page = slug ? await fetchCustomPagePublicBySlug({ slug, locale }) : null;
  const title = safeStr(page?.title) || titleFromSlug(slug, 'Blog Detail');
  const description = excerpt(
    safeStr(page?.summary) || safeStr(page?.content_html) || safeStr(page?.content) || title,
    180,
  );
  const app = getPublicAppName();
  const editorialName = getEditorialTeamName();
  const siteUrl = getPublicSiteOrigin();
  const pageUrl = `${siteUrl}/${locale}/blog/${encodeURIComponent(slug)}`;
  const image = safeStr(page?.featured_image) || (Array.isArray(page?.images) ? safeStr(page.images[0]) : '');
  const faqItems = [
    {
      question: locale === 'tr' ? 'Bu içerik nasıl hazırlanıyor?' : 'How is this content prepared?',
      answer:
        locale === 'tr'
          ? `${app} blog içerikleri editoryal kontrol ve konu araştırması ilkeleriyle hazırlanır.`
          : `${app} blog content is prepared with editorial review and topic research.`,
    },
    {
      question: locale === 'tr' ? 'Bu yazı profesyonel tavsiye yerine geçer mi?' : 'Does this article replace professional advice?',
      answer: locale === 'tr'
        ? 'Hayır. Blog yazıları genel bilgilendirme sunar; kişisel durumlar için ilgili uzmana başvurmanız önerilir.'
        : 'No. Blog articles provide general information; for personal situations consult a relevant professional.',
    },
  ];

  return (
    <>
      <JsonLd
        id="blog-article"
        data={graph([
          breadcrumbSchema([
            { name: app, item: `${siteUrl}/${locale}` },
            { name: 'Blog', item: `${siteUrl}/${locale}/blog` },
            { name: title, item: pageUrl },
          ]),
          articleSchema({
            headline: title,
            description,
            image: image ? absUrlJoin(siteUrl, image) : undefined,
            datePublished: page?.created_at || '2026-04-30T00:00:00.000Z',
            dateModified: page?.updated_at || page?.created_at || '2026-04-30T00:00:00.000Z',
            author: { name: editorialName, url: `${siteUrl}/${locale}/about` },
            publisherId: `${siteUrl}/#org`,
            url: pageUrl,
            speakableSelectors: ['h1', '[data-speakable]'],
            inLanguage: locale,
          }),
          faqSchema(faqItems),
        ])}
      />
      <Banner title={title} />
      <BlogDetails />
      <FaqAccordion items={faqItems} title={locale === 'tr' ? 'Bu Yazı Hakkında Sorular' : 'Questions About This Article'} />
      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/55 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gm-gold)]">
            {locale === 'tr' ? 'Editoryal ekip' : 'Editorial team'}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--gm-text)]">{editorialName}</h2>
          <p className="mt-3 text-[var(--gm-text-dim)]">
            {locale === 'tr'
              ? `${app} editörleri içerikleri sade, sorumlu ve uygulanabilir bir dille hazırlar.`
              : `${app} editors prepare content in clear, responsible, and practical language.`}
          </p>
        </div>
      </section>
    </>
  );
}
