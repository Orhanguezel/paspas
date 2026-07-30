'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useLocaleShort } from '@/i18n';
import { getPublicAppName } from '@/lib/site-config';
import homeWelcomeBanner from '@/config/pages/home-welcome-banner.json';

type WelcomeCopy = {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
};

type WelcomeBannerLocale = {
  subtitle: string;
  cta: string;
  link: string;
  titleTemplate: string;
};

export default function WelcomeBannerSection({ locale: explicitLocale }: { locale?: string }) {
  const locale = useLocaleShort(explicitLocale) || 'tr';
  const app = getPublicAppName();
  const copy = useMemo((): WelcomeCopy => {
    const raw = homeWelcomeBanner as Record<string, WelcomeBannerLocale>;
    const base = raw[locale] || raw[locale.split('-')[0]] || raw.tr;
    const title = base.titleTemplate.replace(/\{\{appName\}\}/g, app.replace(/\s+/g, '').toUpperCase());
    return { title, subtitle: base.subtitle, cta: base.cta, link: base.link };
  }, [app, locale]);

  return (
    <section className="py-24 px-6 md:py-32 overflow-hidden bg-[var(--gm-bg-deep)] border-y border-[var(--gm-border-soft)] relative">
      
      {/* Background Aura */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[var(--gm-gold-light)]/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-start text-left reveal">
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] tracking-[0.1em] text-[var(--gm-text)] mb-6">
              {copy.title}
            </h2>
            <p 
              className="font-serif text-[clamp(1.1rem,1.5vw,1.4rem)] italic text-[var(--gm-text-dim)] mb-10 max-w-lg leading-relaxed [&>em]:text-[var(--gm-gold)] [&>em]:font-normal [&>em]:not-italic"
              dangerouslySetInnerHTML={{ __html: copy.subtitle }}
            />
            <Link href={copy.link} className="btn-premium group shadow-soft py-4 px-10">
              {copy.cta}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right Decoration (Orbits) */}
          <div className="relative hidden lg:flex items-center justify-center reveal reveal-delay-2">
            <div className="relative w-[500px] h-[500px] flex items-center justify-center">
              {/* Central Sun/Gold Dot */}
              <div className="w-4 h-4 rounded-full bg-[var(--gm-gold)] shadow-gold animate-pulse z-10" />
              
              {/* Orbital Rings */}
              <div className="absolute inset-0 border border-[var(--gm-gold-deep)]/20 rounded-full rotate-slow" />
              <div className="absolute inset-[15%] border border-[var(--gm-gold-deep)]/15 rounded-full rotate-slow-reverse" />
              <div className="absolute inset-[30%] border border-[var(--gm-gold-deep)]/10 rounded-full rotate-slow" />
              
              {/* Planet Dots */}
              <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[var(--gm-gold-deep)]/40" />
              <div className="absolute bottom-[20%] right-[15%] w-1.5 h-1.5 rounded-full bg-[var(--gm-gold-deep)]/30" />
              <div className="absolute top-[40%] left-[5%] w-1 h-1 rounded-full bg-[var(--gm-gold-deep)]/20" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
