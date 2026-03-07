'use client';

// =============================================================
// FILE: src/app/(main)/admin/satin-alma/[id]/_components/satin-alma-detay-client.tsx
// Paspas ERP — Satın Alma Detay + Teslim Alma Ekranı
// =============================================================

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, RefreshCcw, CheckCircle2, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  useGetSatinAlmaAdminQuery,
  useUpdateSatinAlmaAdminMutation,
} from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import type { SatinAlmaDurum } from '@/integrations/shared/erp/satin_alma.types';
import { SATIN_ALMA_DURUM_LABELS, SATIN_ALMA_DURUM_BADGE } from '@/integrations/shared/erp/satin_alma.types';
import SatinAlmaForm from '../../_components/satin-alma-form';

interface Props { id: string; }

export default function SatinAlmaDetayClient({ id }: Props) {
  const [formOpen, setFormOpen]       = useState(false);
  const [teslimConfirm, setTeslim]    = useState<'kismen' | 'tam' | null>(null);

  const { data: siparis, isLoading, refetch } = useGetSatinAlmaAdminQuery(id);
  const [update, updateState] = useUpdateSatinAlmaAdminMutation();

  async function handleTeslim(tip: 'kismen' | 'tam') {
    const durum: SatinAlmaDurum = tip === 'tam' ? 'tamamlandi' : 'kismen_teslim';
    try {
      await update({ id, body: { durum } }).unwrap();
      toast.success(tip === 'tam' ? 'Sipariş teslim alındı (tamamlandı)' : 'Kısmi teslim kaydedildi');
      setTeslim(null);
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? 'Güncelleme başarısız');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!siparis) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Satın alma siparişi bulunamadı</p>
        <Link href="/admin/satin-alma" className="mt-2 inline-block text-sm underline">Listeye dön</Link>
      </div>
    );
  }

  const isTamamlandi = siparis.durum === 'tamamlandi' || siparis.durum === 'iptal';
  const kalemler = siparis.items ?? [];

  const toplamMiktar  = kalemler.reduce((s, k) => s + k.miktar, 0);
  const toplamKabul   = kalemler.reduce((s, k) => s + k.kabulMiktar, 0);
  const toplamKalan   = kalemler.reduce((s, k) => s + k.kalanMiktar, 0);
  const kabulYuzde    = toplamMiktar > 0 ? Math.min(100, Math.round((toplamKabul / toplamMiktar) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/satin-alma"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold font-mono">{siparis.siparisNo}</h1>
            <p className="text-sm text-muted-foreground">Satın Alma Detayı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-1 size-4" /> Düzenle
          </Button>
        </div>
      </div>

      {/* Sipariş bilgileri + Teslim alma */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sipariş Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum</span>
              <Badge variant={SATIN_ALMA_DURUM_BADGE[siparis.durum]}>
                {SATIN_ALMA_DURUM_LABELS[siparis.durum]}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tedarikçi</span>
              <Link href={`/admin/tedarikci/${siparis.tedarikciId}`} className="hover:underline">
                {siparis.tedarikciAd ?? siparis.tedarikciId}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sipariş Tarihi</span>
              <span>{siparis.siparisTarihi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Termin Tarihi</span>
              <span>{siparis.terminTarihi ?? '—'}</span>
            </div>
            {siparis.aciklama && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Açıklama</span>
                  <p className="mt-1">{siparis.aciklama}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Teslim Alma Kartı */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PackageCheck className="size-4 text-green-600" />
              Teslim Alma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Kabul ilerleme özeti */}
            {kalemler.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Kabul edilen</span>
                  <span className="tabular-nums font-medium">{kabulYuzde}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${kabulYuzde}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Kabul: {toplamKabul.toFixed(2)}
                  </span>
                  <span className={toplamKalan > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}>
                    Kalan: {toplamKalan.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            {isTamamlandi ? (
              <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  {siparis.durum === 'tamamlandi'
                    ? 'Sipariş tamamen teslim alındı.'
                    : 'Sipariş iptal edildi.'}
                </span>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Durum, Operatör Ekranı&apos;ndaki mal kabul kaydıyla otomatik güncellenir. Manuel olarak da değiştirebilirsiniz.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setTeslim('kismen')}
                    disabled={updateState.isLoading}
                  >
                    <PackageCheck className="mr-1.5 size-4" />
                    Kısmi Teslim
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setTeslim('tam')}
                    disabled={updateState.isLoading}
                  >
                    <CheckCircle2 className="mr-1.5 size-4" />
                    Tam Teslim
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kalemler tablosu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sipariş Kalemleri ({kalemler.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {kalemler.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Kalem bulunamadı</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Sipariş Miktarı</TableHead>
                  <TableHead className="text-right">Kabul Edilen</TableHead>
                  <TableHead className="text-right">Kalan</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kalemler.map((k) => {
                  const isDone    = k.kalanMiktar === 0 && k.kabulMiktar > 0;
                  const isPartial = k.kabulMiktar > 0 && k.kalanMiktar > 0;
                  return (
                    <TableRow key={k.id} className={isDone ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}>
                      <TableCell className="font-mono text-sm">{k.sira}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium">{k.urunAd ?? k.urunId}</p>
                          <p className="font-mono text-muted-foreground text-xs">{k.urunKod ?? k.urunId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{k.miktar}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {k.kabulMiktar > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {k.kabulMiktar.toFixed(4).replace(/\.?0+$/, '')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" /> Tamam
                          </span>
                        ) : isPartial ? (
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {k.kalanMiktar.toFixed(4).replace(/\.?0+$/, '')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground tabular-nums">{k.miktar}</span>
                        )}
                      </TableCell>
                      <TableCell>{k.birim ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{k.birimFiyat.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {(k.miktar * k.birimFiyat).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Toplam */}
                <TableRow className="border-t-2 font-semibold bg-muted/30">
                  <TableCell colSpan={7} className="text-right">Genel Toplam</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {kalemler.reduce((s, k) => s + k.miktar * k.birimFiyat, 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SatinAlmaForm open={formOpen} onClose={() => setFormOpen(false)} siparis={siparis} />

      {/* Teslim Onay Dialog */}
      <AlertDialog open={!!teslimConfirm} onOpenChange={(v) => !v && setTeslim(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {teslimConfirm === 'tam' ? 'Tam Teslim Onayla' : 'Kısmi Teslim Onayla'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {teslimConfirm === 'tam'
                ? `${siparis.siparisNo} siparişi tamamen teslim alınacak ve durum "Tamamlandı" olarak güncellenecek.`
                : `${siparis.siparisNo} siparişi kısmi teslim olarak işaretlenecek.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => teslimConfirm && handleTeslim(teslimConfirm)}
              disabled={updateState.isLoading}
              className={teslimConfirm === 'tam' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {updateState.isLoading ? 'Kaydediliyor…' : 'Onayla'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
