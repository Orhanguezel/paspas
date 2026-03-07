"use client";

// =============================================================
// FILE: src/app/(main)/admin/uretim-emirleri/[id]/_components/uretim-emri-detay-client.tsx
// Paspas ERP — Üretim Emri Detay: ilerleme + makine kuyruğu + durum güncelleme
// =============================================================

import { useState } from "react";

import Link from "next/link";

import { AlertTriangle, ArrowLeft, Pencil, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListIsYukleriAdminQuery } from "@/integrations/endpoints/admin/erp/is_yukler_admin.endpoints";
import {
  useGetUretimEmriAdminQuery,
  useUpdateUretimEmriAdminMutation,
} from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";
import { IS_YUKU_DURUM_BADGE, IS_YUKU_DURUM_LABELS } from "@/integrations/shared/erp/is_yukler.types";
import type { UretimEmriDurum } from "@/integrations/shared/erp/uretim_emirleri.types";
import { EMIR_DURUM_BADGE, EMIR_DURUM_LABELS } from "@/integrations/shared/erp/uretim_emirleri.types";

import UretimEmriForm from "../../_components/uretim-emri-form";

const DURUM_OPTIONS: UretimEmriDurum[] = ["planlandi", "hazirlaniyor", "uretimde", "tamamlandi", "iptal"];

interface Props {
  id: string;
}

export default function UretimEmriDetayClient({ id }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [durumChanging, setChanging] = useState(false);

  const { data: emri, isLoading, refetch } = useGetUretimEmriAdminQuery(id);
  const { data: isYukleri } = useListIsYukleriAdminQuery({});
  const [updateEmri] = useUpdateUretimEmriAdminMutation();

  const makineMapped = (isYukleri?.items ?? []).filter((y) => y.uretimEmriId === id);

  async function handleDurumChange(durum: UretimEmriDurum) {
    setChanging(true);
    try {
      await updateEmri({ id, body: { durum } }).unwrap();
      toast.success("Durum güncellendi");
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "data" in err
          ? (err as { data?: { error?: { message?: string } } }).data?.error?.message
          : undefined;
      toast.error(message ?? "Güncelleme başarısız");
    } finally {
      setChanging(false);
    }
  }

  function pct(uretilen: number, planlanan: number) {
    if (!planlanan) return 0;
    return Math.min(100, Math.round((uretilen / planlanan) * 100));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`uretim-emri-detay-skeleton-${i + 1}`} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!emri) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Üretim emri bulunamadı</p>
        <Link href="/admin/uretim-emirleri" className="mt-2 inline-block text-sm underline">
          Listeye dön
        </Link>
      </div>
    );
  }

  const ilerleme = pct(emri.uretilenMiktar, emri.planlananMiktar);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/uretim-emirleri">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-mono font-semibold text-lg">{emri.emirNo}</h1>
            <p className="text-muted-foreground text-sm">Üretim Emri Detayı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="size-4" />
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-1 size-4" /> Düzenle
          </Button>
        </div>
      </div>

      {/* KPI kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs">Durum</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={EMIR_DURUM_BADGE[emri.durum]} className="text-sm">
              {EMIR_DURUM_LABELS[emri.durum]}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs">Planlanan Miktar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl tabular-nums">{emri.planlananMiktar}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs">Üretilen Miktar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl text-green-600 tabular-nums">{emri.uretilenMiktar}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs">İlerleme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl tabular-nums">{ilerleme}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Detay bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Emir Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ürün</span>
              <div className="text-right">
                <div className="font-medium">{emri.urunAd ?? emri.urunId}</div>
                <div className="font-mono text-muted-foreground text-xs">{emri.urunKod ?? emri.urunId}</div>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Müşteri</span>
              <span>{emri.musteriAd ?? (emri.musteriOzetTipi === "manuel" ? "Manuel üretim" : "—")}</span>
            </div>
            {emri.siparisNo && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sipariş</span>
                <span className="font-medium">{emri.siparisNo}</span>
              </div>
            )}
            {emri.siparisKalemIds.length > 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bağlı Sipariş Kalemleri</span>
                <span>{emri.siparisKalemIds.length} kalem</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Başlangıç</span>
              <span>{emri.baslangicTarihi ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Termin</span>
              <div className="flex items-center gap-1">
                {emri.terminRiski && <AlertTriangle className="size-3.5 text-destructive" />}
                <span className={emri.terminRiski ? "font-medium text-destructive" : undefined}>
                  {emri.terminTarihi ?? "—"}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Planlanan Bitiş</span>
              <div className="text-right">
                <div>{emri.planlananBitisTarihi ?? emri.bitisTarihi ?? "—"}</div>
                <div className="text-muted-foreground text-xs">
                  {emri.makineAtamaSayisi > 0 ? `${emri.makineAtamaSayisi} makine atamasi` : "Operasyon tahmini"}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Silme Durumu</span>
              <div className="max-w-[240px] text-right">
                <div className={emri.silinebilir ? "text-emerald-600" : "font-medium text-amber-600"}>
                  {emri.silinebilir ? "Silinebilir" : "Silinemez"}
                </div>
                {!emri.silinebilir && emri.silmeNedeni && (
                  <div className="text-muted-foreground text-xs">{emri.silmeNedeni}</div>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Oluşturulma</span>
              <span className="tabular-nums">{String(emri.createdAt).slice(0, 16).replace("T", " ")}</span>
            </div>
          </CardContent>
        </Card>

        {/* İlerleme + Durum değiştir */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">İlerleme & Durum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Üretim İlerlemesi</span>
                <span className="font-semibold">{ilerleme}%</span>
              </div>
              <Progress value={ilerleme} className="h-3" />
              <p className="text-muted-foreground text-xs">
                {emri.uretilenMiktar} / {emri.planlananMiktar} adet tamamlandı
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="font-medium text-sm">Durum Güncelle</p>
              <Select
                value={emri.durum}
                onValueChange={(v) => handleDurumChange(v as UretimEmriDurum)}
                disabled={durumChanging}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURUM_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {EMIR_DURUM_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Makine Kuyruğu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Makine Kuyruğu</CardTitle>
        </CardHeader>
        <CardContent>
          {makineMapped.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">Bu emre atanmış makine bulunmuyor</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Makine</TableHead>
                  <TableHead>Planlanan Süre (dk)</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {makineMapped.map((y) => (
                  <TableRow key={y.kuyrukId}>
                    <TableCell className="font-mono">{y.sira}</TableCell>
                    <TableCell>
                      <span className="font-medium">{y.makineKod}</span>
                      <span className="ml-1 text-muted-foreground text-xs">— {y.makineAd}</span>
                    </TableCell>
                    <TableCell>{y.planlananSureDk}</TableCell>
                    <TableCell>
                      <Badge variant={IS_YUKU_DURUM_BADGE[y.durum] ?? "outline"}>
                        {IS_YUKU_DURUM_LABELS[y.durum] ?? y.durum}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UretimEmriForm open={formOpen} onClose={() => setFormOpen(false)} emri={emri} />
    </div>
  );
}
