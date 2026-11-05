'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileOperationalMode() {
  const pathname = usePathname();
  useEffect(() => {
    document.body.classList.toggle('mobile-operational-view', pathname === '/admin/mal-kabul' || pathname === '/admin/satin-alma' || pathname === '/admin/alan-sec');
    return () => document.body.classList.remove('mobile-operational-view');
  }, [pathname]);
  return null;
}
