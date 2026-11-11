import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'privacy_notice', pathname: '/kvkk', fallback: {
    title: 'Promats KVKK Aydınlatma Metni',
    description: 'Promats kişisel veri işleme amaçları, hukuki sebepler, saklama süreçleri ve ilgili kişi hakları hakkında KVKK metnini inceleyin.',
  } });
}

export default function KvkkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
