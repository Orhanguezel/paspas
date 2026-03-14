'use client';

// =============================================================
// FILE: src/app/(main)/admin/makine-havuzu/_components/makine-havuzu-client.tsx
// Paspas ERP — Makine Havuzu: Kuyruk Yonetimi
// =============================================================

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import AtanmamisEmirlerTab from './atanmamis-emirler-tab';

export default function MakineHavuzuClient() {
  const { t } = useLocaleContext();

  const tKuyruk = (key: string, params?: Record<string, string>) =>
    t(`admin.erp.makineHavuzu.${key}`, params);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.makineHavuzu.kuyrukYonetimi.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.makineHavuzu.kuyrukYonetimi.description')}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/makineler">
            <Settings className="mr-1 size-4" />
            {t('admin.erp.makineHavuzu.title')}
          </Link>
        </Button>
      </div>

      {/* Atanmamış Emirler */}
      <AtanmamisEmirlerTab t={tKuyruk} />
    </div>
  );
}
