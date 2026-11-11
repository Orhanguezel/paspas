import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'cookie_policy', pathname: '/cookie-policy', fallback: {
    title: 'Promats Cookie Policy',
    description: 'Learn which cookies the Promats website uses, why they are used and how you can manage your cookie preferences.',
  } });
}

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
