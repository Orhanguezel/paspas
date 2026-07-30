import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PromatsPartnerPage, type PartnerPageContent } from '@/components/promats/PromatsEditorialPages';
import { getPageContent } from '@/lib/promats/api';
import { buildPageMetadata } from '@/seo/serverMetadata';

export const revalidate = 60;

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'en') return {};
  const content = await getPageContent<PartnerPageContent>(locale, 'partner');
  return buildPageMetadata({
    locale, pageKey: 'partner', pathname: '/become-a-partner',
    fallback: {
      title: content.meta?.title ?? '',
      description: content.meta?.description ?? '',
    },
  });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'en') notFound();
  const content = await getPageContent<PartnerPageContent>(locale, 'partner');
  return <PromatsPartnerPage content={content} />;
}
