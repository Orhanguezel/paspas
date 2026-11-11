import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'legal_notice', pathname: '/legal-notice', fallback: {
    title: 'Promats Legal Notice and Company Information',
    description: 'Review the Promats website operator information, legal notices, intellectual-property terms and contact details.',
  } });
}

export default function LegalNoticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
