"use client";

import { Fragment, useState } from "react";

import { Calendar, ChevronDown, ChevronUp, Clock, Factory, Pencil, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useDeleteMakineAdminMutation,
  useGetMakineCapacityAdminQuery,
  useListMakinelerAdminQuery,
} from "@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints";
import { MAKINE_DURUM_BADGE, type MakineDto, type MakineDurum } from "@/integrations/shared/erp/makine_havuzu.types";

import MakineForm from "../../makine-havuzu/_components/makine-form";

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

function MakineExpandedRow({ makine }: { makine: MakineDto }) {
  const { data: capacityData, isLoading: capacityLoading } = useGetMakineCapacityAdminQuery(
    { id: makine.id, params: { days: 30 } },
  );

  const holidays = capacityData?.gunler.filter((g) => g.tatilMi) ?? [];
  const weekendWorkDays = capacityData?.gunler.filter((g) => g.haftaSonuMu && g.calisiyor) ?? [];

  return (
    <div className="px-4 py-4 bg-muted/30">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Uyumlu Kalıplar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Factory className="size-4" />
              Uyumlu Kalıplar
            </CardTitle>
            <CardDescription className="text-xs">
              Bu makine ile çalışabilen kalıplar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {makine.kaliplar.length === 0 ? (
              <p className="text-sm text-muted-foreground">Uyumlu kalıp tanımlanmamış</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {makine.kaliplar.map((kalip) => (
                  <Badge key={kalip.id} variant="secondary">
                    {kalip.kod} — {kalip.ad}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kapasite Özeti */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="size-4" />
              30 Günlük Kapasite
            </CardTitle>
            <CardDescription className="text-xs">
              {capacityData
                ? `${capacityData.baslangicTarihi} — ${capacityData.bitisTarihi}`
                : "Hesaplanıyor..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {capacityLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : capacityData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Çalışma Günü</p>
                    <p className="font-semibold text-lg">{capacityData.toplamCalismaGunu} gün</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Toplam Çalışma Saati</p>
                    <p className="font-semibold text-lg">{capacityData.toplamCalismaSaati} saat</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md bg-background p-2 text-center">
                    <p className="font-medium">{capacityData.gunlukCalismaSaati}s/gün</p>
                    <p className="text-muted-foreground">Günlük</p>
                  </div>
                  <div className="rounded-md bg-background p-2 text-center">
                    <p className="font-medium">{holidays.length} gün</p>
                    <p className="text-muted-foreground">Tatil</p>
                  </div>
                  <div className="rounded-md bg-background p-2 text-center">
                    <p className="font-medium">{weekendWorkDays.length} gün</p>
                    <p className="text-muted-foreground">H.sonu çalışma</p>
                  </div>
                </div>
                {capacityData.saatlikKapasite && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Tahmini Toplam Üretim Kapasitesi</p>
                    <p className="font-semibold">
                      {(capacityData.toplamCalismaSaati * capacityData.saatlikKapasite).toLocaleString("tr-TR")} adet
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kapasite hesaplanamadı</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Günlük Detay */}
      {capacityData && capacityData.gunler.length > 0 && (
        <Collapsible className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full gap-2">
              <Calendar className="size-4" />
              Günlük Detay
              <ChevronDown className="size-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-3 rounded-lg border bg-background overflow-hidden max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Tarih</TableHead>
                    <TableHead className="text-xs">Gün</TableHead>
                    <TableHead className="text-xs text-center">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capacityData.gunler.map((gun) => (
                    <TableRow key={gun.tarih} className={gun.calisiyor ? "" : "bg-muted/50"}>
                      <TableCell className="text-xs font-mono">{gun.tarih}</TableCell>
                      <TableCell className="text-xs">{gun.gunAdi}</TableCell>
                      <TableCell className="text-center">
                        {gun.tatilMi ? (
                          <Badge variant="destructive" className="text-xs">Tatil</Badge>
                        ) : gun.haftaSonuMu && !gun.calisiyor ? (
                          <Badge variant="secondary" className="text-xs">Hafta Sonu</Badge>
                        ) : gun.haftaSonuMu && gun.calisiyor ? (
                          <Badge variant="default" className="text-xs">H.Sonu Çalışma</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Çalışma Günü</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default function MakinelerClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState<MakineDurum | "hepsi">("hepsi");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MakineDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MakineDto | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const params = {
    ...(search ? { q: search } : {}),
    ...(durum !== "hepsi" ? { durum } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useListMakinelerAdminQuery(params);
  const [deleteMakine, deleteState] = useDeleteMakineAdminMutation();

  const items = data?.items ?? [];

  const durumOptions: Array<{ value: MakineDurum | "hepsi"; label: string }> = [
    { value: "hepsi", label: t("admin.erp.common.allStatuses") },
    { value: "aktif", label: t("admin.erp.makineHavuzu.statuses.aktif") },
    { value: "pasif", label: t("admin.erp.makineHavuzu.statuses.pasif") },
    { value: "bakimda", label: t("admin.erp.makineHavuzu.statuses.bakimda") },
  ];

  const durumLabels: Record<MakineDurum, string> = {
    aktif: t("admin.erp.makineHavuzu.statuses.aktif"),
    pasif: t("admin.erp.makineHavuzu.statuses.pasif"),
    bakimda: t("admin.erp.makineHavuzu.statuses.bakimda"),
  };

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMakine(deleteTarget.id).unwrap();
      toast.success(t("admin.erp.common.deleted", { item: t("admin.erp.makineHavuzu.singular") }));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("admin.erp.makineHavuzu.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.erp.common.totalCount", {
              count: String(data?.total ?? 0),
              item: t("admin.erp.makineHavuzu.singular").toLowerCase(),
            })}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" />
          {t("admin.erp.makineHavuzu.newItem")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
            placeholder={t("admin.erp.makineHavuzu.searchPlaceholder")}
          />
        </div>
        <Select value={durum} onValueChange={(value) => setDurum(value as MakineDurum | "hepsi")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {durumOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`size-4${isFetching ? " animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{t("admin.erp.makineHavuzu.columns.kod")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.ad")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.tonaj")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.saatlikKapasite")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.calisir24Saat")}</TableHead>
              <TableHead>Kalıplar</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.durum")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              ["m1", "m2", "m3", "m4"].map((key) => (
                <TableRow key={key}>
                  {["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"].map((cellKey) => (
                    <TableCell key={`${key}-${cellKey}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  {t("admin.erp.makineHavuzu.notFound")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((makine) => (
                <Fragment key={makine.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(makine.id)}
                  >
                    <TableCell className="text-center">
                      {expandedId === makine.id ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium font-mono">{makine.kod}</TableCell>
                    <TableCell>{makine.ad}</TableCell>
                    <TableCell>{makine.tonaj ?? "—"}</TableCell>
                    <TableCell>{makine.saatlikKapasite ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={makine.calisir24Saat ? "default" : "secondary"}>
                        {makine.calisir24Saat
                          ? t("admin.erp.makineHavuzu.flags.yirmiDortSaat")
                          : t("admin.erp.makineHavuzu.flags.normalMesai")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{makine.kaliplar.length} kalıp</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={MAKINE_DURUM_BADGE[makine.durum]}>{durumLabels[makine.durum]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(makine);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(makine);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === makine.id && (
                    <TableRow>
                      <TableCell colSpan={9} className="p-0">
                        <MakineExpandedRow makine={makine} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
          </TableBody>
        </Table>
      </div>

      <MakineForm open={formOpen} onClose={() => setFormOpen(false)} makine={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.makineHavuzu.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.ad}</strong> {t("admin.erp.common.deleteDescription")}
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
