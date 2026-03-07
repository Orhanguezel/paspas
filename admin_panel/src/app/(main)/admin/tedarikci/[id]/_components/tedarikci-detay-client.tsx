'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, RefreshCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import { useGetTedarikciAdminQuery } from '@/integrations/endpoints/admin/erp/tedarikci_admin.endpoints';
import { useListSatinAlmaAdminQuery } from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import { SATIN_ALMA_DURUM_BADGE, SATIN_ALMA_DURUM_LABELS } from '@/integrations/shared/erp/satin_alma.types';

interface Props {
  id: string;
}

export default function TedarikciDetayClient({ id }: Props) {
  const { t } = useLocaleContext();
  const { data: tedarikci, isLoading, refetch } = useGetTedarikciAdminQuery(id);
  const { data: satinAlmalar } = useListSatinAlmaAdminQuery({ tedarikciId: id });

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

  if (!tedarikci) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>{t('admin.erp.tedarikci.notFound')}</p>
      </div>
    );
  }

  const siparisler = satinAlmalar?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/tedarikci">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{tedarikci.ad}</h1>
            <p className="text-sm text-muted-foreground">{tedarikci.kod}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="mr-1 size-4" />
            {t('admin.erp.common.refresh')}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/satin-alma?tedarikciId=${tedarikci.id}`}>
              <ExternalLink className="mr-1 size-4" />
              {t('admin.erp.tedarikci.purchaseOrders')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.erp.tedarikci.summary.contact')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.ilgiliKisi')}</span>
              <span>{tedarikci.ilgiliKisi ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.telefon')}</span>
              <span>{tedarikci.telefon ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.email')}</span>
              <span>{tedarikci.email ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.erp.tedarikci.summary.purchase')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.toplamSiparis')}</span>
              <span>{tedarikci.toplamSiparis}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.acikSiparis')}</span>
              <span>{tedarikci.acikSiparis}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.sonSiparisTarihi')}</span>
              <span>{tedarikci.sonSiparisTarihi ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('admin.erp.tedarikci.summary.status')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.iskonto')}</span>
              <span>{tedarikci.iskonto > 0 ? `%${tedarikci.iskonto}` : '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.durum')}</span>
              <Badge variant={tedarikci.isActive ? 'default' : 'secondary'}>
                {tedarikci.isActive ? t('admin.erp.common.active') : t('admin.erp.common.inactive')}
              </Badge>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('admin.erp.tedarikci.columns.adres')}</span>
              <span className="text-right">{tedarikci.adres ?? '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('admin.erp.tedarikci.purchaseOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          {siparisler.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('admin.erp.satinAlma.notFound')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.erp.satinAlma.columns.siparisNo')}</TableHead>
                  <TableHead>{t('admin.erp.satinAlma.columns.siparisTarihi')}</TableHead>
                  <TableHead>{t('admin.erp.satinAlma.columns.termin')}</TableHead>
                  <TableHead>{t('admin.erp.satinAlma.columns.durum')}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {siparisler.map((siparis) => (
                  <TableRow key={siparis.id}>
                    <TableCell className="font-mono">{siparis.siparisNo}</TableCell>
                    <TableCell>{siparis.siparisTarihi}</TableCell>
                    <TableCell>{siparis.terminTarihi ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={SATIN_ALMA_DURUM_BADGE[siparis.durum]}>
                        {SATIN_ALMA_DURUM_LABELS[siparis.durum]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/satin-alma/${siparis.id}`}>
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
