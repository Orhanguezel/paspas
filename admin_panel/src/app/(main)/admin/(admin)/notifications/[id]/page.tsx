// =============================================================
// FILE: src/app/(main)/admin/(admin)/notifications/[id]/page.tsx
// FINAL — Admin Notification Detail/Edit Page
// =============================================================

import AdminNotificationDetailClient from '../_components/admin-notification-detail-client';

export default function Page({ params }: { params: { id: string } }) {
  return <AdminNotificationDetailClient id={params.id} />;
}
