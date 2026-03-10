"use client";

// =============================================================
// FILE: src/app/(main)/admin/urunler/_components/urun-form.tsx
// Paspas ERP — Ürün oluştur / düzenle formu (3 sekme)
// =============================================================

import { useEffect, useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AdminImageUploadField } from "@/app/(main)/admin/_components/common/AdminImageUploadField";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListCategoriesAdminQuery } from "@/integrations/endpoints/admin/categories_admin.endpoints";
import { useListKaliplarAdminQuery } from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import {
  useCreateUrunAdminMutation,
  useDeleteUrunReceteAdminMutation,
  useGetNextCodeAdminQuery,
  useGetUrunReceteAdminQuery,
  useListUrunlerAdminQuery,
  useListUrunMedyaAdminQuery,
  useSaveUrunMedyaAdminMutation,
  useSaveUrunReceteAdminMutation,
  useUpdateUrunAdminMutation,
} from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";
import { useListSubCategoriesAdminQuery } from "@/integrations/endpoints/admin/subcategories_admin.endpoints";
import type { CategoryDto } from "@/integrations/shared/category.types";
import type {
  OperasyonTipi,
  TedarikTipi,
  UrunCreatePayload,
  UrunDto,
  UrunKategori,
} from "@/integrations/shared/erp/urunler.types";

// ── Schema ────────────────────────────────────────────────────
const operasyonSchema = z.object({
  operasyonAdi: z.string().min(1, "required"),
  sira: z.coerce.number().int().min(1).default(1),
  kalipId: z.string().optional(),
  hazirlikSuresiDk: z.coerce.number().int().min(0).default(60),
  cevrimSuresiSn: z.coerce.number().min(0).default(45),
  montaj: z.boolean().default(false),
});

const birimDonusumSchema = z.object({
  hedefBirim: z.string().min(1, "required"),
  carpan: z.coerce.number().min(0.0001),
});

const schema = z.object({
  kategori: z.string().min(1).max(32).default("urun"),
  tedarikTipi: z.enum(["uretim", "satin_alma", "fason"]).default("uretim"),
  urunGrubu: z.string().optional(),
  kod: z.string().min(1, "kodRequired"),
  ad: z.string().min(1, "adRequired"),
  aciklama: z.string().optional(),
  birim: z.string().min(1, "birimRequired"),
  renk: z.string().optional(),
  stok: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).default(0)),
  kritikStok: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).default(0)),
  birimFiyat: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive("positive").optional(),
  ),
  kdvOrani: z.preprocess((v) => (v === "" || v == null ? 20 : Number(v)), z.number().min(0).max(100).default(20)),
  operasyonTipi: z.enum(["tek_tarafli", "cift_tarafli"]).nullable().optional(),
  isActive: z.boolean().default(true),
  operasyonlar: z.array(operasyonSchema).optional(),
  birimDonusumleri: z.array(birimDonusumSchema).optional(),
});

type FormValues = z.infer<typeof schema>;

function getApiErrorMessage(error: unknown, tError: (key: string) => string): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return undefined;
  const apiError = (data as { error?: unknown }).error;
  if (!apiError || typeof apiError !== "object") return undefined;
  const message = (apiError as { message?: unknown }).message;
  if (typeof message !== "string") return undefined;
  const knownKeys = new Set([
    "urun_kodu_zaten_var",
    "gecersiz_urun_grubu",
    "gecersiz_recete_malzeme",
    "urun_kategorisi_operasyon_desteklemiyor",
    "urun_kategorisi_recete_desteklemiyor",
  ]);
  return knownKeys.has(message) ? tError(message) : message;
}

function getValidationMessage(
  message: string | undefined,
  tValidation: (key: string) => string,
): string | undefined {
  if (!message) return undefined;
  const knownKeys = new Set(["required", "kodRequired", "adRequired", "birimRequired", "positive"]);
  return knownKeys.has(message) ? tValidation(message) : message;
}

// ── Props ─────────────────────────────────────────────────────
interface UrunFormProps {
  open: boolean;
  onClose: () => void;
  urun?: UrunDto | null;
}

const TEDARIK_OPTIONS: TedarikTipi[] = ["uretim", "satin_alma", "fason"];
const OPERASYON_OPTIONS: OperasyonTipi[] = ["tek_tarafli", "cift_tarafli"];
const BIRIM_OPTIONS = ["adet", "takim", "kg", "metre", "litre", "koli", "palet", "m2", "ton"] as const;

