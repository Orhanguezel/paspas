// =============================================================
// FILE: src/app/(main)/admin/_components/admin-auth-gate.tsx
// Promat ERP — 4 rol destekli auth gate
// Roller: admin | operator | satin_almaci | nakliyeci
// =============================================================

'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useStatusQuery } from '@/integrations/hooks';
import type { AuthStatusResponse } from '@/integrations/shared';
import { normalizeMeFromStatus } from '@/integrations/shared';
import { canAccessAdminPath, ROLE_HOME } from '@/navigation/permissions';
import type { PanelRole } from '@/navigation/permissions';

const VALID_ROLES = new Set<string>(['admin', 'operator', 'satin_almaci', 'nakliyeci']);

function resolveRole(me: ReturnType<typeof normalizeMeFromStatus>): PanelRole | null {
  if (!me) return null;
  const r = me.isAdmin ? 'admin' : (me.role ?? '');
  return VALID_ROLES.has(r) ? (r as PanelRole) : null;
}

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const q = useStatusQuery();

  React.useEffect(() => {
    if (q.isFetching || q.isUninitialized) return;

    const me = normalizeMeFromStatus(q.data as AuthStatusResponse | undefined);
    const role = resolveRole(me);

    if (!role) {
      router.replace('/auth/login');
      return;
    }

    if (canAccessAdminPath(role, pathname)) return;

    // Yetkisiz sayfa → rolün ana sayfasına yönlendir
    router.replace(ROLE_HOME[role]);
  }, [q.isFetching, q.isUninitialized, q.data, router, pathname]);

  if (q.isFetching || q.isUninitialized) return null;

  const me = normalizeMeFromStatus(q.data as AuthStatusResponse | undefined);
  const role = resolveRole(me);
  if (!role || !canAccessAdminPath(role, pathname)) return null;

  return <>{children}</>;
}
