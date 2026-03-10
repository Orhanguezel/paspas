'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import { useGetMusteriAdminQuery } from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
import { useListSatisSiparisleriAdminQuery } from '@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints';
import { SIPARIS_DURUM_LABELS, SIPARIS_DURUM_COLORS } from '@/integrations/shared/erp/satis_siparisleri.types';

interface Props {
  id: string;
}

export default function MusteriDetayClient({ id }: Props) {
  const { t } = useLocaleContext();
  const { data: musteri, isLoading, refetch } = useGetMusteriAdminQuery(id);
  const { data: siparisler } = useListSatisSiparisleriAdminQuery({ musteriId: id });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!musteri) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>{t('admin.erp.musteriler.notFound')}</p>
      </div>
    );
  }

  const items = siparisler?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/musteriler">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{musteri.ad}</h1>
            <p className="text-sm text-muted-foreground">{musteri.kod}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-1 size-4" />
            {t('admin.erp.common.refresh')}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/satis-siparisleri?musteriId=${musteri.id}`}>
              <ExternalLink className="mr-1 size-4" />
              {t('admin.erp.musteriler.salesOrders')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.erp.musteriler.summary.contact')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.columns.ilgiliKisi')}</span>
              <span>{musteri.ilgiliKisi ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.columns.telefon')}</span>
              <span>{musteri.telefon ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.columns.email')}</span>
              <span>{musteri.email ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.erp.musteriler.summary.sales')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.summary.toplamSiparis')}</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.summary.acikSiparis')}</span>
              <span>{items.filter(s => !['kapali', 'iptal', 'tamamlandi'].includes(s.durum)).length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.erp.musteriler.summary.status')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.columns.iskonto')}</span>
              <span>{musteri.iskonto > 0 ? `%${musteri.iskonto}` : '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.columns.durum')}</span>
              <Badge variant={musteri.isActive ? 'default' : 'secondary'}>
                {musteri.isActive ? t('admin.erp.common.active') : t('admin.erp.common.inactive')}
              </Badge>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.musteriler.form.adres')}</span>
              <span className="text-right">{musteri.adres ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('admin.erp.musteriler.salesOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('admin.erp.satisSiparisleri.notFound')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.erp.satisSiparisleri.columns.siparisNo')}</TableHead>
                  <TableHead>{t('admin.erp.satisSiparisleri.columns.siparisTarihi')}</TableHead>
                  <TableHead>{t('admin.erp.satisSiparisleri.columns.termin')}</TableHead>
                  <TableHead>{t('admin.erp.satisSiparisleri.columns.durum')}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-mono">{siparis.siparisNo}</TableCell>
                    <TableCell>{siparis.siparisTarihi}</TableCell>
                    <TableCell>{siparis.terminTarihi ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={SIPARIS_DURUM_COLORS[siparis.durum] as 'default' | 'secondary' | 'destructive'}>
                        {SIPARIS_DURUM_LABELS[siparis.durum]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/satis-siparisleri/${siparis.id}`}>
                          <ExternalLink className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
