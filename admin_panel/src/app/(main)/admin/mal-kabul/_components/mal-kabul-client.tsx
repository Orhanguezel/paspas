'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, PackagePlus, PackageCheck, RefreshCcw, Search, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import {
  useListMalKabulAdminQuery,
  useDeleteMalKabulAdminMutation,
  useUpdateMalKabulAdminMutation,
} from '@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints';
import type { MalKabulDto } from '@/integrations/shared/erp/mal_kabul.types';
import {
  KAYNAK_TIPI_LABELS,
  KAYNAK_TIPI_BADGE,
  KALITE_DURUMU_LABELS,
  KALITE_DURUMU_BADGE,
} from '@/integrations/shared/erp/mal_kabul.types';
import CreateMalKabulSheet from './create-mal-kabul-sheet';

const KAYNAK_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Kaynaklar' },
  { value: 'satin_alma', label: 'Satın Alma' },
  { value: 'fason', label: 'Fason' },
  { value: 'hammadde', label: 'Hammadde' },
  { value: 'yari_mamul', label: 'Yarı Mamul' },
  { value: 'iade', label: 'İade' },
  { value: 'diger', label: 'Diğer' },
] as const;

const KALITE_OPTIONS = [
  { value: 'hepsi', label: 'Tüm Kalite' },
  { value: 'bekliyor', label: 'Onay Bekliyor' },
  { value: 'kabul', label: 'Kabul' },
  { value: 'red', label: 'Red' },
  { value: 'kosullu', label: 'Koşullu' },
] as const;

