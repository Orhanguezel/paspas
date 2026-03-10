'use client';

import { useAdminUiCopy } from '@/app/(main)/admin/_components/common/useAdminUiCopy';
import { useAdminSettings } from '../admin-settings-provider';
import { APP_CONFIG } from '@/config/app-config';

export function AdminFooter() {
  const { copy } = useAdminUiCopy();
  const { branding, companyInfo } = useAdminSettings();
  const appName = companyInfo.headerTitle || copy.app_name || branding?.app_name || '';
  const copyright = branding?.app_copyright || '';

  const version = APP_CONFIG.version;

  return (
    <footer className="mt-auto border-t py-4 px-6 bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{appName}</span>
          {version ? <span className="text-border">|</span> : null}
          {version ? <span className="font-mono">v{version}</span> : null}
        </div>

        <div className="flex items-center gap-3">
          {copyright ? <span>{copyright}</span> : null}
          {companyInfo.email ? <span className="text-border">|</span> : null}
          {companyInfo.email ? <span>{companyInfo.email}</span> : null}
          <span className="text-border">|</span>
          <a
            href="https://guezelwebdesign.com/tr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Design by GWD
          </a>
        </div>
      </div>
    </footer>
  );
}
