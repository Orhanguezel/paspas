'use client';

// =============================================================
// FILE: src/app/(main)/admin/satis-siparisleri/_components/siparis-detay-client.tsx
// Paspas ERP — Sipariş detay sayfası
// =============================================================

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, RefreshCcw, Pencil, Truck } from 'lucide-react';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { useGetSatisSiparisiAdminQuery } from '@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints';
import type { SiparisDurum, SiparisKalemDto } from '@/integrations/shared/erp/satis_siparisleri.types';
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

const TRY = (n: number): string => n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
const NUM = (n: number, d = 4): string => n.toLocaleString('tr-TR', { maximumFractionDigits: d });

// ── Simple kalem row ─────────────────────────────────────────
function KalemRow({ k }: { k: SiparisKalemDto }) {
  const araToplam   = k.miktar * k.birimFiyat;
  const kdvTutar    = araToplam * k.kdvOrani / 100;
  const satirToplam = araToplam + kdvTutar;
  const uretimKalan = Math.max(0, k.miktar - k.uretilenMiktar);
  const sevkKalan   = Math.max(0, k.miktar - k.sevkEdilenMiktar);

  return (
    <TableRow>
      <TableCell>{k.sira}</TableCell>
      <TableCell>
        <div className="font-medium">{k.urunAd ?? k.urunId}</div>
        {k.urunKod && <div className="text-xs text-muted-foreground">{k.urunKod}</div>}
      </TableCell>
      <TableCell className="text-right tabular-nums">{NUM(k.miktar)}</TableCell>
      <TableCell className="text-right tabular-nums">{TRY(k.birimFiyat)}</TableCell>
      <TableCell className="text-right tabular-nums">{NUM(k.uretilenMiktar, 2)}</TableCell>
      <TableCell className="text-right tabular-nums">{NUM(uretimKalan, 2)}</TableCell>
      <TableCell className="text-right tabular-nums">{NUM(k.sevkEdilenMiktar, 2)}</TableCell>
      <TableCell className="text-right tabular-nums">{NUM(sevkKalan, 2)}</TableCell>
      <TableCell className="text-right tabular-nums font-semibold">{TRY(satirToplam)}</TableCell>
    </TableRow>
  );
}

// ── Main detail component ────────────────────────────────────
export default function SiparisDetayClient({ id }: { id: string }) {
  const { t } = useLocaleContext();
  const { data, isLoading, refetch, isFetching } = useGetSatisSiparisiAdminQuery(id);
  const [editOpen, setEditOpen] = useState(false);

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
  // birimFiyat zaten iskontolu fiyat. Baz fiyatı (iskontosuz) geriye hesapla:
  const iskontoluToplam = items.reduce((s, k) => s + k.miktar * k.birimFiyat, 0);
  const araToplam = iskonto > 0
    ? items.reduce((s, k) => s + k.miktar * (k.birimFiyat / (1 - iskonto / 100)), 0)
    : iskontoluToplam;
  const iskontoTutar = araToplam - iskontoluToplam;
  const kdvToplam = items.reduce((s, k) => s + (k.miktar * k.birimFiyat * k.kdvOrani / 100), 0);
  const genelToplam = iskontoluToplam + kdvToplam;
  const uretimYuzde = data.uretimPlanlananMiktar > 0
    ? Math.min(100, Math.round((data.uretimTamamlananMiktar / data.uretimPlanlananMiktar) * 100))
    : 0;

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
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/sevkiyat"><Truck className="mr-1 size-4" /> Sevkiyat</Link>
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1 size-4" /> {t('admin.erp.common.edit')}
          </Button>
        </div>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">{t('admin.erp.satisSiparisleri.columns.musteriId')}</p>
          <p className="font-semibold truncate">{data.musteriAd ?? '—'}</p>
          {iskonto > 0 && <p className="text-xs text-muted-foreground">İsk. %{NUM(iskonto, 2)}</p>}
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">{t('admin.erp.common.deliveryDate')}</p>
          <p className="font-semibold">{data.terminTarihi ?? '—'}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Genel Toplam</p>
          <p className="text-lg font-semibold tabular-nums">{TRY(genelToplam)}</p>
          <p className="text-xs text-muted-foreground">KDV dahil {TRY(kdvToplam)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Üretim Durumu</p>
          <Badge variant={URETIM_DURUMU_BADGE[data.uretimDurumu]} className="mt-1">
            {URETIM_DURUMU_LABELS[data.uretimDurumu]}
          </Badge>
          <p className="mt-1 text-xs text-muted-foreground">%{uretimYuzde} tamamlandı</p>
          {data.kilitli && <p className="text-xs text-amber-600">Kalemler kilitli</p>}
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Sevk Durumu</p>
          <Badge variant={SEVK_DURUMU_BADGE[data.sevkDurumu]} className="mt-1">
            {SEVK_DURUMU_LABELS[data.sevkDurumu]}
          </Badge>
          <p className="mt-1 text-xs text-muted-foreground">
            {NUM(data.sevkEdilenMiktar, 2)} / {NUM(data.toplamMiktar, 2)}
          </p>
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
                <TableHead className="w-12">{t('admin.erp.common.row')}</TableHead>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead className="text-right">Birim Fiyat</TableHead>
                <TableHead className="text-right">Üretilen</TableHead>
                <TableHead className="text-right">Ürt. Kalan</TableHead>
                <TableHead className="text-right">Sevk Edilen</TableHead>
                <TableHead className="text-right">Sevk Kalan</TableHead>
                <TableHead className="text-right">Satır Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    {t('admin.erp.common.noItems')}
                  </TableCell>
                </TableRow>
              )}
              {[...items].sort((a, b) => a.sira - b.sira).map((k) => (
                <KalemRow key={k.id} k={k} />
              ))}
            </TableBody>
            {items.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8} className="text-right font-semibold">Ara Toplam</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{TRY(araToplam)}</TableCell>
                </TableRow>
                {iskontoTutar > 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-right font-semibold text-green-600">
                      İskonto (%{NUM(iskonto, 2)})
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-green-600">
                      -{TRY(iskontoTutar)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={8} className="text-right font-semibold">KDV</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{TRY(kdvToplam)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell colSpan={8} className="text-right text-base font-bold">Genel Toplam</TableCell>
                  <TableCell className="text-right tabular-nums text-base font-bold">{TRY(genelToplam)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
        {iskonto > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Müşteri İskontosu (%{NUM(iskonto, 2)}) — Satır fiyatlarına yansıtılmıştır.
          </p>
        )}
      </div>

      <SiparisForm open={editOpen} onClose={() => setEditOpen(false)} siparis={data} />
    </div>
  );
}
