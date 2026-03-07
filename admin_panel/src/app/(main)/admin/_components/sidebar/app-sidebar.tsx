'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/sidebar/app-sidebar.tsx
// FINAL — RTK/Redux uyumlu (zustand yok)
// - NavMain: NavGroup[] alır (senin nav-main.tsx böyle)
// =============================================================

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { buildAdminSidebarItems } from '@/navigation/sidebar/sidebar-items';
import type { NavGroup } from '@/navigation/sidebar/sidebar-items';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';
import type { TranslateFn } from '@/i18n';
import { normalizeMeFromStatus } from '@/integrations/shared';
import type { PanelRole } from '@/navigation/permissions';

import { useMemo } from 'react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { useAdminSettings } from '../admin-settings-provider';
import { useStatusQuery, useGetMyProfileQuery } from '@/integrations/hooks';

const VALID_ROLES = new Set<string>(['admin', 'operator', 'satin_almaci', 'nakliyeci']);

type SidebarMe = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
};

export function AppSidebar({
  me,
  appName,
  variant,
  collapsible,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  me: SidebarMe;
  appName?: string;
}) {
  const { copy } = useAdminUiCopy();
  const t = useAdminT();

  // Admin settings override for page titles
  const { pageMeta, branding } = useAdminSettings();
  const baseName = (copy.app_name || branding?.app_name || appName || '').trim();

  // ✅ Get real user data
  const { data: statusData } = useStatusQuery();
  const { data: profileData } = useGetMyProfileQuery();

  const currentUser = useMemo(() => {
    const s = statusData?.user;
    const statusMe = normalizeMeFromStatus(statusData as any);
    const statusRole = statusMe?.isAdmin ? 'admin' : (statusMe?.role || s?.role);
    return {
      id: s?.id || me?.id || 'me',
      name: profileData?.full_name || s?.email?.split('@')[0] || me?.name || 'Admin',
      email: s?.email || me?.email || 'admin',
      role: statusRole || me?.role || 'admin',
      avatar: profileData?.avatar_url || me?.avatar || '',
    };
  }, [statusData, profileData, me]);

  const wrappedT: TranslateFn = (key, params, fallback) => {
    // Check pageMeta override for sidebar items: admin.dashboard.items.{key}
    if (typeof key === 'string' && key.startsWith('admin.dashboard.items.')) {
      const itemKey = key.replace('admin.dashboard.items.', '');
      // Check if pageMeta has this key and a title
      if (pageMeta?.[itemKey]?.title) {
        return pageMeta[itemKey].title;
      }
    }
    return t(key, params, fallback);
  };

  const resolvedRole: PanelRole = VALID_ROLES.has(currentUser.role)
    ? (currentUser.role as PanelRole)
    : 'admin';
  const groupsForMe: NavGroup[] = buildAdminSidebarItems(copy.nav, wrappedT, resolvedRole);
  const panelLabel = baseName || 'Promat ERP';
  const panelSub = 'Üretim Yönetim Sistemi';

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <Link prefetch={false} href="/admin/dashboard" className="flex items-center gap-3 px-3 py-4 hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-bold text-lg tracking-tight">{panelLabel || 'Admin Panel'}</span>
            <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">{panelSub}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* ✅ NavMain NavGroup[] bekliyor */}
        <NavMain items={groupsForMe} showQuickCreate={false} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{ name: currentUser.name, email: currentUser.email, avatar: currentUser.avatar }} />
      </SidebarFooter>
    </Sidebar>
  );
}
