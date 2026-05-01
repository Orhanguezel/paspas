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
      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium flex-1">{value ?? "—"}</span>
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="size-5" />
            Reçete Detayı
            {emri?.emirNo && <span className="text-muted-foreground font-normal text-sm">— {emri.emirNo}</span>}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {emri && !isLoading && (
          <div className="space-y-5 py-1">
            {/* Ürün bilgisi */}
            <div className="flex items-start gap-4">
              <div className="size-20 rounded border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {displayUrunGorsel ? (
                  <img src={displayUrunGorsel} alt={displayUrunAd} className="size-full object-contain p-1" />
                ) : (
                  <Package className="size-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                {displayUrunKod && <div className="font-mono text-xs text-muted-foreground">{displayUrunKod}</div>}
                <div className="text-lg font-bold">{displayUrunAd}</div>
                {showOperasyonelUrun && (
                  <div className="text-xs text-muted-foreground">
                    Operasyonel YM: {emri.urunKod ? `${emri.urunKod} — ` : ""}{emri.urunAd ?? emri.urunId}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Planlanan miktar:{" "}
                  <span className="font-semibold text-foreground">
                    {emri.planlananMiktar.toLocaleString("tr-TR")} adet
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Emir bilgileri */}
            <div className="space-y-2">
              <InfoRow label="Emir No" value={<span className="font-mono">{emri.emirNo}</span>} />
              <InfoRow label="Makine" value={emri.makineAdlari} />
              <InfoRow label="Reçete" value={emri.receteAd} />
              <InfoRow label="Termin" value={emri.terminTarihi} />
              <InfoRow label="Planlanan Bitiş" value={emri.planlananBitisTarihi} />
              {emri.musteriAd && <InfoRow label="Müşteri" value={emri.musteriAd} />}
            </div>

            {/* Reçete kalemleri */}
            {recete?.items && recete.items.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-semibold mb-2">Malzeme Listesi</div>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Malzeme</TableHead>
                          <TableHead className="text-right">Miktar</TableHead>
                          <TableHead className="text-right">Birim</TableHead>
                          <TableHead>Açıklama</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recete.items
                          .slice()
                          .sort((a, b) => a.sira - b.sira)
                          .map((kalem) => (
                            <TableRow key={kalem.id}>
                              <TableCell className="text-muted-foreground text-xs">{kalem.sira}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="size-10 shrink-0 overflow-hidden rounded border bg-muted transition hover:border-primary disabled:cursor-default disabled:hover:border-border"
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
                                      <Package className="m-2 size-5 text-muted-foreground/40" />
                                    )}
                                  </button>
                                  <div>
                                    <div className="font-medium text-sm">{kalem.malzemeAd ?? "—"}</div>
                                    {kalem.malzemeKod && (
                                      <div className="text-xs text-muted-foreground font-mono">{kalem.malzemeKod}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm font-medium">
                                {kalem.miktar.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {kalem.malzemeBirim ?? "—"}
                              </TableCell>
                              <TableCell className="max-w-56 text-xs text-muted-foreground">
                                {kalem.aciklama || "—"}
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
