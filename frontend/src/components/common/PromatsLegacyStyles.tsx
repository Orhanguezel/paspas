'use client';

import { useEffect } from 'react';

/**
 * Legacy CSS globals.css üzerinden SSR'da yüklenir.
 * Bu bileşen yalnızca `promats-legacy-active` sınıfını ekler (font/token override).
 */
export default function PromatsLegacyStyles() {
  useEffect(() => {
    const root = document.querySelector('.promats-public');
    root?.classList.add('promats-legacy-active');
    return () => root?.classList.remove('promats-legacy-active');
  }, []);

  return null;
}
