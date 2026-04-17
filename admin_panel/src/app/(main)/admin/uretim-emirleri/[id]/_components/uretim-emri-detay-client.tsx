"use client";

// =============================================================
// FILE: src/app/(main)/admin/uretim-emirleri/[id]/_components/uretim-emri-detay-client.tsx
// Paspas ERP — Üretim Emri Detay: ilerleme + makine kuyruğu + durum güncelleme
// =============================================================

import { useEffect, useState } from "react";

import Link from "next/link";

import { AlertTriangle, ArrowLeft, Pencil, RefreshCcw } from "lucide-react";

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
  const toplamGerekli = Math.ceil(yeterlilikKalemleri.reduce((total, kalem) => total + kalem.gerekliMiktarFireli, 0));
  const toplamStokHam = Math.ceil(yeterlilikKalemleri.reduce((total, kalem) => total + kalem.toplamStok, 0));
  const toplamRezerve = Math.ceil(yeterlilikKalemleri.reduce((total, kalem) => total + kalem.rezerveStok, 0));
  const toplamSerbest = Math.ceil(yeterlilikKalemleri.reduce((total, kalem) => total + kalem.mevcutStok, 0));

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

      {/* Özet: Emir No + Ürün + Durum (sol) — İlerleme (sağ) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
            <div>
              <div className="text-muted-foreground text-xs">Emir No</div>
              <div className="font-mono font-semibold text-lg">{emri.emirNo}</div>
            </div>
            <Separator orientation="vertical" className="hidden h-10 sm:block" />
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs">Ürün</div>
              <div className="truncate font-medium">{emri.urunAd ?? emri.urunId}</div>
              <div className="font-mono text-muted-foreground text-xs">{emri.urunKod ?? emri.urunId}</div>
            </div>
            <Separator orientation="vertical" className="hidden h-10 sm:block" />
            <div>
              <div className="text-muted-foreground text-xs">Durum</div>
              <Badge variant={EMIR_DURUM_BADGE[emri.durum]} className="mt-1 text-sm">
                {EMIR_DURUM_LABELS[emri.durum]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İlerleme</span>
              <span className="font-semibold tabular-nums">{ilerleme}%</span>
            </div>
            <Progress value={ilerleme} className="h-3" />
            <p className="text-muted-foreground text-xs">
              {emri.uretilenMiktar} / {emri.planlananMiktar} adet tamamlandı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Montaj bekliyor uyarısı */}
      {emri.durum === "montaj_bekliyor" && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-500" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-200">Montaj bekliyor</p>
                <p className="text-amber-800 dark:text-amber-300/80">
                  Yarı mamul üretimi tamamlandı ancak montaj için gerekli karşı yarı mamul veya ambalaj
                  malzemesi yetersiz. Diğer yarı mamul üretimi bitince montaj otomatik olarak tetiklenecek
                  ve asıl ürün stoğu artacaktır.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detay bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detaylar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Müşteri</span>
              <span className="font-medium">{emri.musteriAd ?? (emri.musteriOzetTipi === "manuel" ? "Manuel üretim" : "—")}</span>
            </div>
            {emri.siparisNo && (
              <div className="flex justify-between sm:flex-col sm:gap-0.5">
                <span className="text-muted-foreground">Sipariş</span>
                <span className="font-medium">{emri.siparisNo}</span>
              </div>
            )}
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Planlanan Miktar</span>
              <span className="font-semibold tabular-nums">{emri.planlananMiktar}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Üretilen Miktar</span>
              <span className="font-semibold tabular-nums text-emerald-600">{emri.uretilenMiktar}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Başlangıç</span>
              <span>{formatDate(emri.baslangicTarihi)}</span>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Termin</span>
              <div className="flex items-center gap-1">
                {emri.terminRiski && <AlertTriangle className="size-3.5 text-destructive" />}
                <span className={emri.terminRiski ? "font-medium text-destructive" : undefined}>
                  {formatDate(emri.terminTarihi)}
                </span>
              </div>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Planlanan Bitiş</span>
              <div>
                <div>{formatDateTime(emri.planlananBitisTarihi ?? emri.bitisTarihi)}</div>
                <div className="text-muted-foreground text-xs">
                  {emri.makineAtamaSayisi > 0 ? `${emri.makineAtamaSayisi} makine ataması` : "Operasyon tahmini"}
                </div>
              </div>
            </div>
            <div className="flex justify-between sm:flex-col sm:gap-0.5">
              <span className="text-muted-foreground">Oluşturulma</span>
              <span className="tabular-nums">{formatDateTime(String(emri.createdAt))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <Badge variant={yeterlilik.tumYeterli ? "default" : "secondary"} className="text-xs">
                      {yeterlilik.tumYeterli ? "Yeterli" : `${eksikKalemSayisi} kalem eksik`}
                    </Badge>
                  )}
                </CardTitle>
                {yeterlilik?.receteAd && (
                  <p className="text-muted-foreground text-xs">Reçete: {yeterlilik.receteAd}</p>
                )}
              </div>

              {!yeterlilikLoading && yeterlilik && (
                <div className="grid min-w-[320px] gap-2 sm:grid-cols-4">
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
                    <div className="text-[11px] text-muted-foreground">Eksik Kalem</div>
                    <div className={`font-semibold tabular-nums ${eksikKalemSayisi > 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {eksikKalemSayisi}
                    </div>
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
                  <span className="font-medium text-foreground">Ozet:</span>{' '}
                  Toplam gerekli {toplamGerekli} birim, stok {toplamStokHam} (rezerve {toplamRezerve}, serbest {toplamSerbest}).
                  {!yeterlilik.tumYeterli && ` ${eksikKalemSayisi} kalemde stok acigi var.`}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Malzeme</TableHead>
                      <TableHead className="text-right">Gerekli</TableHead>
                      <TableHead className="text-right">Stok</TableHead>
                      <TableHead className="text-right">Rezerve</TableHead>
                      <TableHead className="text-right">Serbest</TableHead>
                      <TableHead className="text-right">Eksik</TableHead>
                      <TableHead className="text-center">Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yeterlilik.kalemler.map((k) => (
                      <TableRow key={k.malzemeId}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">
                            {k.malzemeGorselUrl ? (
                              <img
                                src={k.malzemeGorselUrl}
                                alt={k.malzemeAd}
                                className="size-8 shrink-0 rounded border object-cover"
                              />
                            ) : (
                              <div className="size-8 shrink-0 rounded border bg-muted" />
                            )}
                            <div className="min-w-0">
                              <div className="truncate font-medium text-sm">{k.malzemeAd}</div>
                              <div className="truncate font-mono text-xs text-muted-foreground">{k.malzemeKod}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <div className="font-semibold">{Math.ceil(k.gerekliMiktarFireli)}</div>
                          {k.fireOrani > 0 && (
                            <div className="text-[11px] text-muted-foreground">%{k.fireOrani.toFixed(0)} fire</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{Math.ceil(k.toplamStok)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{Math.ceil(k.rezerveStok)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{Math.ceil(k.mevcutStok)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {k.eksikMiktar > 0 ? (
                            <span className="font-semibold text-destructive">{Math.ceil(k.eksikMiktar)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={k.yeterli ? "outline" : (k.eksikMiktar > 0 ? "destructive" : "secondary")}>
                            {k.yeterli ? "Yeterli" : "Tedarik Gerekli"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
