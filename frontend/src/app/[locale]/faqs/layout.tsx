import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale === 'en';
  return buildPageMetadata({
    locale,
    pageKey: 'faqs',
    pathname: '/faqs',
    fallback: {
      title: isEnglish ? 'Promats Frequently Asked Questions' : 'Promats Sık Sorulan Sorular',
      description: isEnglish
        ? 'Find answers about Promats PVC automotive mat products, manufacturing, wholesale supply and contact requests.'
        : 'Promats PVC oto paspas ürünleri, üretim, toptan tedarik ve iletişim talepleri hakkındaki yanıtları inceleyin.',
    },
  });
}

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
