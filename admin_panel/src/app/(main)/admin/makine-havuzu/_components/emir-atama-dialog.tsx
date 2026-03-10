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
  useAtaOperasyonAdminMutation,
  useListMakinelerAdminQuery,
} from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { useListUyumluMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import type { AtanmamisEmirDto } from '@/integrations/shared/erp/makine_havuzu.types';

interface EmirAtamaDialogProps {
  emir: AtanmamisEmirDto | null;
  onClose: () => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export default function EmirAtamaDialog({ emir, onClose, t }: EmirAtamaDialogProps) {
  const { data: makineData } = useListMakinelerAdminQuery({});
  const [ata, ataState] = useAtaOperasyonAdminMutation();

  // Per-operation machine selections: { operasyonId: makineId }
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Collect unique kalipIds from all operations
  const kalipIds = emir?.operasyonlar
    .map((op) => op.kalipId)
    .filter((id): id is string => id !== null) ?? [];
  const firstKalipId = kalipIds[0] ?? '';

  const { data: uyumluMakineIds } = useListUyumluMakinelerAdminQuery(firstKalipId, {
    skip: !firstKalipId,
  });

  // Reset selections when emir changes
  useEffect(() => {
    if (emir) {
      const init: Record<string, string> = {};
      for (const op of emir.operasyonlar) {
        init[op.id] = 'none';
      }
      setSelections(init);
    }
  }, [emir]);

  const allMakineler = (makineData?.items ?? []).filter((m) => m.isActive);

  function getFilteredMakineler(kalipId: string | null) {
    if (!kalipId) return allMakineler;
    if (!uyumluMakineIds?.length) return [];
    return allMakineler.filter((m) => uyumluMakineIds.includes(m.id));
  }

  const allSelected = emir?.operasyonlar.every((op) => selections[op.id] && selections[op.id] !== 'none') ?? false;

  async function handleAta() {
    if (!emir || !allSelected) return;
    try {
      // Assign each operation sequentially
      for (const op of emir.operasyonlar) {
        await ata({
          emirOperasyonId: op.id,
          makineId: selections[op.id],
        }).unwrap();
      }
      toast.success(t('kuyrukYonetimi.atama.basarili'));
      onClose();
    } catch {
      toast.error(t('kuyrukYonetimi.atama.hata'));
    }
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
                          {op.montaj && <Badge variant="secondary" className="text-xs">M</Badge>}
                        </>
                      )}
                  </Label>
                  <Select
                    value={selections[op.id] ?? 'none'}
                    onValueChange={(v) => setSelections((prev) => ({ ...prev, [op.id]: v }))}
                  >
                    <SelectTrigger>
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
    </Dialog>
  );
}
