"use client";

// =============================================================
// FILE: src/app/(main)/admin/uretim-emirleri/[id]/_components/uretim-emri-detay-client.tsx
// Paspas ERP — Üretim Emri Detay: ilerleme + makine kuyruğu + durum güncelleme
// =============================================================

import { useEffect, useState } from "react";

import Link from "next/link";

import { AlertTriangle, ArrowLeft, CheckCircle2, Pencil, RefreshCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useListIsYukleriAdminQuery } from "@/integrations/endpoints/admin/erp/is_yukler_admin.endpoints";
import { useCheckYeterlilikAdminQuery } from "@/integrations/endpoints/admin/erp/stoklar_admin.endpoints";
import { useGetUretimEmriAdminQuery, useLazyGetUretimKarsilastirmaAdminQuery } from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";
import type { UretimKarsilastirma } from "@/integrations/shared/erp/uretim_emirleri.types";
import { IS_YUKU_DURUM_BADGE, IS_YUKU_DURUM_LABELS } from "@/integrations/shared/erp/is_yukler.types";
import { EMIR_DURUM_BADGE, EMIR_DURUM_LABELS } from "@/integrations/shared/erp/uretim_emirleri.types";

import UretimEmriForm from "../../_components/uretim-emri-form";

interface Props {
  id: string;
}

