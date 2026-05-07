// =============================================================
// FILE: src/app/(main)/admin/(admin)/notifications/[id]/page.tsx
// FINAL — Admin Notification Detail/Edit Page
// =============================================================

import AdminNotificationDetailClient from '../_components/admin-notification-detail-client';

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> | Params }) {
  const p = (await params) as Params;
  return <AdminNotificationDetailClient id={p.id} />;
}
