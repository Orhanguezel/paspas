'use client';

// =============================================================
// FILE: src/app/(main)/admin/satis-siparisleri/_components/satis-siparisleri-client.tsx
// Paspas ERP — Satış Siparişleri liste sayfası
// =============================================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, RefreshCcw, Pencil, Trash2, Search, Eye, ShoppingCart, Factory, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

import {
  useListSatisSiparisleriAdminQuery,
  useDeleteSatisSiparisiAdminMutation,
} from '@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints';
import type { SatisSiparisDto, SiparisDurum } from '@/integrations/shared/erp/satis_siparisleri.types';
import {
  URETIM_DURUMU_LABELS, URETIM_DURUMU_BADGE,
  SEVK_DURUMU_LABELS, SEVK_DURUMU_BADGE,
} from '@/integrations/shared/erp/satis_siparisleri.types';
import SiparisForm from './siparis-form';

const BADGE_VARIANT: Record<SiparisDurum, 'default' | 'secondary' | 'destructive'> = {
  taslak:       'secondary',
  planlandi:    'secondary',
  onaylandi:    'default',
  uretimde:     'default',
  kismen_sevk:  'secondary',
  tamamlandi:   'default',
  kapali:       'secondary',
  iptal:        'destructive',
};

export default function SatisSiparisleriClient() {
  const { t } = useLocaleContext();
  const [search, setSearch]         = useState('');
  const [durum, setDurum]           = useState<SiparisDurum | 'hepsi'>('hepsi');
  const [showCompleted, setShowCompleted] = useState(false);
  const [formOpen, setFormOpen]     = useState(false);
  const [editing, setEditing]       = useState<SatisSiparisDto | null>(null);
  const [deleteTarget, setDelete]   = useState<SatisSiparisDto | null>(null);

  const DURUM_OPTIONS: Array<{ value: SiparisDurum | 'hepsi'; label: string }> = [
    { value: 'hepsi',        label: t('admin.erp.satisSiparisleri.statuses.hepsi') },
    { value: 'taslak',       label: t('admin.erp.satisSiparisleri.statuses.taslak') },
    { value: 'planlandi',    label: t('admin.erp.satisSiparisleri.statuses.planlandi') },
    { value: 'onaylandi',    label: t('admin.erp.satisSiparisleri.statuses.onaylandi') },
    { value: 'uretimde',     label: t('admin.erp.satisSiparisleri.statuses.uretimde') },
    { value: 'kismen_sevk',  label: t('admin.erp.satisSiparisleri.statuses.kismen_sevk') },
    { value: 'tamamlandi',   label: t('admin.erp.satisSiparisleri.statuses.tamamlandi') },
    { value: 'kapali',       label: t('admin.erp.satisSiparisleri.statuses.kapali') },
    { value: 'iptal',        label: t('admin.erp.satisSiparisleri.statuses.iptal') },
  ];

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== 'hepsi' ? { durum } : {}),
    tamamlananlariGoster: showCompleted,
  };

  const { data, isLoading, isFetching, refetch } = useListSatisSiparisleriAdminQuery(params);
  const [deleteSiparis, deleteState] = useDeleteSatisSiparisiAdminMutation();

  const items = data?.items ?? [];

  const summary = useMemo(() => {
    const toplam = items.length;
    const terminRiskli = items.filter((s) => {
      if (!s.terminTarihi || s.durum === 'tamamlandi' || s.durum === 'kapali' || s.durum === 'iptal') return false;
      const termin = new Date(s.terminTarihi);
      const bugun = new Date();
      const farkGun = Math.ceil((termin.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24));
      return farkGun <= 3;
    }).length;
    return { toplam, terminRiskli };
  }, [items]);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(s: SatisSiparisDto) { setEditing(s); setFormOpen(true); }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSiparis(deleteTarget.id).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.satisSiparisleri.singular') }));
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(message === 'siparis_kilitli' ? t('admin.erp.satisSiparisleri.form.kilitliBilgi') : (message ?? t('admin.erp.common.deleteFailed')));
    } finally {
      setDelete(null);
    }
  }

  function getDurumLabel(d: SiparisDurum): string {
    return t(`admin.erp.satisSiparisleri.statuses.${d}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t('admin.erp.satisSiparisleri.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.erp.common.totalCount', { count: String(data?.total ?? 0), item: t('admin.erp.satisSiparisleri.singular').toLowerCase() })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" /> {t('admin.erp.satisSiparisleri.newItem')}
          </Button>
        </div>
      </div>

      {/* Özet Kartları (Rev4: Temel Giriş Bilgileri) */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingCart className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Toplam Sipariş</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{summary.toplam}</p>
            </CardContent>
          </Card>
          <Card className={summary.terminRiskli > 0 ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950' : ''}>
            <CardContent className="p-4">
              <div className={`flex items-center gap-2 ${summary.terminRiskli > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                <AlertTriangle className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Termin Riski</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{summary.terminRiskli}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('admin.erp.satisSiparisleri.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={durum} onValueChange={(v) => setDurum(v as any)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURUM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Tamamlananları Göster</span>
          <button
            type="button"
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${showCompleted ? 'bg-primary' : 'bg-input'}`}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${showCompleted ? 'translate-x-4' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.erp.satisSiparisleri.columns.siparisNo')}</TableHead>
              <TableHead>{t('admin.erp.satisSiparisleri.columns.musteriId')}</TableHead>
              <TableHead>{t('admin.erp.satisSiparisleri.columns.siparisTarihi')}</TableHead>
              <TableHead>{t('admin.erp.satisSiparisleri.columns.termin')}</TableHead>
              <TableHead className="text-right">Genel Toplam (KDV Dahil)</TableHead>
              <TableHead>{t('admin.erp.satisSiparisleri.columns.durum')}</TableHead>
              <TableHead className="w-28" />
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
                  {t('admin.erp.satisSiparisleri.notFound')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono font-medium">{s.siparisNo}</TableCell>
                <TableCell className="font-medium">
                  {s.musteriAd ?? '—'}
                </TableCell>
                <TableCell>{s.siparisTarihi}</TableCell>
                <TableCell>{s.terminTarihi ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {s.toplamFiyat > 0
                    ? s.toplamFiyat.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={BADGE_VARIANT[s.durum]}>
                    {getDurumLabel(s.durum)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/satis-siparisleri/${s.id}`}>
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDelete(s)}
                      disabled={s.kilitli}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SiparisForm open={formOpen} onClose={() => setFormOpen(false)} siparis={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.erp.satisSiparisleri.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.erp.common.deleteDescriptionIrreversible', { name: deleteTarget?.siparisNo ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteState.isLoading ? t('admin.erp.common.deleting') : t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
