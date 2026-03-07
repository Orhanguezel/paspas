"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAtaOperasyonAdminMutation,
  useListMakinelerAdminQuery,
} from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import { useListUyumluMakinelerAdminQuery } from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import type { AtanmamisOperasyonDto } from "@/integrations/shared/erp/makine_havuzu.types";

interface MakineAtamaDialogProps {
  operasyon: AtanmamisOperasyonDto | null;
  onClose: () => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export default function MakineAtamaDialog({ operasyon, onClose, t }: MakineAtamaDialogProps) {
  const { data: makineData } = useListMakinelerAdminQuery({});
  const { data: uyumluMakineIds } = useListUyumluMakinelerAdminQuery(operasyon?.kalipId ?? "", {
    skip: !operasyon?.kalipId,
  });
  const [ata, ataState] = useAtaOperasyonAdminMutation();

  const [makineId, setMakineId] = useState("none");
  const [montajMakineId, setMontajMakineId] = useState("none");

  // Reset on open
  useEffect(() => {
    if (operasyon) {
      // Auto-select first suggested machine
      const first = operasyon.onerilenMakineler[0];
      setMakineId(first?.makineId ?? "none");
      setMontajMakineId("none");
    }
  }, [operasyon]);

  const allMakineler = (makineData?.items ?? []).filter((m) => {
    if (!m.isActive) return false;
    if (!operasyon?.kalipId || !uyumluMakineIds?.length) return true;
    return uyumluMakineIds.includes(m.id);
  });

  async function handleAta() {
    if (!operasyon || makineId === "none") return;
    try {
      await ata({
        emirOperasyonId: operasyon.id,
        makineId,
        ...(operasyon.montaj && montajMakineId !== "none" ? { montajMakineId } : {}),
      }).unwrap();
      toast.success(t("kuyrukYonetimi.atama.basarili"));
      onClose();
    } catch {
      toast.error(t("kuyrukYonetimi.atama.hata"));
    }
  }

  return (
    <Dialog open={!!operasyon} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("kuyrukYonetimi.atama.title")}</DialogTitle>
          <DialogDescription>
            {operasyon?.emirNo} — {operasyon?.operasyonAdi}
          </DialogDescription>
        </DialogHeader>

        {operasyon && (
          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">{t("kuyrukYonetimi.atanmamis.urun")}</div>
              <div>
                {operasyon.urunKod} — {operasyon.urunAd}
              </div>
              <div className="text-muted-foreground">{t("kuyrukYonetimi.atanmamis.miktar")}</div>
              <div className="font-mono">{operasyon.planlananMiktar.toLocaleString("tr-TR")}</div>
              {operasyon.terminTarihi && (
                <>
                  <div className="text-muted-foreground">{t("kuyrukYonetimi.atanmamis.terminTarihi")}</div>
                  <div>{operasyon.terminTarihi}</div>
                </>
              )}
            </div>

            {/* Suggested machines */}
            {operasyon.onerilenMakineler.length > 0 && (
              <div>
                <Label className="text-xs mb-1 block">{t("kuyrukYonetimi.atama.onerilenMakineler")}</Label>
                <div className="flex flex-wrap gap-1">
                  {operasyon.onerilenMakineler.map((m) => (
                    <Badge
                      key={m.makineId}
                      variant={makineId === m.makineId ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setMakineId(m.makineId)}
                    >
                      {m.oncelikSira}. {m.makineKod} — {m.makineAd}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Machine select */}
            <div>
              <Label className="text-xs mb-1 block">{t("kuyrukYonetimi.atama.makineSecin")}</Label>
              <Select value={makineId} onValueChange={setMakineId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("kuyrukYonetimi.atama.makineSecin")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("kuyrukYonetimi.atama.makineSecin")}</SelectItem>
                  {allMakineler.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.kod} — {m.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Montaj machine select (only if montaj flag) */}
            {operasyon.montaj && (
              <div>
                <Label className="text-xs mb-1 block">{t("kuyrukYonetimi.atama.montajMakine")}</Label>
                <Select value={montajMakineId} onValueChange={setMontajMakineId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("kuyrukYonetimi.atama.ayniMakine")}</SelectItem>
                    {allMakineler
                      .filter((m) => m.id !== makineId)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.kod} — {m.ad}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("kuyrukYonetimi.atama.iptal")}
          </Button>
          <Button onClick={handleAta} disabled={makineId === "none" || ataState.isLoading}>
            {t("kuyrukYonetimi.atama.ata")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
