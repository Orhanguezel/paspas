"use client";

import { useState } from "react";

import { Eye, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useListHareketlerAdminQuery } from "@/integrations/endpoints/admin/erp/hareketler_admin.endpoints";
import {
  useAdjustStokAdminMutation,
  useGetStokAdminQuery,
} from "@/integrations/endpoints/admin/erp/stoklar_admin.endpoints";
import { HAREKET_TIPI_BADGE, HAREKET_TIPI_LABELS } from "@/integrations/shared/erp/hareketler.types";
import type { StokDto } from "@/integrations/shared/erp/stoklar.types";

function formatAmount(value: number) {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StokDetayDialog({ stok }: { stok: StokDto }) {
  const [open, setOpen] = useState(false);
  const [miktar, setMiktar] = useState("");
  const [aciklama, setAciklama] = useState("");

  const { data, isLoading } = useGetStokAdminQuery(stok.urunId, { skip: !open });
  const { data: hareketler } = useListHareketlerAdminQuery(open ? { urunId: stok.urunId, limit: 20 } : undefined);
  const [adjustStok, adjustState] = useAdjustStokAdminMutation();

  async function handleAdjust() {
    const gercekMiktar = Number(miktar);
    if (!Number.isFinite(gercekMiktar) || gercekMiktar < 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }
    const miktarDegisimi = gercekMiktar - detail.stok;
    if (miktarDegisimi === 0) {
      toast.error("Mevcut stokla aynı miktar girdiniz");
      return;
    }

    try {
      await adjustStok({
        id: stok.urunId,
        body: {
          miktarDegisimi,
          aciklama: aciklama.trim() || undefined,
        },
      }).unwrap();
      toast.success("Stok güncellendi");
      setMiktar("");
      setAciklama("");
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      toast.error(message === "stok_eksiye_dusurulemez" ? "Stok eksiye düşürülemez" : "Stok güncellenemedi");
    }
  }

  const detail = data ?? stok;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="mr-1 size-4" /> Detay
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{detail.urunAd}</DialogTitle>
          <DialogDescription>{detail.urunKod} stok kartı</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`stok-detay-${index + 1}`} className="h-24" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="ozet" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ozet">Özet</TabsTrigger>
              <TabsTrigger value="hareketler">Hareketler</TabsTrigger>
              <TabsTrigger value="duzelt">Stok Düzelt</TabsTrigger>
            </TabsList>

            <TabsContent value="ozet" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Mevcut Stok</div>
                  <div className="mt-1 font-semibold text-xl">
                    {formatAmount(detail.stok)} {detail.birim}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Kritik Stok</div>
                  <div className="mt-1 font-semibold text-xl">
                    {formatAmount(detail.kritikStok)} {detail.birim}
                  </div>
                  {detail.kritikStok > 0 && detail.stok < detail.kritikStok && (
                    <div className="mt-1 text-xs text-destructive font-medium">
                      Eksik: {formatAmount(detail.kritikStok - detail.stok)} {detail.birim}
                    </div>
                  )}
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Açık Üretim İhtiyacı</div>
                  <div className="mt-1 font-semibold text-xl">
                    {formatAmount(detail.acikUretimIhtiyaci)} {detail.birim}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-muted-foreground text-xs">Serbest Stok</div>
                  <div className={`mt-1 font-semibold text-xl ${detail.serbestStok < 0 ? "text-destructive" : ""}`}>
                    {formatAmount(detail.serbestStok)} {detail.birim}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-sm">Birim Dönüşümleri</h3>
                    <Badge variant="outline">{detail.kategori}</Badge>
                  </div>
                  {detail.birimDonusumleri.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Tanımlı dönüşüm yok</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.birimDonusumleri.map((item) => (
                        <div key={item.hedefBirim} className="rounded-md bg-muted/40 p-2 text-sm">
                          1 {item.hedefBirim} = {formatAmount(item.carpan)} {detail.birim}
                          <div className="text-muted-foreground text-xs">
                            Mevcut stok: {formatAmount(detail.stok / item.carpan)} {item.hedefBirim}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-medium text-sm">Planlama Özeti</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tedarik Tipi</span>
                      <span>{detail.tedarikTipi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Eksik Kritik Miktar</span>
                      <span>
                        {formatAmount(detail.kritikAcik)} {detail.birim}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Sonrası Serbest</span>
                      <span className={detail.serbestStok < 0 ? "font-medium text-destructive" : ""}>
                        {formatAmount(detail.serbestStok)} {detail.birim}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hareketler">
              <div className="space-y-2">
                {(hareketler?.items ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground text-sm">
                    Bu ürüne ait hareket kaydı yok
                  </div>
                ) : (
                  (hareketler?.items ?? []).map((hareket) => (
                    <div key={hareket.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={HAREKET_TIPI_BADGE[hareket.hareketTipi] ?? "outline"}>
                          {HAREKET_TIPI_LABELS[hareket.hareketTipi] ?? hareket.hareketTipi}
                        </Badge>
                        <span className={`font-medium ${hareket.miktar < 0 ? "text-destructive" : ""}`}>
                          {formatAmount(hareket.miktar)}
                        </span>
                        <span className="text-muted-foreground text-xs">{formatDate(hareket.createdAt)}</span>
                      </div>
                      {hareket.aciklama && <div className="mt-2 text-sm">{hareket.aciklama}</div>}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="duzelt" className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground">Mevcut Stok:</span>{" "}
                <span className="font-semibold">{formatAmount(detail.stok)} {detail.birim}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`stok-miktar-${stok.urunId}`}>Gerçek Miktar</Label>
                  <Input
                    id={`stok-miktar-${stok.urunId}`}
                    type="number"
                    placeholder="Sayılan/gerçek stok miktarı"
                    value={miktar}
                    onChange={(event) => setMiktar(event.target.value)}
                  />
                  {miktar !== "" && Number.isFinite(Number(miktar)) && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">Fark: </span>
                      <span className={Number(miktar) - detail.stok >= 0 ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                        {Number(miktar) - detail.stok >= 0 ? "+" : ""}{formatAmount(Number(miktar) - detail.stok)} {detail.birim}
                      </span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`stok-aciklama-${stok.urunId}`}>Açıklama</Label>
                  <Textarea
                    id={`stok-aciklama-${stok.urunId}`}
                    value={aciklama}
                    onChange={(event) => setAciklama(event.target.value)}
                    placeholder="Düzeltme nedeni"
                  />
                </div>
              </div>

              <Button onClick={handleAdjust} disabled={adjustState.isLoading}>
                <PackagePlus className="mr-1 size-4" />
                {adjustState.isLoading ? "Kaydediliyor" : "Stok Düzeltmesini Kaydet"}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
