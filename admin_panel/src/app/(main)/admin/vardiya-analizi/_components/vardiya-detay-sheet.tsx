"use client";

import { AlertTriangle, Package, Wrench } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useGetVardiyaDetayAdminQuery } from "@/integrations/endpoints/admin/erp/vardiya_analizi_admin.endpoints";

type Props = {
  open: boolean;
  onClose: () => void;
  target:
    | { type: "vardiya"; vardiyaKayitId: string; title: string; subtitle: string }
    | {
        type: "makine";
        makineId: string;
        tarih?: string;
        baslangicTarih?: string;
        bitisTarih?: string;
        title: string;
        subtitle: string;
      }
    | null;
};

function formatDk(dk: number): string {
  if (dk <= 0) return "0dk";
  const h = Math.floor(dk / 60);
  const m = dk % 60;
  if (h === 0) return `${m}dk`;
  if (m === 0) return `${h}sa`;
  return `${h}sa ${m}dk`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durusTipBadgeVariant(kod: string | null, tipi: string): "destructive" | "secondary" | "outline" {
  if (kod === "ARIZ" || tipi === "ariza") return "destructive";
  if (kod === "KALIP") return "secondary";
  return "outline";
}

export default function VardiyaDetaySheet({ open, onClose, target }: Props) {
  const query =
    target?.type === "vardiya"
      ? { vardiyaKayitId: target.vardiyaKayitId }
      : target?.type === "makine"
        ? {
            makineId: target.makineId,
            tarih: target.tarih,
            baslangicTarih: target.baslangicTarih,
            bitisTarih: target.bitisTarih,
          }
        : { vardiyaKayitId: "skip" };

  const { data, isLoading } = useGetVardiyaDetayAdminQuery(query, { skip: !target || !open });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{target?.title ?? "Detay"}</SheetTitle>
          <SheetDescription>{target?.subtitle ?? ""}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 py-4">
          {isLoading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-40" />
              <Skeleton className="h-60" />
            </div>
          ) : (
            <>
              {/* Saatlik Üretim Grafiği */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                  <Package className="size-4" />
                  Saatlik Üretim
                </h3>
                {data.saatlikUretim.every((s) => s.miktar === 0) ? (
                  <p className="rounded border border-dashed p-3 text-center text-muted-foreground text-xs">
                    Bu aralıkta üretim kaydı yok
                  </p>
                ) : (
                  <div className="h-48 rounded border bg-muted/20 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.saatlikUretim}>
                        <XAxis dataKey="saat" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ fontSize: 12 }}
                          formatter={(v: number) => [`${v} adet`, "Üretim"]}
                        />
                        <Bar dataKey="miktar" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              <Separator />

              {/* Duruş Tablosu */}
              <section>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-sm">
                  <AlertTriangle className="size-4" />
                  Duruşlar ({data.duruslar.length})
                </h3>
                {data.duruslar.length === 0 ? (
                  <p className="rounded border border-dashed p-3 text-center text-muted-foreground text-xs">
                    Duruş kaydı yok
                  </p>
                ) : (
                  <div className="rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Başlangıç</TableHead>
                          <TableHead className="w-24">Bitiş</TableHead>
                          <TableHead className="w-16 text-right">Süre</TableHead>
                          <TableHead>Tip / Neden</TableHead>
                          <TableHead className="w-28">Operatör</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.duruslar.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="text-xs tabular-nums">
                              {formatDateTime(d.baslangic)}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {d.bitis ? formatDateTime(d.bitis) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-xs tabular-nums">
                              {formatDk(d.sureDk)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={durusTipBadgeVariant(d.nedenKod, d.durusTipi)} className="text-[10px]">
                                  {d.nedenKod === "ARIZ" || d.durusTipi === "ariza" ? (
                                    <AlertTriangle className="mr-1 size-3" />
                                  ) : d.nedenKod === "KALIP" ? (
                                    <Wrench className="mr-1 size-3" />
                                  ) : null}
                                  {d.nedenKod ?? d.durusTipi}
                                </Badge>
                                <span className="truncate text-xs">{d.neden}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{d.operatorAd ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              <Separator />

              {/* Üretim Kayıtları */}
              <section>
                <h3 className="mb-2 font-semibold text-sm">Üretim Kayıtları ({data.uretimKayitlari.length})</h3>
                {data.uretimKayitlari.length === 0 ? (
                  <p className="rounded border border-dashed p-3 text-center text-muted-foreground text-xs">
                    Üretim kaydı yok
                  </p>
                ) : (
                  <div className="rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-28">Tarih/Saat</TableHead>
                          <TableHead>Ürün</TableHead>
                          <TableHead>Operasyon / Kalıp</TableHead>
                          <TableHead className="w-16 text-right">Net</TableHead>
                          <TableHead className="w-16 text-right">Fire</TableHead>
                          <TableHead className="w-28">Operatör</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.uretimKayitlari.map((k) => (
                          <TableRow key={k.id}>
                            <TableCell className="text-xs tabular-nums">{formatDateTime(k.kayitTarihi)}</TableCell>
                            <TableCell>
                              <div className="text-xs font-medium">{k.urunAd}</div>
                              {k.urunKod && (
                                <div className="font-mono text-muted-foreground text-[10px]">{k.urunKod}</div>
                              )}
                              {k.notlar && (
                                <div className="text-muted-foreground text-[10px] italic">{k.notlar}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-medium">{k.operasyonAdi ?? "Baskı"}</div>
                              <div className="text-muted-foreground text-[10px]">
                                {k.operasyonTipi === "cift_tarafli"
                                  ? "Çift taraf"
                                  : k.operasyonTipi === "tek_tarafli"
                                    ? "Tek taraf"
                                    : "Baskı"}
                                {k.kalipKod ? ` · ${k.kalipKod}` : ""}
                              </div>
                              {k.kalipAd && (
                                <div className="truncate text-muted-foreground text-[10px]">{k.kalipAd}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs tabular-nums">
                              {k.netMiktar.toLocaleString("tr-TR")}
                            </TableCell>
                            <TableCell className="text-right text-xs tabular-nums text-destructive">
                              {k.fireMiktar > 0 ? k.fireMiktar.toLocaleString("tr-TR") : "—"}
                            </TableCell>
                            <TableCell className="text-xs">{k.operatorAd ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              {/* Bağlı Üretim Emirleri */}
              {data.bagliEmirler.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h3 className="mb-2 font-semibold text-sm">Bağlı Üretim Emirleri</h3>
                    <div className="space-y-1">
                      {data.bagliEmirler.map((e) => (
                        <div key={e.emirId} className="flex items-center justify-between rounded border bg-muted/20 p-2 text-xs">
                          <div>
                            <span className="font-mono">{e.emirNo}</span>
                            <span className="mx-2 text-muted-foreground">—</span>
                            <span>{e.urunAd}</span>
                          </div>
                          <span className="tabular-nums">
                            {e.uretilen.toLocaleString("tr-TR")} / {e.planlanan.toLocaleString("tr-TR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
