'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklif-talepleri/_components/teklif-talepleri-client.tsx
// Paspas ERP — Teklif Talepleri (web lead) inbox listesi
// =============================================================

import { useState } from 'react';
import { RefreshCcw, Search } from 'lucide-react';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useListTeklifTalepleriAdminQuery } from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import type { TalepDto, TalepDurum } from '@/integrations/shared/erp/teklifler.types';
import { TALEP_DURUM_BADGE } from '@/integrations/shared/erp/teklifler.types';
import TalepDetaySheet from './talep-detay-sheet';

const DURUM_VALUES: TalepDurum[] = [
  'yeni', 'inceleniyor', 'musteriye_donustu', 'teklife_donustu', 'istenmeyen', 'kapandi',
];

export default function TeklifTalepleriClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState('');
  const [durum, setDurum] = useState<TalepDurum | 'hepsi'>('hepsi');
  const [selected, setSelected] = useState<TalepDto | null>(null);

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== 'hepsi' ? { durum } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useListTeklifTalepleriAdminQuery(params);
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.teklifTalepleri.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.teklifTalepleri.singular').toLowerCase() })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.teklifTalepleri.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={durum} onValueChange={(v) => setDurum(v as TalepDurum | 'hepsi')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">{t('admin.erp.teklifTalepleri.statuses.hepsi')}</SelectItem>
            {DURUM_VALUES.map((d) => (
              <SelectItem key={d} value={d}>{t(`admin.erp.teklifTalepleri.statuses.${d}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.teklifTalepleri.columns.adFirma')}</TableHead>
              <TableHead>{t('admin.erp.teklifTalepleri.columns.iletisim')}</TableHead>
              <TableHead>{t('admin.erp.teklifTalepleri.columns.konu')}</TableHead>
              <TableHead>{t('admin.erp.teklifTalepleri.columns.durum')}</TableHead>
              <TableHead>{t('admin.erp.teklifTalepleri.columns.kaynak')}</TableHead>
              <TableHead>{t('admin.erp.teklifTalepleri.columns.tarih')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.teklifTalepleri.notFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((talep) => (
              <TableRow key={talep.id} className="cursor-pointer" onClick={() => setSelected(talep)}>
                <TableCell className="font-medium">
                  <div>{talep.firma || talep.ad}</div>
                  {talep.firma && talep.ad && <div className="text-xs text-muted-foreground">{talep.ad}</div>}
                </TableCell>
                <TableCell className="text-sm">
                  <div>{talep.email || '—'}</div>
                  <div className="text-xs text-muted-foreground">{talep.telefon || ''}</div>
                </TableCell>
                <TableCell className="max-w-64 truncate text-sm">{talep.konu || '—'}</TableCell>
                <TableCell>
                  <Badge variant={TALEP_DURUM_BADGE[talep.durum]}>
                    {t(`admin.erp.teklifTalepleri.statuses.${talep.durum}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{talep.kaynakSayfa || '—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {talep.createdAt ? talep.createdAt.slice(0, 10) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TalepDetaySheet talep={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
