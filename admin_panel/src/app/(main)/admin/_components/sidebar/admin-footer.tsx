'use client';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminSettings } from '../admin-settings-provider';
import { useStatusQuery } from '@/integrations/hooks';
import { normalizeMeFromStatus } from '@/integrations/shared';

function withPanelTitle(appNameRaw: string, isAdmin: boolean): string {
  const panelTitle = isAdmin ? 'Admin Panel' : 'Satici Panel';
  const cleaned = appNameRaw
    .replace(/\badmin\s*panel\b/gi, '')
    .replace(/\bsatici\s*panel\b/gi, '')
    .trim();
  return cleaned ? `${cleaned} ${panelTitle}` : panelTitle;
}

export function AdminFooter() {
  const { copy } = useAdminUiCopy();
  const { branding } = useAdminSettings();
  const statusQ = useStatusQuery();
  const me = normalizeMeFromStatus(statusQ.data as any);
  const isAdmin = me?.isAdmin === true;
  const appNameRaw = copy.app_name || branding?.app_name || '';
  const appName = withPanelTitle(appNameRaw, isAdmin);
  const appVersion = copy.app_version || '';
  const copyright = branding?.app_copyright || '';

  return (
    <footer className="mt-auto border-t py-4 px-6 bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{appName}</span>
          {appVersion ? <span className="text-border">|</span> : null}
          {appVersion ? <span className="font-mono">{appVersion}</span> : null}
        </div>

        {copyright ? <div className="flex items-center gap-1">{copyright}</div> : null}
      </div>
    </footer>
  );
}