// ── Component ─────────────────────────────────────────────────
export default function UrunForm({ open, onClose, urun }: UrunFormProps) {
  const { t } = useLocaleContext();
  const isEdit = !!urun;
  const [create, createState] = useCreateUrunAdminMutation();
  const [update, updateState] = useUpdateUrunAdminMutation();
  const [saveDraftMedya, saveDraftMedyaState] = useSaveUrunMedyaAdminMutation();
  const [saveDraftRecete, saveDraftReceteState] = useSaveUrunReceteAdminMutation();
  const busy =
    createState.isLoading || updateState.isLoading || saveDraftMedyaState.isLoading || saveDraftReceteState.isLoading;
  const [activeTab, setActiveTab] = useState("bilgiler");
  const [draftReceteRows, setDraftReceteRows] = useState<ReceteRow[]>([]);
  const [draftMediaUrls, setDraftMediaUrls] = useState<string[]>([]);
  const [draftCoverUrl, setDraftCoverUrl] = useState("");

  const { data: kalipData } = useListKaliplarAdminQuery({});
  const { data: categoryData } = useListCategoriesAdminQuery({ limit: 50, sort: "display_order", order: "asc" });
  const kaliplar = kalipData?.items ?? [];
  const categories = (categoryData ?? []) as CategoryDto[];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kategori: "urun",
      tedarikTipi: "uretim",
      urunGrubu: "",
      kod: "",
      ad: "",
      aciklama: "",
      birim: "takim",
      renk: "",
      stok: 0,
      kritikStok: 0,
      kdvOrani: 20,
      operasyonTipi: "tek_tarafli",
      isActive: true,
      operasyonlar: [],
      birimDonusumleri: [],
    },
  });

  const { fields: opFields, replace: replaceOps } = useFieldArray({
    control: form.control,
    name: "operasyonlar",
  });

  const {
    fields: donusumFields,
    append: appendDonusum,
    remove: removeDonusum,
  } = useFieldArray({
    control: form.control,
    name: "birimDonusumleri",
  });

  const watchKategori = form.watch("kategori");

  // Auto-suggest next product code for new products
  const { data: nextCodeData, refetch: refetchNextCode } = useGetNextCodeAdminQuery({ kategori: watchKategori }, { skip: isEdit });
  const watchTedarikTipi = form.watch("tedarikTipi");
  const watchOperasyonTipi = form.watch("operasyonTipi");
  const watchAd = form.watch("ad");
  const watchRenk = form.watch("renk");
  const selectedCategory = categories.find((item) => item.kod === watchKategori);
  const { data: subCategoryData, isFetching: subCategoriesFetching } = useListSubCategoriesAdminQuery(
    selectedCategory
      ? { category_id: selectedCategory.id, is_active: true, sort: "display_order", order: "asc", limit: 200 }
      : { is_active: true, sort: "display_order", order: "asc", limit: 200 },
    { skip: !selectedCategory },
  );
  const categorySubGroups = subCategoryData ?? [];
  const receteKategoriKodlari = useMemo(
    () => categories.filter((item) => item.recetede_kullanilabilir).map((item) => item.kod),
    [categories],
  );
  const productionFieldsEnabled = selectedCategory?.uretim_alanlari_aktif ?? false;
  const operationTypeRequired = selectedCategory?.operasyon_tipi_gerekli ?? false;
  const isRecipeCategory = watchKategori === "urun";
  const showProductionFields = isRecipeCategory && productionFieldsEnabled && watchTedarikTipi === "uretim";
  const showOperasyonTipi = isRecipeCategory && operationTypeRequired && showProductionFields;

  useEffect(() => {
    if (activeTab === "operasyonlar" && !showProductionFields) {
      setActiveTab("bilgiler");
      return;
    }
    if (activeTab === "recete" && !isRecipeCategory) {
      setActiveTab("bilgiler");
    }
  }, [activeTab, isRecipeCategory, showProductionFields]);

  // Auto-generate operation names for NEW products
  useEffect(() => {
    if (isEdit) return;
    if (!showProductionFields) {
      replaceOps([]);
      return;
    }

    const rawName = watchAd || tForm("defaultProductName");
    const renk = watchRenk?.trim();
    const name = renk && !rawName.toLowerCase().includes(renk.toLowerCase()) ? `${rawName} ${renk}` : rawName;
    if (!operationTypeRequired) {
      replaceOps([{ operasyonAdi: name, sira: 1, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false }]);
    } else if (watchOperasyonTipi === "cift_tarafli") {
      replaceOps([
        { operasyonAdi: `${name} - Sol`, sira: 1, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false },
        { operasyonAdi: `${name} - Sağ`, sira: 2, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false },
      ]);
    } else {
      replaceOps([{ operasyonAdi: name, sira: 1, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false }]);
    }
  }, [watchOperasyonTipi, watchAd, watchRenk, showProductionFields, isEdit, operationTypeRequired, replaceOps]);

  // Handle operasyonTipi change for EXISTING products (bug fix)
  const prevOpTipiRef = useRef<string | null>(null);
  const prevKategoriRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isEdit || !showOperasyonTipi) return;
    // Skip initial load
    if (prevOpTipiRef.current === null) {
      prevOpTipiRef.current = watchOperasyonTipi;
      return;
    }
    if (prevOpTipiRef.current === watchOperasyonTipi) return;
    prevOpTipiRef.current = watchOperasyonTipi;

    const currentOps = form.getValues("operasyonlar") ?? [];
    const baseName = watchAd || tForm("defaultProductName");

    if (watchOperasyonTipi === "cift_tarafli") {
      const first = currentOps[0] ?? { hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false };
      replaceOps([
        { ...first, operasyonAdi: `${baseName} - Sol`, sira: 1 },
        {
          operasyonAdi: `${baseName} - Sağ`,
          sira: 2,
          kalipId: first.kalipId,
          hazirlikSuresiDk: first.hazirlikSuresiDk,
          cevrimSuresiSn: first.cevrimSuresiSn,
          montaj: false,
        },
      ]);
    } else {
      const first = currentOps[0] ?? { hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false };
      replaceOps([{ ...first, operasyonAdi: baseName, sira: 1 }]);
    }
  }, [watchOperasyonTipi, isEdit, showOperasyonTipi, form.getValues, replaceOps, watchAd]);

  useEffect(() => {
    if (!selectedCategory) return;

    const currentKategori = selectedCategory.kod;
    const previousKategori = prevKategoriRef.current;
    prevKategoriRef.current = currentKategori;

    if (!isEdit) {
      const nextTedarik = selectedCategory.varsayilan_tedarik_tipi as TedarikTipi;
      if (form.getValues("tedarikTipi") !== nextTedarik) {
        form.setValue("tedarikTipi", nextTedarik, { shouldDirty: true });
      }

      const nextOperation = selectedCategory.varsayilan_operasyon_tipi as OperasyonTipi | null;
      if (!operationTypeRequired) {
        if (form.getValues("operasyonTipi") !== null) {
          form.setValue("operasyonTipi", null, { shouldDirty: true });
        }
      } else if (nextOperation && form.getValues("operasyonTipi") !== nextOperation) {
        form.setValue("operasyonTipi", nextOperation, { shouldDirty: true });
      }

      const nextBirim = selectedCategory.varsayilan_birim?.trim() || "adet";
      if (form.getValues("birim") !== nextBirim) {
        form.setValue("birim", nextBirim, { shouldDirty: true });
      }
      return;
    }

    if (previousKategori === null || previousKategori === currentKategori) {
      return;
    }

    const nextTedarik = selectedCategory.varsayilan_tedarik_tipi as TedarikTipi;
    if (form.getValues("tedarikTipi") !== nextTedarik) {
      form.setValue("tedarikTipi", nextTedarik, { shouldDirty: true });
    }

    const nextOperation = selectedCategory.varsayilan_operasyon_tipi as OperasyonTipi | null;
    if (!operationTypeRequired) {
      if (form.getValues("operasyonTipi") !== null) {
        form.setValue("operasyonTipi", null, { shouldDirty: true });
      }
    } else if (nextOperation && form.getValues("operasyonTipi") !== nextOperation) {
      form.setValue("operasyonTipi", nextOperation, { shouldDirty: true });
    }

    const nextBirim = selectedCategory.varsayilan_birim?.trim() || "adet";
    if (form.getValues("birim") !== nextBirim) {
      form.setValue("birim", nextBirim, { shouldDirty: true });
    }
  }, [selectedCategory, isEdit, form, operationTypeRequired]);

  useEffect(() => {
    if (subCategoriesFetching) return;
    const currentGroup = (form.getValues("urunGrubu") || "").trim();
    if (!currentGroup) return;

    if (categorySubGroups.length === 0) {
      form.setValue("urunGrubu", "", { shouldDirty: true });
      return;
    }

    const isValid = categorySubGroups.some((item) => item.name === currentGroup);
    if (!isValid) {
      form.setValue("urunGrubu", "", { shouldDirty: true });
    }
  }, [categorySubGroups, form, subCategoriesFetching]);

  useEffect(() => {
    if (!open || isEdit || categories.length === 0) return;
    const currentKategori = form.getValues("kategori");
    if (categories.some((item) => item.kod === currentKategori)) return;

    const nextKategori = categories[0]?.kod;
    if (!nextKategori) return;

    form.setValue("kategori", nextKategori, { shouldDirty: false });
  }, [categories, open, isEdit, form]);

  // Auto-fill kod from next-code suggestion (only for new products, only if user hasn't typed)
  useEffect(() => {
    if (isEdit || !nextCodeData?.kod) return;
    const currentKod = form.getValues("kod");
    // Only auto-fill if empty or matches a previous auto-suggestion pattern
    if (!currentKod || /^(URN|YM|HM)-\d{4}$/.test(currentKod)) {
      form.setValue("kod", nextCodeData.kod);
    }
  }, [nextCodeData, isEdit, form]);

  // Reset form when sheet opens or urun changes
  useEffect(() => {
    if (!open) return;
    prevOpTipiRef.current = null;
    prevKategoriRef.current = null;
    setActiveTab("bilgiler");
    setDraftReceteRows([]);
    setDraftMediaUrls([]);
    setDraftCoverUrl("");
    if (urun) {
      form.reset({
        kategori: urun.kategori ?? "urun",
        tedarikTipi: urun.tedarikTipi ?? "uretim",
        urunGrubu: urun.urunGrubu ?? "",
        kod: urun.kod,
        ad: urun.ad,
        aciklama: urun.aciklama ?? "",
        birim: urun.birim,
        renk: urun.renk ?? "",
        stok: urun.stok ?? 0,
        kritikStok: urun.kritikStok ?? 0,
        birimFiyat: urun.birimFiyat ?? undefined,
        kdvOrani: urun.kdvOrani ?? 20,
        operasyonTipi:
          urun.operasyonTipi ??
          ((categories.find((item) => item.kod === (urun.kategori ?? "urun"))?.varsayilan_operasyon_tipi as
            | OperasyonTipi
            | null) ?? "tek_tarafli"),
        isActive: urun.isActive,
        operasyonlar:
          urun.operasyonlar?.map((op) => ({
            operasyonAdi: op.operasyonAdi,
            sira: op.sira,
            kalipId: op.kalipId ?? undefined,
            hazirlikSuresiDk: op.hazirlikSuresiDk,
            cevrimSuresiSn: op.cevrimSuresiSn,
            montaj: op.montaj,
          })) ?? [],
        birimDonusumleri:
          urun.birimDonusumleri?.map((d) => ({
            hedefBirim: d.hedefBirim,
            carpan: d.carpan,
          })) ?? [],
      });
    } else {
      form.reset({
        kategori: categories[0]?.kod ?? "urun",
        tedarikTipi: (categories[0]?.varsayilan_tedarik_tipi as TedarikTipi | undefined) ?? "uretim",
        urunGrubu: "",
        kod: "",
        ad: "",
        aciklama: "",
        birim: categories[0]?.varsayilan_birim?.trim() || "adet",
        renk: "",
        stok: 0,
        kritikStok: 0,
        kdvOrani: 20,
        operasyonTipi: (categories[0]?.varsayilan_operasyon_tipi as OperasyonTipi | null | undefined) ?? null,
        isActive: true,
        operasyonlar: [],
        birimDonusumleri: [],
      });
    }
  }, [open, urun, categories, form.reset]);

  async function onSubmit(values: FormValues) {
    const coverUrl = draftCoverUrl || draftMediaUrls[0];
    const payload: UrunCreatePayload = {
      ...values,
      aciklama: values.aciklama?.trim() || undefined,
      renk: values.renk?.trim() || undefined,
      imageUrl: !isEdit && coverUrl ? coverUrl : undefined,
      imageAlt: !isEdit && coverUrl ? values.ad.trim() : undefined,
      operasyonTipi: showOperasyonTipi ? values.operasyonTipi : null,
      operasyonlar: values.operasyonlar?.map((op) => ({
        ...op,
        kalipId: op.kalipId === "none" ? undefined : op.kalipId,
      })),
    };

    try {
      if (isEdit && urun) {
        await update({ id: urun.id, body: payload }).unwrap();
        toast.success(t("admin.erp.common.updated", { item: t("admin.erp.urunler.singular") }));
      } else {
        const created = await create(payload).unwrap();
        const validRows = draftReceteRows
          .filter((row) => row.urunId)
          .map(({ key: _key, ...row }, idx) => ({ ...row, sira: idx + 1 }));
        if (validRows.length > 0) {
          await saveDraftRecete({ urunId: created.id, items: validRows }).unwrap();
        }
        if (draftMediaUrls.length > 0) {
          await saveDraftMedya({
            urunId: created.id,
            items: draftMediaUrls.map((url, idx) => ({
              tip: "image" as const,
              url,
              baslik: values.ad.trim() || undefined,
              sira: idx + 1,
              isCover: url === (coverUrl || draftMediaUrls[0]),
            })),
          }).unwrap();
        }
        toast.success(t("admin.erp.common.created", { item: t("admin.erp.urunler.singular") }));
        // Reset form and draft states for next create
        form.reset({
          kategori: categories[0]?.kod ?? "urun",
          tedarikTipi: (categories[0]?.varsayilan_tedarik_tipi as TedarikTipi | undefined) ?? "uretim",
          urunGrubu: "",
          kod: "",
          ad: "",
          aciklama: "",
          birim: categories[0]?.varsayilan_birim ?? "takim",
          renk: "",
          stok: 0,
          kritikStok: 0,
          birimFiyat: undefined,
          kdvOrani: 20,
          operasyonTipi: (categories[0]?.varsayilan_operasyon_tipi as OperasyonTipi | null | undefined) ?? null,
          isActive: true,
          operasyonlar: [],
          birimDonusumleri: [],
        });
        setDraftReceteRows([]);
        setDraftMediaUrls([]);
        setDraftCoverUrl("");
        // Refetch next code so the new product gets a fresh code suggestion
        refetchNextCode();
      }
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, (key) => t(`admin.erp.urunler.errors.${key}`)) ?? t("admin.erp.common.operationFailed"));
    }
  }

  const tForm = (key: string) => t(`admin.erp.urunler.form.${key}`);
  const formatKategoriFallback = (k: string) => {
    const categoryName = categories.find((item) => item.kod === k)?.name?.trim();
    if (categoryName) return categoryName;
    return k
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };
  const tKategori = (k: string) => t(`admin.erp.urunler.kategoriLabel.${k}`, undefined, formatKategoriFallback(k));
  const tTedarik = (k: string) => t(`admin.erp.urunler.tedarikTipiLabel.${k}`);
  const tOperasyon = (k: string) => t(`admin.erp.urunler.operasyonTipiLabel.${k}`);
  const handleDraftMediaChange = (nextUrls: string[]) => {
    setDraftMediaUrls(nextUrls);
    if (nextUrls.length === 0) {
      setDraftCoverUrl("");
      return;
    }
    if (!draftCoverUrl || !nextUrls.includes(draftCoverUrl)) {
      setDraftCoverUrl(nextUrls[0]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEdit ? t("admin.erp.urunler.editItem") : t("admin.erp.urunler.newItem")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="bilgiler" className="flex-1">
                {tForm("tabBilgiler")}
              </TabsTrigger>
              {showProductionFields && (
                <TabsTrigger value="operasyonlar" className="flex-1">
                  {tForm("tabOperasyonlar")}
                </TabsTrigger>
              )}
              {isRecipeCategory && (
                <TabsTrigger value="recete" className="flex-1">
                  {tForm("tabRecete")}
                </TabsTrigger>
              )}
              <TabsTrigger value="medya" className="flex-1">
                {tForm("tabMedya")}
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Ürün Bilgileri ─────────────────────── */}
            <TabsContent value="bilgiler" className="mt-4 space-y-5">
              {/* Kategori + Tedarik Tipi */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{tForm("kategori")}</Label>
                  <Select
                    value={form.watch("kategori")}
                    onValueChange={(v) => form.setValue("kategori", v as UrunKategori, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 && (
                        <SelectItem value="__empty" disabled>
                          {tForm("kategoriYok")}
                        </SelectItem>
                      )}
                      {categories
                        .map((item) => item.kod)
                        .map((k) => (
                          <SelectItem key={k} value={k}>
                            {tKategori(k)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>{tForm("tedarikTipi")}</Label>
                  <Select
                    value={form.watch("tedarikTipi")}
                    onValueChange={(v) => form.setValue("tedarikTipi", v as TedarikTipi, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEDARIK_OPTIONS.map((k) => (
                        <SelectItem key={k} value={k}>
                          {tTedarik(k)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kod + Birim */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{tForm("kod")} *</Label>
                  <Input {...form.register("kod")} placeholder={tForm("kodPlaceholder")} />
                  {form.formState.errors.kod && (
                    <p className="text-destructive text-xs">
                      {getValidationMessage(form.formState.errors.kod.message, tValidation)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>{tForm("birim")} *</Label>
                  <Select
                    value={form.watch("birim")}
                    onValueChange={(v) => form.setValue("birim", v, { shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tForm("birimPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {BIRIM_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b.charAt(0).toUpperCase() + b.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ad */}
              <div className="space-y-1">
                <Label>{tForm("ad")} *</Label>
                <Input {...form.register("ad")} placeholder={tForm("adPlaceholder")} />
                {form.formState.errors.ad && (
                  <p className="text-destructive text-xs">
                    {getValidationMessage(form.formState.errors.ad.message, tValidation)}
                  </p>
                )}
              </div>

              {/* Açıklama + Ürün Grubu */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{tForm("aciklama")}</Label>
                  <Input {...form.register("aciklama")} placeholder={tForm("aciklamaPlaceholder")} />
                </div>
                <div className="space-y-1">
                  <Label>{tForm("urunGrubu")}</Label>
                  <Select
                    value={form.watch("urunGrubu") || "none"}
                    onValueChange={(v) => form.setValue("urunGrubu", v === "none" ? "" : v, { shouldDirty: true })}
                    disabled={categorySubGroups.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categorySubGroups.length > 0 ? tForm("urunGrubuSec") : tForm("urunGrubuYok")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {categorySubGroups.map((sc) => (
                        <SelectItem key={sc.id} value={sc.name}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Renk */}
              <div className="space-y-1">
                <Label>{tForm("renk")}</Label>
                <Input {...form.register("renk")} placeholder={tForm("renkPlaceholder")} />
              </div>

              {/* Stok + Kritik Stok */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{tForm("stok")}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    {...form.register("stok")}
                    placeholder={tForm("stokPlaceholder")}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tForm("kritikStok")}</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    {...form.register("kritikStok")}
                    placeholder={tForm("kritikStokPlaceholder")}
                  />
                </div>
              </div>

              {/* Birim Fiyat + KDV */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{tForm("birimFiyat")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("birimFiyat")}
                    placeholder={tForm("birimFiyatPlaceholder")}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{tForm("kdvOrani")}</Label>
                  <Input
                    type="number"
                    step="1"
                    {...form.register("kdvOrani")}
                    placeholder={tForm("kdvOraniPlaceholder")}
                  />
                </div>
              </div>

              {/* Birim Dönüşümleri */}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{tForm("birimDonusumleriTitle")}</h3>
                    <p className="mt-0.5 text-muted-foreground text-xs">{tForm("birimDonusumleriHelper")}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendDonusum({ hedefBirim: "", carpan: 1 })}
                  >
                    <Plus className="mr-1 size-3" /> {tForm("donusumEkle")}
                  </Button>
                </div>
                {donusumFields.map((field, idx) => {
                  const hedefVal = form.watch(`birimDonusumleri.${idx}.hedefBirim`);
                  const carpanVal = form.watch(`birimDonusumleri.${idx}.carpan`);
                  const anaBirim = form.watch("birim") || "birim";
                  return (
                    <div key={field.id} className="space-y-2 rounded-md border p-3">
                      <div className="grid grid-cols-5 items-end gap-2">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">{tForm("hedefBirim")}</Label>
                          <Select
                            value={hedefVal || "custom"}
                            onValueChange={(v) =>
                              form.setValue(`birimDonusumleri.${idx}.hedefBirim`, v === "custom" ? "" : v, {
                                shouldDirty: true,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={tForm("hedefBirimPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              {BIRIM_OPTIONS.filter((b) => b !== anaBirim).map((b) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">{tForm("digerBirim")}</SelectItem>
                            </SelectContent>
                          </Select>
                          {hedefVal === "" && (
                            <Input
                              {...form.register(`birimDonusumleri.${idx}.hedefBirim`)}
                              placeholder={tForm("ozelBirimAdi")}
                              className="mt-1"
                            />
                          )}
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">{tForm("carpan")}</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            {...form.register(`birimDonusumleri.${idx}.carpan`)}
                            placeholder={tForm("carpanPlaceholder")}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeDonusum(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {/* Visual chain preview */}
                      {hedefVal && Number(carpanVal) > 0 && (
                        <div className="rounded bg-muted/50 px-2 py-1 text-muted-foreground text-xs">
                          1 <span className="font-medium text-foreground">{hedefVal}</span>
                          {" = "}
                          <span className="font-medium text-foreground">{carpanVal}</span>{" "}
                          <span className="font-medium text-foreground">{anaBirim}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Aktif */}
              <div className="flex items-center gap-3">
                <Switch checked={form.watch("isActive")} onCheckedChange={(v) => form.setValue("isActive", v)} />
                <Label>{tForm("aktif")}</Label>
              </div>
            </TabsContent>

            {/* ── Tab 2: Operasyonlar ──────────────────────── */}
            {showProductionFields && (
              <TabsContent value="operasyonlar" className="mt-4 space-y-5">
                {/* Operasyon Tipi — only for 'urun' kategori */}
                {showOperasyonTipi && (
                  <div className="space-y-1">
                    <Label>{tForm("operasyonTipi")}</Label>
                    <Select
                      value={form.watch("operasyonTipi") ?? undefined}
                      onValueChange={(v) => form.setValue("operasyonTipi", v as OperasyonTipi, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERASYON_OPTIONS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {tOperasyon(k)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Operasyonlar */}
                {opFields.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">{tForm("operasyonlarTitle")}</h3>
                    {opFields.map((field, idx) => (
                      <div key={field.id} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">{tForm("operasyonAdi")}</Label>
                            <Input {...form.register(`operasyonlar.${idx}.operasyonAdi`)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{tForm("kalip")}</Label>
                            <Select
                              value={form.watch(`operasyonlar.${idx}.kalipId`) || "none"}
                              onValueChange={(v) =>
                                form.setValue(`operasyonlar.${idx}.kalipId`, v === "none" ? undefined : v, {
                                  shouldDirty: true,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={tForm("kalipSec")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {kaliplar.map((k) => (
                                  <SelectItem key={k.id} value={k.id}>
                                    {k.kod} — {k.ad}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">{tForm("hazirlikSuresi")}</Label>
                            <Input type="number" {...form.register(`operasyonlar.${idx}.hazirlikSuresiDk`)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{tForm("cevrimSuresi")}</Label>
                            <Input type="number" step="0.01" {...form.register(`operasyonlar.${idx}.cevrimSuresiSn`)} />
                          </div>
                          <div className="flex items-end gap-2 pb-0.5">
                            <Switch
                              checked={form.watch(`operasyonlar.${idx}.montaj`)}
                              onCheckedChange={(v) =>
                                form.setValue(`operasyonlar.${idx}.montaj`, v, { shouldDirty: true })
                              }
                            />
                            <Label className="text-xs">{tForm("montaj")}</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {opFields.length === 0 && (
                  <p className="py-4 text-center text-muted-foreground text-sm">{tForm("operasyonYok")}</p>
                )}
              </TabsContent>
            )}

            {/* ── Tab 3: Reçete ────────────────────────────── */}
            {isRecipeCategory && (
              <TabsContent value="recete" className="mt-4">
                {isEdit && urun ? (
                  <ReceteSection urunId={urun.id} allowedCategoryCodes={receteKategoriKodlari} />
                ) : (
                  <DraftReceteSection
                    birim={form.watch("birim")}
                    allowedCategoryCodes={receteKategoriKodlari}
                    rows={draftReceteRows}
                    onRowsChange={setDraftReceteRows}
                  />
                )}
              </TabsContent>
            )}

            {/* ── Tab 4: Medya ─────────────────────────────── */}
            <TabsContent value="medya" className="mt-4">
              {isEdit && urun ? (
                <MedyaSection urunId={urun.id} />
              ) : (
                <DraftMedyaSection
                  urls={draftMediaUrls}
                  coverUrl={draftCoverUrl}
                  onUrlsChange={handleDraftMediaChange}
                  onCoverChange={setDraftCoverUrl}
                  disabled={busy}
                />
              )}
            </TabsContent>
          </Tabs>

          <SheetFooter className="mt-2 border-t px-0 pt-4 pb-1">
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

// ── MedyaSection ──────────────────────────────────────────────
interface DraftMedyaSectionProps {
  urls: string[];
  coverUrl: string;
  onUrlsChange: (urls: string[]) => void;
  onCoverChange: (url: string) => void;
  disabled?: boolean;
}

function DraftMedyaSection({ urls, coverUrl, onUrlsChange, onCoverChange, disabled }: DraftMedyaSectionProps) {
  const { t } = useLocaleContext();
  const tForm = (key: string) => t(`admin.erp.urunler.form.${key}`);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-sm">{tForm("medyaTitle")}</h3>
        <p className="mt-1 text-muted-foreground text-xs">
          {tForm("medyaDraftHelper")}
        </p>
      </div>

      <AdminImageUploadField
        label={tForm("medyaTitle")}
        helperText={tForm("medyaHelper")}
        multiple
        bucket="public"
        folder="product-media"
        values={urls}
        onChangeMultiple={onUrlsChange}
        coverValue={coverUrl || urls[0] || ""}
        onSelectAsCover={onCoverChange}
        disabled={disabled}
      />
    </div>
  );
}

interface MedyaSectionProps {
  urunId: string;
}

function MedyaSection({ urunId }: MedyaSectionProps) {
  const { t } = useLocaleContext();
  const tForm = (key: string) => t(`admin.erp.urunler.form.${key}`);
  const { data: medyaData, isLoading, refetch } = useListUrunMedyaAdminQuery(urunId);
  const [saveMedya, saveState] = useSaveUrunMedyaAdminMutation();

  // Derive URLs and cover from server data
  const serverUrls = useMemo(() => (medyaData ?? []).map((m) => m.url).filter(Boolean), [medyaData]);
  const serverCover = useMemo(
    () => (medyaData ?? []).find((m) => m.isCover)?.url ?? serverUrls[0] ?? "",
    [medyaData, serverUrls],
  );

  // Local UI state for instant feedback
  const [uiUrls, setUiUrls] = useState<string[]>([]);
  const [uiCover, setUiCover] = useState("");

  // Sync from server
  useEffect(() => {
    setUiUrls(serverUrls);
  }, [serverUrls]);

  useEffect(() => {
    setUiCover(serverCover);
  }, [serverCover]);

  // Gallery change: save immediately to backend
  const handleGalleryChange = async (nextUrls: string[]) => {
    setUiUrls(nextUrls);

    const items = nextUrls.map((url, idx) => {
      const existing = (medyaData ?? []).find((m) => m.url === url);
      return {
        id: existing?.id,
        tip: "image" as const,
        url,
        storageAssetId: existing?.storageAssetId ?? undefined,
        baslik: existing?.baslik ?? undefined,
        sira: idx + 1,
        isCover: url === (uiCover || nextUrls[0]),
      };
    });

    try {
      await saveMedya({ urunId, items }).unwrap();
      toast.success(tForm("medyaKaydedildi"));
      refetch();
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
      refetch();
    }
  };

  // Cover change: save immediately
  const handleCoverChange = async (url: string) => {
    setUiCover(url);

    const items = uiUrls.map((u, idx) => {
      const existing = (medyaData ?? []).find((m) => m.url === u);
      return {
        id: existing?.id,
        tip: "image" as const,
        url: u,
        storageAssetId: existing?.storageAssetId ?? undefined,
        baslik: existing?.baslik ?? undefined,
        sira: idx + 1,
        isCover: u === url,
      };
    });

    try {
      await saveMedya({ urunId, items }).unwrap();
      refetch();
    } catch {
      toast.error(t("admin.erp.common.operationFailed"));
      refetch();
    }
  };

  const busy = saveState.isLoading || isLoading;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">{tForm("medyaTitle")}</h3>

      <AdminImageUploadField
        label={tForm("medyaTitle")}
        helperText={tForm("medyaHelper")}
        multiple
        bucket="public"
        folder="product-media"
        values={uiUrls}
        onChangeMultiple={handleGalleryChange}
        coverValue={uiCover}
        onSelectAsCover={handleCoverChange}
        disabled={busy}
      />
    </div>
  );
}

// ── ReceteSection ─────────────────────────────────────────────
interface ReceteSectionProps {
  urunId: string;
  allowedCategoryCodes: string[];
}

interface DraftReceteSectionProps {
  birim: string;
  allowedCategoryCodes: string[];
  rows: ReceteRow[];
  onRowsChange: (rows: ReceteRow[]) => void;
}

interface ReceteRow {
  key: string;
  urunId: string;
  miktar: number;
  fireOrani: number;
  sira: number;
}

function createReceteRow(partial?: Partial<Omit<ReceteRow, "key">>): ReceteRow {
  return {
    key: crypto.randomUUID(),
    urunId: partial?.urunId ?? "",
    miktar: partial?.miktar ?? 1,
    fireOrani: partial?.fireOrani ?? 0,
    sira: partial?.sira ?? 0,
  };
}

function DraftReceteSection({ birim, allowedCategoryCodes, rows, onRowsChange }: DraftReceteSectionProps) {
  const { t } = useLocaleContext();
  const tForm = (key: string) => t(`admin.erp.urunler.form.${key}`);
  const { data: malzemeData } = useListUrunlerAdminQuery({ limit: 500 });

  const malzemeOptions = useMemo(() => {
    if (!malzemeData?.items) return [];
    return malzemeData.items.filter((u) => allowedCategoryCodes.includes(u.kategori));
  }, [allowedCategoryCodes, malzemeData]);

  useEffect(() => {
    const validIds = new Set(malzemeOptions.map((item) => item.id));
    const nextRows = rows.map((row) => (row.urunId && !validIds.has(row.urunId) ? { ...row, urunId: "" } : row));
    const changed = nextRows.some((row, index) => row.urunId !== rows[index]?.urunId);
    if (changed) onRowsChange(nextRows);
  }, [malzemeOptions, onRowsChange, rows]);

  const updateRow = (idx: number, field: keyof ReceteRow, value: string | number) => {
    onRowsChange(rows.map((row, rowIdx) => (rowIdx === idx ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    onRowsChange([...rows, createReceteRow({ sira: rows.length + 1 })]);
  };

  const removeRow = (idx: number) => {
    onRowsChange(rows.filter((_, rowIdx) => rowIdx !== idx).map((row, rowIdx) => ({ ...row, sira: rowIdx + 1 })));
  };

  const getRowCost = (row: ReceteRow): number => {
    const malzeme = malzemeOptions.find((u) => u.id === row.urunId);
    if (!malzeme?.birimFiyat) return 0;
    return row.miktar * (1 + row.fireOrani / 100) * malzeme.birimFiyat;
  };

  const toplamMaliyet = rows.reduce((sum, row) => sum + getRowCost(row), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{tForm("receteTitle")}</h3>
          <p className="mt-1 text-muted-foreground text-xs">
            {tForm("receteDraftHelper")}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 size-3" /> {tForm("receteSatirEkle")}
        </Button>
      </div>

      {rows.length === 0 && <p className="py-2 text-muted-foreground text-sm">{tForm("receteYok")}</p>}

      {rows.map((row, idx) => {
        const malzeme = malzemeOptions.find((u) => u.id === row.urunId);
        const rowCost = getRowCost(row);

        return (
          <div key={row.key} className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-6">
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">{tForm("receteMalzeme")}</Label>
                <Select
                  value={row.urunId || "none"}
                  onValueChange={(value) => updateRow(idx, "urunId", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tForm("receteMalzemeSec")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {malzemeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.kod} — {option.ad} ({option.birim})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tForm("receteMiktar")}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={row.miktar}
                  onChange={(e) => updateRow(idx, "miktar", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tForm("receteFire")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.fireOrani}
                  onChange={(e) => updateRow(idx, "fireOrani", Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeRow(idx)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {malzeme && (
              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                <span>
                  {tForm("receteSonAlis")}:{" "}
                  {malzeme.birimFiyat?.toLocaleString("tr-TR", { style: "currency", currency: "TRY" }) ?? "—"}
                </span>
                <span>
                  {tForm("receteSatirMaliyet")}:{" "}
                  {rowCost.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </span>
                <span>
                  {tForm("birim")}: {birim || "—"}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {rows.length > 0 && (
        <div className="pt-2 font-medium text-sm">
          {tForm("receteToplamMaliyet")}:{" "}
          {toplamMaliyet.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
        </div>
      )}
    </div>
  );
}

function ReceteSection({ urunId, allowedCategoryCodes }: ReceteSectionProps) {
  const { t } = useLocaleContext();
  const tForm = (key: string) => t(`admin.erp.urunler.form.${key}`);

  const { data: receteData, isLoading: receteLoading } = useGetUrunReceteAdminQuery(urunId);
  const { data: malzemeData } = useListUrunlerAdminQuery({ limit: 500 });
  const [saveRecete, saveState] = useSaveUrunReceteAdminMutation();
  const [deleteRecete, deleteState] = useDeleteUrunReceteAdminMutation();

  const [rows, setRows] = useState<ReceteRow[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const malzemeOptions = useMemo(() => {
    if (!malzemeData?.items) return [];
    return malzemeData.items.filter((u) => allowedCategoryCodes.includes(u.kategori) && u.id !== urunId);
  }, [allowedCategoryCodes, malzemeData, urunId]);

  useEffect(() => {
    const validIds = new Set(malzemeOptions.map((item) => item.id));
    setRows((prev) => {
      const nextRows = prev.map((row) => (row.urunId && !validIds.has(row.urunId) ? { ...row, urunId: "" } : row));
      const changed = nextRows.some((row, index) => row.urunId !== prev[index]?.urunId);
      return changed ? nextRows : prev;
    });
  }, [malzemeOptions]);

  useEffect(() => {
    if (receteLoading || initialized) return;
    if (receteData?.items?.length) {
      setRows(
        receteData.items.map((item) => ({
          key: crypto.randomUUID(),
          urunId: item.urunId,
          miktar: item.miktar,
          fireOrani: item.fireOrani,
          sira: item.sira,
        })),
      );
    } else {
      setRows([]);
    }
    setInitialized(true);
  }, [receteData, receteLoading, initialized]);

  useEffect(() => {
    setInitialized(false);
  }, []);

  function addRow() {
    setRows((prev) => [...prev, createReceteRow({ sira: prev.length + 1 })]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sira: i + 1 })));
  }

  function updateRow(idx: number, field: keyof ReceteRow, value: string | number) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function getRowCost(row: ReceteRow): number {
    const malzeme = malzemeOptions.find((u) => u.id === row.urunId);
    if (!malzeme?.birimFiyat) return 0;
    return row.miktar * (1 + row.fireOrani / 100) * malzeme.birimFiyat;
  }

  const toplamMaliyet = rows.reduce((sum, r) => sum + getRowCost(r), 0);

  async function handleSave() {
    const validRows = rows.filter((r) => r.urunId);
    if (validRows.length === 0) {
      toast.error(t("admin.erp.common.operationFailed"));
      return;
    }
    try {
      await saveRecete({
        urunId,
        items: validRows.map(({ key: _key, ...row }) => row),
      }).unwrap();
      toast.success(tForm("receteKaydedildi"));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast.error(msg ?? t("admin.erp.common.operationFailed"));
    }
  }

  async function handleDelete() {
    try {
      await deleteRecete(urunId).unwrap();
      setRows([]);
      setDeleteConfirm(false);
      toast.success(t("admin.erp.common.deleted", { item: tForm("receteEntity") }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast.error(msg ?? t("admin.erp.common.deleteFailed"));
    }
  }

  const busy = saveState.isLoading || deleteState.isLoading;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{tForm("receteTitle")}</h3>
        <div className="flex items-center gap-2">
          {receteData && rows.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirm(true)}
              disabled={busy}
            >
              <Trash2 className="mr-1 size-3" /> {tForm("receteSil")}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={busy}>
            <Plus className="mr-1 size-3" /> {tForm("receteSatirEkle")}
          </Button>
        </div>
      </div>

      {rows.length === 0 && !receteLoading && (
        <p className="py-2 text-muted-foreground text-sm">{tForm("receteYok")}</p>
      )}

      {rows.map((row, idx) => {
        const malzeme = malzemeOptions.find((u) => u.id === row.urunId);
        const rowCost = getRowCost(row);
        return (
          <div key={row.key} className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-6">
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">{tForm("receteMalzeme")}</Label>
                <Select
                  value={row.urunId || "none"}
                  onValueChange={(v) => updateRow(idx, "urunId", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tForm("receteMalzemeSec")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {malzemeOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.kod} — {u.ad} ({u.birim})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tForm("receteMiktar")}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={row.miktar}
                  onChange={(e) => updateRow(idx, "miktar", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tForm("receteFire")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.fireOrani}
                  onChange={(e) => updateRow(idx, "fireOrani", Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeRow(idx)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            {malzeme && (
              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                <span>
                  {tForm("receteSonAlis")}:{" "}
                  {malzeme.birimFiyat?.toLocaleString("tr-TR", { style: "currency", currency: "TRY" }) ?? "—"}
                </span>
                <span>
                  {tForm("receteSatirMaliyet")}:{" "}
                  {rowCost.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {rows.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="font-medium text-sm">
            {tForm("receteToplamMaliyet")}:{" "}
            {toplamMaliyet.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </span>
          <Button type="button" size="sm" onClick={handleSave} disabled={busy}>
            {saveState.isLoading ? t("admin.erp.common.saving") : tForm("receteKaydet")}
          </Button>
        </div>
      )}

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tForm("receteSil")}</AlertDialogTitle>
            <AlertDialogDescription>{tForm("receteSilOnay")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
