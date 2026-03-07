"use client";

// =============================================================
// FILE: src/app/(main)/admin/tanimlar/_components/tanimlar-client.tsx
// Paspas ERP — Tanımlar yönetim sayfası (Kalıplar + Tatiller + Vardiyalar + Duruş Nedenleri)
// =============================================================

import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Eye, Pencil, Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListMakinelerAdminQuery } from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import {
  useDeleteDurusNedeniAdminMutation,
  useDeleteKalipAdminMutation,
  useDeleteTatilAdminMutation,
  useDeleteVardiyaAdminMutation,
  useListDurusNedenleriAdminQuery,
  useListKaliplarAdminQuery,
  useListTatillerAdminQuery,
  useListVardiyalarAdminQuery,
  useSetUyumluMakinelerAdminMutation,
} from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import {
  DURUS_KATEGORI_LABELS,
  type DurusNedeniDto,
  type KalipDto,
  type TatilDto,
  type VardiyaDto,
} from "@/integrations/shared/erp/tanimlar.types";

import DurusNedeniForm from "./durus-nedeni-form";
import KalipForm from "./kalip-form";
import TatilForm from "./tatil-form";
import VardiyaForm from "./vardiya-form";

function formatTatilDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat("tr-TR").format(date);
}

function getApiErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "error" in error.data &&
    error.data.error &&
    typeof error.data.error === "object" &&
    "message" in error.data.error &&
    typeof error.data.error.message === "string"
  ) {
    return error.data.error.message;
  }
  return null;
}

