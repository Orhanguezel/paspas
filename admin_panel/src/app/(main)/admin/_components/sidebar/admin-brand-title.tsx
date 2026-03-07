'use client';

import { useStatusQuery } from '@/integrations/hooks';
import { normalizeMeFromStatus } from '@/integrations/shared';
import { useAdminSettings } from '../admin-settings-provider';

function withPanelTitle(appNameRaw: string, isAdmin: boolean): string {
  const panelTitle = isAdmin ? 'Admin Panel' : 'Satici Panel';
  const cleaned = appNameRaw
    .replace(/\badmin\s*panel\b/gi, '')
    .replace(/\bsatici\s*panel\b/gi, '')
    .trim();
  return cleaned ? `${cleaned} ${panelTitle}` : panelTitle;
}

export function AdminBrandTitle() {
  const { branding } = useAdminSettings();
  const statusQ = useStatusQuery();
  const me = normalizeMeFromStatus(statusQ.data as any);
  const isAdmin = me?.isAdmin === true;
  const appName = branding?.app_name || '';
  return (
    <h2 className="text-sm font-semibold tracking-tight hidden sm:block">
      {withPanelTitle(appName, isAdmin)}
    </h2>
  );
}
