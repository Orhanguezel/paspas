'use client';

import { useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useLocaleContext } from '@/i18n/LocaleProvider';

import { useCreateMalKabulAdminMutation } from '@/integrations/endpoints/admin/erp/mal_kabul_admin.endpoints';
import { useListSatinAlmaAdminQuery, useGetSatinAlmaAdminQuery } from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
import { useListUrunlerAdminQuery } from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
import { SATIN_ALMA_DURUM_LABELS, SATIN_ALMA_DURUM_BADGE } from '@/integrations/shared/erp/satin_alma.types';

const KAYNAK_OPTIONS = [
  { value: 'satin_alma', label: 'Satın Alma' },
  { value: 'fason', label: 'Fason' },
  { value: 'hammadde', label: 'Hammadde' },
  { value: 'yari_mamul', label: 'Yarı Mamul' },
  { value: 'iade', label: 'İade' },
  { value: 'diger', label: 'Diğer' },
] as const;

const KALITE_OPTIONS = [
  { value: 'kabul', label: 'Kabul' },
  { value: 'red', label: 'Red' },
  { value: 'kosullu', label: 'Koşullu' },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateMalKabulSheet({ open, onClose }: Props) {
  const { t } = useLocaleContext();
  const [createMalKabul, createState] = useCreateMalKabulAdminMutation();

  // Step 1: kaynak tipi
  const [kaynakTipi, setKaynakTipi] = useState('satin_alma');

  // SA flow state
  const [selectedSiparisId, setSelectedSiparisId] = useState('');
  const [selectedKalemId, setSelectedKalemId] = useState('');

  // Free flow state (non-SA)
  const [freeUrunId, setFreeUrunId] = useState('');
  const [freeUrunSearch, setFreeUrunSearch] = useState('');

  // Common fields
  const [gelenMiktar, setGelenMiktar] = useState('');
  const [partiNo, setPartiNo] = useState('');
  const [kaliteDurumu, setKaliteDurumu] = useState('kabul');
  const [kaliteNotu, setKaliteNotu] = useState('');
  const [notlar, setNotlar] = useState('');

  const isSatinAlma = kaynakTipi === 'satin_alma';

  // ── SA queries ──
  // Load open SA orders: onaylandi, siparis_verildi, kismen_teslim
  const saListQuery = useListSatinAlmaAdminQuery(undefined, { skip: !isSatinAlma || !open });
  const saOrders = (saListQuery.data?.items ?? []).filter((s) =>
    s.durum === 'onaylandi' || s.durum === 'siparis_verildi' || s.durum === 'kismen_teslim'
  );

  // Load selected SA order details with items
  const saDetailQuery = useGetSatinAlmaAdminQuery(selectedSiparisId, {
    skip: !isSatinAlma || !selectedSiparisId,
  });
  const saKalemler = (saDetailQuery.data?.items ?? []).filter((k) => k.kalanMiktar > 0);
  const selectedKalem = saKalemler.find((k) => k.id === selectedKalemId);

  // ── Free product query (non-SA) ──
  const urunlerQuery = useListUrunlerAdminQuery(
    { q: freeUrunSearch, limit: 50 },
    { skip: isSatinAlma || !open },
  );
  const urunler = urunlerQuery.data?.items ?? [];
  const selectedUrun = urunler.find((u) => u.id === freeUrunId);

  // Reset cascading selects
  useEffect(() => {
    setSelectedSiparisId('');
    setSelectedKalemId('');
    setFreeUrunId('');
    setGelenMiktar('');
  }, [kaynakTipi]);

  useEffect(() => {
    setSelectedKalemId('');
    setGelenMiktar('');
  }, [selectedSiparisId]);

  // Auto-fill gelenMiktar when SA kalem selected
  useEffect(() => {
    if (selectedKalem) {
      setGelenMiktar(String(selectedKalem.kalanMiktar));
    }
  }, [selectedKalem]);

  // Reset all when sheet closes
  useEffect(() => {
    if (!open) {
      setKaynakTipi('satin_alma');
      setSelectedSiparisId('');
      setSelectedKalemId('');
      setFreeUrunId('');
      setFreeUrunSearch('');
      setGelenMiktar('');
      setPartiNo('');
      setKaliteDurumu('kabul');
      setKaliteNotu('');
      setNotlar('');
    }
  }, [open]);

  async function handleSubmit() {
    const miktar = Number.parseFloat(gelenMiktar);
    if (!miktar || miktar <= 0) {
      toast.error('Geçerli bir miktar giriniz');
      return;
    }

    const urunId = isSatinAlma ? selectedKalem?.urunId : freeUrunId;
    if (!urunId) {
      toast.error('Ürün seçimi zorunludur');
      return;
    }

    try {
      await createMalKabul({
        kaynakTipi,
        ...(isSatinAlma && selectedSiparisId ? { satinAlmaSiparisId: selectedSiparisId } : {}),
        ...(isSatinAlma && selectedKalemId ? { satinAlmaKalemId: selectedKalemId } : {}),
        urunId,
        ...(isSatinAlma && saDetailQuery.data ? { tedarikciId: saDetailQuery.data.tedarikciId } : {}),
        gelenMiktar: miktar,
        ...(partiNo.trim() ? { partiNo: partiNo.trim() } : {}),
        kaliteDurumu,
        ...(kaliteNotu.trim() ? { kaliteNotu: kaliteNotu.trim() } : {}),
        ...(notlar.trim() ? { notlar: notlar.trim() } : {}),
      }).unwrap();
      toast.success(t('admin.erp.common.created', { item: t('admin.erp.malKabul.singular') }));
      onClose();
    } catch (error: unknown) {
      const msg = (error as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast.error(msg ?? t('admin.erp.common.operationFailed'));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(state) => !state && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle className="flex items-center gap-2">
            <PackagePlus className="size-5 text-primary" />
            {t('admin.erp.malKabul.newItem')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {/* Kaynak Tipi */}
          <div className="space-y-1">
            <Label>{t('admin.erp.malKabul.columns.kaynakTipi')}</Label>
            <Select value={kaynakTipi} onValueChange={setKaynakTipi}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KAYNAK_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Satın Alma Flow ── */}
          {isSatinAlma && (
            <>
              {/* SA Sipariş Seçimi */}
              <div className="space-y-1">
                <Label>Satın Alma Siparişi</Label>
                {saListQuery.isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : saOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Açık satın alma siparişi bulunamadı
                  </p>
                ) : (
                  <Select value={selectedSiparisId || 'none'} onValueChange={(v) => setSelectedSiparisId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Sipariş seçin…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sipariş seçin…</SelectItem>
                      {saOrders.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="font-mono">{s.siparisNo}</span>
                          <span className="ml-2 text-muted-foreground">—</span>
                          <span className="ml-2">{s.tedarikciAd ?? '—'}</span>
                          <Badge variant={SATIN_ALMA_DURUM_BADGE[s.durum]} className="ml-2 text-[10px]">
                            {SATIN_ALMA_DURUM_LABELS[s.durum]}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* SA Kalem Seçimi */}
              {selectedSiparisId && (
                <div className="space-y-1">
                  <Label>Sipariş Kalemi</Label>
                  {saDetailQuery.isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : saKalemler.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Teslim alınacak kalem kalmadı
                    </p>
                  ) : (
                    <Select value={selectedKalemId || 'none'} onValueChange={(v) => setSelectedKalemId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Kalem seçin…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kalem seçin…</SelectItem>
                        {saKalemler.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            <span className="font-medium">{k.urunAd ?? k.urunKod ?? k.urunId}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              Kalan: {k.kalanMiktar.toFixed(2)} {k.birim ?? ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Selected kalem info */}
              {selectedKalem && (
                <div className="rounded-md border p-3 space-y-1 bg-muted/30">
                  <p className="font-medium">{selectedKalem.urunAd ?? selectedKalem.urunId}</p>
                  <p className="font-mono text-xs text-muted-foreground">{selectedKalem.urunKod ?? '—'}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                    <span>Sipariş: <strong className="text-foreground">{selectedKalem.miktar}</strong></span>
                    <span>Kabul: <strong className="text-emerald-600">{selectedKalem.kabulMiktar.toFixed(2)}</strong></span>
                    <span>Kalan: <strong className="text-orange-600">{selectedKalem.kalanMiktar.toFixed(2)}</strong></span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Free Product Flow (non-SA) ── */}
          {!isSatinAlma && (
            <div className="space-y-1">
              <Label>Ürün</Label>
              <Input
                placeholder="Ürün ara…"
                value={freeUrunSearch}
                onChange={(e) => setFreeUrunSearch(e.target.value)}
                className="mb-2"
              />
              {urunlerQuery.isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select value={freeUrunId || 'none'} onValueChange={(v) => setFreeUrunId(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Ürün seçin…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ürün seçin…</SelectItem>
                    {urunler.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="font-medium">{u.ad}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{u.kod}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedUrun && (
                <p className="text-xs text-muted-foreground mt-1">
                  Birim: {selectedUrun.birim} · Stok: {selectedUrun.stok}
                </p>
              )}
            </div>
          )}

          {/* ── Common Fields ── */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.malKabul.columns.miktar')}</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={gelenMiktar}
                onChange={(e) => setGelenMiktar(e.target.value)}
              />
              {isSatinAlma && selectedKalem && Number.parseFloat(gelenMiktar) > selectedKalem.kalanMiktar && (
                <p className="text-xs text-orange-600">Kalan miktardan fazla</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{t('admin.erp.malKabul.columns.partiNo')}</Label>
              <Input value={partiNo} onChange={(e) => setPartiNo(e.target.value)} maxLength={64} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('admin.erp.malKabul.columns.kaliteDurumu')}</Label>
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
            {createState.isLoading ? 'Kaydediliyor…' : t('admin.erp.malKabul.newItem')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
