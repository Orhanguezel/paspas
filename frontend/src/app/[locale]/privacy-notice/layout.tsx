import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'privacy_notice', pathname: '/privacy-notice', fallback: {
    title: 'Promats Personal Data Privacy Notice',
    description: 'Review the Promats notice describing personal-data processing purposes, legal grounds, retention and data-subject rights.',
  } });
}

export default function PrivacyNoticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
