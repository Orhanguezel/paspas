'use client';

import { useMemo, useState } from 'react';
import { Plus, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import { useCreateHareketAdminMutation, useListHareketlerAdminQuery } from '@/integrations/endpoints/admin/erp/hareketler_admin.endpoints';
import { useListUrunlerAdminQuery } from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
import { HAREKET_KAYNAK_LABELS, HAREKET_TIPI_BADGE, HAREKET_TIPI_LABELS } from '@/integrations/shared/erp/hareketler.types';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Bu Hafta' },
  { value: 'custom', label: 'Özel Aralık' },
] as const;

const KAYNAK_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Kaynaklar' },
  { value: 'sevkiyat', label: 'Sevkiyat' },
  { value: 'mal_kabul', label: 'Mal Kabul' },
  { value: 'stok_duzeltme', label: 'Stok Düzeltme' },
  { value: 'manuel', label: 'Manuel' },
  { value: 'uretim', label: 'Üretim' },
  { value: 'fire', label: 'Fire' },
] as const;

const HAREKET_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Hareketler' },
  { value: 'giris', label: 'Giriş' },
  { value: 'cikis', label: 'Çıkış' },
  { value: 'duzeltme', label: 'Düzeltme' },
] as const;

export default function HareketlerClient() {
  const { t } = useLocaleContext();
  const [q, setQ] = useState('');
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'custom'>('all');
  const [hareketTipi, setHareketTipi] = useState('hepsi');
  const [kaynakTipi, setKaynakTipi] = useState('hepsi');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const params = {
    ...(q ? { q } : {}),
    ...(hareketTipi !== 'hepsi' ? { hareketTipi } : {}),
    ...(kaynakTipi !== 'hepsi' ? { kaynakTipi } : {}),
    ...(period !== 'all' ? { period } : {}),
    ...(period === 'custom' && startDate ? { startDate } : {}),
    ...(period === 'custom' && endDate ? { endDate } : {}),
    limit: 100,
  };

  const { data, isLoading, isFetching, refetch } = useListHareketlerAdminQuery(params);
  const items = data?.items ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.hareketler.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.hareketler.singular').toLowerCase() })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            {t('admin.erp.hareketler.newItem')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title={t('admin.erp.hareketler.summary.total')} value={String(summary?.toplamKayit ?? 0)} />
        <SummaryCard title={t('admin.erp.hareketler.summary.giris')} value={`+${(summary?.toplamGiris ?? 0).toFixed(2)}`} />
        <SummaryCard title={t('admin.erp.hareketler.summary.cikis')} value={`-${(summary?.toplamCikis ?? 0).toFixed(2)}`} />
        <SummaryCard
          title={t('admin.erp.hareketler.summary.timeline')}
          value={`${summary?.sevkiyatAdet ?? 0} / ${summary?.malKabulAdet ?? 0} / ${summary?.duzeltmeAdet ?? 0}`}
          hint={t('admin.erp.hareketler.summary.timelineHint')}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_170px_170px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.hareketler.searchPlaceholder')}
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>
        <Select value={hareketTipi} onValueChange={setHareketTipi}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HAREKET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kaynakTipi} onValueChange={setKaynakTipi}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KAYNAK_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(value: 'today' | 'week' | 'custom') => setPeriod(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {period === 'custom' ? (
          <div className="grid grid-cols-2 gap-2 xl:col-span-2">
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
        ) : (
          <div />
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.hareketler.columns.tarih')}</TableHead>
              <TableHead>{t('admin.erp.hareketler.columns.urun')}</TableHead>
              <TableHead>{t('admin.erp.hareketler.columns.kaynak')}</TableHead>
              <TableHead>{t('admin.erp.hareketler.columns.hareketTipi')}</TableHead>
              <TableHead>{t('admin.erp.hareketler.columns.miktar')}</TableHead>
              <TableHead>{t('admin.erp.hareketler.columns.aciklama')}</TableHead>
              <TableHead>{t('admin.erp.hareketler.columns.olusturan')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`hareket-skeleton-${index}`}>
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <TableCell key={`hareket-skeleton-cell-${cellIndex}`}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.hareketler.notFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((hareket) => (
              <TableRow key={hareket.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {hareket.createdAt.slice(0, 16).replace('T', ' ')}
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="font-medium">{hareket.urunAd ?? hareket.urunId}</div>
                    <div className="font-mono text-xs text-muted-foreground">{hareket.urunKod ?? hareket.urunId}</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{HAREKET_KAYNAK_LABELS[hareket.kaynakTipi] ?? hareket.kaynakTipi}</TableCell>
                <TableCell>
                  <Badge variant={HAREKET_TIPI_BADGE[hareket.hareketTipi] ?? 'outline'}>
                    {HAREKET_TIPI_LABELS[hareket.hareketTipi] ?? hareket.hareketTipi}
                  </Badge>
                </TableCell>
                <TableCell className={hareket.miktar < 0 ? 'font-medium text-destructive' : 'font-medium text-green-600'}>
                  {hareket.miktar > 0 ? '+' : ''}{hareket.miktar.toFixed(4).replace(/\.?0+$/, '')}
                </TableCell>
                <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{hareket.aciklama ?? '—'}</TableCell>
                <TableCell className="text-sm">{hareket.createdByName ?? t('admin.erp.hareketler.system')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateHareketSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function SummaryCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

function CreateHareketSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocaleContext();
  const { data: urunlerData } = useListUrunlerAdminQuery({ limit: 500 });
  const [createHareket, createState] = useCreateHareketAdminMutation();

  const [urunId, setUrunId] = useState('');
  const [hareketTipi, setHareketTipi] = useState<'giris' | 'cikis' | 'duzeltme'>('giris');
  const [referansTipi, setReferansTipi] = useState<'manuel' | 'stok_duzeltme' | 'uretim' | 'fire'>('manuel');
  const [miktar, setMiktar] = useState('');
  const [aciklama, setAciklama] = useState('');

  const urunler = useMemo(() => urunlerData?.items ?? [], [urunlerData]);

  async function handleSubmit() {
    if (!urunId || !miktar.trim()) {
      toast.error(t('admin.erp.hareketler.fillRequired'));
      return;
    }

    try {
      await createHareket({
        urunId,
        hareketTipi,
        referansTipi,
        miktar: Number.parseFloat(miktar),
        aciklama: aciklama.trim() || undefined,
      }).unwrap();
      toast.success(t('admin.erp.common.created', { item: t('admin.erp.hareketler.singular') }));
      setUrunId('');
      setHareketTipi('giris');
      setReferansTipi('manuel');
      setMiktar('');
      setAciklama('');
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(state) => !state && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{t('admin.erp.hareketler.newItem')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4 sm:px-6">
          <div className="space-y-1">
            <Label>{t('admin.erp.hareketler.form.urun')}</Label>
            <Select value={urunId} onValueChange={setUrunId}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.erp.hareketler.form.urunPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {urunler.map((urun) => (
                  <SelectItem key={urun.id} value={urun.id}>
                    {urun.kod} - {urun.ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.hareketler.form.hareketTipi')}</Label>
              <Select value={hareketTipi} onValueChange={(value: 'giris' | 'cikis' | 'duzeltme') => setHareketTipi(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="giris">{t('admin.erp.hareketler.types.giris')}</SelectItem>
                  <SelectItem value="cikis">{t('admin.erp.hareketler.types.cikis')}</SelectItem>
                  <SelectItem value="duzeltme">{t('admin.erp.hareketler.types.duzeltme')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.hareketler.form.kaynak')}</Label>
              <Select value={referansTipi} onValueChange={(value: 'manuel' | 'stok_duzeltme' | 'uretim' | 'fire') => setReferansTipi(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manuel">{t('admin.erp.hareketler.types.manual')}</SelectItem>
                  <SelectItem value="stok_duzeltme">{t('admin.erp.hareketler.types.stok_duzeltme')}</SelectItem>
                  <SelectItem value="uretim">{t('admin.erp.hareketler.types.uretim')}</SelectItem>
                  <SelectItem value="fire">{t('admin.erp.hareketler.types.fire')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('admin.erp.hareketler.form.miktar')}</Label>
            <Input type="number" step="0.0001" value={miktar} onChange={(event) => setMiktar(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t('admin.erp.hareketler.form.aciklama')}</Label>
            <Textarea rows={4} value={aciklama} onChange={(event) => setAciklama(event.target.value)} />
          </div>
        </div>
        <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="outline" onClick={onClose}>{t('admin.common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={createState.isLoading}>
            {createState.isLoading ? t('admin.erp.common.saving') : t('admin.common.save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
