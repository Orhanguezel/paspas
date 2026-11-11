import type { Metadata } from 'next';
import type React from 'react';

import { buildPageMetadata } from '@/seo/serverMetadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return buildPageMetadata({ locale, pageKey: 'privacy_policy', pathname: '/privacy-policy', fallback: {
    title: 'Promats Privacy Policy',
    description: 'Read how Promats processes, protects and manages personal data collected through its website and contact channels.',
  } });
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
