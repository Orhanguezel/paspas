"use client";

import { Fragment, useMemo, useState } from "react";

import { PackageSearch, RefreshCcw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListHareketlerAdminQuery } from "@/integrations/endpoints/admin/erp/hareketler_admin.endpoints";
import { useListStoklarAdminQuery } from "@/integrations/endpoints/admin/erp/stoklar_admin.endpoints";
import { useListCategoriesAdminQuery } from "@/integrations/endpoints/admin/categories_admin.endpoints";
import { HAREKET_TIPI_LABELS } from "@/integrations/shared/erp/hareketler.types";
import type { StokDto } from "@/integrations/shared/erp/stoklar.types";

import StokDetayDialog from "./stok-detay-dialog";
import YeterlilikDialog from "./yeterlilik-dialog";

export default function StoklarClient() {
  const { t } = useLocaleContext();
  const PAGE_SIZE = 100;
  const [search, setSearch] = useState("");
  // Varsayilanlar: Kategori = Urunler, Sadece Stokta Olanlar acik (YN 9ec0f5cf).
  const [kategori, setKategori] = useState<string>("urun");
  const [durum, setDurum] = useState<"all" | StokDto["durum"]>("all");
  const [stokluOnly, setStokluOnly] = useState(true);
  // Negatif miktarli malzemeler modu (YN 201329ec). `stokluOnly` (stok > 0) ve
  // `durum=yetersiz` (stok <= 0) ile mantiken celisir; asagida karsilikli
  // dislama uygulanir, aksi halde sonuc daima bos donerdi.
  const [negatifOnly, setNegatifOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedUrunId, setExpandedUrunId] = useState<string | null>(null);
  const { data: categories = [] } = useListCategoriesAdminQuery({ limit: 50, sort: "display_order", order: "asc" });

  function negatifModunuAyarla(acik: boolean) {
    setNegatifOnly(acik);
    setPage(0);
    if (acik) {
      setStokluOnly(false);
      setDurum("all");
      setKategori("all");
    }
  }

  function stokluModunuAyarla(acik: boolean) {
    setStokluOnly(acik);
    setPage(0);
    if (acik) setNegatifOnly(false);
  }

  function durumuAyarla(value: "all" | StokDto["durum"]) {
    setDurum(value);
    setPage(0);
    // "Yetersiz" (stok <= 0) ile "Sadece Stokta Olanlar" (stok > 0) birlikte
    // imkansiz kosul uretir; kullanici aciklamasiz bos liste gormesin.
    if (value === "yetersiz") setStokluOnly(false);
  }

  const query = {
    ...(search ? { q: search } : {}),
    ...(kategori !== "all" ? { kategori } : {}),
    ...(durum !== "all" ? { durum, kritikOnly: durum !== "yeterli" } : {}),
    ...(stokluOnly ? { stokluOnly: true } : {}),
    ...(negatifOnly ? { negatifOnly: true } : {}),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    sort: durum === "all" ? "ad" : "kritik_stok",
    order: durum === "all" ? "asc" : "desc",
  } as const;

  const { data, isLoading, isFetching, refetch } = useListStoklarAdminQuery(query);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const counts = useMemo(
    () => ({
      toplam: total,
      kritik: items.filter((item) => item.durum === "kritik").length,
      yetersiz: items.filter((item) => item.durum === "yetersiz").length,
    }),
    [items, total],
  );

  function getEffectiveDurum(item: StokDto): StokDto["durum"] {
    if (item.kritikStok <= 0) return "yeterli";
    return item.durum;
  }

  function durumBadge(item: StokDto) {
    const durumValue = getEffectiveDurum(item);
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
          <Select value={kategori} onValueChange={(value) => { setKategori(value as typeof kategori); setPage(0); }}>
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
          <Select value={durum} onValueChange={(value) => durumuAyarla(value as typeof durum)}>
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
          <Button
            variant={negatifOnly ? "destructive" : "outline"}
            size="sm"
            onClick={() => negatifModunuAyarla(!negatifOnly)}
          >
            {negatifOnly ? "Negatif Filtresini Kapat" : "Miktarı Negatif Olanlar"}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Switch
              id="stoklu-only"
              checked={stokluOnly}
              disabled={negatifOnly}
              onCheckedChange={stokluModunuAyarla}
            />
            <Label htmlFor="stoklu-only" className="cursor-pointer text-sm">
              Sadece Stokta Olanlar
            </Label>
          </div>
        </div>

        {negatifOnly && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive text-sm">
            Negatif miktar modu açık — yalnızca stoğu sıfırın altına düşmüş malzemeler listeleniyor
            ({total} kayıt). Diğer filtreler bu modda sıfırlandı.
          </div>
        )}

        <Tabs value={kategori} onValueChange={(value) => { setKategori(value as typeof kategori); setPage(0); }}>
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
                <TableHead className="text-right">Serbest</TableHead>
                <TableHead>{t("admin.erp.stoklar.columns.durum")}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={`stok-skeleton-row-${index + 1}`}>
                    {Array.from({ length: 9 }).map((__, cellIndex) => (
                      <TableCell key={`stok-skeleton-cell-${index + 1}-${cellIndex + 1}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <PackageSearch className="size-5" />
                      <span>{t("admin.erp.stoklar.notFound")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                items.map((item) => (
                  <Fragment key={item.urunId}>
                  <TableRow
                    onClick={() => setExpandedUrunId((current) => current === item.urunId ? null : item.urunId)}
                    className={
                      item.durum === "yetersiz"
                        ? "cursor-pointer bg-red-50/60"
                        : item.durum === "kritik"
                          ? "cursor-pointer bg-orange-50/70"
                          : "cursor-pointer"
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
                    <TableCell className="text-right tabular-nums">
                      {item.serbestStok > 0 ? formatAmount(item.serbestStok) : "—"}
                    </TableCell>
                    <TableCell>{durumBadge(item)}</TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <StokDetayDialog stok={item} />
                    </TableCell>
                  </TableRow>
                  {expandedUrunId === item.urunId && (
                    <TableRow key={`${item.urunId}-hareketler`}>
                      <TableCell colSpan={9} className="bg-muted/20 p-0">
                        <RecentHareketlerInline urunId={item.urunId} />
                      </TableCell>
                    </TableRow>
                  )}
                  </Fragment>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Sayfalama: onceden liste sessizce ilk 100 kayitla sinirliydi ve
            geri kalani hic gorunmuyordu (S1). */}
        {total > PAGE_SIZE && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/10 px-4 py-3">
            <p className="text-muted-foreground text-sm">
              {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, total)} / {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Önceki
              </Button>
              <span className="text-muted-foreground text-sm">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage + 1 >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentHareketlerInline({ urunId }: { urunId: string }) {
  const { data, isLoading } = useListHareketlerAdminQuery({ urunId, limit: 10 });
  const hareketler = data?.items ?? [];

  return (
    <div className="px-4 py-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">Son 10 hareket</div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`hareket-inline-${index + 1}`} className="h-7 w-full" />
          ))}
        </div>
      ) : hareketler.length === 0 ? (
        <div className="rounded-md border border-dashed bg-background px-3 py-3 text-center text-muted-foreground text-sm">
          Hareket kaydı yok.
        </div>
      ) : (
        <div className="divide-y rounded-md border bg-background">
          {hareketler.map((hareket) => {
            const isCikis = hareket.hareketTipi === "cikis";
            const amount = Math.abs(hareket.miktar).toFixed(4).replace(/\.?0+$/, "");
            return (
              <div key={hareket.id} className="grid gap-2 px-3 py-2 text-sm sm:grid-cols-[150px_120px_100px_1fr]">
                <span className="text-muted-foreground">{hareket.createdAt.slice(0, 16).replace("T", " ")}</span>
                <span>{HAREKET_TIPI_LABELS[hareket.hareketTipi] ?? hareket.hareketTipi}</span>
                <span className={`font-medium tabular-nums ${isCikis ? "text-destructive" : "text-green-600"}`}>
                  {isCikis ? "-" : "+"}{amount}
                </span>
                <span className="truncate text-muted-foreground">{hareket.aciklama ?? "—"}</span>
              </div>
            );
          })}
        </div>
      )}
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
