"use client";

import { useMemo, useState } from "react";

import { PackageSearch, RefreshCcw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListStoklarAdminQuery } from "@/integrations/endpoints/admin/erp/stoklar_admin.endpoints";
import { useListCategoriesAdminQuery } from "@/integrations/endpoints/admin/categories_admin.endpoints";
import type { StokDto } from "@/integrations/shared/erp/stoklar.types";

import StokDetayDialog from "./stok-detay-dialog";
import YeterlilikDialog from "./yeterlilik-dialog";

export default function StoklarClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState<string>("all");
  const [durum, setDurum] = useState<"all" | StokDto["durum"]>("all");
  const { data: categories = [] } = useListCategoriesAdminQuery({ limit: 50, sort: "display_order", order: "asc" });

  const query = {
    ...(search ? { q: search } : {}),
    ...(kategori !== "all" ? { kategori } : {}),
    ...(durum !== "all" ? { durum, kritikOnly: durum !== "yeterli" } : {}),
    sort: durum === "all" ? "ad" : "kritik_stok",
    order: durum === "all" ? "asc" : "desc",
  } as const;

  const { data, isLoading, isFetching, refetch } = useListStoklarAdminQuery(query);

  const items = data?.items ?? [];
  const counts = useMemo(
    () => ({
      toplam: items.length,
      kritik: items.filter((item) => item.durum === "kritik").length,
      yetersiz: items.filter((item) => item.durum === "yetersiz").length,
    }),
    [items],
  );

  function durumBadge(durumValue: StokDto["durum"]) {
    if (durumValue === "yetersiz") {
      return <Badge variant="destructive">{t("admin.erp.stoklar.status.yetersiz")}</Badge>;
    }
    if (durumValue === "kritik") {
      return <Badge className="bg-orange-500 hover:bg-orange-500/90">{t("admin.erp.stoklar.status.kritik")}</Badge>;
    }
    return <Badge variant="secondary">{t("admin.erp.stoklar.status.yeterli")}</Badge>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">{t("admin.erp.stoklar.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("admin.erp.common.totalCount", {
              count: String(data?.total ?? 0),
              item: t("admin.erp.stoklar.singular").toLowerCase(),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <YeterlilikDialog />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </div>
      </div>



      <div className="rounded-xl border bg-background p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("admin.erp.stoklar.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={kategori} onValueChange={(value) => setKategori(value as typeof kategori)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.erp.stoklar.filters.allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.kod} value={cat.kod}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={durum} onValueChange={(value) => setDurum(value as typeof durum)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.erp.stoklar.filters.allStatuses")}</SelectItem>
              <SelectItem value="yeterli">{t("admin.erp.stoklar.status.yeterli")}</SelectItem>
              <SelectItem value="kritik">{t("admin.erp.stoklar.status.kritik")}</SelectItem>
              <SelectItem value="yetersiz">{t("admin.erp.stoklar.status.yetersiz")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={kategori} onValueChange={(value) => setKategori(value as typeof kategori)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.kod} value={cat.kod}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.erp.stoklar.columns.kod")}</TableHead>
                <TableHead>{t("admin.erp.stoklar.columns.ad")}</TableHead>
                <TableHead>{t("admin.erp.stoklar.columns.kategori")}</TableHead>
                <TableHead>{t("admin.erp.stoklar.columns.birim")}</TableHead>
                <TableHead className="text-right">{t("admin.erp.stoklar.columns.stokMiktari")}</TableHead>
                <TableHead className="text-right">Rezerve</TableHead>
                <TableHead className="text-right">Açık İhtiyaç</TableHead>
                <TableHead className="text-right">Serbest</TableHead>
                <TableHead className="text-right">{t("admin.erp.stoklar.columns.kritikStok")}</TableHead>
                <TableHead className="text-right">{t("admin.erp.stoklar.columns.kritikAcik")}</TableHead>
                <TableHead>{t("admin.erp.stoklar.columns.durum")}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`stok-skeleton-row-${index + 1}`}>
                    {Array.from({ length: 12 }).map((__, cellIndex) => (
                      <TableCell key={`stok-skeleton-cell-${index + 1}-${cellIndex + 1}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <PackageSearch className="size-5" />
                      <span>{t("admin.erp.stoklar.notFound")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                items.map((item) => (
                  <TableRow
                    key={item.urunId}
                    className={
                      item.durum === "yetersiz" ? "bg-red-50/60" : item.durum === "kritik" ? "bg-orange-50/70" : ""
                    }
                  >
                    <TableCell className="font-mono text-xs">{item.urunKod}</TableCell>
                    <TableCell className="font-medium">{item.urunAd}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`admin.erp.urunler.kategoriLabel.${item.kategori}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span>{item.birim}</span>
                      {item.birimDonusumleri.length > 0 && (
                        <div className="mt-0.5 space-y-0 text-[11px] text-muted-foreground leading-tight">
                          {item.birimDonusumleri.map((d) => (
                            <div key={d.hedefBirim}>
                              1 {d.hedefBirim} = {formatAmount(d.carpan)} {item.birim}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span>{formatAmount(item.stok)}</span>
                      {item.birimDonusumleri.length > 0 && (
                        <div className="mt-0.5 space-y-0 text-[11px] text-muted-foreground leading-tight">
                          {item.birimDonusumleri.map((d) => (
                            <div key={d.hedefBirim}>
                              {formatAmount(item.stok / d.carpan)} {d.hedefBirim}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${item.rezerveStok > 0 ? "text-amber-600" : ""}`}>
                      {item.rezerveStok > 0 ? formatAmount(item.rezerveStok) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(item.acikUretimIhtiyaci)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.serbestStok > 0 ? formatAmount(item.serbestStok) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(item.kritikStok)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatAmount(item.kritikAcik)}</TableCell>
                    <TableCell>{durumBadge(item.durum)}</TableCell>
                    <TableCell>
                      <StokDetayDialog stok={item} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: string; tone: "default" | "warning" | "danger" }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : "border-border bg-background text-foreground";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <p className="font-medium text-xs uppercase tracking-wide opacity-80">{title}</p>
      <p className="mt-2 font-semibold text-2xl">{value}</p>
    </div>
  );
}

function formatAmount(value: number) {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}
