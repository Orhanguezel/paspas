"use client";

import { useState } from "react";

import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useCheckYeterlilikAdminQuery } from "@/integrations/endpoints/admin/erp/stoklar_admin.endpoints";
import { useListUrunlerAdminQuery } from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";

export default function YeterlilikDialog() {
  const { t } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const [urunId, setUrunId] = useState("");
  const [miktar, setMiktar] = useState("100");

  const { data: urunlerData } = useListUrunlerAdminQuery(
    { limit: 500, kategori: "urun" },
    { skip: !open },
  );

  const urunler = urunlerData?.items ?? [];
  const miktarNum = Number(miktar);
  const canQuery = urunId.length > 0 && miktarNum > 0;

  const { data, isLoading, isFetching } = useCheckYeterlilikAdminQuery(
    { urunId, miktar: miktarNum },
    { skip: !canQuery || !open },
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardCheck className="size-4" />
          <span className="ml-1.5">{t("admin.erp.stoklar.yeterlilik.button")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{t("admin.erp.stoklar.yeterlilik.title")}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block font-medium text-sm">
                {t("admin.erp.stoklar.yeterlilik.urun")}
              </label>
              <Select value={urunId || "none"} onValueChange={(v) => setUrunId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.erp.stoklar.yeterlilik.urunSecin")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("admin.erp.stoklar.yeterlilik.urunSecin")}</SelectItem>
                  {urunler.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.kod} — {u.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28">
              <label className="mb-1 block font-medium text-sm">
                {t("admin.erp.stoklar.yeterlilik.miktar")}
              </label>
              <Input
                type="number"
                min="1"
                value={miktar}
                onChange={(e) => setMiktar(e.target.value)}
              />
            </div>
          </div>

          {canQuery && isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={`yeterlilik-skeleton-${i + 1}`} className="h-8 w-full" />
              ))}
            </div>
          )}

          {canQuery && !isLoading && !data && (
            <p className="py-4 text-center text-muted-foreground text-sm">
              {t("admin.erp.stoklar.yeterlilik.receteYok")}
            </p>
          )}

          {data && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">{t("admin.erp.stoklar.yeterlilik.recete")}:</span>{" "}
                  <span className="font-medium">{data.receteAd}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({t("admin.erp.stoklar.yeterlilik.carpan")}: {formatAmount(data.carpan)}x)
                  </span>
                </div>
                {data.tumYeterli ? (
                  <Badge className="bg-green-600 hover:bg-green-600/90">
                    <CheckCircle2 className="mr-1 size-3" />
                    {t("admin.erp.stoklar.yeterlilik.yeterli")}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 size-3" />
                    {t("admin.erp.stoklar.yeterlilik.yetersiz")}
                  </Badge>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.erp.stoklar.yeterlilik.columns.malzeme")}</TableHead>
                      <TableHead className="text-right">{t("admin.erp.stoklar.yeterlilik.columns.gerekli")}</TableHead>
                      <TableHead className="text-right">{t("admin.erp.stoklar.yeterlilik.columns.fire")}</TableHead>
                      <TableHead className="text-right">{t("admin.erp.stoklar.yeterlilik.columns.gerekliFire")}</TableHead>
                      <TableHead className="text-right">{t("admin.erp.stoklar.yeterlilik.columns.mevcut")}</TableHead>
                      <TableHead className="text-right">{t("admin.erp.stoklar.yeterlilik.columns.fark")}</TableHead>
                      <TableHead className="text-center">{t("admin.erp.stoklar.yeterlilik.columns.durum")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.kalemler.map((k) => (
                      <TableRow key={k.malzemeId} className={!k.yeterli ? "bg-red-50/60 dark:bg-red-950/20" : ""}>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-mono text-muted-foreground text-xs">{k.malzemeKod}</div>
                          <div className="text-sm">{k.malzemeAd}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm whitespace-nowrap">
                          {formatAmount(k.gerekliMiktar)} {k.birim}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          %{formatAmount(k.fireOrani)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm whitespace-nowrap">
                          {formatAmount(k.gerekliMiktarFireli)} {k.birim}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm whitespace-nowrap">
                          {formatAmount(k.mevcutStok)} {k.birim}
                        </TableCell>
                        <TableCell className={`text-right tabular-nums text-sm font-medium whitespace-nowrap ${k.fark < 0 ? "text-red-600" : "text-green-600"}`}>
                          {k.fark >= 0 ? "+" : ""}{formatAmount(k.fark)} {k.birim}
                        </TableCell>
                        <TableCell className="text-center">
                          {k.yeterli ? (
                            <CheckCircle2 className="mx-auto size-4 text-green-600" />
                          ) : (
                            <XCircle className="mx-auto size-4 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatAmount(value: number) {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
