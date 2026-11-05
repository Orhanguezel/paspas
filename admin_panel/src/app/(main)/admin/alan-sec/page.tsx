'use client';

import Link from 'next/link';
import { PackageCheck, Wrench } from 'lucide-react';
import { useStatusQuery } from '@/integrations/hooks';

export default function AlanSecPage() {
  const { data, isLoading } = useStatusQuery();
  const roles = data?.user?.roles ?? (data?.user?.role ? [data.user.role] : []);
  const canOperate = roles.includes('admin') || roles.includes('operator');
  const canReceive = roles.includes('admin') || roles.includes('satin_almaci');
  return <main className="mx-auto flex min-h-[70dvh] w-full max-w-xl flex-col justify-center gap-5 py-8">
    <h1 className="text-3xl font-bold">Çalışma alanı seçin</h1>
    <p className="text-base text-muted-foreground">Yetkili olduğunuz alana geçin.</p>
    {isLoading ? <p role="status">Alanlar yükleniyor…</p> : <div className="grid gap-4">
      {canOperate && <Link href="/admin/operator" className="flex min-h-28 items-center gap-5 rounded-2xl border bg-card p-6 text-xl font-bold shadow-sm"><Wrench className="size-9 text-blue-700"/>Operatör</Link>}
      {canReceive && <Link href="/admin/mal-kabul" className="flex min-h-28 items-center gap-5 rounded-2xl border bg-card p-6 text-xl font-bold shadow-sm"><PackageCheck className="size-9 text-emerald-700"/>Mal Kabul</Link>}
    </div>}
  </main>;
}
