'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroNew from './HeroNew';
import BannerSlot from './BannerSlot';
import type { HomeSection } from './fetchHomeLayout.server';

import FeaturesNew from './FeaturesNew';
import WelcomeBannerSection from './WelcomeBannerSection';
import HomeIntroSection from './HomeIntroSection';
import PromisesSection from './PromisesSection';
import HomeCTABanner from './HomeCTABanner';

type HomeSectionComponentProps = {
  locale?: string;
  label?: string;
  config?: Record<string, unknown>;
  imageUrls?: string[];
};

const REGISTRY: Record<string, React.ComponentType<HomeSectionComponentProps>> = {
  HeroNew,
  BannerSlot,
  PromisesSection,
  FeaturesNew,
  HomeIntroSection,
  WelcomeBannerSection,
  HomeCTABanner,
};

interface Props {
  layout: HomeSection[];
  locale?: string;
  /** FeaturesNew için sunucuda önceden çekilen görsel URL’leri */
  featuresImageUrls?: string[];
}

export default function HomeLayoutRenderer({ layout, locale, featuresImageUrls }: Props) {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');

  useEffect(() => {
    if (sectionParam) {
      // Small delay to ensure dynamic content is painted
      const timer = setTimeout(() => {
        const targetId = sectionParam;
        const element = document.getElementById(targetId);
        
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [sectionParam]);

  return (
    <>
      {layout.map((section) => {
        const Component = REGISTRY[section.component_key];
        if (!Component) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[HomeLayoutRenderer] Unknown component_key: ${section.component_key} (slug: ${section.slug})`);
          }
          return null;
        }

        const isHero = section.component_key === 'HeroNew';

        const node = (
          <div id={section.slug} className="scroll-mt-32">
            <Component
              locale={locale}
              label={section.label}
              config={section.config ?? undefined}
              {...(section.component_key === 'FeaturesNew' && featuresImageUrls?.length
                ? { imageUrls: featuresImageUrls }
                : {})}
            />
          </div>
        );

        if (isHero) {
          // Hero hızlı SSR — Suspense'siz
          return <React.Fragment key={section.id}>{node}</React.Fragment>;
        }

        return (
          <Suspense key={section.id} fallback={null}>
            {node}
          </Suspense>
        );
      })}
    </>
  );
}
