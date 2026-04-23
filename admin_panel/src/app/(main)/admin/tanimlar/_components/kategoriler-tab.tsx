"use client";

// =============================================================
// FILE: tanimlar/_components/kategoriler-tab.tsx
// Paspas ERP — Kategoriler + Alt Kategoriler (Ürün Grupları) yönetimi
// =============================================================

import { useEffect, useMemo, useState } from "react";

import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import {
  useCreateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
  useListCategoriesAdminQuery,
  useUpdateCategoryAdminMutation,
} from "@/integrations/endpoints/admin/categories_admin.endpoints";
import { useListBirimlerAdminQuery } from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import {
  useCreateSubCategoryAdminMutation,
  useDeleteSubCategoryAdminMutation,
  useListSubCategoriesAdminQuery,
  useUpdateSubCategoryAdminMutation,
} from "@/integrations/endpoints/admin/subcategories_admin.endpoints";
import type { CategoryDto } from "@/integrations/shared/category.types";
import type { SubCategoryDto } from "@/integrations/shared/subcategory.types";

const KATEGORI_KEYS = ["urun", "yarimamul", "operasyonel_ym", "hammadde"] as const;
const TEDARIK_OPTIONS = ["uretim", "satin_alma", "fason"] as const;
const OPERASYON_TIPI_OPTIONS = ["tek_tarafli", "cift_tarafli"] as const;

// ── Category Form ────────────────────────────────────────────────

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: CategoryDto | null;
}

