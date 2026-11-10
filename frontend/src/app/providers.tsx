'use client';

import React, { Suspense } from 'react';
import { StoreProvider } from '@/store';
import LangBoot from '@/i18n/LangBoot';
import { Toaster } from 'sonner';
import AnalyticsScripts from '@/features/analytics/AnalyticsScripts';
import GAViewPages from '@/features/analytics/GAViewPages';
import AnalyticsConsentBanner from '@/features/analytics/AnalyticsConsentBanner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <LangBoot />
      <AnalyticsScripts />
      <Suspense fallback={null}>
        <GAViewPages />
      </Suspense>
      <AnalyticsConsentBanner />
      {children}
      <Toaster richColors position="top-right" />
    </StoreProvider>
  );
}
