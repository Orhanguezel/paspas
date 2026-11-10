'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocaleShort } from '@/i18n';

const STORAGE_KEY = 'promats.analytics-consent.v1';
type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    __setAnalyticsConsent?: (consent: { analytics_storage: Consent } | boolean) => void;
    __pendingAnalyticsConsent?: Array<{ analytics_storage: Consent } | boolean>;
  }
}

function applyConsent(consent: Consent) {
  const payload = { analytics_storage: consent };
  if (typeof window.__setAnalyticsConsent === 'function') {
    window.__setAnalyticsConsent(payload);
    return;
  }
  window.__pendingAnalyticsConsent = window.__pendingAnalyticsConsent || [];
  window.__pendingAnalyticsConsent.push(payload);
}

export default function AnalyticsConsentBanner() {
  const locale = useLocaleShort();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') {
      applyConsent(stored);
      return;
    }
    setVisible(true);
  }, []);

  function choose(consent: Consent) {
    window.localStorage.setItem(STORAGE_KEY, consent);
    applyConsent(consent);
    setVisible(false);
  }

  if (!visible) return null;

  const english = locale === 'en';
  const policyHref = english ? '/en/cookie-policy' : '/tr/cerez-politikasi';

  return (
    <aside
      aria-label={english ? 'Cookie preferences' : 'Çerez tercihleri'}
      className="fixed inset-x-4 bottom-4 z-[10000] mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#111827] p-5 text-white shadow-2xl sm:flex sm:items-center sm:gap-5"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-6">
          {english
            ? 'We use analytics cookies to understand site usage and improve our services. Analytics remains off until you accept.'
            : 'Site kullanımını anlamak ve hizmetlerimizi geliştirmek için analitik çerezleri kullanıyoruz. Onay verene kadar analitik ölçüm kapalı kalır.'}
        </p>
        <Link className="mt-1 inline-block text-xs font-semibold text-amber-300 underline" href={policyHref}>
          {english ? 'Cookie policy' : 'Çerez politikası'}
        </Link>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">
        <button
          type="button"
          className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={() => choose('denied')}
        >
          {english ? 'Reject' : 'Reddet'}
        </button>
        <button
          type="button"
          className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={() => choose('granted')}
        >
          {english ? 'Accept' : 'Kabul et'}
        </button>
      </div>
    </aside>
  );
}