export default function MalKabulClient() {
  const { t } = useLocaleContext();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [q, setQ] = useState('');
  const [kaynakTipi, setKaynakTipi] = useState('hepsi');
  const [kaliteDurumu, setKaliteDurumu] = useState('bekliyor');
  const [showAll, setShowAll] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [teslimAlRow, setTeslimAlRow] = useState<MalKabulDto | null>(null);
  const [teslimMiktar, setTeslimMiktar] = useState('');
  const [teslimNotlar, setTeslimNotlar] = useState('');

  const params = {
    ...(q ? { q } : {}),
    ...(kaynakTipi !== 'hepsi' ? { kaynakTipi } : {}),
    ...(!showAll ? { kaliteDurumu: 'bekliyor' } : kaliteDurumu !== 'hepsi' ? { kaliteDurumu } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    limit: 100,
  };

  const { data, isLoading, isFetching, refetch } = useListMalKabulAdminQuery(params);
  const [deleteMalKabul] = useDeleteMalKabulAdminMutation();
  const [updateMalKabul] = useUpdateMalKabulAdminMutation();
  const items = data?.items ?? [];

  async function handleKaliteGuncelle(id: string, kaliteDurumu: string) {
    try {
      await updateMalKabul({ id, body: { kaliteDurumu } }).unwrap();
      const label = kaliteDurumu === 'kabul' ? 'Kabul edildi' : kaliteDurumu === 'red' ? 'Reddedildi' : 'Koşullu kabul';
      toast.success(label);
    } catch {
      toast.error('Güncelleme başarısız');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('admin.erp.malKabul.deleteConfirm'))) return;
    try {
      await deleteMalKabul(id).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.malKabul.singular') }));
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? t('admin.erp.common.operationFailed'));
    }
  }

  function openTeslimAl(row: MalKabulDto) {
    setTeslimMiktar(String(row.gelenMiktar));
    setTeslimNotlar('');
    setTeslimAlRow(row);
  }

  async function confirmTeslimAl() {
    if (!teslimAlRow) return;
    const miktar = Number.parseFloat(teslimMiktar);
    if (!Number.isFinite(miktar) || miktar <= 0) {
      toast.error('Geçerli bir miktar girin');
      return;
    }
    try {
      await updateMalKabul({
        id: teslimAlRow.id,
        body: { gelenMiktar: miktar, kaliteDurumu: 'kabul', notlar: teslimNotlar.trim() || undefined },
      }).unwrap();
      toast.success('Teslim alındı');
      setTeslimAlRow(null);
    } catch {
      toast.error(t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.malKabul.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.malKabul.singular').toLowerCase() })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAll ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'Tümü Göster' : 'Bekleyenler'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <PackagePlus className="mr-1 size-4" />
            {t('admin.erp.malKabul.newItem')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_160px_150px_150px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.malKabul.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={kaynakTipi} onValueChange={setKaynakTipi}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {KAYNAK_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kaliteDurumu} onValueChange={setKaliteDurumu}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {KALITE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Başlangıç" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Bitiş" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.malKabul.columns.kabulTarihi')}</TableHead>
              <TableHead>{t('admin.erp.malKabul.columns.urun')}</TableHead>
              <TableHead>{t('admin.erp.malKabul.columns.kaynakTipi')}</TableHead>
              <TableHead>{t('admin.erp.malKabul.columns.tedarikci')}</TableHead>
              <TableHead>{t('admin.erp.malKabul.columns.miktar')}</TableHead>
              <TableHead>Notlar</TableHead>
              <TableHead>{t('admin.erp.malKabul.columns.kaliteDurumu')}</TableHead>
              <TableHead>{t('admin.erp.malKabul.columns.operator')}</TableHead>
              <TableHead>İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`mk-skel-${i}`}>
                {Array.from({ length: 9 }).map((__, j) => (
                  <TableCell key={`mk-skel-c-${j}`}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  {t('admin.erp.malKabul.notFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {row.kabulTarihi.slice(0, 16).replace('T', ' ')}
                </TableCell>
                <TableCell>
                  <Link href={`/admin/mal-kabul/${row.id}`} className="space-y-0.5 hover:underline underline-offset-4">
                    <div className="font-medium">{row.urunAd ?? row.urunId}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.urunKod ?? '—'}</div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={KAYNAK_TIPI_BADGE[row.kaynakTipi] ?? 'outline'}>
                    {KAYNAK_TIPI_LABELS[row.kaynakTipi] ?? row.kaynakTipi}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{row.tedarikciAd ?? '—'}</TableCell>
                <TableCell className="font-medium text-green-600">
                  +{row.gelenMiktar.toFixed(4).replace(/\.?0+$/, '')}
                  {row.urunBirim ? <span className="ml-1 text-xs text-muted-foreground">{row.urunBirim}</span> : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{row.notlar ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={KALITE_DURUMU_BADGE[row.kaliteDurumu] ?? 'outline'}>
                    {KALITE_DURUMU_LABELS[row.kaliteDurumu] ?? row.kaliteDurumu}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{row.operatorName ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {row.kaliteDurumu === 'bekliyor' && (
                      <>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => openTeslimAl(row)}
                        >
                          <PackageCheck className="mr-1 size-3" />
                          Teslim Al
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleKaliteGuncelle(row.id, 'kosullu')}
                        >
                          <AlertTriangle className="mr-1 size-3" />
                          Koşullu
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleKaliteGuncelle(row.id, 'red')}
                        >
                          <X className="mr-1 size-3" />
                          Red
                        </Button>
                      </>
                    )}
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                      <Link href={`/admin/mal-kabul/${row.id}`}>Düzenle</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(row.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateMalKabulSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* Teslim Al Sheet */}
      <Sheet open={!!teslimAlRow} onOpenChange={(v) => !v && setTeslimAlRow(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle className="flex items-center gap-2">
              <PackageCheck className="size-5 text-emerald-600" />
              Teslim Al
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            {teslimAlRow && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{teslimAlRow.urunAd ?? teslimAlRow.urunId}</span>
                {teslimAlRow.tedarikciAd && <> · {teslimAlRow.tedarikciAd}</>}
              </p>
            )}
            <div className="space-y-1">
              <Label>Teslim Alınan Miktar {teslimAlRow?.urunBirim ? `(${teslimAlRow.urunBirim})` : ''}</Label>
              <Input
                type="number"
                step="0.0001"
                min={0}
                value={teslimMiktar}
                onChange={(e) => setTeslimMiktar(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Notlar <span className="text-muted-foreground">(opsiyonel)</span></Label>
              <Textarea rows={2} value={teslimNotlar} onChange={(e) => setTeslimNotlar(e.target.value)} />
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setTeslimAlRow(null)}>İptal</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={confirmTeslimAl}
            >
              <Check className="mr-1 size-4" />
              Onayla ve Kaydet
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

