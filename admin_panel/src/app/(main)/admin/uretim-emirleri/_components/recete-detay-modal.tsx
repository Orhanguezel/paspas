"use client";

import { useState } from "react";
import { Package, Wrench } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetReceteAdminQuery } from "@/integrations/endpoints/admin/erp/receteler_admin.endpoints";
import { useGetUretimEmriAdminQuery } from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";

interface Props {
  emirId: string | null;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-semibold flex-1">{value ?? "—"}</span>
    </div>
  );
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
  const displayUrunKod = emri?.siparisUrunKod ?? emri?.urunKod ?? null;
  const displayUrunAd = emri?.siparisUrunAd ?? emri?.urunAd ?? "";
  const displayUrunGorsel = emri?.siparisUrunGorsel ?? emri?.urunGorsel ?? null;
  const showOperasyonelUrun =
    Boolean(emri?.siparisUrunAd || emri?.siparisUrunKod) &&
    (emri?.urunAd !== emri?.siparisUrunAd || emri?.urunKod !== emri?.siparisUrunKod);

  return (
    <Dialog open={!!emirId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wrench className="size-5" />
            Reçete Detayı
            {emri?.emirNo && <span className="text-muted-foreground font-normal">— {emri.emirNo}</span>}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {emri && !isLoading && (
          <div className="space-y-5 py-1">
            {/* Ürün bilgisi — büyük görsel + belirgin isim */}
            <div className="flex items-start gap-5">
              <div className="size-28 rounded-lg border-2 bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {displayUrunGorsel ? (
                  <img src={displayUrunGorsel} alt={displayUrunAd} className="size-full object-contain p-1.5" />
                ) : (
                  <Package className="size-10 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                {displayUrunKod && (
                  <div className="font-mono text-sm text-muted-foreground tracking-wide">{displayUrunKod}</div>
                )}
                <div className="text-2xl font-bold leading-tight">{displayUrunAd}</div>
                {showOperasyonelUrun && (
                  <div className="text-sm text-muted-foreground">
                    Operasyonel YM: {emri.urunKod ? `${emri.urunKod} — ` : ""}{emri.urunAd ?? emri.urunId}
                  </div>
                )}
                <div className="text-base text-muted-foreground">
                  Planlanan miktar:{" "}
                  <span className="font-bold text-foreground text-lg">
                    {emri.planlananMiktar.toLocaleString("tr-TR")} adet
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Emir bilgileri — iki kolonlu grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              <InfoRow label="Emir No" value={<span className="font-mono font-bold">{emri.emirNo}</span>} />
              <InfoRow label="Makine" value={emri.makineAdlari} />
              <InfoRow label="Reçete" value={emri.receteAd} />
              <InfoRow label="Termin" value={emri.terminTarihi} />
              <InfoRow label="Plan. Bitiş" value={emri.planlananBitisTarihi} />
              {emri.musteriAd && <InfoRow label="Müşteri" value={emri.musteriAd} />}
            </div>

            {/* Reçete kalemleri */}
            {recete?.items && recete.items.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-base font-semibold mb-3">Malzeme Listesi</div>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead>Malzeme</TableHead>
                          <TableHead className="text-right w-28">Miktar</TableHead>
                          <TableHead className="text-right w-16">Birim</TableHead>
                          <TableHead className="w-56">Açıklama</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recete.items
                          .filter((k) => k.malzemeKategori !== "operasyonel_ym")
                          .slice()
                          .sort((a, b) => a.sira - b.sira)
                          .map((kalem) => (
                            <TableRow key={kalem.id} className="align-middle">
                              <TableCell className="text-muted-foreground text-sm">{kalem.sira}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    className="size-12 shrink-0 overflow-hidden rounded border bg-muted transition hover:border-primary disabled:cursor-default disabled:hover:border-border"
                                    onClick={() => kalem.malzemeGorselUrl && setPreviewUrl(kalem.malzemeGorselUrl)}
                                    disabled={!kalem.malzemeGorselUrl}
                                    aria-label={
                                      kalem.malzemeGorselUrl
                                        ? `${kalem.malzemeAd ?? "Malzeme"} görselini büyüt`
                                        : "Malzeme görseli yok"
                                    }
                                    title={kalem.malzemeGorselUrl ? "Görseli büyüt" : "Malzeme görseli yok"}
                                  >
                                    {kalem.malzemeGorselUrl ? (
                                      <img
                                        src={kalem.malzemeGorselUrl}
                                        alt={kalem.malzemeAd ?? ""}
                                        className="size-full object-contain p-0.5"
                                      />
                                    ) : (
                                      <Package className="m-2.5 size-6 text-muted-foreground/40" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="font-semibold text-sm leading-snug">{kalem.malzemeAd ?? "—"}</div>
                                    {kalem.malzemeKod && (
                                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{kalem.malzemeKod}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm font-bold">
                                {kalem.miktar.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {kalem.malzemeBirim ?? "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word">
                                {kalem.aciklama || ""}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {emri.receteId && !recete && !receteLoading && (
              <p className="text-sm text-muted-foreground text-center py-2">Reçete bilgileri yüklenemedi.</p>
            )}
            {!emri.receteId && (
              <p className="text-sm text-muted-foreground text-center py-2">Bu üretim emrine reçete tanımlı değil.</p>
            )}
          </div>
        )}
      </DialogContent>
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Malzeme Görseli</DialogTitle>
          </DialogHeader>
          {previewUrl && <img src={previewUrl} alt="" className="max-h-[75vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
