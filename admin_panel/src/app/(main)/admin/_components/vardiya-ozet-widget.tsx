"use client";

import Link from "next/link";

import { AlertTriangle, ArrowRight, Clock, Factory, Package, Timer, Wrench } from "lucide-react";

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
  const aktifMakine = makineler.filter((m) => m.aktifVardiya).length;

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
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricItem
                icon={<Package className="size-3.5" />}
                label="Üretim"
                value={ozet.toplamUretim.toLocaleString("tr-TR")}
              />
              <MetricItem
                icon={<Clock className="size-3.5" />}
                label="Çalışma"
                value={formatDk(ozet.toplamCalismaDk)}
              />
              <MetricItem
                icon={<AlertTriangle className="size-3.5 text-amber-500" />}
                label="Duruş"
                value={`${formatDk(ozet.toplamDurusDk)} (%${Math.round(ozet.durusOrani * 100)})`}
              />
              <MetricItem
                icon={<Factory className="size-3.5 text-primary" />}
                label="OEE"
                value={`%${Math.round(ozet.oee * 100)}`}
              />
            </div>

            {/* Uyarılar */}
            {(ozet.arizaSayisi > 0 || ozet.kalipDegisimSayisi > 0 || aktifMakine > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {aktifMakine > 0 && (
                  <Badge variant="default" className="text-[10px]">
                    <span className="mr-1 size-1.5 animate-pulse rounded-full bg-white" />
                    {aktifMakine} makine çalışıyor
                  </Badge>
                )}
                {ozet.arizaSayisi > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertTriangle className="mr-1 size-3" />
                    {ozet.arizaSayisi} arıza
                  </Badge>
                )}
                {ozet.kalipDegisimSayisi > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Wrench className="mr-1 size-3" />
                    {ozet.kalipDegisimSayisi} kalıp değişimi
                  </Badge>
                )}
              </div>
            )}

            {/* Makineler hızlı liste */}
            {makineler.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <div className="space-y-1">
                  {makineler.slice(0, 4).map((m) => (
                    <div key={m.makineId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {m.aktifVardiya && (
                          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                        )}
                        <span className="truncate">{m.makineAd}</span>
                      </div>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="text-muted-foreground">
                          {m.toplamUretim.toLocaleString("tr-TR")} adet
                        </span>
                        {m.hedefGerceklesmeYuzde !== null && (
                          <span
                            className={
                              m.hedefGerceklesmeYuzde >= 95
                                ? "text-emerald-600 font-semibold"
                                : m.hedefGerceklesmeYuzde >= 75
                                  ? "text-amber-600 font-semibold"
                                  : "text-destructive font-semibold"
                            }
                          >
                            %{m.hedefGerceklesmeYuzde}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {makineler.length > 4 && (
                    <div className="text-muted-foreground text-[10px]">
                      +{makineler.length - 4} diğer makine
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-semibold text-sm tabular-nums">{value}</div>
    </div>
  );
}
