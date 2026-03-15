'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useGetMalKabulAdminQuery, useUpdateMalKabulAdminMutation } from '@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints';
import {
  KAYNAK_TIPI_LABELS,
  KAYNAK_TIPI_BADGE,
  KALITE_DURUMU_LABELS,
  KALITE_DURUMU_BADGE,
} from '@/integrations/shared/erp/mal_kabul.types';

interface Props {
  id: string;
}

const KALITE_OPTIONS = [
  { value: 'bekliyor', label: 'Onay Bekliyor' },
  { value: 'kabul', label: 'Kabul' },
  { value: 'red', label: 'Red' },
  { value: 'kosullu', label: 'Koşullu' },
] as const;

export default function MalKabulDetayClient({ id }: Props) {
  const router = useRouter();
  const { data, isLoading } = useGetMalKabulAdminQuery(id);
  const [updateMalKabul, updateState] = useUpdateMalKabulAdminMutation();

  const [kaliteDurumu, setKaliteDurumu] = useState('');
  const [kaliteNotu, setKaliteNotu] = useState('');
  const [partiNo, setPartiNo] = useState('');
  const [notlar, setNotlar] = useState('');
  const [edited, setEdited] = useState(false);

  // Populate form when data loads
  if (data && !edited) {
    setKaliteDurumu(data.kaliteDurumu);
    setKaliteNotu(data.kaliteNotu ?? '');
    setPartiNo(data.partiNo ?? '');
    setNotlar(data.notlar ?? '');
    setEdited(true);
  }

  async function handleSave() {
    try {
      await updateMalKabul({
        id,
        body: {
          kaliteDurumu: kaliteDurumu || undefined,
          kaliteNotu: kaliteNotu.trim() || undefined,
          partiNo: partiNo.trim() || undefined,
          notlar: notlar.trim() || undefined,
        },
      }).unwrap();
      toast.success('Kayıt güncellendi');
      router.push('/admin/mal-kabul');
    } catch (error: unknown) {
      const msg = (error as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast.error(msg ?? 'Güncelleme başarısız');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/mal-kabul">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Mal Kabul
          </Button>
        </Link>
        <p className="text-muted-foreground">Kayıt bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/mal-kabul">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Mal Kabul
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Mal Kabul Detayı</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bilgi kartı */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-primary" />
              Ürün ve Kaynak Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <InfoRow label="Ürün" value={data.urunAd ?? data.urunId} />
              <InfoRow label="Ürün Kodu" value={<span className="font-mono">{data.urunKod ?? '—'}</span>} />
              <InfoRow
                label="Kaynak Tipi"
                value={
                  <Badge variant={KAYNAK_TIPI_BADGE[data.kaynakTipi] ?? 'outline'}>
                    {KAYNAK_TIPI_LABELS[data.kaynakTipi] ?? data.kaynakTipi}
                  </Badge>
                }
              />
              <InfoRow
                label="Kalite Durumu"
                value={
                  <Badge variant={KALITE_DURUMU_BADGE[data.kaliteDurumu] ?? 'outline'}>
                    {KALITE_DURUMU_LABELS[data.kaliteDurumu] ?? data.kaliteDurumu}
                  </Badge>
                }
              />
              <InfoRow
                label="Gelen Miktar"
                value={
                  <span className="font-semibold text-green-600">
                    +{data.gelenMiktar.toFixed(4).replace(/\.?0+$/, '')}
                    {data.urunBirim ? <span className="ml-1 text-xs font-normal text-muted-foreground">{data.urunBirim}</span> : null}
                  </span>
                }
              />
              <InfoRow label="Parti No" value={data.partiNo ?? '—'} />
              <InfoRow label="Tedarikçi" value={data.tedarikciAd ?? '—'} />
              <InfoRow label="Operatör" value={data.operatorName ?? '—'} />
              {data.satinAlmaSiparisId && (
                <InfoRow
                  label="Satın Alma Siparişi"
                  value={
                    <Link
                      href={`/admin/satin-alma/${data.satinAlmaSiparisId}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Siparişe Git
                    </Link>
                  }
                />
              )}
              <InfoRow label="Kabul Tarihi" value={data.kabulTarihi.slice(0, 16).replace('T', ' ')} />
              <InfoRow label="Kayıt Tarihi" value={data.createdAt.slice(0, 16).replace('T', ' ')} />
            </div>
            {data.notlar && (
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Notlar</p>
                <p className="mt-1 text-sm">{data.notlar}</p>
              </div>
            )}
            {data.kaliteNotu && (
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Kalite Notu</p>
                <p className="mt-1 text-sm">{data.kaliteNotu}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Düzenleme kartı */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Güncelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
              {kaliteDurumu === 'red' && kaliteDurumu !== data.kaliteDurumu && (
                <p className="text-xs text-destructive">Stok düşülecek</p>
              )}
              {kaliteDurumu !== 'red' && data.kaliteDurumu === 'red' && (
                <p className="text-xs text-emerald-600">Stok artacak</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Parti No</Label>
              <Input value={partiNo} onChange={(e) => setPartiNo(e.target.value)} maxLength={64} />
            </div>

            <div className="space-y-1">
              <Label>Kalite Notu</Label>
              <Input value={kaliteNotu} onChange={(e) => setKaliteNotu(e.target.value)} maxLength={500} />
            </div>

            <div className="space-y-1">
              <Label>Notlar</Label>
              <Textarea rows={3} value={notlar} onChange={(e) => setNotlar(e.target.value)} maxLength={500} />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={updateState.isLoading}>
              <Save className="mr-2 size-4" />
              {updateState.isLoading ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
