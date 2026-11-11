import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'privacy_policy', pathname: '/gizlilik', fallback: {
    title: 'Promats Gizlilik Politikası',
    description: 'Promats web sitesi ve iletişim kanalları üzerinden alınan kişisel verilerin işlenmesi ve korunması hakkında bilgi edinin.',
  } });
}

export default function GizlilikLayout({ children }: { children: React.ReactNode }) {
  return children;
}
