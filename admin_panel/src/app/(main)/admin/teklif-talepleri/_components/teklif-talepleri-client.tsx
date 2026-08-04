'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklif-talepleri/_components/teklif-talepleri-client.tsx
// Paspas ERP — Teklif Talepleri (web lead) inbox listesi
// =============================================================

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCcw, Search } from 'lucide-react';
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
import { useListUsersAdminQuery } from '@/integrations/endpoints/admin/users/auth_admin.endpoints';
import type { TalepDto, TalepDurum } from '@/integrations/shared/erp/teklifler.types';
import { TALEP_DURUM_BADGE } from '@/integrations/shared/erp/teklifler.types';
import TalepDetaySheet from './talep-detay-sheet';

const DURUM_VALUES: TalepDurum[] = [
  'yeni', 'inceleniyor', 'musteriye_donustu', 'teklife_donustu', 'istenmeyen', 'kapandi',
];
const PAGE_SIZE = 50;
type DurumGrubu = 'hepsi' | 'yeni' | 'inceleniyor' | 'donusturuldu' | 'spam';

export default function TeklifTalepleriClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState('');
  const [durum, setDurum] = useState<TalepDurum | 'hepsi'>('hepsi');
  const [durumGrubu, setDurumGrubu] = useState<DurumGrubu>('hepsi');
  const [dil, setDil] = useState('hepsi');
  const [konu, setKonu] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('hepsi');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<TalepDto | null>(null);

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== 'hepsi' ? { durum } : {}),
    ...(durumGrubu !== 'hepsi' ? { durumGrubu } : {}),
    ...(dil !== 'hepsi' ? { dil } : {}),
    ...(konu ? { konu } : {}),
    ...(ownerUserId !== 'hepsi' ? { ownerUserId } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    limit: PAGE_SIZE,
    offset,
  };

  const { data, isLoading, isFetching, refetch } = useListTeklifTalepleriAdminQuery(params);
  const { data: users = [] } = useListUsersAdminQuery();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const userName = (id: string | null) => users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.email || 'Atanmamış';

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
      <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.teklifTalepleri.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          />
        </div>
        <Select value={durumGrubu} onValueChange={(v) => { setDurumGrubu(v as DurumGrubu); setDurum('hepsi'); setOffset(0); }}>
          <SelectTrigger><SelectValue placeholder="Gelen kutusu" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">Tüm kutular</SelectItem><SelectItem value="yeni">Yeni</SelectItem><SelectItem value="inceleniyor">İnceleniyor</SelectItem><SelectItem value="donusturuldu">Dönüştürüldü</SelectItem><SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
        <Select value={durum} onValueChange={(v) => { setDurum(v as TalepDurum | 'hepsi'); setDurumGrubu('hepsi'); setOffset(0); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">{t('admin.erp.teklifTalepleri.statuses.hepsi')}</SelectItem>
            {DURUM_VALUES.map((d) => (
              <SelectItem key={d} value={d}>{t(`admin.erp.teklifTalepleri.statuses.${d}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownerUserId} onValueChange={(v) => { setOwnerUserId(v); setOffset(0); }}><SelectTrigger><SelectValue placeholder="Sorumlu" /></SelectTrigger><SelectContent><SelectItem value="hepsi">Tüm sorumlular</SelectItem>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email || u.id}</SelectItem>)}</SelectContent></Select>
        <Select value={dil} onValueChange={(v) => { setDil(v); setOffset(0); }}><SelectTrigger><SelectValue placeholder="Dil" /></SelectTrigger><SelectContent><SelectItem value="hepsi">Tüm diller</SelectItem><SelectItem value="tr">Türkçe</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="de">Deutsch</SelectItem></SelectContent></Select>
        <Input placeholder="Konu filtrele" value={konu} onChange={(e) => { setKonu(e.target.value); setOffset(0); }} />
        <Input type="date" aria-label="Başlangıç tarihi" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setOffset(0); }} />
        <Input type="date" aria-label="Bitiş tarihi" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setOffset(0); }} />
        <Button variant="ghost" onClick={() => { setSearch(''); setDurum('hepsi'); setDurumGrubu('hepsi'); setDil('hepsi'); setKonu(''); setOwnerUserId('hepsi'); setDateFrom(''); setDateTo(''); setOffset(0); }}>Filtreleri temizle</Button>
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
              <TableHead>Sorumlu / Dil</TableHead>
              <TableHead>{t('admin.erp.teklifTalepleri.columns.tarih')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
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
                <TableCell className="text-xs"><div>{userName(talep.atananUserId)}</div><div className="uppercase text-muted-foreground">{talep.dil}</div></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {talep.createdAt ? talep.createdAt.slice(0, 10) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted-foreground">{total ? `${offset + 1}-${Math.min(offset + PAGE_SIZE, total)} / ${total}` : '0 / 0'}</span>
        <Button variant="outline" size="icon" disabled={offset === 0 || isFetching} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" size="icon" disabled={offset + PAGE_SIZE >= total || isFetching} onClick={() => setOffset(offset + PAGE_SIZE)}><ChevronRight className="size-4" /></Button>
      </div>

      <TalepDetaySheet talep={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
