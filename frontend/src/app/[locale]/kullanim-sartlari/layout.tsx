import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'terms', pathname: '/kullanim-sartlari', fallback: {
    title: 'Promats Web Sitesi Kullanım Şartları',
    description: 'Promats web sitesine, içeriklerine, formlarına ve dijital hizmetlerine erişim ve kullanım şartlarını inceleyin.',
  } });
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
