"use client";

import { useState } from "react";
import { AlertTriangle, Package, Search, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetReceteAdminQuery } from "@/integrations/endpoints/admin/erp/receteler_admin.endpoints";
import { useGetUretimEmriAdminQuery } from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";
import { resolveMediaUrl } from "@/lib/media-url";

interface Props {
  emirId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ReceteDetayModal({ emirId, onOpenChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { data: emri, isLoading: emriLoading } = useGetUretimEmriAdminQuery(emirId ?? "", {
    skip: !emirId,
  });

  const { data: recete, isLoading: receteLoading } = useGetReceteAdminQuery(emri?.receteId ?? "", {
    skip: !emri?.receteId,
  });

  const isLoading = emriLoading || receteLoading;
  const displayUrunKod = emri?.urunKod ?? null;
  const displayUrunAd = emri?.urunAd ?? "";
  const displayUrunGorsel = emri?.urunGorsel ?? null;

  return (
    <Dialog open={!!emirId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full lg:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-8 py-6 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wrench className="size-6 text-primary" />
              </div>
              Reçete Detayı
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading && (
            <div className="p-8">
              <ReceteDetaySkeleton />
            </div>
          )}

          {emri && !isLoading && (
            <div className="p-8 space-y-10">
              {/* Ürün Bilgisi */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-card rounded-2xl border p-6 shadow-sm">
                <button
                  type="button"
                  className="size-48 rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group cursor-zoom-in"
                  onClick={() => displayUrunGorsel && setPreviewUrl(displayUrunGorsel)}
                  disabled={!displayUrunGorsel}
                >
                  {displayUrunGorsel ? (
                    <>
                      <img src={resolveMediaUrl(displayUrunGorsel)} alt={displayUrunAd} className="size-full object-contain p-2 transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                        <Search className="size-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <Package className="size-16 text-muted-foreground/20" />
                  )}
                </button>
                <div className="flex-1 space-y-3 min-w-0 text-center md:text-left pt-2">
                  <div>
                    {displayUrunKod && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider mb-2">
                        {displayUrunKod}
                      </div>
                    )}
                    <h2 className="text-4xl font-black tracking-tight leading-tight text-foreground">{displayUrunAd}</h2>
                  </div>
                  {emri.receteAd && (
                    <div className="text-xl text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                      <div className="size-1.5 rounded-full bg-primary/40" />
                      {emri.receteAd}
                    </div>
                  )}
                </div>
              </div>

              {recete?.items && recete.items.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                      <Package className="size-4" />
                    </div>
                    <h3 className="text-xl font-bold">Malzeme Listesi</h3>
                    <div className="h-px flex-1 bg-border/60 ml-2" />
                  </div>
                  
                  <div className="rounded-2xl border shadow-md overflow-hidden bg-card">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50 border-b">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-16 text-center font-bold">#</TableHead>
                            <TableHead className="min-w-[400px] font-bold">Malzeme</TableHead>
                            <TableHead className="text-right w-40 font-bold">Miktar</TableHead>
                            <TableHead className="text-center w-32 font-bold">Birim</TableHead>
                            <TableHead className="min-w-[300px] font-bold">Açıklama</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recete.items
                            .filter((k) => k.malzemeKategori !== "operasyonel_ym")
                            .slice()
                            .sort((a, b) => a.sira - b.sira)
                            .map((kalem) => (
                              <TableRow key={kalem.id} className="group hover:bg-primary/[0.02] transition-colors border-b last:border-0 h-24">
                                <TableCell className="text-muted-foreground text-center font-mono font-medium">
                                  {kalem.sira.toString().padStart(2, '0')}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-5 py-1">
                                    <button
                                      type="button"
                                      className="size-16 shrink-0 overflow-hidden rounded-xl border bg-white transition-all group-hover:border-primary/40 hover:border-primary shadow-sm relative group/btn"
                                      onClick={() => kalem.malzemeGorselUrl && setPreviewUrl(kalem.malzemeGorselUrl)}
                                      disabled={!kalem.malzemeGorselUrl}
                                    >
                                      {kalem.malzemeGorselUrl ? (
                                        <>
                                          <img
                                            src={resolveMediaUrl(kalem.malzemeGorselUrl)}
                                            alt={kalem.malzemeAd ?? ""}
                                            className="size-full object-contain p-2 transition-transform duration-500 group-hover/btn:scale-110"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover/btn:bg-black/5 flex items-center justify-center transition-colors">
                                            <Search className="size-5 text-white opacity-0 group-hover/btn:opacity-100 drop-shadow-md" />
                                          </div>
                                        </>
                                      ) : (
                                        <Package className="m-auto size-8 text-muted-foreground/10" />
                                      )}
                                    </button>
                                    <div className="space-y-1.5 min-w-0">
                                      <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                                        {kalem.malzemeAd ?? "—"}
                                      </div>
                                      {kalem.malzemeKod && (
                                        <div className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded border border-border/50 w-fit uppercase tracking-tighter">
                                          {kalem.malzemeKod}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-xl font-black text-foreground">
                                  {kalem.miktar.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="secondary" className="font-bold px-3 py-1 bg-muted/60">
                                    {kalem.malzemeBirim?.toUpperCase() ?? "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-base text-foreground/70 font-medium italic leading-relaxed px-6">
                                  {kalem.aciklama || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {emri.receteId && !recete && !receteLoading && (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/10 rounded-3xl border border-dashed">
                  <AlertTriangle className="size-12 opacity-20" />
                  <p className="text-lg font-medium">Reçete bilgileri yüklenemedi.</p>
                </div>
              )}
              {!emri.receteId && (
                <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/10 rounded-3xl border border-dashed">
                  <AlertTriangle className="size-12 opacity-20" />
                  <p className="text-lg font-medium">Bu üretim emrine reçete tanımlı değil.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl bg-black/90 border-none shadow-2xl p-0 overflow-hidden">
          {previewUrl && (
            <div className="relative flex items-center justify-center min-h-[50vh]">
              <img 
                src={resolveMediaUrl(previewUrl)} 
                alt="Görsel" 
                className="max-h-[85vh] max-w-full object-contain animate-in zoom-in-95 duration-200" 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function ReceteDetaySkeleton() {
  return (
    <div className="space-y-3 py-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
