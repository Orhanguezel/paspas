'use client';

import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { useStatusQuery } from '@/integrations/hooks';

export default function OperationalSwitchLink() {
  const { data } = useStatusQuery();
  const roles = data?.user?.roles ?? (data?.user?.role ? [data.user.role] : []);
  if (!roles.includes('admin') && !(roles.includes('operator') && roles.includes('satin_almaci'))) return null;
  return <div className="mb-3 flex justify-end md:hidden"><Link href="/admin/alan-sec" className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-base font-semibold"><ArrowLeftRight className="size-5"/>Alan değiştir</Link></div>;
}
