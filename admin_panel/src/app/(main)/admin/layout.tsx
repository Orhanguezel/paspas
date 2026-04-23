// =============================================================
// FILE: src/app/(main)/admin/layout.tsx
// FINAL — Admin Layout (NO SSR fetch) — Auth gate via RTK client guard
// =============================================================

import type { ReactNode } from 'react';

import { AppSidebar } from '@/app/(main)/admin/_components/sidebar/app-sidebar';

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import { AccountSwitcher } from './_components/sidebar/account-switcher';
import { AdminFooter } from './_components/sidebar/admin-footer';
import { AdminBrandTitle } from './_components/sidebar/admin-brand-title';
import { LayoutControls } from './_components/sidebar/layout-controls';
import { ThemeSwitcher } from './_components/sidebar/theme-switcher';

import AdminAuthGate from './_components/admin-auth-gate';
import { AdminNotificationsLive } from './_components/admin-notifications-live';
import { AdminSettingsProvider } from './_components/admin-settings-provider';

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AdminAuthGate>
      <AdminSettingsProvider>
        {/* Gate inside; when ok, render layout */}
        <SidebarProvider defaultOpen>
          <AppSidebar
            // variant/collapsible artık redux DOM-preferences ile client'ta yönetilecek
            // Sidebar komponentin prop zorunluluğu varsa default ver:
            variant="inset"
            collapsible="icon"
            me={{
              id: 'me',
              name: 'Admin',
              email: 'admin',
              role: 'admin',
              avatar: '',
            }}
          />

          <SidebarInset
            className={cn(
              'flex flex-col',
              '[html[data-content-layout=centered]_&]:mx-auto! [html[data-content-layout=centered]_&]:max-w-screen-2xl!',
              'max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:peer-data-[state=collapsed]:mr-auto!',
            )}
          >
            <header
              className={cn(
                'flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
                '[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md',
              )}
            >
              <div className="flex w-full items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-1 lg:gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                  />
                  <AdminBrandTitle />
                </div>

                <div className="flex items-center gap-2">
                  <AdminNotificationsLive />
                  <LayoutControls />
                  <ThemeSwitcher />
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 min-w-0 overflow-auto p-4 md:p-6">
                {children}
              </div>
              <AdminFooter />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AdminSettingsProvider>
    </AdminAuthGate>
  );
}
