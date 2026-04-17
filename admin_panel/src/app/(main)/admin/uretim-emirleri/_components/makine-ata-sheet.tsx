"use client";

// =============================================================
// FILE: makine-ata-sheet.tsx
// Paspas ERP — Üretim Emrine makine atama sheet bileşeni
// =============================================================

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAtaOperasyonAdminMutation,
  useListAtanmamisAdminQuery,
  useListMakinelerAdminQuery,
} from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";

interface Props {
  emirId: string | null;
  emirNo: string;
  open: boolean;
  onClose: () => void;
}

export function MakineAtaSheet({ emirId, emirNo, open, onClose }: Props) {
  const { data: atanmamisler = [], isLoading: opLoading } = useListAtanmamisAdminQuery(undefined, { skip: !open });
  const { data: makinelerData, isLoading: makineLoading } = useListMakinelerAdminQuery({}, { skip: !open });
  const [ataOperasyon, { isLoading: ataliyor }] = useAtaOperasyonAdminMutation();

  const operasyonlar = atanmamisler.filter((o) => o.uretimEmriId === emirId);
  const makineler = makinelerData?.items ?? [];

  // opId → makineId
  const [secimler, setSecimler] = useState<Record<string, string>>({});
  // Çift taraflı üretimde montaj hangi operasyonda yapılacak?
  const [montajOpId, setMontajOpId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSecimler({});
      setMontajOpId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || operasyonlar.length <= 1) {
      setMontajOpId(null);
      return;
    }
    setMontajOpId((prev) => {
      if (prev && operasyonlar.some((op) => op.id === prev)) return prev;
      const mevcutMontaj = operasyonlar.find((op) => op.montaj);
      return mevcutMontaj?.id ?? operasyonlar[0]?.id ?? null;
    });
  }, [open, operasyonlar]);

  const isLoading = opLoading || makineLoading;
  const atanabilir = operasyonlar.some((op) => secimler[op.id]);

  async function handleAta() {
    let atanan = 0;
    for (const op of operasyonlar) {
      const makineId = secimler[op.id];
      if (!makineId) continue;
      try {
        const montajMakineId = montajOpId ? secimler[montajOpId] : undefined;
        await ataOperasyon({
          emirOperasyonId: op.id,
          makineId,
          montaj: operasyonlar.length > 1 ? op.id === montajOpId : op.montaj,
          ...(montajMakineId ? { montajMakineId } : {}),
        }).unwrap();
        atanan++;
      } catch {
        toast.error(`${op.operasyonAdi} operasyonu atanamadı.`);
      }
    }
    if (atanan > 0) {
      toast.success(`${atanan} operasyon makineye atandı.`);
      onClose();
    }
  }

  const ciftTarafli = operasyonlar.length > 1;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Makine Ata — {emirNo}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : operasyonlar.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Bu emrin atanmamış operasyonu bulunmuyor.
            </p>
          ) : (
            <>
              {/* Operasyon → Makine seçimleri */}
              {operasyonlar
                .slice()
                .sort((a, b) => a.sira - b.sira)
                .map((op) => (
                  <div key={op.id} className="space-y-2 border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{op.operasyonAdi}</span>
                      {(ciftTarafli ? montajOpId === op.id : op.montaj) && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                          Montaj
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Makine *</Label>
                      {(() => {
                        // Kalıbı olan operasyonlar için sadece uyumlu makineleri göster
                        const uyumluMakineler = op.kalipId
                          ? makineler.filter((m) => m.kalipIds.includes(op.kalipId!))
                          : makineler;
                        const tumListe = uyumluMakineler.length > 0 ? uyumluMakineler : makineler;
                        const kisitliVar = op.kalipId && uyumluMakineler.length > 0 && uyumluMakineler.length < makineler.length;
                        return (
                          <>
                            <Select
                              value={secimler[op.id] ?? "_none_"}
                              onValueChange={(v) =>
                                setSecimler((p) => ({ ...p, [op.id]: v === "_none_" ? "" : v }))
                              }
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Makine seçin…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none_" className="text-sm text-muted-foreground">
                                  Seçin…
                                </SelectItem>
                                {tumListe.map((m) => (
                                  <SelectItem key={m.id} value={m.id} className="text-sm">
                                    <span className="font-mono font-medium">{m.kod}</span>
                                    <span className="text-muted-foreground ml-2">{m.ad}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {kisitliVar && (
                              <p className="text-[11px] text-amber-700">
                                Bu kalıpla uyumlu {uyumluMakineler.length} makine gösteriliyor.
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {ciftTarafli && (
                      <button
                        type="button"
                        className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
                          montajOpId === op.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted bg-muted/20 text-muted-foreground"
                        }`}
                        onClick={() => setMontajOpId(op.id)}
                      >
                        <span className={`flex size-3.5 items-center justify-center rounded-full border-2 ${
                          montajOpId === op.id ? "border-primary" : "border-muted-foreground/40"
                        }`}>
                          {montajOpId === op.id && <span className="size-2 rounded-full bg-primary" />}
                        </span>
                        <span className="whitespace-nowrap">Bu tarafta montaj var</span>
                      </button>
                    )}
                  </div>
                ))}
            </>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={ataliyor}>
            İptal
          </Button>
          <Button onClick={handleAta} disabled={ataliyor || !atanabilir || isLoading}>
            {ataliyor ? "Atanıyor…" : "Makineye Ata"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