export default function TanimlarClient() {
  const { t } = useLocaleContext();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "tatiller") return "tatiller";
    if (tab === "vardiyalar") return "vardiyalar";
    if (tab === "durus-nedenleri") return "durus-nedenleri";
    return "kaliplar";
  }, [searchParams]);
  const isKaliplar      = activeTab === "kaliplar";
  const isTatiller      = activeTab === "tatiller";
  const isVardiyalar    = activeTab === "vardiyalar";
  const isDurusNedenleri = activeTab === "durus-nedenleri";

  const [kalipFormOpen, setKalipFormOpen] = useState(false);
  const [editingKalip, setEditingKalip] = useState<KalipDto | null>(null);
  const [deleteKalip, setDeleteKalip] = useState<KalipDto | null>(null);
  const [selectedKalipId, setSelectedKalipId] = useState<string | null>(null);

  const [tatilFormOpen, setTatilFormOpen] = useState(false);
  const [viewingTatil, setViewingTatil] = useState<TatilDto | null>(null);
  const [editingTatil, setEditingTatil] = useState<TatilDto | null>(null);
  const [deleteTatil, setDeleteTatil] = useState<TatilDto | null>(null);

  const [vardiyaFormOpen, setVardiyaFormOpen] = useState(false);
  const [editingVardiya, setEditingVardiya] = useState<VardiyaDto | null>(null);
  const [deleteVardiya, setDeleteVardiya] = useState<VardiyaDto | null>(null);

  const [durusFormOpen, setDurusFormOpen] = useState(false);
  const [editingDurus, setEditingDurus] = useState<DurusNedeniDto | null>(null);
  const [deleteDurus, setDeleteDurus] = useState<DurusNedeniDto | null>(null);

  const { data: kaliplar, isLoading: kalipLoading, refetch: refetchKalip } = useListKaliplarAdminQuery();
  const { data: makineData, isLoading: makineLoading } = useListMakinelerAdminQuery();
  const { data: tatiller, isLoading: tatilLoading, refetch: refetchTatil } = useListTatillerAdminQuery();
  const { data: vardiyalar, isLoading: vardiyaLoading, refetch: refetchVardiya } = useListVardiyalarAdminQuery();
  const { data: durusNedenleri, isLoading: durusLoading, refetch: refetchDurus } = useListDurusNedenleriAdminQuery();
  const [doDeleteKalip, deleteKalipState] = useDeleteKalipAdminMutation();
  const [setUyumluMakineler, setUyumluMakinelerState] = useSetUyumluMakinelerAdminMutation();
  const [doDeleteTatil, deleteTatilState] = useDeleteTatilAdminMutation();
  const [doDeleteVardiya, deleteVardiyaState] = useDeleteVardiyaAdminMutation();
  const [doDeleteDurus, deleteDurusState] = useDeleteDurusNedeniAdminMutation();
  const [matrixState, setMatrixState] = useState<Record<string, string[]>>({});
  const [dirtyKalipIds, setDirtyKalipIds] = useState<string[]>([]);

  const makineler = useMemo(() => (makineData?.items ?? []).filter((makine) => makine.isActive), [makineData?.items]);

  useEffect(() => {
    if (!makineData?.items?.length) return;
    const next: Record<string, string[]> = {};
    for (const makine of makineData.items) {
      for (const kalipId of makine.kalipIds) {
        next[kalipId] = [...(next[kalipId] ?? []), makine.id];
      }
    }
    setMatrixState(next);
  }, [makineData?.items]);

  useEffect(() => {
    if (!kaliplar?.items?.length) {
      setSelectedKalipId(null);
      return;
    }
    if (!selectedKalipId || !kaliplar.items.some((kalip) => kalip.id === selectedKalipId)) {
      setSelectedKalipId(kaliplar.items[0]?.id ?? null);
    }
  }, [kaliplar?.items, selectedKalipId]);

  async function confirmDeleteKalip() {
    if (!deleteKalip) return;
    try {
      await doDeleteKalip(deleteKalip.id).unwrap();
      toast.success(t("admin.erp.common.deleted"));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDeleteKalip(null);
    }
  }

  async function confirmDeleteTatil() {
    if (!deleteTatil) return;
    try {
      await doDeleteTatil(deleteTatil.id).unwrap();
      toast.success(t("admin.erp.common.deleted"));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDeleteTatil(null);
    }
  }

  async function confirmDeleteVardiya() {
    if (!deleteVardiya) return;
    try {
      await doDeleteVardiya(deleteVardiya.id).unwrap();
      toast.success(t("admin.erp.common.deleted"));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDeleteVardiya(null);
    }
  }

  async function confirmDeleteDurus() {
    if (!deleteDurus) return;
    try {
      await doDeleteDurus(deleteDurus.id).unwrap();
      toast.success(t("admin.erp.common.deleted"));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDeleteDurus(null);
    }
  }

  function toggleUyumluluk(kalipId: string, makineId: string, checked: boolean) {
    setMatrixState((prev) => {
      const current = prev[kalipId] ?? [];
      const next = checked ? Array.from(new Set([...current, makineId])) : current.filter((id) => id !== makineId);
      return { ...prev, [kalipId]: next };
    });
    setDirtyKalipIds((prev) => (prev.includes(kalipId) ? prev : [...prev, kalipId]));
  }

  async function kaydetUyumluluk(kalipId: string) {
    try {
      await setUyumluMakineler({
        kalipId,
        body: { makineIds: matrixState[kalipId] ?? [] },
      }).unwrap();
      setDirtyKalipIds((prev) => prev.filter((id) => id !== kalipId));
      toast.success(t("admin.erp.tanimlar.kaliplar.matrix.saved"));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t("admin.erp.common.operationFailed2"));
    }
  }

  const selectedKalip = useMemo(
    () => kaliplar?.items.find((kalip) => kalip.id === selectedKalipId) ?? null,
    [kaliplar?.items, selectedKalipId],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">
          {isKaliplar
            ? t("admin.erp.tanimlar.tabs.kaliplar")
            : isTatiller
              ? t("admin.erp.tanimlar.tabs.tatiller")
              : isVardiyalar
                ? t("admin.erp.tanimlar.tabs.vardiyalar")
                : t("admin.erp.tanimlar.tabs.durusNedenleri")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isKaliplar
            ? t("admin.erp.tanimlar.kaliplar.pageDescription")
            : isTatiller
              ? t("admin.erp.tanimlar.tatiller.pageDescription")
              : isVardiyalar
                ? t("admin.erp.tanimlar.vardiyalar.pageDescription")
                : t("admin.erp.tanimlar.durusNedenleri.pageDescription")}
        </p>
      </div>

      {isKaliplar ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {kaliplar?.total ?? 0} {t("admin.erp.tanimlar.kaliplar.count")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchKalip()}>
                <RefreshCcw className="size-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingKalip(null);
                  setKalipFormOpen(true);
                }}
              >
                <Plus className="mr-1 size-4" /> {t("admin.erp.tanimlar.kaliplar.newItem")}
              </Button>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle>{t("admin.erp.tanimlar.tabs.kaliplar")}</CardTitle>
                <CardDescription>{t("admin.erp.tanimlar.kaliplar.pageDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {kalipLoading ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {["k1", "k2", "k3", "k4"].map((key) => (
                      <div key={key} className="rounded-lg border p-4">
                        <Skeleton className="mb-2 h-4 w-24" />
                        <Skeleton className="mb-3 h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : !kaliplar?.items.length ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("admin.erp.tanimlar.kaliplar.notFound")}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {kaliplar.items.map((kalip) => {
                      const isSelected = kalip.id === selectedKalipId;
                      const uyumluSayisi = matrixState[kalip.id]?.length ?? 0;
                      return (
                        <div
                          role="button"
                          tabIndex={0}
                          key={kalip.id}
                          onClick={() => setSelectedKalipId(kalip.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedKalipId(kalip.id); } }}
                          className={`cursor-pointer rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/40 hover:bg-muted/30"
                          }`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-mono text-xs text-muted-foreground">{kalip.kod}</div>
                              <div className="truncate font-medium text-sm">{kalip.ad}</div>
                            </div>
                            {kalip.isActive ? (
                              <Badge variant="default">{t("admin.erp.common.active")}</Badge>
                            ) : (
                              <Badge variant="secondary">{t("admin.erp.common.inactive")}</Badge>
                            )}
                          </div>
                          <p className="mb-4 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                            {kalip.aciklama ?? "—"}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {uyumluSayisi} {t("admin.erp.tanimlar.kaliplar.matrix.machineCount")}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditingKalip(kalip);
                                  setKalipFormOpen(true);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeleteKalip(kalip);
                                }}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <CardTitle>{t("admin.erp.tanimlar.kaliplar.matrix.title")}</CardTitle>
                <CardDescription>{t("admin.erp.tanimlar.kaliplar.matrix.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {!selectedKalip ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    {t("admin.erp.tanimlar.kaliplar.matrix.selectPrompt")}
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="font-mono text-xs text-muted-foreground">{selectedKalip.kod}</div>
                      <div className="mt-1 font-medium">{selectedKalip.ad}</div>
                      <p className="mt-2 text-sm text-muted-foreground">{selectedKalip.aciklama ?? "—"}</p>
                    </div>

                    {makineLoading ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {["m1", "m2", "m3", "m4"].map((key) => (
                          <div key={key} className="rounded-lg border p-4">
                            <Skeleton className="mb-2 h-4 w-20" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {makineler.map((makine) => (
                          <label
                            key={makine.id}
                            className="flex items-start gap-3 rounded-xl border p-4 transition hover:border-primary/40 hover:bg-muted/20"
                          >
                            <Checkbox
                              checked={(matrixState[selectedKalip.id] ?? []).includes(makine.id)}
                              onCheckedChange={(checked) =>
                                toggleUyumluluk(selectedKalip.id, makine.id, checked === true)
                              }
                            />
                            <div className="min-w-0">
                              <div className="font-mono text-sm font-medium">{makine.kod}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {makine.calisir24Saat
                                  ? t("admin.erp.tanimlar.kaliplar.matrix.machine24h")
                                  : t("admin.erp.tanimlar.kaliplar.matrix.machineShift")}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-xl border bg-background p-3">
                      <span className="text-sm text-muted-foreground">
                        {(matrixState[selectedKalip.id] ?? []).length} {t("admin.erp.tanimlar.kaliplar.matrix.machineCount")}
                      </span>
                      <Button
                        size="sm"
                        disabled={!dirtyKalipIds.includes(selectedKalip.id) || setUyumluMakinelerState.isLoading}
                        onClick={() => kaydetUyumluluk(selectedKalip.id)}
                      >
                        <Save className="mr-1 size-4" />
                        {t("admin.common.save")}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : isTatiller ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {tatiller?.total ?? 0} {t("admin.erp.tanimlar.tatiller.count")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchTatil()}>
                <RefreshCcw className="size-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingTatil(null);
                  setTatilFormOpen(true);
                }}
              >
                <Plus className="mr-1 size-4" /> {t("admin.erp.tanimlar.tatiller.newItem")}
              </Button>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.erp.tanimlar.tatiller.columns.tarih")}</TableHead>
                  <TableHead>{t("admin.erp.tanimlar.tatiller.columns.ad")}</TableHead>
                  <TableHead>{t("admin.erp.tanimlar.tatiller.columns.saatAraligi")}</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tatilLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!tatilLoading && !tatiller?.items.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      {t("admin.erp.tanimlar.tatiller.notFound")}
                    </TableCell>
                  </TableRow>
                )}
                {!tatilLoading &&
                  tatiller?.items.map((tatil) => (
                    <TableRow key={tatil.id}>
                      <TableCell className="font-mono">{formatTatilDate(tatil.tarih)}</TableCell>
                      <TableCell className="font-medium">{tatil.ad}</TableCell>
                      <TableCell className="font-mono">
                        {tatil.baslangicSaati} - {tatil.bitisSaati}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewingTatil(tatil)}>
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingTatil(tatil);
                              setTatilFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTatil(tatil)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : isVardiyalar ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {vardiyalar?.total ?? 0} {t("admin.erp.tanimlar.vardiyalar.count")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchVardiya()}>
                <RefreshCcw className="size-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingVardiya(null);
                  setVardiyaFormOpen(true);
                }}
              >
                <Plus className="mr-1 size-4" /> {t("admin.erp.tanimlar.vardiyalar.newItem")}
              </Button>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.erp.tanimlar.vardiyalar.columns.ad")}</TableHead>
                  <TableHead>{t("admin.erp.tanimlar.vardiyalar.columns.saatAraligi")}</TableHead>
                  <TableHead>{t("admin.erp.tanimlar.vardiyalar.columns.durum")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {vardiyaLoading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!vardiyaLoading && !vardiyalar?.items.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      {t("admin.erp.tanimlar.vardiyalar.notFound")}
                    </TableCell>
                  </TableRow>
                )}
                {!vardiyaLoading &&
                  vardiyalar?.items.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.ad}</TableCell>
                      <TableCell className="font-mono">{v.baslangicSaati} – {v.bitisSaati}</TableCell>
                      <TableCell>
                        {v.isActive
                          ? <Badge variant="default">{t("admin.erp.common.active")}</Badge>
                          : <Badge variant="secondary">{t("admin.erp.common.inactive")}</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => { setEditingVardiya(v); setVardiyaFormOpen(true); }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteVardiya(v)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {durusNedenleri?.total ?? 0} {t("admin.erp.tanimlar.durusNedenleri.count")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetchDurus()}>
                <RefreshCcw className="size-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingDurus(null);
                  setDurusFormOpen(true);
                }}
              >
                <Plus className="mr-1 size-4" /> {t("admin.erp.tanimlar.durusNedenleri.newItem")}
              </Button>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">{t("admin.erp.tanimlar.durusNedenleri.columns.kod")}</TableHead>
                  <TableHead>{t("admin.erp.tanimlar.durusNedenleri.columns.ad")}</TableHead>
                  <TableHead>{t("admin.erp.tanimlar.durusNedenleri.columns.kategori")}</TableHead>
                  <TableHead>{t("admin.erp.tanimlar.durusNedenleri.columns.durum")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {durusLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                {!durusLoading && !durusNedenleri?.items.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      {t("admin.erp.tanimlar.durusNedenleri.notFound")}
                    </TableCell>
                  </TableRow>
                )}
                {!durusLoading &&
                  durusNedenleri?.items.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono font-semibold">{d.kod}</TableCell>
                      <TableCell>{d.ad}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{DURUS_KATEGORI_LABELS[d.kategori]}</Badge>
                      </TableCell>
                      <TableCell>
                        {d.isActive
                          ? <Badge variant="default">{t("admin.erp.common.active")}</Badge>
                          : <Badge variant="secondary">{t("admin.erp.common.inactive")}</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => { setEditingDurus(d); setDurusFormOpen(true); }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteDurus(d)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <KalipForm open={kalipFormOpen} onClose={() => setKalipFormOpen(false)} kalip={editingKalip} />
      <TatilForm open={tatilFormOpen} onClose={() => setTatilFormOpen(false)} tatil={editingTatil} />
      <VardiyaForm open={vardiyaFormOpen} onClose={() => setVardiyaFormOpen(false)} vardiya={editingVardiya} />
      <DurusNedeniForm open={durusFormOpen} onClose={() => setDurusFormOpen(false)} durusNedeni={editingDurus} />
      <Dialog open={!!viewingTatil} onOpenChange={(open) => !open && setViewingTatil(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewingTatil?.ad ?? t("admin.erp.tanimlar.tatiller.singular")}</DialogTitle>
            <DialogDescription>{t("admin.erp.tanimlar.tatiller.detailDescription")}</DialogDescription>
          </DialogHeader>
          {viewingTatil && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">{t("admin.erp.tanimlar.tatiller.columns.tarih")}</p>
                  <p className="font-mono">{formatTatilDate(viewingTatil.tarih)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("admin.erp.tanimlar.tatiller.columns.saatAraligi")}</p>
                  <p className="font-mono">
                    {viewingTatil.baslangicSaati} - {viewingTatil.bitisSaati}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">{t("admin.erp.tanimlar.tatiller.affects")}</p>
                <p>{t("admin.erp.tanimlar.tatiller.affectsDescription")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("admin.erp.tanimlar.tatiller.columns.aciklama")}</p>
                <p>{viewingTatil.aciklama || t("admin.erp.tanimlar.tatiller.noDescription")}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Kalip sil */}
      <AlertDialog open={!!deleteKalip} onOpenChange={(v) => !v && setDeleteKalip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.tanimlar.kaliplar.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteKalip?.ad}</strong> {t("admin.erp.common.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteKalip}
              disabled={deleteKalipState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKalipState.isLoading ? t("admin.erp.common.deleting") : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tatil sil */}
      <AlertDialog open={!!deleteTatil} onOpenChange={(v) => !v && setDeleteTatil(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.tanimlar.tatiller.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTatil?.ad}</strong> {t("admin.erp.common.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTatil}
              disabled={deleteTatilState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTatilState.isLoading ? t("admin.erp.common.deleting") : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vardiya sil */}
      <AlertDialog open={!!deleteVardiya} onOpenChange={(v) => !v && setDeleteVardiya(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.tanimlar.vardiyalar.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteVardiya?.ad}</strong> {t("admin.erp.common.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVardiya}
              disabled={deleteVardiyaState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVardiyaState.isLoading ? t("admin.erp.common.deleting") : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duruş nedeni sil */}
      <AlertDialog open={!!deleteDurus} onOpenChange={(v) => !v && setDeleteDurus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.tanimlar.durusNedenleri.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteDurus?.ad}</strong> {t("admin.erp.common.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDurus}
              disabled={deleteDurusState.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDurusState.isLoading ? t("admin.erp.common.deleting") : t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
