import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'terms', pathname: '/terms', fallback: {
    title: 'Promats Website Terms of Use',
    description: 'Review the terms governing access to and use of the Promats website, its content, forms and digital services.',
  } });
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