function CategoryForm({ open, onClose, category }: CategoryFormProps) {
  const { t } = useLocaleContext();
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [varsayilanBirim, setVarsayilanBirim] = useState<string>(category?.varsayilan_birim ?? "adet");
  const [varsayilanKodPrefixi, setVarsayilanKodPrefixi] = useState<string>(category?.varsayilan_kod_prefixi ?? "URN");
  const [recetedeKullanilabilir, setRecetedeKullanilabilir] = useState(category?.recetede_kullanilabilir ?? false);
  const [varsayilanTedarikTipi, setVarsayilanTedarikTipi] = useState<string>(
    category?.varsayilan_tedarik_tipi ?? "uretim",
  );
  const [uretimAlanlariAktif, setUretimAlanlariAktif] = useState(category?.uretim_alanlari_aktif ?? true);
  const [operasyonTipiGerekli, setOperasyonTipiGerekli] = useState(category?.operasyon_tipi_gerekli ?? true);
  const [varsayilanOperasyonTipi, setVarsayilanOperasyonTipi] = useState<string>(
    category?.varsayilan_operasyon_tipi ?? "tek_tarafli",
  );

  const [create, createState] = useCreateCategoryAdminMutation();
  const [update, updateState] = useUpdateCategoryAdminMutation();
  const busy = createState.isLoading || updateState.isLoading;
  const { data: birimlerData } = useListBirimlerAdminQuery(undefined, { skip: !open });
  const birimler = birimlerData?.items ?? [];
  const tK = (key: string, params?: Record<string, string>) => t(`admin.erp.tanimlar.kategoriler.${key}`, params);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEdit || slug === slugify(category?.name ?? "")) {
      setSlug(slugify(v));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(tK("nameRequired"));
      return;
    }

    const generatedSlug = slug.trim() || slugify(name.trim());
    const payload = {
      kod: isEdit ? category.kod : generatedSlug,
      name: name.trim(),
      slug: generatedSlug,
      is_active: isActive,
      varsayilan_birim: varsayilanBirim,
      varsayilan_kod_prefixi: varsayilanKodPrefixi.trim().toUpperCase(),
      recetede_kullanilabilir: recetedeKullanilabilir,
      varsayilan_tedarik_tipi: varsayilanTedarikTipi as "uretim" | "satin_alma" | "fason",
      uretim_alanlari_aktif: uretimAlanlariAktif,
      operasyon_tipi_gerekli: operasyonTipiGerekli,
      varsayilan_operasyon_tipi: operasyonTipiGerekli
        ? (varsayilanOperasyonTipi as "tek_tarafli" | "cift_tarafli")
        : null,
    };

    try {
      if (isEdit && category) {
        await update({ id: category.id, patch: payload }).unwrap();
        toast.success(tK("updated"));
      } else {
        await create(payload).unwrap();
        toast.success(tK("created"));
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      if (msg === "duplicate_kod" || msg?.includes("duplicate")) {
        toast.error(tK("duplicateCode"));
      } else {
        toast.error(msg ?? t("admin.erp.common.operationFailed"));
      }
    }
  }

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "");
      setSlug(category?.slug ?? "");
      setIsActive(category?.is_active ?? true);
      setVarsayilanBirim(category?.varsayilan_birim ?? "adet");
      setVarsayilanKodPrefixi(category?.varsayilan_kod_prefixi ?? "URN");
      setRecetedeKullanilabilir(category?.recetede_kullanilabilir ?? false);
      setVarsayilanTedarikTipi(category?.varsayilan_tedarik_tipi ?? "uretim");
      setUretimAlanlariAktif(category?.uretim_alanlari_aktif ?? true);
      setOperasyonTipiGerekli(category?.operasyon_tipi_gerekli ?? true);
      setVarsayilanOperasyonTipi(category?.varsayilan_operasyon_tipi ?? "tek_tarafli");
    }
  }, [open, category]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? tK("editCategory") : tK("newCategory")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{tK("name")} *</Label>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder={tK("namePlaceholder")} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>{t("admin.common.active")}</Label>
              </div>
            </div>

            <div className="space-y-1">
              <Label>{tK("slug")}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-slug" />
              <p className="text-muted-foreground text-xs">{tK("slugHelp")}</p>
            </div>

            <div className="space-y-1">
              <Label>{tK("defaultUnit")}</Label>
              <Select value={varsayilanBirim} onValueChange={setVarsayilanBirim}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {birimler.map((b) => (
                    <SelectItem key={b.kod} value={b.kod}>
                      {b.ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{tK("defaultCodePrefix")}</Label>
              <Input
                value={varsayilanKodPrefixi}
                onChange={(e) => setVarsayilanKodPrefixi(e.target.value.toUpperCase())}
                placeholder={tK("defaultCodePrefixPlaceholder")}
                maxLength={16}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={recetedeKullanilabilir} onCheckedChange={setRecetedeKullanilabilir} />
              <Label>{tK("usableInRecipe")}</Label>
            </div>

            <div className="space-y-1">
              <Label>{tK("defaultSupplyType")}</Label>
              <Select value={varsayilanTedarikTipi} onValueChange={setVarsayilanTedarikTipi}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEDARIK_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {t(`admin.erp.urunler.tedarikTipiLabel.${o}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={uretimAlanlariAktif} onCheckedChange={setUretimAlanlariAktif} />
                <Label>{tK("productionFieldsEnabled")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={operasyonTipiGerekli} onCheckedChange={setOperasyonTipiGerekli} />
                <Label>{tK("operationTypeRequired")}</Label>
              </div>
            </div>

            {operasyonTipiGerekli && (
              <div className="space-y-1">
                <Label>{tK("defaultOperationType")}</Label>
                <Select value={varsayilanOperasyonTipi} onValueChange={setVarsayilanOperasyonTipi}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERASYON_TIPI_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {t(`admin.erp.urunler.operasyonTipiLabel.${o}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t("admin.common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("admin.erp.common.saving") : t("admin.common.save")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── SubCategory Form ────────────────────────────────────────────

interface SubCategoryFormProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  subCategory?: SubCategoryDto | null;
}

function SubCategoryForm({ open, onClose, categoryId, categoryName, subCategory }: SubCategoryFormProps) {
  const { t } = useLocaleContext();
  const isEdit = !!subCategory;
  const [name, setName] = useState(subCategory?.name ?? "");
  const [slug, setSlug] = useState(subCategory?.slug ?? "");
  const [isActive, setIsActive] = useState(subCategory?.is_active ?? true);

  const [create, createState] = useCreateSubCategoryAdminMutation();
  const [update, updateState] = useUpdateSubCategoryAdminMutation();
  const busy = createState.isLoading || updateState.isLoading;
  const tK = (key: string, params?: Record<string, string>) => t(`admin.erp.tanimlar.kategoriler.${key}`, params);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEdit || slug === slugify(subCategory?.name ?? "")) {
      setSlug(slugify(v));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(tK("nameRequired"));
      return;
    }

    const generatedSlug = slug.trim() || slugify(name.trim());
    if (!generatedSlug) {
      toast.error(tK("slugRequired"));
      return;
    }

    try {
      if (isEdit && subCategory) {
        await update({
          id: subCategory.id,
          patch: { name: name.trim(), slug: generatedSlug, is_active: isActive },
        }).unwrap();
        toast.success(tK("subUpdated"));
      } else {
        await create({
          category_id: categoryId,
          name: name.trim(),
          slug: generatedSlug,
          is_active: isActive,
        }).unwrap();
        toast.success(tK("subCreated"));
      }
      onClose();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      if (msg === "duplicate_slug") {
        toast.error(tK("duplicateSlug"));
      } else {
        toast.error(msg ?? t("admin.erp.common.operationFailed"));
      }
    }
  }

  useEffect(() => {
    if (open) {
      setName(subCategory?.name ?? "");
      setSlug(subCategory?.slug ?? "");
      setIsActive(subCategory?.is_active ?? true);
    }
  }, [open, subCategory]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-4 py-4 sm:px-6">
          <SheetTitle>{isEdit ? tK("editSubCategory") : tK("newSubCategoryWithName", { name: categoryName })}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{tK("name")} *</Label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={tK("subNamePlaceholder")}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>{t("admin.common.active")}</Label>
              </div>
            </div>
            <div className="space-y-1">
              <Label>{tK("slug")} *</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="paspas" />
              <p className="text-muted-foreground text-xs">{tK("slugHelp")}</p>
            </div>
          </div>
          <SheetFooter className="border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t("admin.common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("admin.erp.common.saving") : t("admin.common.save")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function KategorilerTab() {
  const { t } = useLocaleContext();
  const {
    data: categoriesRaw,
    isLoading: catLoading,
    refetch: refetchCats,
  } = useListCategoriesAdminQuery({
    limit: 50,
    sort: "display_order",
    order: "asc",
  });
  const { data: subCategoriesRaw, isLoading: subLoading, refetch: refetchSubs } = useListSubCategoriesAdminQuery();
  const [deleteSubCat] = useDeleteSubCategoryAdminMutation();
  const [deleteCat] = useDeleteCategoryAdminMutation();

  const categories = (categoriesRaw ?? []) as CategoryDto[];
  const subCategories = (subCategoriesRaw ?? []) as SubCategoryDto[];

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Category form state
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryDto | null>(null);
  const [deletingCat, setDeletingCat] = useState<CategoryDto | null>(null);

  // SubCategory form state
  const [subFormOpen, setSubFormOpen] = useState(false);
  const [subFormCategoryId, setSubFormCategoryId] = useState("");
  const [subFormCategoryName, setSubFormCategoryName] = useState("");
  const [editingSub, setEditingSub] = useState<SubCategoryDto | null>(null);
  const [deletingSub, setDeletingSub] = useState<SubCategoryDto | null>(null);
  const tK = (key: string, params?: Record<string, string>) => t(`admin.erp.tanimlar.kategoriler.${key}`, params);
  const tKategori = (kod: string) => tK(`categoryLabel.${kod}`);

  const subsByCategory = useMemo(() => {
    const map = new Map<string, SubCategoryDto[]>();
    for (const sub of subCategories) {
      const arr = map.get(sub.category_id) ?? [];
      arr.push(sub);
      map.set(sub.category_id, arr);
    }
    return map;
  }, [subCategories]);

  function toggleExpand(catId: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function openCreateCat() {
    setEditingCat(null);
    setCatFormOpen(true);
  }

  function openEditCat(cat: CategoryDto) {
    setEditingCat(cat);
    setCatFormOpen(true);
  }

  function openAddSub(cat: CategoryDto) {
    setSubFormCategoryId(cat.id);
    setSubFormCategoryName(tKategori(cat.kod) || cat.name);
    setEditingSub(null);
    setSubFormOpen(true);
  }

  function openEditSub(sub: SubCategoryDto, cat: CategoryDto) {
    setSubFormCategoryId(cat.id);
    setSubFormCategoryName(tKategori(cat.kod) || cat.name);
    setEditingSub(sub);
    setSubFormOpen(true);
  }

  async function handleDeleteCat() {
    if (!deletingCat) return;
    try {
      await deleteCat(deletingCat.id).unwrap();
      toast.success(tK("deleted"));
      setDeletingCat(null);
      refetchCats();
    } catch {
      toast.error(tK("deleteFailed"));
    }
  }

  async function handleDeleteSub() {
    if (!deletingSub) return;
    try {
      await deleteSubCat(deletingSub.id).unwrap();
      toast.success(tK("subDeleted"));
      setDeletingSub(null);
      refetchSubs();
    } catch {
      toast.error(tK("deleteFailed"));
    }
  }

  const loading = catLoading || subLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{tK("title")}</CardTitle>
              <CardDescription>
                {tK("description")}
              </CardDescription>
            </div>
            <Button size="sm" onClick={openCreateCat}>
              <Plus className="mr-1 size-4" /> {tK("newCategory")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">{tK("empty")}</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => {
                const subs = subsByCategory.get(cat.id) ?? [];
                const isExpanded = expandedCats.has(cat.id);
                return (
                  <div key={cat.id} className="rounded-lg border">
                    {/* Category Row */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-3 text-left hover:text-foreground/90"
                        onClick={() => toggleExpand(cat.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{tKategori(cat.kod) || cat.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {cat.kod}
                        </Badge>
                        {!cat.is_active && (
                          <Badge variant="outline" className="text-xs">
                            {tK("inactive")}
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-xs">{tK("subGroupCount", { count: String(subs.length) })}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCat(cat);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCat(cat);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddSub(cat);
                          }}
                        >
                          <Plus className="mr-1 size-3" /> {tK("addSubGroup")}
                        </Button>
                      </div>
                    </div>

                    {/* Sub Categories */}
                    {isExpanded && subs.length > 0 && (
                      <div className="border-t">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="pl-12">{tK("tableName")}</TableHead>
                              <TableHead>{tK("tableSlug")}</TableHead>
                              <TableHead>{tK("tableStatus")}</TableHead>
                              <TableHead className="w-24" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subs
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((sub) => (
                                <TableRow key={sub.id}>
                                  <TableCell className="pl-12 font-medium">{sub.name}</TableCell>
                                  <TableCell className="text-muted-foreground text-sm">{sub.slug}</TableCell>
                                  <TableCell>
                                    <Badge variant={sub.is_active ? "default" : "secondary"}>
                                      {sub.is_active ? t("admin.common.active") : tK("inactive")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => openEditSub(sub, cat)}
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-destructive hover:text-destructive"
                                        onClick={() => setDeletingSub(sub)}
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {isExpanded && subs.length === 0 && (
                      <div className="border-t px-12 py-4 text-muted-foreground text-sm">
                        {tK("noSubGroups")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Sheet */}
      {catFormOpen && (
        <CategoryForm
          open={catFormOpen}
          onClose={() => {
            setCatFormOpen(false);
            refetchCats();
          }}
          category={editingCat}
        />
      )}

      {/* SubCategory Form Sheet */}
      {subFormOpen && (
        <SubCategoryForm
          open={subFormOpen}
          onClose={() => {
            setSubFormOpen(false);
            refetchSubs();
          }}
          categoryId={subFormCategoryId}
          categoryName={subFormCategoryName}
          subCategory={editingSub}
        />
      )}

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deletingCat} onOpenChange={(v) => !v && setDeletingCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tK("deleteCategoryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tK("deleteCategoryDescription", {
                name: tKategori(deletingCat?.kod ?? "") || deletingCat?.name || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete SubCategory Confirmation */}
      <AlertDialog open={!!deletingSub} onOpenChange={(v) => !v && setDeletingSub(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tK("deleteSubCategoryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tK("deleteSubCategoryDescription", { name: deletingSub?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSub}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
