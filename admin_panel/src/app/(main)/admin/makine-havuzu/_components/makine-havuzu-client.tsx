'use client';

// =============================================================
// FILE: src/app/(main)/admin/makine-havuzu/_components/makine-havuzu-client.tsx
// Paspas ERP — Makine Havuzu: Kuyruk Yonetimi
// =============================================================

import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AtanmamisEmirlerTab from './atanmamis-emirler-tab';
import MakineKuyrukTab from './makine-kuyruklar-tab';

export default function MakineHavuzuClient() {
  const { t } = useLocaleContext();

  // -- Tabs --
  const [activeTab, setActiveTab] = useState('atanmamis');

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

      {/* Queue Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="atanmamis">
            {t('admin.erp.makineHavuzu.kuyrukYonetimi.tabs.atanmamis')}
          </TabsTrigger>
          <TabsTrigger value="kuyruklar">
            {t('admin.erp.makineHavuzu.kuyrukYonetimi.tabs.kuyruklar')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="atanmamis" className="mt-4">
          <AtanmamisEmirlerTab t={tKuyruk} />
        </TabsContent>

        <TabsContent value="kuyruklar" className="mt-4">
          <MakineKuyrukTab t={tKuyruk} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
