"use client";

import Link from "next/link";

import { AlertTriangle, ArrowRight, Factory, Package, Timer, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetVardiyaAnaliziAdminQuery } from "@/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDk(dk: number) {
  if (dk <= 0) return "0dk";
  const h = Math.floor(dk / 60);
  const m = dk % 60;
  if (h === 0) return `${m}dk`;
  if (m === 0) return `${h}sa`;
  return `${h}sa ${m}dk`;
}

export default function VardiyaOzetWidget() {
  const { data, isLoading } = useGetVardiyaAnaliziAdminQuery(
    { tarih: todayIso() },
    { pollingInterval: 120000 },
  );

  const ozet = data?.ozet;
  const makineler = data?.makineler ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Timer className="size-4" />
            Bugünkü Vardiya Özeti
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/vardiya-analizi">
              Detay <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !ozet ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="space-y-4">
            {/* Global Özet — Daha kompakt */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-b pb-3">
              <div className="flex items-center gap-1.5">
                <Package className="size-3.5" />
                <span>Toplam: <span className="font-semibold text-foreground">{ozet.toplamUretim.toLocaleString("tr-TR")}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" />
                <span>Duruş: <span className="font-semibold text-foreground">%{Math.round(ozet.durusOrani * 100)}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Factory className="size-3.5" />
                <span>OEE: <span className="font-semibold text-foreground">{ozet.oee === null ? "—" : `%${Math.round(ozet.oee * 100)}`}</span></span>
              </div>
            </div>

            {/* Makineler Tablosu */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Makine</th>
                    <th className="pb-2 text-right font-medium">Üretim</th>
                    <th className="pb-2 text-right font-medium">OEE / Hedef</th>
                    <th className="pb-2 text-right font-medium">Duruş</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {makineler.map((m) => (
                    <tr key={m.makineId} className="group">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${m.aktifVardiya ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                          <span className="font-medium">{m.makineAd}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {m.toplamUretim.toLocaleString("tr-TR")}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-primary">{m.oee === null ? "—" : `%${Math.round(m.oee * 100)}`}</span>
                          {m.hedefGerceklesmeYuzde !== null && (
                            <span className="text-[10px] text-muted-foreground">Hedef: %{m.hedefGerceklesmeYuzde}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {formatDk(m.durusToplamDk)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Uyarılar/Badge'ler alt kısımda */}
            {(ozet.arizaSayisi > 0 || ozet.kalipDegisimSayisi > 0) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {ozet.arizaSayisi > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    <AlertTriangle className="mr-1 size-3" />
                    {ozet.arizaSayisi} Arıza
                  </Badge>
                )}
                {ozet.kalipDegisimSayisi > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    <Wrench className="mr-1 size-3" />
                    {ozet.kalipDegisimSayisi} Kalıp
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
