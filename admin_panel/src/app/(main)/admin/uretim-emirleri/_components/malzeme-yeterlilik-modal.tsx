"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Package, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useGetHammaddeYeterlilikAdminQuery } from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";

interface Props {
  emirId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function MalzemeYeterlilikModal({ emirId, onOpenChange }: Props) {
  const { t } = useLocaleContext();
  const { data, isLoading } = useGetHammaddeYeterlilikAdminQuery(emirId ?? "", {
    skip: !emirId,
  });

  const items = data?.items ?? [];

  return (
    <Dialog open={!!emirId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            {t("admin.erp.uretimEmirleri.malzemeYeterlilik.title") || "Malzeme Yeterlilik Analizi"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              {t("admin.erp.uretimEmirleri.malzemeYeterlilik.empty") || "Bu üretim emri için hammadde gereksinimi bulunamadı."}
            </div>
          ) : (
            <>
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${data?.yeterli ? "bg-emerald-50 border-emerald-100" : "bg-destructive/5 border-destructive/10"}`}>
                {data?.yeterli ? (
                  <>
                    <CheckCircle2 className="size-6 text-emerald-600" />
                    <div>
                      <div className="font-bold text-emerald-900">Tüm Malzemeler Yeterli</div>
                      <div className="text-sm text-emerald-700">Kuyruktaki öncelikli işler sonrası serbest stok bu emri karşılamaya yetiyor.</div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="size-6 text-destructive" />
                    <div>
                      <div className="font-bold text-destructive">Eksik Malzeme Tespit Edildi</div>
                      <div className="text-sm text-destructive/80">Bazı kalemler kuyruk sıralamasına göre serbest stoktan karşılanamıyor.</div>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-16">Görsel</TableHead>
                      <TableHead>Malzeme</TableHead>
                      <TableHead className="text-right">Gerekli</TableHead>
                      <TableHead className="text-right">Toplam Stok</TableHead>
                      <TableHead className="text-right">Öncelikli Rezerve</TableHead>
                      <TableHead className="text-right">Serbest Stok</TableHead>
                      <TableHead className="text-right">Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((m) => (
                      <TableRow key={m.urunId} className={m.eksikMiktar > 0 ? "bg-destructive/5" : undefined}>
                        <TableCell>
                          <div className="size-10 rounded border bg-slate-50 flex items-center justify-center overflow-hidden">
                            {m.urunGorsel ? (
                              <img src={m.urunGorsel} alt={m.urunAd || ""} className="size-full object-contain p-0.5" />
                            ) : (
                              <Package className="size-5 text-slate-300" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm leading-tight">{m.urunAd}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{m.urunKod}</div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm tabular-nums">
                          {m.gerekliMiktar.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-slate-600">
                          {m.toplamStok.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-amber-600 italic">
                          -{m.rezerveKuyruk.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className={`text-right font-bold text-sm tabular-nums ${m.kalanSerbest < m.gerekliMiktar ? "text-destructive" : "text-emerald-600"}`}>
                          {m.kalanSerbest.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.eksikMiktar > 0 ? (
                            <Badge variant="destructive" className="whitespace-nowrap">
                              Eksik: {m.eksikMiktar.toLocaleString("tr-TR")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Yeterli
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-slate-50 p-3 rounded border border-slate-100">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                <p>
                  <b>Analiz Mantığı:</b> Bu tablo, mevcut üretim emrinin <b>Planlanan Bitiş</b> tarihine göre kuyruktaki sırasını baz alır. 
                  Sizden önce bitmesi planlanan diğer iş emirlerinin rezerve ettiği miktarlar toplam stoktan düşülerek "Serbest Stok" hesaplanır.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
