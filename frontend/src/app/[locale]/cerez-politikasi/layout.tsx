import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'cookie_policy', pathname: '/cerez-politikasi', fallback: {
    title: 'Promats Çerez Politikası',
    description: 'Promats web sitesinde kullanılan çerezleri, kullanım amaçlarını ve çerez tercihlerinizi nasıl yönetebileceğinizi öğrenin.',
  } });
}

export default function CookieLayout({ children }: { children: React.ReactNode }) {
  return children;
}
