'use client';

// =============================================================
// FILE: src/app/(main)/admin/satin-alma/[id]/_components/satin-alma-detay-client.tsx
// Paspas ERP — Satın Alma Detay + Kalem Bazlı Teslim Alma
// =============================================================

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, RefreshCcw, CheckCircle2, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import {
  useGetSatinAlmaAdminQuery,
} from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import { useCreateMalKabulAdminMutation } from '@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints';
import type { SatinAlmaKalemDto } from '@/integrations/shared/erp/satin_alma.types';
import { SATIN_ALMA_DURUM_LABELS, SATIN_ALMA_DURUM_BADGE } from '@/integrations/shared/erp/satin_alma.types';
import SatinAlmaForm from '../../_components/satin-alma-form';

interface Props { id: string; }

export default function SatinAlmaDetayClient({ id }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [teslimKalem, setTeslimKalem] = useState<SatinAlmaKalemDto | null>(null);

  const { data: siparis, isLoading, refetch } = useGetSatinAlmaAdminQuery(id);

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
  const isAutomaticOrder = siparis.aciklama?.includes('Kritik stok nedeniyle otomatik') ?? false;

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const toplamMiktar = kalemler.reduce((s, k) => s + k.miktar, 0);
  const toplamKabul = kalemler.reduce((s, k) => s + k.kabulMiktar, 0);
  const toplamKalan = kalemler.reduce((s, k) => s + k.kalanMiktar, 0);
  const kabulYuzde = toplamMiktar > 0 ? Math.min(100, Math.round((toplamKabul / toplamMiktar) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Baslik */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/satin-alma"><ArrowLeft className="size-4" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold font-mono">{siparis.siparisNo}</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Satın Alma Detayı</p>
              {isAutomaticOrder && (
                <Badge variant="secondary" className="text-[10px]">
                  Otomatik Kritik Stok
                </Badge>
              )}
            </div>
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

      {/* Siparis bilgileri + Teslim ozeti */}
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
              <span>{formatDate(siparis.siparisTarihi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Termin Tarihi</span>
              <span>{formatDate(siparis.terminTarihi)}</span>
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

        {/* Teslim Ozeti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PackageCheck className="size-4 text-green-600" />
              Teslim Alma Durumu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                Aşağıdaki kalemlerden &quot;Teslim Al&quot; butonuyla mal kabul kaydı oluşturun.
                Durum ve stok otomatik güncellenir.
              </p>
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
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {kalemler.map((k) => {
                  const isDone = k.kalanMiktar === 0 && k.kabulMiktar > 0;
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
                      <TableCell>
                        {!isDone && !isTamamlandi && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                            onClick={() => setTeslimKalem(k)}
                          >
                            <PackageCheck className="mr-1 size-3.5" />
                            Teslim Al
                          </Button>
                        )}
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
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SatinAlmaForm open={formOpen} onClose={() => setFormOpen(false)} siparis={siparis} />

      {/* Teslim Al Sheet */}
      {teslimKalem && siparis && (
        <TeslimAlSheet
          kalem={teslimKalem}
          siparisId={siparis.id}
          tedarikciId={siparis.tedarikciId}
          open={!!teslimKalem}
          onClose={() => setTeslimKalem(null)}
          onSuccess={() => { setTeslimKalem(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ─── Teslim Al Sheet ───────────────────────────────────────────

const KALITE_OPTIONS = [
  { value: 'kabul', label: 'Kabul' },
  { value: 'red', label: 'Red' },
  { value: 'kosullu', label: 'Koşullu' },
] as const;

function TeslimAlSheet({
  kalem,
  siparisId,
  tedarikciId,
  open,
  onClose,
  onSuccess,
}: {
  kalem: SatinAlmaKalemDto;
  siparisId: string;
  tedarikciId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [createMalKabul, createState] = useCreateMalKabulAdminMutation();

  const [gelenMiktar, setGelenMiktar] = useState(String(kalem.kalanMiktar));
  const [partiNo, setPartiNo] = useState('');
  const [kaliteDurumu, setKaliteDurumu] = useState('kabul');
  const [kaliteNotu, setKaliteNotu] = useState('');
  const [notlar, setNotlar] = useState('');

  async function handleSubmit() {
    const miktar = Number.parseFloat(gelenMiktar);
    if (!miktar || miktar <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    try {
      await createMalKabul({
        kaynakTipi: 'satin_alma',
        satinAlmaSiparisId: siparisId,
        satinAlmaKalemId: kalem.id,
        urunId: kalem.urunId,
        tedarikciId,
        gelenMiktar: miktar,
        ...(partiNo.trim() ? { partiNo: partiNo.trim() } : {}),
        kaliteDurumu,
        ...(kaliteNotu.trim() ? { kaliteNotu: kaliteNotu.trim() } : {}),
        ...(notlar.trim() ? { notlar: notlar.trim() } : {}),
      }).unwrap();
      toast.success(`${kalem.urunAd ?? kalem.urunKod} teslim alındı — stok güncellendi`);
      onSuccess();
    } catch (error: any) {
      toast.error(error?.data?.error?.message ?? 'Teslim alma başarısız');
    }
  }

  return (
    <Sheet open={open} onOpenChange={(state) => !state && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle className="flex items-center gap-2">
            <PackageCheck className="size-5 text-emerald-600" />
            Teslim Al
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4 sm:px-6">
          {/* Kalem bilgisi */}
          <div className="rounded-md border p-3 space-y-1 bg-muted/30">
            <p className="font-medium">{kalem.urunAd ?? kalem.urunId}</p>
            <p className="font-mono text-xs text-muted-foreground">{kalem.urunKod ?? '—'}</p>
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span>Sipariş: <strong className="text-foreground">{kalem.miktar}</strong></span>
              <span>Kabul: <strong className="text-emerald-600">{kalem.kabulMiktar.toFixed(2)}</strong></span>
              <span>Kalan: <strong className="text-orange-600">{kalem.kalanMiktar.toFixed(2)}</strong></span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Gelen Miktar</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={gelenMiktar}
                onChange={(e) => setGelenMiktar(e.target.value)}
              />
              {Number.parseFloat(gelenMiktar) > kalem.kalanMiktar && (
                <p className="text-xs text-orange-600">Kalan miktardan fazla</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Parti No</Label>
              <Input value={partiNo} onChange={(e) => setPartiNo(e.target.value)} maxLength={64} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Kalite Durumu</Label>
              <Select value={kaliteDurumu} onValueChange={setKaliteDurumu}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KALITE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Kalite Notu</Label>
              <Input value={kaliteNotu} onChange={(e) => setKaliteNotu(e.target.value)} maxLength={500} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notlar</Label>
            <Textarea rows={3} value={notlar} onChange={(e) => setNotlar(e.target.value)} maxLength={500} />
          </div>

          {kaliteDurumu === 'red' && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
              Red durumunda stok artmaz, sadece kayıt oluşturulur.
            </div>
          )}
        </div>
        <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button
            onClick={handleSubmit}
            disabled={createState.isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {createState.isLoading ? 'Kaydediliyor…' : 'Teslim Al'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
