"use client";

// =============================================================
// FILE: src/app/(main)/admin/urunler/_components/urunler-client.tsx
// Paspas ERP — Ürünler liste sayfası
// =============================================================

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ChevronRight, FileText, Pencil, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListCategoriesAdminQuery } from "@/integrations/endpoints/admin/categories_admin.endpoints";
import {
  useDeleteUrunAdminMutation,
  useGetUrunAdminQuery,
  useGetUrunReceteAdminQuery,
  useListUrunlerAdminQuery,
} from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";
import { useListSubCategoriesAdminQuery } from "@/integrations/endpoints/admin/subcategories_admin.endpoints";
import type { CategoryDto } from "@/integrations/shared/category.types";
import type { TedarikTipi, UrunDto } from "@/integrations/shared/erp/urunler.types";
import type { SubCategoryDto } from "@/integrations/shared/subcategory.types";
import { useAuthStatusQuery } from "@/integrations/endpoints/users/auth_public.endpoints";
import { resolveMediaUrl } from "@/lib/media-url";

import UrunForm from "./urun-form";
import UrunFullForm from "./urun-full-form";

type UrunListQueryParams = {
  q?: string;
  kategori?: string;
  tedarikTipi?: TedarikTipi;
  urunGrubu?: string;
};

const SKELETON_ROW_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"] as const;
const SKELETON_CELL_KEYS = [
  "cell-1",
  "cell-2",
  "cell-3",
  "cell-4",
  "cell-5",
  "cell-6",
  "cell-7",
  "cell-8",
  "cell-9",
  "cell-10",
  "cell-11",
  "cell-12",
] as const;

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return undefined;
  const apiError = (data as { error?: unknown }).error;
  if (!apiError || typeof apiError !== "object") return undefined;
  const message = (apiError as { message?: unknown }).message;
  if (message === 'urun_bagimliligi_var') {
    const reasons = (apiError as { reasons?: string[] }).reasons;
    return `Bu ürün silinemez: ${reasons?.join(', ') ?? 'ilişkili kayıtlar mevcut'}.`;
  }
  return typeof message === "string" ? message : undefined;
}

