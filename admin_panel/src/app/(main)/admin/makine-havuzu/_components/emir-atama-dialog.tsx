'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useAtaOperasyonAdminMutation,
  useListMakinelerAdminQuery,
} from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { useLazyCheckHammaddeAdminQuery } from '@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints';
import { useListUyumluMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import type { AtanmamisEmirDto } from '@/integrations/shared/erp/makine_havuzu.types';
import type { HammaddeUyari } from '@/integrations/shared/erp/uretim_emirleri.types';

interface EmirAtamaDialogProps {
  emir: AtanmamisEmirDto | null;
  onClose: () => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export default function EmirAtamaDialog({ emir, onClose, t }: EmirAtamaDialogProps) {
  const { data: makineData } = useListMakinelerAdminQuery({});
  const [ata, ataState] = useAtaOperasyonAdminMutation();
  const [checkHammadde] = useLazyCheckHammaddeAdminQuery();

  // Per-operation machine selections: { operasyonId: makineId }
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Which operation carries the montaj (only relevant for multi-op / çift taraflı)
  const [montajOpId, setMontajOpId] = useState<string | null>(null);

  // Hammadde uyarı onay dialog state
  const [hammaddeUyarilar, setHammaddeUyarilar] = useState<HammaddeUyari[]>([]);
  const [showHammaddeOnay, setShowHammaddeOnay] = useState(false);

  // Collect unique kalipIds from all operations
  const kalipIds = emir?.operasyonlar
    .map((op) => op.kalipId)
    .filter((id): id is string => id !== null) ?? [];
  const firstKalipId = kalipIds[0] ?? '';

  const { data: uyumluMakineIds } = useListUyumluMakinelerAdminQuery(firstKalipId, {
    skip: !firstKalipId,
  });

  // Reset selections & montaj when emir changes
  useEffect(() => {
    if (emir) {
      const init: Record<string, string> = {};
      for (const op of emir.operasyonlar) {
        init[op.id] = 'none';
      }
      setSelections(init);
      // Default montaj to first operation (only meaningful for multi-op)
      setMontajOpId(emir.operasyonlar.length > 1 ? emir.operasyonlar[0].id : null);
    }
  }, [emir]);

  const allMakineler = (makineData?.items ?? []).filter((m) => m.isActive);

  function getFilteredMakineler(kalipId: string | null) {
    if (!kalipId) return allMakineler;
    if (!uyumluMakineIds?.length) return [];
    return allMakineler.filter((m) => uyumluMakineIds.includes(m.id));
  }

  const allSelected = emir?.operasyonlar.every((op) => selections[op.id] && selections[op.id] !== 'none') ?? false;

  async function doAta() {
    if (!emir || !allSelected) return;
    const isMultiOp = emir.operasyonlar.length > 1;
    const montajMakineId = isMultiOp && montajOpId ? selections[montajOpId] : undefined;
    try {
      for (const op of emir.operasyonlar) {
        await ata({
          emirOperasyonId: op.id,
          makineId: selections[op.id],
          ...(montajMakineId ? { montajMakineId } : {}),
        }).unwrap();
      }
      toast.success(t('kuyrukYonetimi.atama.basarili'));
      onClose();
    } catch {
      toast.error(t('kuyrukYonetimi.atama.hata'));
    }
  }

  async function handleAta() {
    if (!emir || !allSelected) return;
    try {
      const result = await checkHammadde(emir.uretimEmriId).unwrap();
      if (!result.yeterli) {
        setHammaddeUyarilar(result.uyarilar);
        setShowHammaddeOnay(true);
        return;
      }
    } catch {
      // Kontrol başarısız olursa yine de devam et
    }
    await doAta();
  }

  function handleHammaddeOnay() {
    setShowHammaddeOnay(false);
    setHammaddeUyarilar([]);
    doAta();
  }

  const isSingleOp = emir?.operasyonlar.length === 1;

  return (
    <Dialog open={!!emir} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('kuyrukYonetimi.atama.title')}</DialogTitle>
          <DialogDescription>
            {emir?.emirNo} — {emir?.urunKod} {emir?.urunAd}
          </DialogDescription>
        </DialogHeader>

        {emir && (
          <div className="space-y-4">
            {/* Emir info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">{t('kuyrukYonetimi.atanmamis.miktar')}</div>
              <div className="font-mono">{emir.planlananMiktar.toLocaleString('tr-TR')}</div>
              {emir.terminTarihi && (
                <>
                  <div className="text-muted-foreground">{t('kuyrukYonetimi.atanmamis.terminTarihi')}</div>
                  <div>{emir.terminTarihi}</div>
                </>
              )}
            </div>

            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              {t('kuyrukYonetimi.atama.uyumlulukBilgi')}
            </div>

            {/* Machine selectors per operation */}
            {emir.operasyonlar.map((op) => {
              const makineler = getFilteredMakineler(op.kalipId);
              return (
                <div key={op.id}>
                  <Label className="text-xs mb-1 flex items-center gap-1.5">
                    {isSingleOp
                      ? t('kuyrukYonetimi.atama.makineSecin')
                      : (
                        <>
                          <Badge variant="outline" className="text-xs">{op.sira}</Badge>
                          {op.operasyonAdi}
                        </>
                      )}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selections[op.id] ?? 'none'}
                      onValueChange={(v) => setSelections((prev) => ({ ...prev, [op.id]: v }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t('kuyrukYonetimi.atama.makineSecin')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('kuyrukYonetimi.atama.makineSecin')}</SelectItem>
                        {makineler.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.kod} — {m.ad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Montaj radio — sadece çift taraflı emirlerde göster */}
                    {!isSingleOp && (
                      <div
                        className={`flex items-center gap-1.5 cursor-pointer rounded-md border px-2.5 py-2 text-xs transition-colors ${montajOpId === op.id ? 'border-primary bg-primary/10 text-primary' : 'border-muted bg-muted/20 text-muted-foreground'}`}
                        onClick={() => setMontajOpId(op.id)}
                      >
                        <span className={`size-3.5 rounded-full border-2 flex items-center justify-center ${montajOpId === op.id ? 'border-primary' : 'border-muted-foreground/40'}`}>
                          {montajOpId === op.id && <span className="size-2 rounded-full bg-primary" />}
                        </span>
                        <span className="whitespace-nowrap">Montaj</span>
                      </div>
                    )}
                  </div>
                  {op.kalipId && makineler.length === 0 && (
                    <p className="mt-1 text-destructive text-xs">{t('kuyrukYonetimi.atama.uyumluMakineYok')}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('kuyrukYonetimi.atama.iptal')}
          </Button>
          <Button onClick={handleAta} disabled={!allSelected || ataState.isLoading}>
            {t('kuyrukYonetimi.atama.ata')}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Hammadde yetersizlik onay dialogu */}
      <AlertDialog open={showHammaddeOnay} onOpenChange={setShowHammaddeOnay}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hammadde Stok Yetersiz</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Aşağıdaki hammaddelerde stok yetersiz. Yine de atama yapmak istiyor musunuz?</p>
                <div className="rounded-md border bg-destructive/5 p-3 text-sm space-y-1">
                  {hammaddeUyarilar.map((u) => (
                    <div key={u.urunId} className="flex justify-between">
                      <span className="font-medium">{u.urunKod} — {u.urunAd}</span>
                      <span className="text-destructive font-mono">{u.eksikMiktar.toLocaleString('tr-TR')} eksik</span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleHammaddeOnay}>
              Yine de Ata
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
