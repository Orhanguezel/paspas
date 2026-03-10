'use client';

import { useAdminSettings } from '../admin-settings-provider';

export function AdminBrandTitle() {
  const { companyInfo } = useAdminSettings();
  return (
    <h2 className="text-sm font-semibold tracking-tight hidden sm:block">
      {companyInfo.headerTitle}
    </h2>
  );
}
