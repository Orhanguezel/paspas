'use client';

import { useMemo, useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { useListAtanmamisAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import type { AtanmamisEmirDto } from '@/integrations/shared/erp/makine_havuzu.types';
import { groupByEmirId } from '@/integrations/shared/erp/makine_havuzu.types';

import EmirAtamaDialog from './emir-atama-dialog';

interface AtanmamisEmirlerTabProps {
  t: (key: string, params?: Record<string, string>) => string;
}

export default function AtanmamisEmirlerTab({ t }: AtanmamisEmirlerTabProps) {
  const { data: items, isLoading } = useListAtanmamisAdminQuery();
  const [atamaTarget, setAtamaTarget] = useState<AtanmamisEmirDto | null>(null);

  const emirler = useMemo(() => groupByEmirId(items ?? []), [items]);
  const ozet = useMemo(() => {
    const toplamOperasyon = emirler.reduce((sum, emir) => sum + emir.operasyonlar.length, 0);
    const terminli = emirler.filter((emir) => Boolean(emir.terminTarihi)).length;
    return {
      toplamEmir: emirler.length,
      toplamOperasyon,
      terminli,
    };
  }, [emirler]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (emirler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertCircle className="size-8 mb-2" />
        <p className="text-sm">{t('kuyrukYonetimi.atanmamis.bos')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('kuyrukYonetimi.atanmamis.ozet.toplamEmir')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{ozet.toplamEmir}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('kuyrukYonetimi.atanmamis.ozet.toplamOperasyon')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{ozet.toplamOperasyon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">{t('kuyrukYonetimi.atanmamis.ozet.terminli')}</div>
            <div className="mt-1 font-semibold text-2xl tabular-nums">{ozet.terminli}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('kuyrukYonetimi.atanmamis.emirNo')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.urun')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.operasyon')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.miktar')}</TableHead>
              <TableHead>{t('kuyrukYonetimi.atanmamis.terminTarihi')}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {emirler.map((emir) => (
              <TableRow key={emir.uretimEmriId}>
                <TableCell className="font-mono font-medium">{emir.emirNo}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">{emir.urunKod}</span>
                  {' '}
                  <span className="text-sm">{emir.urunAd}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {emir.operasyonlar.map((op) => (
                      <Badge key={op.id} variant="outline" className="text-xs">
                        {op.sira}. {op.operasyonAdi}
                        {op.montaj ? ' (M)' : ''}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{emir.planlananMiktar.toLocaleString('tr-TR')}</TableCell>
                <TableCell className="text-sm">
                  {emir.terminTarihi ? (
                    <span className="font-medium">{emir.terminTarihi}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="default" onClick={() => setAtamaTarget(emir)}>
                    <Plus className="mr-1 size-3" />
                    {t('kuyrukYonetimi.atanmamis.makineAta')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EmirAtamaDialog
        emir={atamaTarget}
        onClose={() => setAtamaTarget(null)}
        t={t}
      />
    </>
  );
}
