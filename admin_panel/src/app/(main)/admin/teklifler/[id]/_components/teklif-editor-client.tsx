'use client';

// =============================================================
// FILE: src/app/(main)/admin/teklifler/[id]/_components/teklif-editor-client.tsx
// Paspas ERP — Teklif Modülü — Teklif düzenleme / detay sayfası
// =============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCcw, Plus, Pencil, Trash2, Printer, FileDown, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';
import { resolveBaseUrl } from '@/integrations/apiBase';
import { tokenStore } from '@/integrations/core/token';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  useGetTeklifAdminQuery,
  useUpdateTeklifAdminMutation,
  useSetTeklifDurumAdminMutation,
  useDeleteTeklifKalemAdminMutation,
} from '@/integrations/endpoints/admin/erp/teklifler_admin.endpoints';
import type { TeklifDurum, TeklifKalemDto, TeklifPatchPayload } from '@/integrations/shared/erp/teklifler.types';
import { TEKLIF_DURUM_BADGE, TEKLIF_DURUM_GECISLERI } from '@/integrations/shared/erp/teklifler.types';
import TeklifKalemDialog from './teklif-kalem-dialog';
import TeklifPrint from './teklif-print';

const PARA_BIRIMLERI = ['TRY', 'USD', 'EUR'] as const;

const DURUM_ACTION_KEY: Record<TeklifDurum, string> = {
  taslak:        'taslagaDondur',
  onay_bekliyor: 'onayaGonder',
  gonderildi:    'gonderildiIsaretle',
  goruntulendi:  'goruntulendiIsaretle',
  revizyon:      'revizyonaAl',
  kabul:         'kabulEt',
  red:           'reddet',
  suresi_doldu:  'suresiDolduIsaretle',
};

interface HeaderFormState {
  paraBirimi: string;
  kdvOrani: string;
  kdvDahil: boolean;
  iskontoOrani: string;
  nakliye: string;
  gecerlilikTarihi: string;
  odemeKosullari: string;
  teslimKosullari: string;
  aciklama: string;
}

const EMPTY_FORM: HeaderFormState = {
  paraBirimi: 'TRY',
  kdvOrani: '20',
  kdvDahil: true,
  iskontoOrani: '0',
  nakliye: '0',
  gecerlilikTarihi: '',
  odemeKosullari: '',
  teslimKosullari: '',
  aciklama: '',
};

function money(n: number, currency: string): string {
  return n.toLocaleString('tr-TR', { style: 'currency', currency: currency || 'TRY' });
}

