'use client';

// =============================================================
// FILE: src/app/(main)/admin/satis-siparisleri/_components/siparis-detay-client.tsx
// Paspas ERP — Sipariş detay sayfası
// =============================================================

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ChevronRight, RefreshCcw, Pencil, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { useSevkiyatOlusturAdminMutation } from '@/integrations/endpoints/admin/erp/operator_admin.endpoints';
import { useGetSatisSiparisiAdminQuery } from '@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints';
import { useGetUrunReceteAdminQuery, useListUrunlerAdminQuery } from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
import type { SiparisDurum, SiparisKalemDto } from '@/integrations/shared/erp/satis_siparisleri.types';
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

const TRY = (n: number): string => n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
const NUM = (n: number, d = 4): string => n.toLocaleString('tr-TR', { maximumFractionDigits: d });

// ── Expandable kalem row with recipe ─────────────────────────
function KalemRow({ k, iskonto }: { k: SiparisKalemDto; iskonto: number }) {
  const [expanded, setExpanded] = useState(false);
  const { data: recete, isLoading: receteLoading } = useGetUrunReceteAdminQuery(k.urunId, { skip: !expanded });
  const { data: allProducts } = useListUrunlerAdminQuery(undefined, { skip: !expanded });

  const araToplam   = k.miktar * k.birimFiyat;
  const iskontoTutar = 0;
  const kdvTutar    = araToplam * k.kdvOrani / 100;
  const satirToplam = araToplam + kdvTutar;

  const productMap = new Map((allProducts?.items ?? []).map((u) => [u.id, u]));
  const receteItems = recete?.items ?? [];

  return (
    <>
      <TableRow className="group">
        <TableCell className="w-8">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronRight className={`size-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>
        </TableCell>
        <TableCell>{k.sira}</TableCell>
        <TableCell>
          <div className="font-medium">{k.urunAd ?? k.urunId}</div>
          {k.urunKod && <div className="text-xs text-muted-foreground">{k.urunKod}</div>}
        </TableCell>
        <TableCell className="text-right tabular-nums">{NUM(k.miktar)}</TableCell>
        <TableCell className="text-right tabular-nums">{TRY(k.birimFiyat)}</TableCell>
        <TableCell className="text-right tabular-nums">{NUM(k.sevkEdilenMiktar, 2)}</TableCell>
        <TableCell className="text-right tabular-nums">{NUM(Math.max(0, k.miktar - k.sevkEdilenMiktar), 2)}</TableCell>
        <TableCell className="text-right tabular-nums">{TRY(araToplam)}</TableCell>
        <TableCell className="text-right tabular-nums">
          {iskonto > 0 ? `%${NUM(iskonto, 2)}` : '—'}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {iskonto > 0 ? 'Satıra yansıtıldı' : '—'}
        </TableCell>
        <TableCell className="text-right tabular-nums">%{NUM(k.kdvOrani, 0)}</TableCell>
        <TableCell className="text-right tabular-nums">{TRY(kdvTutar)}</TableCell>
        <TableCell className="text-right tabular-nums font-semibold">{TRY(satirToplam)}</TableCell>
      </TableRow>

      {/* Expandable recipe sub-table */}
      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/40">
          <TableCell colSpan={13} className="p-0">
            <div className="px-8 py-3">
              {receteLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  Reçete yükleniyor...
                </div>
              ) : receteItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">Bu ürüne ait reçete tanımlı değil.</p>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Reçete: {recete?.ad} ({recete?.kod})
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-1 pr-4">Malzeme</th>
                        <th className="text-right py-1 pr-4">Miktar</th>
                        <th className="text-right py-1 pr-4">Fire %</th>
                        <th className="text-right py-1">Birim Miktar (fire dahil)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receteItems.map((ri) => {
                        const prod = productMap.get(ri.urunId);
                        const effectiveMiktar = ri.miktar * (1 + ri.fireOrani / 100);
                        return (
                          <tr key={ri.id} className="border-b border-border/50">
                            <td className="py-1 pr-4">
                              {prod?.ad ?? ri.urunId}
                              {prod?.kod && (
                                <span className="ml-2 text-muted-foreground">({prod.kod})</span>
                              )}
                            </td>
                            <td className="text-right py-1 pr-4 tabular-nums">{NUM(ri.miktar)}</td>
                            <td className="text-right py-1 pr-4 tabular-nums">
                              {ri.fireOrani > 0 ? `%${NUM(ri.fireOrani, 2)}` : '—'}
                            </td>
                            <td className="text-right py-1 tabular-nums">{NUM(effectiveMiktar)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Main detail component ────────────────────────────────────
export default function SiparisDetayClient({ id }: { id: string }) {
  const { t } = useLocaleContext();
  const { data, isLoading, refetch, isFetching } = useGetSatisSiparisiAdminQuery(id);
  const [sevkiyatOlustur, sevkiyatState] = useSevkiyatOlusturAdminMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [sevkiyatNotu, setSevkiyatNotu] = useState('');
  const [shipmentAmounts, setShipmentAmounts] = useState<Record<string, string>>({});

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
        {t('admin.erp.satisSiparisleri.detail.notFound')}{' '}
        <Link href="/admin/satis-siparisleri" className="underline">{t('admin.erp.common.goBack')}</Link>
      </div>
    );
  }

  const items   = data.items ?? [];
  const iskonto = data.musteriIskonto;

  // Toplamlar
  const araToplam = items.reduce((s, k) => s + k.miktar * k.birimFiyat, 0);
  const iskontoTutar = 0;
  const kdvToplam = items.reduce((s, k) => s + (k.miktar * k.birimFiyat * k.kdvOrani / 100), 0);
  const genelToplam = araToplam + kdvToplam;
  const uretimYuzde = data.uretimPlanlananMiktar > 0
    ? Math.min(100, Math.round((data.uretimTamamlananMiktar / data.uretimPlanlananMiktar) * 100))
    : 0;

  function openShipmentDialog() {
    const initial: Record<string, string> = {};
    for (const item of items) {
      const kalan = Math.max(0, item.miktar - item.sevkEdilenMiktar);
      initial[item.id] = kalan > 0 ? String(Number(kalan.toFixed(4))) : '0';
    }
    setShipmentAmounts(initial);
    setSevkiyatNotu('');
    setShipmentOpen(true);
  }

  async function handleShipmentCreate() {
    const kalemler = items
      .map((item) => {
        const miktar = Number(shipmentAmounts[item.id] ?? 0);
        if (!Number.isFinite(miktar) || miktar <= 0) return null;
        return {
          musteriId: data.musteriId,
          siparisId: data.id,
          siparisKalemId: item.id,
          urunId: item.urunId,
          miktar,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (kalemler.length === 0) {
      toast.error('Sevk edilecek en az bir kalem miktari giriniz.');
      return;
    }

    try {
      const result = await sevkiyatOlustur({
        kalemler,
        notlar: sevkiyatNotu.trim() || undefined,
      }).unwrap();
      toast.success(`Sevkiyat oluşturuldu: ${result.sevkiyat.sevkNo}`);
      setShipmentOpen(false);
      refetch();
    } catch {
      toast.error(t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <div className="space-y-6">
      {/* Üst bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/satis-siparisleri"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{data.siparisNo}</h1>
            <p className="text-xs text-muted-foreground">{data.siparisTarihi}</p>
          </div>
          <Badge variant={BADGE_VARIANT[data.durum]}>
            {t(`admin.erp.satisSiparisleri.statuses.${data.durum}`)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? ' animate-spin' : ''}`} />
          </Button>
          <Button size="sm" variant="outline" onClick={openShipmentDialog}>
            <Truck className="mr-1 size-4" /> Sevkiyat Oluştur
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1 size-4" /> {t('admin.erp.common.edit')}
          </Button>
        </div>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">{t('admin.erp.satisSiparisleri.columns.musteriId')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold truncate">{data.musteriAd ?? '—'}</p>
            {iskonto > 0 && <p className="text-xs text-muted-foreground">İskonto: %{NUM(iskonto, 2)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">{t('admin.erp.common.deliveryDate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{data.terminTarihi ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">{t('admin.erp.common.lineCount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Genel Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">{TRY(genelToplam)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Üretime Aktarılan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{data.uretimeAktarilanKalemSayisi}/{data.kalemSayisi} kalem</p>
            <p className="text-xs text-muted-foreground">%{uretimYuzde} ilerleme</p>
            {data.kilitli && <p className="text-xs text-amber-600">Sipariş üretime bağlı olduğu için kalemler kilitli.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Sevk Edilen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {NUM(data.sevkEdilenMiktar, 2)} / {NUM(data.toplamMiktar, 2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">KDV Toplam</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{TRY(kdvToplam)}</p>
          </CardContent>
        </Card>
      </div>

      {data.aciklama && (
        <p className="text-sm text-muted-foreground">{data.aciklama}</p>
      )}

      {/* Kalemler tablosu */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">{t('admin.erp.satisSiparisleri.detail.kalemler')}</h2>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead className="w-12">{t('admin.erp.common.row')}</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead className="text-right">Birim Fiyat</TableHead>
                <TableHead className="text-right">Sevk Edilen</TableHead>
                <TableHead className="text-right">Kalan</TableHead>
                <TableHead className="text-right">Ara Toplam</TableHead>
                <TableHead className="text-right">İskonto</TableHead>
                <TableHead className="text-right">İsk. Tutarı</TableHead>
                <TableHead className="text-right">KDV</TableHead>
                <TableHead className="text-right">KDV Tutarı</TableHead>
                <TableHead className="text-right">Satır Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="py-10 text-center text-sm text-muted-foreground">
                    {t('admin.erp.common.noItems')}
                  </TableCell>
                </TableRow>
              )}
              {[...items].sort((a, b) => a.sira - b.sira).map((k) => (
                <KalemRow key={k.id} k={k} iskonto={iskonto} />
              ))}
            </TableBody>
            {items.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-semibold">Ara Toplam</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{TRY(araToplam)}</TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
                {iskonto > 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-right font-semibold text-destructive">
                      Müşteri İskontosu (%{NUM(iskonto, 2)})
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-destructive">
                      Satır fiyatlarına yansıtıldı
                    </TableCell>
                    <TableCell colSpan={5} />
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-semibold">KDV Toplam</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{TRY(kdvToplam)}</TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell colSpan={7} className="text-right text-base font-bold">Genel Toplam</TableCell>
                  <TableCell className="text-right tabular-nums text-base font-bold">{TRY(genelToplam)}</TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      <SiparisForm open={editOpen} onClose={() => setEditOpen(false)} siparis={data} />
      <Dialog open={shipmentOpen} onOpenChange={setShipmentOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sevkiyat Oluştur</DialogTitle>
            <DialogDescription>Bu siparişten sevk edilecek kalem miktarlarını girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {items.map((item) => {
              const kalan = Math.max(0, item.miktar - item.sevkEdilenMiktar);
              return (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <div>
                    <div className="font-medium">{item.urunAd ?? item.urunId}</div>
                    <div className="text-xs text-muted-foreground">
                      Sevk edilen: {NUM(item.sevkEdilenMiktar, 2)} / Kalan: {NUM(kalan, 2)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Sevk miktarı</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.0001"
                      max={kalan}
                      value={shipmentAmounts[item.id] ?? '0'}
                      onChange={(e) => setShipmentAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
            <div className="space-y-1">
              <Label>Not</Label>
              <Input value={sevkiyatNotu} onChange={(e) => setSevkiyatNotu(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipmentOpen(false)}>İptal</Button>
            <Button onClick={handleShipmentCreate} disabled={sevkiyatState.isLoading}>
              {sevkiyatState.isLoading ? 'Oluşturuluyor...' : 'Sevkiyatı Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
