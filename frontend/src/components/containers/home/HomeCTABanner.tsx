'use client';

import React from 'react';
import Link from 'next/link';
import { useLocaleShort } from '@/i18n';
import { localizePath } from '@/integrations/shared';
import homeCtaBanner from '@/config/pages/home-cta-banner.json';

type CtaBannerCopy = {
  title: string;
  desc: string;
  cta: string;
  secondary: string;
};

export default function HomeCTABanner({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const raw = homeCtaBanner as Record<string, CtaBannerCopy>;
  const copy = raw[locale] || raw[locale.split('-')[0]] || raw.tr;

  return (
    <section
      className="py-28 relative overflow-hidden"
      style={{ padding: '7rem 4%' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, var(--color-brand-primary) 0%, transparent 70%)',
          opacity: 0.07,
        }}
      />
      <div className="max-w-[700px] mx-auto text-center relative reveal">
        <h2 className="font-serif text-[clamp(2rem,4.5vw,3.6rem)] font-light leading-[1.15] mb-5">
          {copy.title}
        </h2>
        <p className="text-text-secondary font-light leading-[1.8] text-base mb-10 max-w-[480px] mx-auto">
          {copy.desc}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={localizePath(locale, '/contact')} className="btn-premium">
            <span>{copy.cta}</span>
          </Link>
          <Link href={localizePath(locale, '/faqs')} className="btn-outline-premium">
            {copy.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
