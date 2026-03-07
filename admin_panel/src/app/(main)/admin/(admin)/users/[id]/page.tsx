// src/app/(main)/admin/users/[id]/page.tsx

import UserDetailClient from '../_components/user-detail-client';

type Params = { id: string };

// Next.js bazı sürümlerde params'ı Promise olarak verir (sync-dynamic-apis hatası)
export default async function Page({ params }: { params: Promise<Params> | Params }) {
  const p = (await params) as Params;
  return <UserDetailClient id={p.id} />;
}
