'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/sidebar/app-sidebar.tsx
// FINAL — RTK/Redux uyumlu (zustand yok)
// - NavMain: NavGroup[] alır (senin nav-main.tsx böyle)
// =============================================================

import Link from 'next/link';
import { LayoutDashboard, Mail, Phone } from 'lucide-react';

import { resolveMediaUrl } from '@/lib/media-url';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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

function SidebarCompanyFooter({
  title,
  subtitle,
  email,
  phone,
}: {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
}) {
  const infoLines = [
    { icon: Mail, value: email },
    { icon: Phone, value: phone },
  ].filter((item) => item.value);

  return (
    <div className="mx-3 mb-3 border-t border-sidebar-border/60 px-1 pt-3 group-data-[collapsible=icon]:hidden">
      <div className="truncate text-sm font-semibold text-sidebar-foreground">{title}</div>
      <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{subtitle}</div>

      {infoLines.length ? (
        <div className="mt-3 space-y-1.5">
          {infoLines.map(({ icon: Icon, value }) => (
            <div key={value} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarBrandBlock({
  title,
  subtitle,
  logoUrl,
}: {
  title: string;
  subtitle: string;
  logoUrl: string;
}) {
  return (
    <div className="w-full group-data-[collapsible=icon]:w-auto">
      {logoUrl ? (
        <div className="w-full overflow-hidden rounded-2xl bg-white/80 px-4 py-4 shadow-sm ring-1 ring-sidebar-border/60 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-16 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={title}
            width={180}
            height={72}
            className="h-16 w-auto max-w-full object-contain group-data-[collapsible=icon]:h-10"
          />
        </div>
      ) : (
        <div className="flex h-16 w-full items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:size-16">
          <LayoutDashboard className="size-7" />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-1 leading-none group-data-[collapsible=icon]:hidden">
        <span className="text-[1.35rem] font-semibold tracking-tight text-foreground">{title}</span>
        <span className="max-w-[12rem] text-xs leading-4 text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  );
}

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
  const { pageMeta, branding, companyInfo } = useAdminSettings();
  const baseName = (
    companyInfo.sidebarTitle ||
    copy.app_name ||
    branding?.app_name ||
    appName ||
    ''
  ).trim();

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
  const panelLabel = baseName || 'ERP';
  const panelSub = companyInfo.sidebarSubtitle || 'Uretim Yonetim Sistemi';

  const logoUrl = branding?.logo_url ? resolveMediaUrl(branding.logo_url) : '';

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <Link
          prefetch={false}
          href="/admin/dashboard"
          className="block px-4 py-5 transition-colors hover:bg-sidebar-accent/40 group-data-[collapsible=icon]:px-2"
        >
          <SidebarBrandBlock title={panelLabel || 'Admin Panel'} subtitle={panelSub} logoUrl={logoUrl} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* ✅ NavMain NavGroup[] bekliyor */}
        <NavMain items={groupsForMe} showQuickCreate={false} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarCompanyFooter
          title={companyInfo.sidebarTitle || panelLabel}
          subtitle={companyInfo.sidebarSubtitle || panelSub}
          email={companyInfo.email}
          phone={companyInfo.phone}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
