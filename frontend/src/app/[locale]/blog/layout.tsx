import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const isEnglish = locale === 'en';
  return buildPageMetadata({
    locale,
    pageKey: 'blog',
    pathname: '/blog',
    fallback: {
      title: isEnglish ? 'Promats Automotive Mat Articles' : 'Promats Oto Paspas Yazıları',
      description: isEnglish
        ? 'Read Promats articles on PVC automotive mats, manufacturing, mould accuracy, product care and sourcing.'
        : 'PVC oto paspas, üretim, kalıp hassasiyeti, ürün bakımı ve tedarik hakkında Promats yazılarını okuyun.',
    },
  });
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
