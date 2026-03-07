'use client';

import React from 'react';

import { useListAdminAuditLogsQuery } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DbRecentAudit() {
  const t = useAdminT('admin.db.audit');
  const { data, isLoading } = useListAdminAuditLogsQuery({
    resource: 'db',
    limit: 10,
    order: 'desc',
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">{t('columns.date')}</TableHead>
                  <TableHead>{t('columns.user')}</TableHead>
                  <TableHead>{t('columns.action')}</TableHead>
                  <TableHead className="w-[100px] text-center">{t('columns.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.actor_email ?? '-'}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                        {log.success ? t('success') : t('failed')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
