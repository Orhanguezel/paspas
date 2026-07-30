import type { Metadata } from 'next';

import { PromatsUretimPage, type UretimPageContent } from '@/components/promats/PromatsUretimPage';
import { getPageContent } from '@/lib/promats/api';
import { buildPageMetadata } from '@/seo/serverMetadata';

const PROMATS_LOCALES = ['tr', 'en'] as const;

export const revalidate = 60;

export function generateStaticParams() {
  return PROMATS_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const c = await getPageContent<UretimPageContent>(locale, 'production');
  return buildPageMetadata({ locale, pageKey: 'production', pathname: '/uretim', fallback: c.meta });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getPageContent<UretimPageContent>(locale, 'production');
  return <PromatsUretimPage locale={locale} content={content} />;
}
