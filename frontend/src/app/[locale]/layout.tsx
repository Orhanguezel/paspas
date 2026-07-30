import type { ReactNode } from 'react';

import { Providers } from '../providers';
import PromatsPublicLayout from '@/components/promats/PromatsPublicLayout';

export const revalidate = 60;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Providers>
      <PromatsPublicLayout locale={locale}>
        {children}
      </PromatsPublicLayout>
    </Providers>
  );
}