export default function UrunlerClient() {
  const { t } = useLocaleContext();
  const { data: authStatus } = useAuthStatusQuery();
  const isAdmin = authStatus?.is_admin === true;
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("urun");
  const [tedarikFilter, setTedarikFilter] = useState<TedarikTipi | "">("");
  const [urunGrubuFilter, setUrunGrubuFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [fullFormOpen, setFullFormOpen] = useState(false);
  const [editing, setEditing] = useState<UrunDto | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UrunDto | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Fetch categories & subcategories for filter
  const { data: categoriesRaw } = useListCategoriesAdminQuery({ limit: 50, sort: "display_order", order: "asc" });
  const { data: subCategoriesRaw } = useListSubCategoriesAdminQuery({
    is_active: true,
    sort: "display_order",
    order: "asc",
    limit: 200,
  });
  const categories = (categoriesRaw ?? []) as CategoryDto[];
  const subCategories = (subCategoriesRaw ?? []) as SubCategoryDto[];
  const selectedCategory = categories.find((category) => category.kod === kategoriFilter);

  const allowedTedarikOptions = useMemo<TedarikTipi[]>(() => {
    if (selectedCategory) {
      return [selectedCategory.varsayilan_tedarik_tipi];
    }

    return Array.from(new Set(categories.map((category) => category.varsayilan_tedarik_tipi)));
  }, [categories, selectedCategory]);

  // Filtered subcategories based on selected category
  const filteredSubCategories = useMemo(
    () =>
      selectedCategory
        ? subCategories.filter((subCategory) => subCategory.category_id === selectedCategory.id)
        : [],
    [selectedCategory, subCategories],
  );

  useEffect(() => {
    if (!tedarikFilter) return;
    if (allowedTedarikOptions.includes(tedarikFilter as TedarikTipi)) return;
    setTedarikFilter("");
  }, [allowedTedarikOptions, tedarikFilter]);

  useEffect(() => {
    if (!urunGrubuFilter) return;
    if (filteredSubCategories.some((subCategory) => subCategory.name === urunGrubuFilter)) return;
    setUrunGrubuFilter("");
  }, [filteredSubCategories, urunGrubuFilter]);

  const queryParams: UrunListQueryParams = {};
  if (search) queryParams.q = search;
  if (kategoriFilter) queryParams.kategori = kategoriFilter;
  if (tedarikFilter) queryParams.tedarikTipi = tedarikFilter;
  if (urunGrubuFilter) queryParams.urunGrubu = urunGrubuFilter;

  const { data, isLoading, isFetching, refetch } = useListUrunlerAdminQuery(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  );

  // Fetch full product with operasyonlar when editing
  const { data: fullUrun } = useGetUrunAdminQuery(editingId ?? "", { skip: !editingId });

  const [deleteUrun, deleteState] = useDeleteUrunAdminMutation();

  const items = data?.items ?? [];

  function openCreate() {
    setEditing(null);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(u: UrunDto) {
    setEditingId(u.id);
    setEditing(u);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditing(null);
    setEditingId(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUrun(deleteTarget.id).unwrap();
      toast.success(t("admin.erp.common.deleted", { item: t("admin.erp.urunler.singular") }));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? t("admin.erp.common.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  }

  const tKategori = (k: string) => {
    const categoryName = categories.find((item) => item.kod === k)?.name?.trim();
    const fallback =
      categoryName ||
      k
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    return t(`admin.erp.urunler.kategoriLabel.${k}`, undefined, fallback);
  };
  const tTedarik = (k: string) => t(`admin.erp.urunler.tedarikTipiLabel.${k}`);
  const resetFilters = () => {
    setSearch("");
    setKategoriFilter("");
    setTedarikFilter("");
    setUrunGrubuFilter("");
  };

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-lg">{t("admin.erp.urunler.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("admin.erp.common.totalCount", {
              count: String(data?.total ?? 0),
              item: t("admin.erp.urunler.singular").toLowerCase(),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/tanimlar?tab=kategoriler">{t("admin.erp.urunler.categoryManagement")}</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`size-4${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setFullFormOpen(true)}>
            <Plus className="mr-1 size-4" /> Asıl Ürün + Yarı Mamul
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" /> {t("admin.erp.urunler.newItem")}
          </Button>
        </div>
      </div>

      {/* Kategori Sekmeleri */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { kod: "urun", label: "Ürünler" },
          { kod: "yarimamul", label: "Yarımamuller" },
          { kod: "hammadde", label: "Hammaddeler" },
        ].map((kat) => (
          <Button
            key={kat.kod}
            variant={kategoriFilter === kat.kod ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const nextCategory = categories.find((c) => c.kod === kat.kod);
              setKategoriFilter(kat.kod);
              setUrunGrubuFilter("");
              setTedarikFilter(nextCategory?.varsayilan_tedarik_tipi ?? "");
            }}
          >
            {kat.label}
          </Button>
        ))}
        <Button
          variant={kategoriFilter === "" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setKategoriFilter("");
            setUrunGrubuFilter("");
            setTedarikFilter("");
          }}
        >
          Tümü
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("admin.erp.urunler.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={kategoriFilter || "all"}
          onValueChange={(v) => {
            const nextKategori = v === "all" ? "" : v;
            const nextCategory = categories.find((category) => category.kod === nextKategori);
            setKategoriFilter(nextKategori);
            setUrunGrubuFilter("");
            setTedarikFilter(nextCategory?.varsayilan_tedarik_tipi ?? "");
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.erp.urunler.allCategories")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.kod} value={cat.kod}>
                {tKategori(cat.kod)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tedarikFilter || "all"}
          onValueChange={(v) => setTedarikFilter(v === "all" ? "" : (v as TedarikTipi))}
          disabled={allowedTedarikOptions.length === 0}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.erp.urunler.allTedarikTipi")}</SelectItem>
            {allowedTedarikOptions.map((k) => (
              <SelectItem key={k} value={k}>
                {tTedarik(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filteredSubCategories.length > 0 && (
          <Select value={urunGrubuFilter || "all"} onValueChange={(v) => setUrunGrubuFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.erp.urunler.allProductGroups")}</SelectItem>
              {filteredSubCategories.map((sc) => (
                <SelectItem key={sc.id} value={sc.name}>
                  {sc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" onClick={resetFilters}>
          {t("admin.erp.urunler.resetFilters")}
        </Button>
      </div>

      {/* Tablo */}
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>{t("admin.erp.urunler.columns.kod")}</TableHead>
                <TableHead>{t("admin.erp.urunler.columns.gorsel")}</TableHead>
                <TableHead>{t("admin.erp.urunler.columns.ad")}</TableHead>
                <TableHead>{t("admin.erp.urunler.columns.kategori")}</TableHead>
                <TableHead>{t("admin.erp.urunler.columns.tedarikTipi")}</TableHead>
                <TableHead>{t("admin.erp.urunler.columns.birim")}</TableHead>
                <TableHead className="text-right">{t("admin.erp.urunler.columns.stok")}</TableHead>
                <TableHead className="text-right">{t("admin.erp.urunler.columns.kritikStok")}</TableHead>
                <TableHead className="text-right">{t("admin.erp.urunler.columns.birimFiyat")}</TableHead>
                <TableHead>{t("admin.erp.urunler.columns.durum")}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                SKELETON_ROW_KEYS.map((rowKey) => (
                  <TableRow key={rowKey}>
                    {SKELETON_CELL_KEYS.map((cellKey) => (
                      <TableCell key={`${rowKey}-${cellKey}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center text-muted-foreground text-sm">
                    {t("admin.erp.urunler.notFound")}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                items.map((u) => {
                  const isExpanded = expandedId === u.id;
                  return (
                    <ExpandableProductRow
                      key={u.id}
                      urun={u}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedId(isExpanded ? null : u.id)}
                      onEdit={() => openEdit(u)}
                      onDelete={() => setDeleteTarget(u)}
                      onShowImage={(url) => setLightboxUrl(url)}
                      canDelete={isAdmin && u.silinebilir !== false}
                      tKategori={tKategori}
                      tTedarik={tTedarik}
                      t={t}
                      allProducts={items}
                    />
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Sheet — use full product data when editing */}
      <UrunForm open={formOpen} onClose={handleFormClose} urun={editingId && fullUrun ? fullUrun : editing} />

      {/* Asıl Ürün + Yarı Mamul Full Form */}
      <UrunFullForm
        open={fullFormOpen}
        onClose={() => setFullFormOpen(false)}
        onSuccess={() => {
          refetch();
          setKategoriFilter("urun");
        }}
      />

      {/* Silme onayı */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.erp.urunler.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.erp.common.deleteDescriptionIrreversible", { name: deleteTarget?.ad ?? "" })}
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-h-full max-w-full">
            <img 
              src={resolveMediaUrl(lightboxUrl)} 
              alt="Büyük görsel" 
              className="max-h-[90vh] max-w-[90vw] rounded-lg border-4 border-white/10 shadow-2xl transition-transform animate-in zoom-in-95"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-4 -right-4 size-10 rounded-full border-2 bg-background shadow-lg hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxUrl(null);
              }}
            >
              <Plus className="size-6 rotate-45" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ExpandableProductRow ─────────────────────────────────────
interface ExpandableProductRowProps {
  urun: UrunDto;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShowImage: (url: string) => void;
  canDelete: boolean;
  tKategori: (k: string) => string;
  tTedarik: (k: string) => string;
  t: (key: string, params?: Record<string, string>) => string;
  allProducts: UrunDto[];
}

function ExpandableProductRow({
  urun: u,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onShowImage,
  canDelete,
  tKategori,
  tTedarik,
  t,
  allProducts,
}: ExpandableProductRowProps) {
  const { data: receteData, isLoading: receteLoading } = useGetUrunReceteAdminQuery(u.id, {
    skip: !isExpanded,
  });

  const receteItems = receteData?.items ?? [];

  return (
    <>
      <TableRow className="hover:bg-muted/40">
        <TableCell className="w-8 px-1">
          <Button variant="ghost" size="icon" className="size-6" onClick={onToggle}>
            <ChevronRight className={`size-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          </Button>
        </TableCell>
        <TableCell className="whitespace-nowrap font-mono text-xs">{u.kod}</TableCell>
        <TableCell>
          {u.imageUrl ? (
            u.imageUrl.toLowerCase().endsWith(".pdf") ? (
              <div 
                className="h-10 w-10 flex items-center justify-center rounded border bg-slate-50 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(resolveMediaUrl(u.imageUrl!), "_blank");
                }}
                title="PDF Dokümanı Aç"
              >
                <FileText className="size-6 text-blue-600" />
              </div>
            ) : (
              // biome-ignore lint/performance/noImgElement: thumbnail source can be arbitrary media URLs from storage and legacy records.
              <img
                src={resolveMediaUrl(u.imageUrl)}
                alt={u.imageAlt || u.ad}
                className="h-10 w-10 cursor-pointer rounded border object-cover transition-transform hover:scale-110 active:scale-95"
                loading="lazy"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowImage(u.imageUrl!);
                }}
              />
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="font-medium">{u.ad}</TableCell>
        <TableCell>
          <Badge variant="outline">{tKategori(u.kategori)}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={u.tedarikTipi === "uretim" ? "default" : "secondary"}>{tTedarik(u.tedarikTipi)}</Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap">{u.birim}</TableCell>
        <TableCell className="text-right tabular-nums">
          {u.stok.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {u.kritikStok.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {u.birimFiyat != null ? u.birimFiyat.toLocaleString("tr-TR", { style: "currency", currency: "TRY" }) : "—"}
        </TableCell>
        <TableCell>
          <Badge variant={u.isActive ? "default" : "secondary"}>
            {u.isActive ? t("admin.erp.common.active") : t("admin.erp.common.inactive")}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={canDelete ? "text-destructive hover:text-destructive" : "text-muted-foreground/40 cursor-not-allowed"}
              onClick={canDelete ? onDelete : undefined}
              disabled={!canDelete}
              title={!canDelete ? "Bu ürün sipariş veya üretim emri ile ilişkili, silinemez" : undefined}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/20 hover:bg-muted/30">
          <TableCell colSpan={12} className="p-0">
            <div className="space-y-2 px-6 py-3">
              <p className="font-semibold text-muted-foreground text-xs">{t("admin.erp.urunler.form.receteTitle")}</p>
              {receteLoading && (
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              )}
              {!receteLoading && receteItems.length === 0 && (
                <p className="text-muted-foreground text-xs">{t("admin.erp.urunler.form.receteYok")}</p>
              )}
              {!receteLoading && receteItems.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-1 pr-4 text-left">{t("admin.erp.urunler.form.receteMalzeme")}</th>
                      <th className="py-1 pr-4 text-right">{t("admin.erp.urunler.form.receteMiktar")}</th>
                      <th className="py-1 pr-4 text-right">{t("admin.erp.urunler.form.receteBirim")}</th>
                      <th className="py-1 pr-4 text-right">{t("admin.erp.urunler.form.receteFire")}</th>
                      <th className="py-1 pr-4 text-right">{t("admin.erp.urunler.form.receteSonAlis")}</th>
                      <th className="py-1 text-right">{t("admin.erp.urunler.form.receteSatirMaliyet")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receteItems.map((item) => {
                      const birimFiyat = item.malzemeBirimFiyat ?? 0;
                      const satirMaliyet = item.miktar * (1 + item.fireOrani / 100) * birimFiyat;
                      return (
                        <tr key={item.id} className="border-muted/50 border-b">
                          <td className="py-1.5 pr-4">
                            {item.malzemeKod ? `${item.malzemeKod} — ${item.malzemeAd}` : item.urunId}
                          </td>
                          <td className="py-1.5 pr-4 text-right tabular-nums">
                            {item.miktar.toLocaleString("tr-TR", { maximumFractionDigits: 4 })}
                          </td>
                          <td className="py-1.5 pr-4 text-right">{item.malzemeBirim ?? "—"}</td>
                          <td className="py-1.5 pr-4 text-right tabular-nums">
                            %{item.fireOrani.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-1.5 pr-4 text-right tabular-nums">
                            {birimFiyat
                              ? birimFiyat.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })
                              : "—"}
                          </td>
                          <td className="py-1.5 text-right font-medium tabular-nums">
                            {satirMaliyet.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="py-1.5 pr-4 text-right font-medium">
                        {t("admin.erp.urunler.form.receteToplamMaliyet")}:
                      </td>
                      <td className="py-1.5 text-right font-semibold tabular-nums">
                        {receteItems
                          .reduce((sum, item) => {
                            return sum + item.miktar * (1 + item.fireOrani / 100) * (item.malzemeBirimFiyat ?? 0);
                          }, 0)
                          .toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
