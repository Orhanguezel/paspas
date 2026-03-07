"use client";

import { useState } from "react";

import { Pencil, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useDeleteMakineAdminMutation,
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

export default function MakinelerClient() {
  const { t } = useLocaleContext();
  const [search, setSearch] = useState("");
  const [durum, setDurum] = useState<MakineDurum | "hepsi">("hepsi");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MakineDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MakineDto | null>(null);

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
              <TableHead>{t("admin.erp.makineHavuzu.columns.kod")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.ad")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.tonaj")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.saatlikKapasite")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.calisir24Saat")}</TableHead>
              <TableHead>{t("admin.erp.makineHavuzu.columns.durum")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              ["m1", "m2", "m3", "m4"].map((key) => (
                <TableRow key={key}>
                  {["c1", "c2", "c3", "c4", "c5", "c6", "c7"].map((cellKey) => (
                    <TableCell key={`${key}-${cellKey}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  {t("admin.erp.makineHavuzu.notFound")}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((makine) => (
                <TableRow key={makine.id}>
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
                    <Badge variant={MAKINE_DURUM_BADGE[makine.durum]}>{durumLabels[makine.durum]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
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
                        onClick={() => setDeleteTarget(makine)}
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
