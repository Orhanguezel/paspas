"use client";

// =============================================================
// FILE: src/app/(main)/admin/uretim-emirleri/_components/uretim-emirleri-client.tsx
// Paspas ERP — Üretim Emirleri liste sayfası
// =============================================================

import { useState } from "react";

import Link from "next/link";

import { AlertTriangle, Eye, Pencil, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
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
import type { UretimEmriDto, UretimEmriDurum } from "@/integrations/shared/erp/uretim_emirleri.types";
import { EMIR_DURUM_BADGE } from "@/integrations/shared/erp/uretim_emirleri.types";

import UretimEmriForm from "./uretim-emri-form";

export default function UretimEmirleriClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState<UretimEmriDurum | "hepsi">("hepsi");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UretimEmriDto | null>(null);
  const [deleteTarget, setDelete] = useState<UretimEmriDto | null>(null);

  const DURUM_OPTIONS: Array<{ value: UretimEmriDurum | "hepsi"; label: string }> = [
    { value: "hepsi", label: t("admin.erp.uretimEmirleri.statuses.hepsi") },
    { value: "planlandi", label: t("admin.erp.uretimEmirleri.statuses.planlandi") },
    { value: "hazirlaniyor", label: t("admin.erp.uretimEmirleri.statuses.hazirlaniyor") },
    { value: "uretimde", label: t("admin.erp.uretimEmirleri.statuses.uretimde") },
    { value: "tamamlandi", label: t("admin.erp.uretimEmirleri.statuses.tamamlandi") },
    { value: "iptal", label: t("admin.erp.uretimEmirleri.statuses.iptal") },
  ];

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== "hepsi" ? { durum } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useListUretimEmirleriAdminQuery(params);
  const [deleteEmri, deleteState] = useDeleteUretimEmriAdminMutation();

  const items = data?.items ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(e: UretimEmriDto) {
    setEditing(e);
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

  function ilerlemeYuzde(e: UretimEmriDto) {
    if (!e.planlananMiktar) return 0;
    return Math.min(100, Math.round((e.uretilenMiktar / e.planlananMiktar) * 100));
  }

  function getDurumLabel(d: UretimEmriDurum): string {
    return t(`admin.erp.uretimEmirleri.statuses.${d}`);
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    return String(value).slice(0, 16).replace("T", " ");
  }

  function renderDeleteButton(e: UretimEmriDto) {
    const button = (
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive disabled:text-muted-foreground"
        onClick={() => setDelete(e)}
        disabled={!e.silinebilir}
      >
        <Trash2 className="size-4" />
      </Button>
    );

    if (!e.silinebilir && e.silmeNedeni) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{button}</span>
            </TooltipTrigger>
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

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-48 max-w-xs flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("admin.erp.uretimEmirleri.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={durum} onValueChange={(v) => setDurum(v as UretimEmriDurum | "hepsi")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURUM_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.emirNo")}</TableHead>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.urunId")}</TableHead>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.musteri")}</TableHead>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.planlanan")}</TableHead>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.ilerleme")}</TableHead>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.termin")}</TableHead>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.bitis")}</TableHead>
              <TableHead>{t("admin.erp.uretimEmirleri.columns.durum")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`uretim-emri-skeleton-row-${i + 1}`}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={`uretim-emri-skeleton-cell-${i + 1}-${j + 1}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground text-sm">
                  {t("admin.erp.uretimEmirleri.notFound")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((e) => (
                <TableRow key={e.id} className={e.terminRiski ? "bg-destructive/5" : undefined}>
                  <TableCell className="font-medium font-mono">{e.emirNo}</TableCell>
                  <TableCell>
                    <div className="min-w-[180px]">
                      <div className="font-medium">{e.urunAd ?? e.urunId}</div>
                      <div className="text-muted-foreground text-xs">{e.urunKod ?? e.urunId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[140px]">
                      <div className="font-medium">
                        {e.musteriOzetTipi === "toplam" && e.musteriDetay ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-muted-foreground border-b border-dashed">
                                  {e.musteriAd ?? t("admin.erp.uretimEmirleri.form.toplamSiparis")}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <p className="whitespace-pre-line text-xs">
                                  {e.musteriDetay.replace(/\s*\|\s*/g, "\n")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          (e.musteriAd ??
                          (e.musteriOzetTipi === "manuel" ? t("admin.erp.uretimEmirleri.form.kaynakManuel") : "—"))
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {e.siparisNo
                          ? `${t("admin.erp.uretimEmirleri.form.siparisInfo")}: ${e.siparisNo}`
                          : t("admin.erp.uretimEmirleri.siparissiz")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{e.planlananMiktar}</TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Progress value={ilerlemeYuzde(e)} className="h-2 flex-1" />
                      <span className="w-8 text-right text-muted-foreground text-xs">{ilerlemeYuzde(e)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-[120px] items-center gap-1">
                      {e.terminRiski && <AlertTriangle className="size-3.5 text-destructive" />}
                      <span className={e.terminRiski ? "font-medium text-destructive" : undefined}>
                        {formatDate(e.terminTarihi)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[150px]">
                      <div>{formatDate(e.planlananBitisTarihi ?? e.bitisTarihi)}</div>
                      <div className="text-muted-foreground text-xs">
                        {e.makineAtamaSayisi > 0 ? `${e.makineAtamaSayisi} makine ataması` : "Makine ataması yok"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={e.terminRiski && e.durum !== "tamamlandi" ? "destructive" : EMIR_DURUM_BADGE[e.durum]}
                    >
                      {getDurumLabel(e.durum)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/uretim-emirleri/${e.id}`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                        <Pencil className="size-4" />
                      </Button>
                      {renderDeleteButton(e)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <UretimEmriForm open={formOpen} onClose={() => setFormOpen(false)} emri={editing} />

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
    </div>
  );
}
