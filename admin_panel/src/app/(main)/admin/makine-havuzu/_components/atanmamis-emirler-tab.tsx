'use client';

import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { useListAtanmamisAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import type { AtanmamisOperasyonDto } from '@/integrations/shared/erp/makine_havuzu.types';

import MakineAtamaDialog from './makine-atama-dialog';

interface AtanmamisEmirlerTabProps {
  t: (key: string, params?: Record<string, string>) => string;
}

export default function AtanmamisEmirlerTab({ t }: AtanmamisEmirlerTabProps) {
  const { data: items, isLoading } = useListAtanmamisAdminQuery();
  const [atamaTarget, setAtamaTarget] = useState<AtanmamisOperasyonDto | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertCircle className="size-8 mb-2" />
        <p className="text-sm">{t('kuyrukYonetimi.atanmamis.bos')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('kuyrukYonetimi.atanmamis.emirNo')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.urun')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.operasyon')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.miktar')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.terminTarihi')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.onerilenMakineler')}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((op) => (
              <TableRow key={op.id}>
                <TableCell className="font-mono font-medium">{op.emirNo}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">{op.urunKod}</span>
                  {' '}
                  <span className="text-sm">{op.urunAd}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">{op.sira}</Badge>
                    <span className="text-sm">{op.operasyonAdi}</span>
                    {op.montaj && <Badge variant="secondary" className="text-xs">M</Badge>}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{op.planlananMiktar.toLocaleString('tr-TR')}</TableCell>
                <TableCell className="text-sm">{op.terminTarihi ?? '—'}</TableCell>
                <TableCell>
                  {op.onerilenMakineler.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {op.onerilenMakineler.map((m) => (
                        <Badge key={m.makineId} variant="outline" className="text-xs">
                          {m.oncelikSira}. {m.makineKod}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="default" onClick={() => setAtamaTarget(op)}>
                    <Plus className="mr-1 size-3" />
                    {t('kuyrukYonetimi.atanmamis.makineAta')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MakineAtamaDialog
        operasyon={atamaTarget}
        onClose={() => setAtamaTarget(null)}
        t={t}
      />
    </>
  );
}
