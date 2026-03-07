'use client';

// =============================================================
// FILE: src/app/(main)/admin/urunler/_components/operasyon-makine-secici.tsx
// Per-operasyon machine selector with priority ordering
// =============================================================

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useListMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
import { useListUyumluMakinelerAdminQuery } from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
import type { OperasyonMakinePayload } from '@/integrations/shared/erp/urunler.types';

interface OperasyonMakineSeciciProps {
  kalipId: string | undefined;
  makineler: OperasyonMakinePayload[];
  onChange: (makineler: OperasyonMakinePayload[]) => void;
  disabled?: boolean;
  tForm: (key: string) => string;
}

export default function OperasyonMakineSecici({
  kalipId,
  makineler,
  onChange,
  disabled,
  tForm,
}: OperasyonMakineSeciciProps) {
  const { data: allMakineData } = useListMakinelerAdminQuery();
  const { data: uyumluIds } = useListUyumluMakinelerAdminQuery(kalipId!, { skip: !kalipId });

  const allMakineler = allMakineData?.items ?? [];

  // Filter by kalıp compatibility if kalipId is set
  const availableMakineler = useMemo(() => {
    if (!kalipId || !uyumluIds) return allMakineler.filter((m) => m.isActive);
    const uyumluSet = new Set(uyumluIds);
    return allMakineler.filter((m) => m.isActive && uyumluSet.has(m.id));
  }, [allMakineler, kalipId, uyumluIds]);

  // Machines not yet selected
  const secilebilirMakineler = useMemo(() => {
    const selectedIds = new Set(makineler.map((m) => m.makineId));
    return availableMakineler.filter((m) => !selectedIds.has(m.id));
  }, [availableMakineler, makineler]);

  function handleAdd(makineId: string) {
    if (makineId === 'none') return;
    const next = [...makineler, { makineId, oncelikSira: makineler.length + 1 }];
    onChange(next);
  }

  function handleRemove(idx: number) {
    const next = makineler.filter((_, i) => i !== idx).map((m, i) => ({ ...m, oncelikSira: i + 1 }));
    onChange(next);
  }

  function handleMove(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= makineler.length) return;
    const next = [...makineler];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((m, i) => ({ ...m, oncelikSira: i + 1 })));
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{tForm('makineKuyrugu')}</Label>

      {/* Selected machines list */}
      {makineler.length > 0 && (
        <div className="space-y-1">
          {makineler.map((m, idx) => {
            const makine = allMakineler.find((am) => am.id === m.makineId);
            return (
              <div key={m.makineId} className="flex items-center gap-1 text-xs rounded border px-2 py-1 bg-background">
                <span className="text-muted-foreground w-5 text-center font-mono">{m.oncelikSira}</span>
                <span className="flex-1 truncate">{makine ? `${makine.kod} — ${makine.ad}` : m.makineId}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={disabled || idx === 0}
                  onClick={() => handleMove(idx, -1)}
                >
                  <ArrowUp className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  disabled={disabled || idx === makineler.length - 1}
                  onClick={() => handleMove(idx, 1)}
                >
                  <ArrowDown className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive"
                  disabled={disabled}
                  onClick={() => handleRemove(idx)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add machine dropdown */}
      {secilebilirMakineler.length > 0 && (
        <Select value="none" onValueChange={handleAdd} disabled={disabled}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={tForm('makineEkle')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{tForm('makineEkle')}</SelectItem>
            {secilebilirMakineler.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.kod} — {m.ad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {kalipId && uyumluIds && availableMakineler.length === 0 && (
        <p className="text-xs text-muted-foreground">{tForm('uyumluMakineYok')}</p>
      )}
    </div>
  );
}