export default function UretimEmriDetayClient({ id }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [karsilastirma, setKarsilastirma] = useState<UretimKarsilastirma | null>(null);

  const { data: emri, isLoading, refetch } = useGetUretimEmriAdminQuery(id);
  const [fetchKarsilastirma] = useLazyGetUretimKarsilastirmaAdminQuery();
  const { data: isYukleri } = useListIsYukleriAdminQuery({});
  const { data: yeterlilik, isLoading: yeterlilikLoading } = useCheckYeterlilikAdminQuery(
    { urunId: emri?.urunId ?? "", miktar: emri?.planlananMiktar ?? 0 },
    { skip: !emri?.receteId },
  );

  // Üretim karşılaştırması: üretimde veya tamamlandi iken getir
  useEffect(() => {
    if (emri && (emri.durum === 'uretimde' || emri.durum === 'tamamlandi')) {
      fetchKarsilastirma(id).unwrap().then(setKarsilastirma).catch(() => setKarsilastirma(null));
    } else {
      setKarsilastirma(null);
    }
  }, [emri?.durum, id, fetchKarsilastirma]);

  const makineMapped = (isYukleri?.items ?? []).filter((y) => y.uretimEmriId === id);
  const yeterlilikKalemleri = yeterlilik?.kalemler ?? [];
  const eksikKalemSayisi = yeterlilikKalemleri.filter((kalem) => !kalem.yeterli).length;
  const toplamGerekli = yeterlilikKalemleri.reduce((total, kalem) => total + kalem.gerekliMiktarFireli, 0);
  const toplamStok = yeterlilikKalemleri.reduce((total, kalem) => total + kalem.mevcutStok, 0);

  function pct(uretilen: number, planlanan: number) {
    if (!planlanan) return 0;
    return Math.min(100, Math.round((uretilen / planlanan) * 100));
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const tarih = d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const saat = d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${tarih} ${saat}`;
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
              <span>{formatDate(emri.baslangicTarihi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Termin</span>
              <div className="flex items-center gap-1">
                {emri.terminRiski && <AlertTriangle className="size-3.5 text-destructive" />}
                <span className={emri.terminRiski ? "font-medium text-destructive" : undefined}>
                  {formatDate(emri.terminTarihi)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Planlanan Bitiş</span>
              <div className="text-right">
                <div>{formatDateTime(emri.planlananBitisTarihi ?? emri.bitisTarihi)}</div>
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
              <span className="tabular-nums">{formatDateTime(String(emri.createdAt))}</span>
            </div>
          </CardContent>
        </Card>

        {/* İlerleme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">İlerleme</CardTitle>
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

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Durum</span>
              <Badge variant={EMIR_DURUM_BADGE[emri.durum]} className="text-xs">
                {EMIR_DURUM_LABELS[emri.durum]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Durum, makine ataması ve operatör işlemlerine göre otomatik güncellenir.
            </p>
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

      {/* Malzeme Yeterliliği */}
      {emri.receteId && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-sm">
                  Malzeme Yeterliliği
                  {yeterlilik && !yeterlilikLoading && (
                    <Badge variant={yeterlilik.tumYeterli ? "default" : "destructive"} className="text-xs">
                      {yeterlilik.tumYeterli ? "Yeterli" : "Eksik"}
                    </Badge>
                  )}
                </CardTitle>
                {yeterlilik?.receteAd && (
                  <p className="text-muted-foreground text-xs">Reçete: {yeterlilik.receteAd}</p>
                )}
              </div>

              {!yeterlilikLoading && yeterlilik && (
                <div className="grid min-w-[260px] gap-2 sm:grid-cols-3">
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Malzeme</div>
                    <div className="font-semibold tabular-nums">{yeterlilikKalemleri.length}</div>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Eksik Kalem</div>
                    <div className={`font-semibold tabular-nums ${eksikKalemSayisi > 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {eksikKalemSayisi}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Toplam Stok</div>
                    <div className="font-semibold tabular-nums">{toplamStok.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {yeterlilikLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`yeterlilik-skeleton-${i + 1}`} className="h-6 w-full" />
                ))}
              </div>
            ) : !yeterlilik ? (
              <p className="py-4 text-center text-muted-foreground text-sm">Yeterlilik bilgisi alınamadı</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Özet:</span>{' '}
                  Toplam gerekli {toplamGerekli.toFixed(1)} birim malzeme, mevcut stok toplamı {toplamStok.toFixed(1)}.
                  {!yeterlilik.tumYeterli && ` ${eksikKalemSayisi} kalemde stok açığı var.`}
                </div>

                <div className="space-y-3">
                  {yeterlilik.kalemler.map((k) => (
                    <div
                      key={k.malzemeId}
                      className={`rounded-lg border p-3 ${k.yeterli ? "bg-background" : "border-destructive/30 bg-destructive/5"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {k.malzemeGorselUrl ? (
                            <img
                              src={k.malzemeGorselUrl}
                              alt={k.malzemeAd}
                              className="size-12 rounded-md border object-cover"
                            />
                          ) : (
                            <div className="size-12 rounded-md border bg-muted" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium">{k.malzemeAd}</div>
                            <div className="font-mono text-xs text-muted-foreground">{k.malzemeKod}</div>
                          </div>
                        </div>

                        <Badge variant={k.yeterli ? "outline" : "destructive"} className="shrink-0">
                          {k.yeterli ? "Yeterli" : "Eksik"}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-4">
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-[11px] text-muted-foreground">Gerekli</div>
                          <div className="font-semibold tabular-nums">
                            {k.gerekliMiktarFireli.toFixed(1)} {k.birim}
                          </div>
                          {k.fireOrani > 0 && (
                            <div className="text-[11px] text-muted-foreground">%{k.fireOrani.toFixed(0)} fire dahil</div>
                          )}
                        </div>
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-[11px] text-muted-foreground">Stok</div>
                          <div className="font-semibold tabular-nums">
                            {k.mevcutStok.toFixed(1)} {k.birim}
                          </div>
                        </div>
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-[11px] text-muted-foreground">Fark</div>
                          <div className={`font-semibold tabular-nums ${k.fark < 0 ? "text-destructive" : "text-emerald-600"}`}>
                            {k.fark >= 0 ? "+" : ""}{k.fark.toFixed(1)} {k.birim}
                          </div>
                        </div>
                        <div className="rounded-md border bg-muted/30 px-3 py-2">
                          <div className="text-[11px] text-muted-foreground">Durum</div>
                          <div className="flex items-center gap-2 font-semibold">
                            {k.yeterli ? (
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            ) : (
                              <XCircle className="size-4 text-destructive" />
                            )}
                            <span>{k.yeterli ? "Hazır" : "Tedarik Gerekli"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Üretim Karşılaştırması — vardiya kayıtlarından toplanan gerçek üretim vs planlanan */}
      {karsilastirma && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              Üretim Karşılaştırması
              {karsilastirma.fark >= 0 ? (
                <Badge variant="default" className="text-xs">Hedefe Ulaşıldı</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Eksik Üretim</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">Planlanan</div>
                <div className="font-semibold tabular-nums text-lg">{karsilastirma.planlananMiktar.toLocaleString("tr-TR")}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">Toplam Üretilen</div>
                <div className="font-semibold tabular-nums text-lg">{karsilastirma.toplamUretilen.toLocaleString("tr-TR")}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">Fire</div>
                <div className="font-semibold tabular-nums text-lg text-amber-600">{karsilastirma.toplamFire.toLocaleString("tr-TR")}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">Net Fark</div>
                <div className={`font-semibold tabular-nums text-lg ${karsilastirma.fark >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {karsilastirma.fark >= 0 ? "+" : ""}{karsilastirma.fark.toLocaleString("tr-TR")}
                </div>
              </div>
            </div>
            {karsilastirma.fark < 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>
                  Vardiya kayıtlarında toplam <strong>{karsilastirma.netUretilen.toLocaleString("tr-TR")}</strong> net üretim girilmiş,
                  planlanan miktar <strong>{karsilastirma.planlananMiktar.toLocaleString("tr-TR")}</strong>.
                  {" "}<strong>{Math.abs(karsilastirma.fark).toLocaleString("tr-TR")}</strong> adet eksik.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <UretimEmriForm open={formOpen} onClose={() => setFormOpen(false)} emri={emri} />
    </div>
  );
}
