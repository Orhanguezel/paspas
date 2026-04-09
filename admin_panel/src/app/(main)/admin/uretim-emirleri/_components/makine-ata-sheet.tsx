"use client";

// =============================================================
// FILE: makine-ata-sheet.tsx
// Paspas ERP — Üretim Emrine makine atama sheet bileşeni
// =============================================================

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  // montaj opId → montajın yapılacağı makineId (sadece 2+ farklı makine seçilince aktif)
  const [montajHedef, setMontajHedef] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSecimler({});
      setMontajHedef("");
    }
  }, [open]);

  // Operasyonlara atanan benzersiz makineler
  const seciliMakineler = useMemo(() => {
    const ids = [...new Set(Object.values(secimler).filter(Boolean))];
    return ids.flatMap((id) => {
      const m = makineler.find((m) => m.id === id);
      return m ? [m] : [];
    });
  }, [secimler, makineler]);

  // Birden fazla farklı makine seçildi mi?
  const cokluMakine = seciliMakineler.length > 1;

  const isLoading = opLoading || makineLoading;
  const atanabilir = operasyonlar.some((op) => secimler[op.id]);

  async function handleAta() {
    let atanan = 0;
    for (const op of operasyonlar) {
      const makineId = secimler[op.id];
      if (!makineId) continue;
      try {
        let montajMakineId: string | undefined;
        if (op.montaj) {
          // Tek makine → o makine; çoklu → kullanıcının seçtiği (seçilmediyse bu op'un makinesi)
          montajMakineId = cokluMakine ? (montajHedef || makineId) : makineId;
        }
        await ataOperasyon({
          emirOperasyonId: op.id,
          makineId,
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

  // Montaj operasyonu var mı?
  const montajOp = operasyonlar.find((op) => op.montaj);

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
                      {op.montaj && (
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
                  </div>
                ))}

              {/* Montaj yeri — montaj operasyonu varsa ve en az bir makine seçilmişse göster */}
              {montajOp && seciliMakineler.length > 0 && (
                <div className="border rounded-md p-3 space-y-2 bg-amber-50 border-amber-200">
                  <Label className="text-xs font-medium text-amber-800">
                    Montaj nerede yapılacak?
                  </Label>

                  {seciliMakineler.length === 1 ? (
                    /* Tek makine — otomatik, sadece bilgi */
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        <span className="font-mono font-semibold">{seciliMakineler[0].kod}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{seciliMakineler[0].ad}</span>
                      </span>
                      <Switch checked disabled />
                    </div>
                  ) : (
                    /* Birden fazla makine — kullanıcı seçer */
                    <div className="flex flex-col gap-2">
                      {seciliMakineler.map((m) => (
                        <div key={m.id} className="flex items-center justify-between">
                          <span className="text-sm">
                            <span className="font-mono font-semibold">{m.kod}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{m.ad}</span>
                          </span>
                          <Switch
                            checked={montajHedef === m.id}
                            onCheckedChange={(checked) => setMontajHedef(checked ? m.id : "")}
                          />
                        </div>
                      ))}
                      {!montajHedef && (
                        <p className="text-[11px] text-amber-700">
                          Seçilmezse montaj operasyonunun makinesi kullanılır.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
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
