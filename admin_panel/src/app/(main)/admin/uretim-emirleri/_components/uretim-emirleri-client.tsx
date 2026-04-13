"use client";

// =============================================================
// FILE: uretim-emirleri-client.tsx
// Paspas ERP — Üretim Emirleri liste sayfası
// =============================================================

import { useMemo, useState } from "react";

import Link from "next/link";

import { AlertTriangle, Eye, Factory, Pencil, Plus, RefreshCcw, Search, Trash2, Wrench, X } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useDeleteUretimEmriAdminMutation,
  useListUretimEmirleriAdminQuery,
} from "@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints";
import {
  useKuyrukCikarAdminMutation,
  useListKuyrukAdminQuery,
} from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import type { UretimEmriDto, UretimEmriDurum } from "@/integrations/shared/erp/uretim_emirleri.types";
import { EMIR_DURUM_BADGE } from "@/integrations/shared/erp/uretim_emirleri.types";
import { useCheckYeterlilikAdminQuery } from "@/integrations/endpoints/admin/erp/stoklar_admin.endpoints";

import UretimEmriForm from "./uretim-emri-form";
import { ReceteDetayModal } from "./recete-detay-modal";
import { MakineAtaSheet } from "./makine-ata-sheet";

// ── MalzemeBadge ─────────────────────────────────────────────
function MalzemeBadge({ urunId, miktar, receteId }: { urunId: string; miktar: number; receteId: string | null }) {
  const { data, isLoading } = useCheckYeterlilikAdminQuery(
    { urunId, miktar },
    { skip: !receteId },
  );

  if (!receteId) return <span className="text-muted-foreground text-xs">—</span>;
  if (isLoading) return <Skeleton className="h-5 w-16" />;
  if (!data) return <span className="text-muted-foreground text-xs">—</span>;

  if (data.tumYeterli) {
    return <Badge variant="default" className="bg-emerald-600 text-xs">Yeterli</Badge>;
  }

  const eksikSayisi = data.kalemler.filter((k) => !k.yeterli).length;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="text-xs cursor-help">
            {eksikSayisi} eksik
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            {data.kalemler.filter((k) => !k.yeterli).map((k) => (
              <div key={k.malzemeId}>
                <span className="font-medium">{k.malzemeAd}</span>: stok {k.mevcutStok.toFixed(1)}, gerekli {k.gerekliMiktarFireli.toFixed(1)} {k.birim}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Ana Bileşen ───────────────────────────────────────────────
export default function UretimEmirleriClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState<UretimEmriDurum | "hepsi">("hepsi");
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState("bitis_tarihi");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UretimEmriDto | null>(null);
  const [formInitialKaynak, setFormInitialKaynak] = useState<"manuel" | "siparis">("manuel");
  const [deleteTarget, setDelete] = useState<UretimEmriDto | null>(null);
  const [selectedEmirForRecete, setSelectedEmirForRecete] = useState<string | null>(null);
  const [makineAtaTarget, setMakineAtaTarget] = useState<UretimEmriDto | null>(null);
  const [cikarTarget, setCikarTarget] = useState<UretimEmriDto | null>(null);

  const DURUM_OPTIONS: Array<{ value: UretimEmriDurum | "hepsi"; label: string }> = [
    { value: "hepsi", label: t("admin.erp.uretimEmirleri.statuses.hepsi") },
    { value: "atanmamis", label: t("admin.erp.uretimEmirleri.statuses.atanmamis") },
    { value: "planlandi", label: t("admin.erp.uretimEmirleri.statuses.planlandi") },
    { value: "uretimde", label: t("admin.erp.uretimEmirleri.statuses.uretimde") },
    { value: "tamamlandi", label: t("admin.erp.uretimEmirleri.statuses.tamamlandi") },
    { value: "iptal", label: t("admin.erp.uretimEmirleri.statuses.iptal") },
  ];

  const SORT_OPTIONS = [
    { value: "created_at", label: t("admin.erp.uretimEmirleri.sortOptions.createdAt") },
    { value: "bitis_tarihi", label: t("admin.erp.uretimEmirleri.sortOptions.bitisTarihi") },
    { value: "baslangic_tarihi", label: t("admin.erp.uretimEmirleri.sortOptions.baslangicTarihi") },
    { value: "emir_no", label: t("admin.erp.uretimEmirleri.sortOptions.emirNo") },
  ];

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== "hepsi" ? { durum } : {}),
    ...(showCompleted ? { tamamlananlariGoster: true } : {}),
    sort: sortBy,
    order: (sortBy === "bitis_tarihi" ? "asc" : "desc") as "asc" | "desc",
  };

  const { data, isLoading, isFetching, refetch } = useListUretimEmirleriAdminQuery(params);
  const [deleteEmri, deleteState] = useDeleteUretimEmriAdminMutation();
  const { data: kuyruklar = [], isFetching: kuyrukFetching } = useListKuyrukAdminQuery(undefined, { skip: !cikarTarget });
  const [kuyrukCikar, { isLoading: cikarLoading }] = useKuyrukCikarAdminMutation();

  const rawItems = data?.items ?? [];

  const items = useMemo(() => {
    if (sortBy !== "bitis_tarihi") return rawItems;
    return [...rawItems].sort((a, b) => {
      const dateA = a.planlananBitisTarihi ?? a.bitisTarihi;
      const dateB = b.planlananBitisTarihi ?? b.bitisTarihi;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });
  }, [rawItems, sortBy]);

  const ozet = useMemo(() => {
    const terminRiskli = items.filter((item) => item.terminRiski && item.durum !== "tamamlandi").length;
    const aktif = items.filter((item) => item.durum === "planlandi" || item.durum === "uretimde").length;
    const tamamlanan = items.filter((item) => item.durum === "tamamlandi").length;
    return { toplam: data?.total ?? 0, terminRiskli, aktif, tamamlanan };
  }, [data?.total, items]);

  function openCreate() {
    setEditing(null);
    setFormInitialKaynak("manuel");
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEmri(deleteTarget.id).unwrap();
      toast.success(t("admin.erp.common.deleted", { item: t("admin.erp.uretimEmirleri.singular") }));
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "data" in err
          ? ((err as { data?: { error?: { message?: string; detail?: string } } }).data?.error?.detail ??
            (err as { data?: { error?: { message?: string; detail?: string } } }).data?.error?.message)
          : undefined;
      toast.error(message ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDelete(null);
    }
  }

  async function confirmCikar() {
    if (!cikarTarget) return;
    const allItems = kuyruklar.flatMap((g) => g.kuyruk);
    const emirItems = allItems.filter((k) => k.uretimEmriId === cikarTarget.id);

    if (emirItems.length === 0) {
      toast.error("Bu emrin kuyrukta atanmış operasyonu bulunamadı.");
      setCikarTarget(null);
      return;
    }

    // Aktif veya duraklatılmış operasyonlar çıkarılamaz
    const aktifler = emirItems.filter((k) => k.durum === 'calisiyor' || k.durum === 'duraklatildi');
    if (aktifler.length > 0) {
      toast.error("Aktif veya duraklatılmış operasyonlar çıkarılamaz. Önce operasyonu durdurun.");
      setCikarTarget(null);
      return;
    }

    const cikarilacaklar = emirItems.filter((k) => k.durum === 'bekliyor');
    if (cikarilacaklar.length === 0) {
      toast.error("Bu emrin çıkarılabilir operasyonu bulunamadı.");
      setCikarTarget(null);
      return;
    }

    try {
      for (const item of cikarilacaklar) {
        await kuyrukCikar(item.id).unwrap();
      }
      toast.success(`${cikarilacaklar.length} operasyon makineden çıkarıldı.`);
    } catch {
      toast.error("Makineden çıkarma sırasında hata oluştu.");
    } finally {
      setCikarTarget(null);
    }
  }

  function ilerlemeYuzde(e: UretimEmriDto) {
    if (!e.planlananMiktar) return 0;
    return Math.min(100, Math.round((e.uretilenMiktar / e.planlananMiktar) * 100));
  }

  function getDurumLabel(d: UretimEmriDurum): string {
    return t(`admin.erp.uretimEmirleri.statuses.${d}`);
  }

  function resetFilters() {
    setSearch("");
    setDurum("hepsi");
    setSortBy("bitis_tarihi");
  }

  function formatDateShort(value: string | null | undefined) {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return null;
    }
  }

  function renderDeleteButton(e: UretimEmriDto) {
    const button = (
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-destructive hover:text-destructive disabled:text-muted-foreground"
        onClick={() => setDelete(e)}
        disabled={!e.silinebilir}
      >
        <Trash2 className="size-3.5" />
      </Button>
    );

    if (!e.silinebilir && e.silmeNedeni) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><span>{button}</span></TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="whitespace-pre-line text-xs">{e.silmeNedeni}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return button;
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">{t("admin.erp.uretimEmirleri.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("admin.erp.common.totalCount", {
              count: String(data?.total ?? 0),
              item: t("admin.erp.uretimEmirleri.singular").toLowerCase(),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" /> {t("admin.erp.uretimEmirleri.newItem")}
          </Button>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("admin.erp.uretimEmirleri.summary.total"), value: ozet.toplam, color: "" },
          { label: t("admin.erp.uretimEmirleri.summary.active"), value: ozet.aktif, color: "text-blue-600" },
          { label: t("admin.erp.uretimEmirleri.summary.terminRiskli"), value: ozet.terminRiskli, color: ozet.terminRiskli > 0 ? "text-destructive" : "" },
          { label: t("admin.erp.uretimEmirleri.summary.completed"), value: ozet.tamamlanan, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="shadow-none">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <div className="relative w-full max-w-50">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder={t("admin.erp.uretimEmirleri.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={durum} onValueChange={(v) => setDurum(v as UretimEmriDurum | "hepsi")}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DURUM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
          {t("admin.erp.uretimEmirleri.resetFilters")}
        </Button>
        <Button
          variant={showCompleted ? "secondary" : "outline"}
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => setShowCompleted((v) => !v)}
        >
          {showCompleted ? "Tamamlananları Gizle" : "Tamamlananları Göster"}
        </Button>
      </div>

      {/* Tablo */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-32">{t("admin.erp.uretimEmirleri.columns.emirNo")}</TableHead>
              <TableHead className="min-w-40">{t("admin.erp.uretimEmirleri.columns.urunId")}</TableHead>
              <TableHead className="w-36">Müşteri</TableHead>
              <TableHead className="w-32">{t("admin.erp.uretimEmirleri.columns.bitis")}</TableHead>
              <TableHead className="w-24 text-right">{t("admin.erp.uretimEmirleri.columns.planlanan")}</TableHead>
              <TableHead className="w-36">{t("admin.erp.uretimEmirleri.columns.ilerleme")}</TableHead>
              <TableHead className="w-24 text-center">{t("admin.erp.uretimEmirleri.columns.malzeme")}</TableHead>
              <TableHead className="w-48">Makine</TableHead>
              <TableHead className="w-24 text-right pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`ue-skel-${i + 1}`}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={`ue-skel-${i + 1}-${j + 1}`}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-muted-foreground">
                  {t("admin.erp.uretimEmirleri.notFound")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.map((e) => {
              const planlananBitis = formatDateShort(e.planlananBitisTarihi);
              const ilerleYuzde = ilerlemeYuzde(e);
              const atanmamis = e.makineAtamaSayisi === 0;

              return (
                <TableRow
                  key={e.id}
                  className={`group hover:bg-slate-50/80 transition-colors ${e.terminRiski && e.durum !== "tamamlandi" ? "bg-destructive/5" : ""}`}
                >
                  {/* Emir No + Durum */}
                  <TableCell>
                    <div className="font-bold font-mono text-sm text-slate-900 leading-none">{e.emirNo}</div>
                    <Badge
                      className="mt-1 px-2 py-0 text-[10px] font-semibold"
                      variant={e.terminRiski && e.durum !== "tamamlandi" ? "destructive" : EMIR_DURUM_BADGE[e.durum]}
                    >
                      {getDurumLabel(e.durum)}
                    </Badge>
                  </TableCell>

                  {/* Ürün */}
                  <TableCell>
                    <div className="font-medium text-sm text-slate-900 line-clamp-1">{e.urunAd ?? e.urunId}</div>
                    {e.urunKod && <div className="text-xs text-muted-foreground font-mono">{e.urunKod}</div>}
                    {e.siparisNo && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Sipariş: {e.siparisNo}
                      </div>
                    )}
                  </TableCell>

                  {/* Müşteri */}
                  <TableCell>
                    {e.musteriAd ? (
                      <div
                        className="text-sm text-slate-700 truncate max-w-32 font-medium"
                        title={e.musteriDetay || undefined}
                      >
                        {e.musteriAd}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {t("admin.erp.uretimEmirleri.siparissiz")}
                      </span>
                    )}
                  </TableCell>

                  {/* Planlanan Bitiş */}
                  <TableCell>
                    {planlananBitis ? (
                      <div className="text-sm font-medium text-slate-700">{planlananBitis}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    {e.terminRiski && e.durum !== "tamamlandi" && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="size-3 text-destructive" />
                        <span className="text-[10px] text-destructive font-medium">Termin riski</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Planlanan Miktar */}
                  <TableCell className="text-right">
                    <span className="font-bold text-sm text-slate-900">
                      {e.planlananMiktar.toLocaleString("tr-TR")}
                    </span>
                  </TableCell>

                  {/* İlerleme */}
                  <TableCell>
                    <div className="text-xs text-muted-foreground mb-1">
                      {e.uretilenMiktar.toLocaleString("tr-TR")} / {e.planlananMiktar.toLocaleString("tr-TR")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={ilerleYuzde} className="h-1.5 flex-1 max-w-20" />
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums">{ilerleYuzde}%</span>
                    </div>
                  </TableCell>

                  {/* Malzeme */}
                  <TableCell className="text-center">
                    <MalzemeBadge urunId={e.urunId} miktar={e.planlananMiktar} receteId={e.receteId} />
                  </TableCell>

                  {/* Makine */}
                  <TableCell>
                    {atanmamis ? (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Atanmamış</span>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => setMakineAtaTarget(e)}
                          >
                            <Factory className="size-3" />
                            Makine Ata
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-700 flex items-center gap-1">
                          <Factory className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-30">{e.makineAdlari}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] px-1.5 text-destructive hover:text-destructive gap-1"
                          onClick={() => setCikarTarget(e)}
                        >
                          <X className="size-3" />
                          Makineden Çıkar
                        </Button>
                      </div>
                    )}
                  </TableCell>

                  {/* Aksiyonlar */}
                  <TableCell className="text-right pr-3">
                    <div className="flex justify-end items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-indigo-600"
                        title="Reçete Detayı"
                        onClick={() => setSelectedEmirForRecete(e.id)}
                      >
                        <Wrench className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7" asChild>
                        <Link href={`/admin/uretim-emirleri/${e.id}`}>
                          <Eye className="size-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditing(e); setFormOpen(true); }}>
                        <Pencil className="size-3.5" />
                      </Button>
                      {renderDeleteButton(e)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Form Sheet */}
      <UretimEmriForm open={formOpen} onClose={() => setFormOpen(false)} emri={editing} initialKaynak={formInitialKaynak} />

      {/* Makine Ata Sheet */}
      <MakineAtaSheet
        emirId={makineAtaTarget?.id ?? null}
        emirNo={makineAtaTarget?.emirNo ?? ""}
        open={!!makineAtaTarget}
        onClose={() => setMakineAtaTarget(null)}
      />

      {/* Sil Onayı */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.uretimEmirleri.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.erp.common.deleteDescriptionIrreversible", { name: deleteTarget?.emirNo ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteState.isLoading ? t("admin.erp.common.deleting") : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Makineden Çıkar Onayı */}
      <AlertDialog open={!!cikarTarget} onOpenChange={(v) => !v && setCikarTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Makineden Çıkar</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{cikarTarget?.emirNo}</strong> emrinin tüm makine atamaları kaldırılacak. Devam edilsin mi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCikar}
              disabled={cikarLoading || kuyrukFetching}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cikarLoading ? "Çıkarılıyor…" : kuyrukFetching ? "Yükleniyor…" : "Evet, Çıkar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReceteDetayModal
        emirId={selectedEmirForRecete}
        onOpenChange={(open) => !open && setSelectedEmirForRecete(null)}
      />
    </div>
  );
}
