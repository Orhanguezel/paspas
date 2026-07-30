'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { PROMATS_AOS } from '@/lib/promats/animation-config';

export default function AOSInit() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let aosModule: typeof import('aos') | null = null;

    const initAos = () => {
      if (cancelled || aosModule) return;
      void import('aos').then((mod) => {
        if (cancelled) return;
        aosModule = mod;
        mod.default.init({
          duration: PROMATS_AOS.duration,
          easing: PROMATS_AOS.easing,
          once: PROMATS_AOS.once,
        });
        mod.default.refresh();
      });
    };

    const timer = globalThis.setTimeout(initAos, PROMATS_AOS.initDelayMs);
    globalThis.addEventListener('scroll', initAos, { once: true, passive: true });

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
      globalThis.removeEventListener('scroll', initAos);
    };
  }, []);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void import('aos').then(({ default: AOS }) => AOS.refresh());
    }, 100);
    return () => globalThis.clearTimeout(timer);
  }, [pathname]);

  return null;
}