export default function TeklifEditorClient({ id }: { id: string }) {
  const { t } = useLocaleContext();
  const { data, isLoading, isFetching, refetch } = useGetTeklifAdminQuery(id);
  const [updateTeklif, updateState] = useUpdateTeklifAdminMutation();
  const [setDurum, setDurumState] = useSetTeklifDurumAdminMutation();
  const [deleteKalem, deleteKalemState] = useDeleteTeklifKalemAdminMutation();

  const [form, setForm] = useState<HeaderFormState>(EMPTY_FORM);
  const [kalemDialogOpen, setKalemDialogOpen] = useState(false);
  const [editingKalem, setEditingKalem] = useState<TeklifKalemDto | null>(null);
  const [deleteKalemTarget, setDeleteKalemTarget] = useState<TeklifKalemDto | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handlePdf() {
    setPdfLoading(true);
    try {
      const token = tokenStore.get();
      const res = await fetch(`${resolveBaseUrl()}/admin/teklifler/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('PDF oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setPdfLoading(false);
    }
  }
  const [redDialogOpen, setRedDialogOpen] = useState(false);
  const [redNedeni, setRedNedeni] = useState('');

  const isLocked = data ? data.durum !== 'taslak' : true;

  useEffect(() => {
    if (!data) return;
    setForm({
      paraBirimi: data.paraBirimi,
      kdvOrani: String(data.kdvOrani),
      kdvDahil: data.kdvDahil,
      iskontoOrani: String(data.iskontoOrani),
      nakliye: String(data.nakliye),
      gecerlilikTarihi: data.gecerlilikTarihi ?? '',
      odemeKosullari: data.odemeKosullari ?? '',
      teslimKosullari: data.teslimKosullari ?? '',
      aciklama: data.aciklama ?? '',
    });
  }, [data]);

  function patch<K extends keyof HeaderFormState>(key: K, value: HeaderFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveHeader() {
    const body: TeklifPatchPayload = {
      paraBirimi: form.paraBirimi,
      kdvOrani: Number(form.kdvOrani) || 0,
      kdvDahil: form.kdvDahil,
      iskontoOrani: Number(form.iskontoOrani) || 0,
      nakliye: Number(form.nakliye) || 0,
      gecerlilikTarihi: form.gecerlilikTarihi || undefined,
      odemeKosullari: form.odemeKosullari || undefined,
      teslimKosullari: form.teslimKosullari || undefined,
      aciklama: form.aciklama || undefined,
    };
    try {
      await updateTeklif({ id, body }).unwrap();
      toast.success(t('admin.erp.common.updated', { item: t('admin.erp.teklifler.singular') }));
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(
        message === 'sadece_taslak_duzenlenir'
          ? t('admin.erp.teklifler.form.taslakDisindaBilgi')
          : (message ?? t('admin.erp.common.operationFailed')),
      );
    }
  }

  async function handleDurumChange(next: TeklifDurum) {
    if (next === 'red') {
      setRedNedeni('');
      setRedDialogOpen(true);
      return;
    }
    try {
      await setDurum({ id, body: { durum: next } }).unwrap();
      toast.success(t('admin.erp.teklifler.durumAksiyonlari.durumGuncellendi'));
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(
        message === 'gecersiz_teklif_gecisi'
          ? t('admin.erp.teklifler.durumAksiyonlari.durumGuncellenemedi')
          : (message ?? t('admin.erp.common.operationFailed')),
      );
    }
  }

  async function confirmRed() {
    if (!redNedeni.trim()) {
      toast.error(t('admin.erp.teklifler.durumAksiyonlari.redNedeniZorunlu'));
      return;
    }
    try {
      await setDurum({ id, body: { durum: 'red', redNedeni: redNedeni.trim() } }).unwrap();
      toast.success(t('admin.erp.teklifler.durumAksiyonlari.durumGuncellendi'));
      setRedDialogOpen(false);
    } catch (err: any) {
      const message = err?.data?.error?.message;
      toast.error(message ?? t('admin.erp.common.operationFailed'));
    }
  }

  function openAddKalem() { setEditingKalem(null); setKalemDialogOpen(true); }
  function openEditKalem(k: TeklifKalemDto) { setEditingKalem(k); setKalemDialogOpen(true); }

  async function confirmDeleteKalem() {
    if (!deleteKalemTarget) return;
    try {
      await deleteKalem({ id, kalemId: deleteKalemTarget.id }).unwrap();
      toast.success(t('admin.erp.common.deleted', { item: t('admin.erp.teklifler.form.kalemler') }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t('admin.erp.common.deleteFailed'));
    } finally {
      setDeleteKalemTarget(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {t('admin.erp.teklifler.detail.notFound')}{' '}
        <Link href="/admin/teklifler" className="underline">{t('admin.erp.common.goBack')}</Link>
      </div>
    );
  }

  const kalemler = [...(data.kalemler ?? [])].sort((a, b) => a.sira - b.sira);
  const gecisler = TEKLIF_DURUM_GECISLERI[data.durum] ?? [];

  return (
    <div className="space-y-6">
      {/* Üst bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/teklifler"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{data.teklifNo}</h1>
            <p className="text-xs text-muted-foreground">{data.musteriAd ?? '—'}</p>
          </div>
          <Badge variant={TEKLIF_DURUM_BADGE[data.durum]}>
            {t(`admin.erp.teklifler.statuses.${data.durum}`)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
            <Printer className="mr-1 size-4" /> {t('admin.erp.teklifler.detail.yazdir')}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePdf} disabled={pdfLoading}>
            <FileDown className="mr-1 size-4" /> {pdfLoading ? 'PDF…' : 'PDF İndir'}
          </Button>
        </div>
      </div>

      {/* Durum aksiyonları */}
      {gecisler.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gecisler.map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === 'red' ? 'destructive' : 'outline'}
              onClick={() => handleDurumChange(next)}
              disabled={setDurumState.isLoading}
            >
              {t(`admin.erp.teklifler.durumAksiyonlari.${DURUM_ACTION_KEY[next]}`)}
            </Button>
          ))}
        </div>
      )}

      {data.redNedeni && data.durum === 'red' && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            <strong>{t('admin.erp.teklifler.durumAksiyonlari.redNedeni')}:</strong> {data.redNedeni}
          </CardContent>
        </Card>
      )}

      {isLocked && (
        <p className="text-xs text-amber-600">{t('admin.erp.teklifler.form.taslakDisindaBilgi')}</p>
      )}

      {/* Header alanları */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.erp.teklifler.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.paraBirimi')}</Label>
              <Select value={form.paraBirimi} onValueChange={(v) => patch('paraBirimi', v)} disabled={isLocked}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARA_BIRIMLERI.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.kdvOrani')}</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={form.kdvOrani}
                onChange={(e) => patch('kdvOrani', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.gecerlilikTarihi')}</Label>
              <Input
                type="date"
                value={form.gecerlilikTarihi}
                onChange={(e) => patch('gecerlilikTarihi', e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.iskontoOrani')}</Label>
              <Input
                type="number" min="0" max="100" step="0.01"
                value={form.iskontoOrani}
                onChange={(e) => patch('iskontoOrani', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.nakliye')}</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.nakliye}
                onChange={(e) => patch('nakliye', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3 self-end">
              <Label className="cursor-pointer">{t('admin.erp.teklifler.form.kdvDahil')}</Label>
              <Switch checked={form.kdvDahil} onCheckedChange={(v) => patch('kdvDahil', v)} disabled={isLocked} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.odemeKosullari')}</Label>
              <Textarea
                value={form.odemeKosullari}
                onChange={(e) => patch('odemeKosullari', e.target.value)}
                placeholder={t('admin.erp.teklifler.form.odemeKosullariPlaceholder')}
                disabled={isLocked}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.teklifler.form.teslimKosullari')}</Label>
              <Textarea
                value={form.teslimKosullari}
                onChange={(e) => patch('teslimKosullari', e.target.value)}
                placeholder={t('admin.erp.teklifler.form.teslimKosullariPlaceholder')}
                disabled={isLocked}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.form.aciklama')}</Label>
            <Textarea
              value={form.aciklama}
              onChange={(e) => patch('aciklama', e.target.value)}
              placeholder={t('admin.erp.teklifler.form.aciklamaPlaceholder')}
              disabled={isLocked}
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={saveHeader} disabled={isLocked || updateState.isLoading}>
              <Save className="mr-1 size-4" />
              {updateState.isLoading ? t('admin.erp.common.saving') : t('admin.common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kalemler */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('admin.erp.teklifler.detail.kalemler')}</h2>
          <Button size="sm" variant="outline" onClick={openAddKalem} disabled={isLocked}>
            <Plus className="mr-1 size-4" /> {t('admin.erp.teklifler.form.kalemEkle')}
          </Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t('admin.erp.common.row')}</TableHead>
                <TableHead>{t('admin.erp.teklifler.form.kalemAciklama')}</TableHead>
                <TableHead className="text-right">{t('admin.erp.teklifler.form.miktar')}</TableHead>
                <TableHead className="text-right">{t('admin.erp.teklifler.form.fiyat')}</TableHead>
                <TableHead className="text-right">{t('admin.erp.teklifler.form.kalemIskonto')}</TableHead>
                <TableHead className="text-right">{t('admin.erp.common.total')}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {kalemler.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    {t('admin.erp.common.noItems')}
                  </TableCell>
                </TableRow>
              )}
              {kalemler.map((k) => (
                <TableRow key={k.id}>
                  <TableCell>{k.sira}</TableCell>
                  <TableCell>
                    <div className="font-medium">{k.aciklama}</div>
                    {k.urunKod && <div className="text-xs text-muted-foreground">{k.urunKod} — {k.urunAd}</div>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {k.miktar.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} {k.birim ?? ''}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(k.birimFiyat, data.paraBirimi)}</TableCell>
                  <TableCell className="text-right tabular-nums">{k.iskontoOrani > 0 ? `%${k.iskontoOrani}` : '—'}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{money(k.satirToplam, data.paraBirimi)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditKalem(k)} disabled={isLocked}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteKalemTarget(k)}
                        disabled={isLocked}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {kalemler.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-semibold">{t('admin.erp.common.total')}</TableCell>
                  <TableCell colSpan={2} className="text-right tabular-nums font-semibold">{money(data.araToplam, data.paraBirimi)}</TableCell>
                </TableRow>
                {data.iskontoTutari > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold text-green-600">
                      İskonto (%{data.iskontoOrani})
                    </TableCell>
                    <TableCell colSpan={2} className="text-right tabular-nums font-semibold text-green-600">
                      -{money(data.iskontoTutari, data.paraBirimi)}
                    </TableCell>
                  </TableRow>
                )}
                {data.nakliye > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">Nakliye</TableCell>
                    <TableCell colSpan={2} className="text-right tabular-nums font-semibold">{money(data.nakliye, data.paraBirimi)}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-semibold">
                    KDV (%{data.kdvOrani}{data.kdvDahil ? ' — dahil' : ''})
                  </TableCell>
                  <TableCell colSpan={2} className="text-right tabular-nums font-semibold">{money(data.kdvTutari, data.paraBirimi)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell colSpan={5} className="text-right text-base font-bold">Genel Toplam</TableCell>
                  <TableCell colSpan={2} className="text-right tabular-nums text-base font-bold">{money(data.genelToplam, data.paraBirimi)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      <TeklifKalemDialog
        open={kalemDialogOpen}
        onClose={() => setKalemDialogOpen(false)}
        teklifId={id}
        kalem={editingKalem}
      />

      <TeklifPrint open={printOpen} onClose={() => setPrintOpen(false)} teklif={data} />

      <AlertDialog open={!!deleteKalemTarget} onOpenChange={(v) => !v && setDeleteKalemTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.erp.teklifler.form.kalemler')} — {t('admin.common.delete')}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.erp.common.deleteDescriptionIrreversible', { name: deleteKalemTarget?.aciklama ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteKalem}
              disabled={deleteKalemState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKalemState.isLoading ? t('admin.erp.common.deleting') : t('admin.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={redDialogOpen} onOpenChange={setRedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.erp.teklifler.durumAksiyonlari.reddet')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Label>{t('admin.erp.teklifler.durumAksiyonlari.redNedeni')}</Label>
            <Textarea
              value={redNedeni}
              onChange={(e) => setRedNedeni(e.target.value)}
              placeholder={t('admin.erp.teklifler.durumAksiyonlari.redNedeniPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedDialogOpen(false)} disabled={setDurumState.isLoading}>
              {t('admin.common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmRed} disabled={setDurumState.isLoading}>
              {setDurumState.isLoading ? t('admin.erp.common.saving') : t('admin.erp.teklifler.durumAksiyonlari.reddet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
