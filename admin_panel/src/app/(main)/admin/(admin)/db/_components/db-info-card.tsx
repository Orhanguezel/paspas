'use client';

import React from 'react';
import { Database, HardDrive, Rows3, Camera, Globe } from 'lucide-react';

import { useGetDbInfoQuery } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const ENV_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  demo: 'secondary',
  seed: 'outline',
  production: 'destructive',
};

export function DbInfoCard() {
  const t = useAdminT('admin.db.info');
  const { data, isLoading, isError } = useGetDbInfoQuery();

  if (isError) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-destructive">{t('error')}</p>
        </CardContent>
      </Card>
    );
  }

  const envLabel =
    data?.environment === 'demo'
      ? t('envDemo')
      : data?.environment === 'seed'
        ? t('envSeed')
        : t('envProduction');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Table Count */}
          <div className="flex items-center gap-3">
            <Database className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('tables')}</p>
              {isLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <p className="text-sm font-medium">{data?.tableCount ?? '-'}</p>
              )}
            </div>
          </div>

          {/* Total Rows */}
          <div className="flex items-center gap-3">
            <Rows3 className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('rows')}</p>
              {isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <p className="text-sm font-medium">
                  {data?.totalRows != null ? data.totalRows.toLocaleString('tr-TR') : '-'}
                </p>
              )}
            </div>
          </div>

          {/* DB Size */}
          <div className="flex items-center gap-3">
            <HardDrive className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('size')}</p>
              {isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <p className="text-sm font-medium">
                  {data?.dbSizeMb != null ? `${data.dbSizeMb.toFixed(1)} MB` : '-'}
                </p>
              )}
            </div>
          </div>

          {/* Snapshot Count */}
          <div className="flex items-center gap-3">
            <Camera className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('snapshots')}</p>
              {isLoading ? (
                <Skeleton className="h-5 w-8" />
              ) : (
                <p className="text-sm font-medium">{data?.snapshotCount ?? '-'}</p>
              )}
            </div>
          </div>

          {/* Environment */}
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('environment')}</p>
              {isLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <Badge variant={ENV_VARIANT[data?.environment ?? 'production'] ?? 'default'}>
                  {envLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
