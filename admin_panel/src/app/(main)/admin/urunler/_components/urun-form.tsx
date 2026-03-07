"use client";

// =============================================================
// FILE: src/app/(main)/admin/urunler/_components/urun-form.tsx
// Paspas ERP — Ürün oluştur / düzenle formu
// =============================================================

import { useEffect, useMemo, useState } from "react";

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
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListCategoriesAdminQuery } from "@/integrations/endpoints/admin/categories_admin.endpoints";
import { useListKaliplarAdminQuery } from "@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints";
import {
  useCreateUrunAdminMutation,
  useDeleteUrunReceteAdminMutation,
  useGetUrunReceteAdminQuery,
  useListUrunlerAdminQuery,
  useSaveUrunReceteAdminMutation,
  useUpdateUrunAdminMutation,
} from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";
import type { CategoryDto } from "@/integrations/shared/category.types";
import type { OperasyonTipi, TedarikTipi, UrunDto, UrunKategori } from "@/integrations/shared/erp/urunler.types";

import OperasyonMakineSecici from "./operasyon-makine-secici";

// ── Schema ────────────────────────────────────────────────────
const operasyonMakineSchema = z.object({
  makineId: z.string().min(1),
  oncelikSira: z.coerce.number().int().min(1),
});

const operasyonSchema = z.object({
  operasyonAdi: z.string().min(1, "Zorunlu"),
  sira: z.coerce.number().int().min(1).default(1),
  kalipId: z.string().optional(),
  hazirlikSuresiDk: z.coerce.number().int().min(0).default(60),
  cevrimSuresiSn: z.coerce.number().min(0).default(45),
  montaj: z.boolean().default(false),
  makineler: z.array(operasyonMakineSchema).optional(),
});

const birimDonusumSchema = z.object({
  hedefBirim: z.string().min(1, "Zorunlu"),
  carpan: z.coerce.number().min(0.0001),
});

const schema = z.object({
  kategori: z.enum(["urun", "yarimamul", "hammadde"]).default("urun"),
  tedarikTipi: z.enum(["uretim", "satin_alma", "fason"]).default("uretim"),
  kod: z.string().min(1, "Kod zorunlu"),
  ad: z.string().min(1, "Ad zorunlu"),
  aciklama: z.string().optional(),
  birim: z.string().min(1, "Birim zorunlu"),
  renk: z.string().optional(),
  imageUrl: z.string().optional(),
  storageAssetId: z.string().optional(),
  imageAlt: z.string().optional(),
  stok: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).default(0)),
  kritikStok: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(0).default(0)),
  birimFiyat: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().positive("Pozitif olmalı").optional(),
  ),
  kdvOrani: z.preprocess((v) => (v === "" || v == null ? 20 : Number(v)), z.number().min(0).max(100).default(20)),
  operasyonTipi: z.enum(["tek_tarafli", "cift_tarafli"]).default("tek_tarafli"),
  isActive: z.boolean().default(true),
  operasyonlar: z.array(operasyonSchema).optional(),
  birimDonusumleri: z.array(birimDonusumSchema).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────
interface UrunFormProps {
  open: boolean;
  onClose: () => void;
  urun?: UrunDto | null;
}

const TEDARIK_OPTIONS: TedarikTipi[] = ["uretim", "satin_alma", "fason"];
const OPERASYON_OPTIONS: OperasyonTipi[] = ["tek_tarafli", "cift_tarafli"];

// ── Component ─────────────────────────────────────────────────
export default function UrunForm({ open, onClose, urun }: UrunFormProps) {
  const { t } = useLocaleContext();
  const isEdit = !!urun;
  const [create, createState] = useCreateUrunAdminMutation();
  const [update, updateState] = useUpdateUrunAdminMutation();
  const busy = createState.isLoading || updateState.isLoading;

  const { data: kalipData } = useListKaliplarAdminQuery();
  const { data: categoryData } = useListCategoriesAdminQuery({ limit: 50, sort: "display_order", order: "asc" });
  const kaliplar = kalipData?.items ?? [];
  const categories = (categoryData ?? []) as CategoryDto[];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kategori: "urun",
      tedarikTipi: "uretim",
      kod: "",
      ad: "",
      aciklama: "",
      birim: "adet",
      renk: "",
      imageUrl: "",
      storageAssetId: "",
      imageAlt: "",
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
  const watchTedarikTipi = form.watch("tedarikTipi");
  const watchOperasyonTipi = form.watch("operasyonTipi");
  const watchAd = form.watch("ad");
  const watchRenk = form.watch("renk");
  const selectedCategory = categories.find((item) => item.kod === watchKategori);

  // Show production fields only for uretim type
  const showProductionFields = watchTedarikTipi === "uretim";
  // Show operasyon_tipi only for 'urun' kategori
  const showOperasyonTipi = watchKategori === "urun" && showProductionFields;

  // Auto-generate operation names when operasyonTipi or ad changes (for new products)
  useEffect(() => {
    if (isEdit) return;
    if (!showProductionFields) {
      replaceOps([]);
      return;
    }

    const rawName = watchAd || "Ürün";
    const renk = watchRenk?.trim();
    const name = renk && !rawName.toLowerCase().includes(renk.toLowerCase())
      ? `${rawName} ${renk}`
      : rawName;
    if (watchKategori !== "urun") {
      replaceOps([{ operasyonAdi: name, sira: 1, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false }]);
    } else if (watchOperasyonTipi === "cift_tarafli") {
      replaceOps([
        { operasyonAdi: `${name} - Sol`, sira: 1, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false },
        { operasyonAdi: `${name} - Sağ`, sira: 2, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false },
      ]);
    } else {
      replaceOps([{ operasyonAdi: name, sira: 1, hazirlikSuresiDk: 60, cevrimSuresiSn: 45, montaj: false }]);
    }
  }, [watchKategori, watchOperasyonTipi, watchAd, watchRenk, showProductionFields, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    if (!selectedCategory) return;

    const nextTedarik = selectedCategory.varsayilan_tedarik_tipi as TedarikTipi;
    if (form.getValues("tedarikTipi") !== nextTedarik) {
      form.setValue("tedarikTipi", nextTedarik, { shouldDirty: true });
    }

    const nextOperation = selectedCategory.varsayilan_operasyon_tipi as OperasyonTipi | null;
    if (nextOperation && form.getValues("operasyonTipi") !== nextOperation) {
      form.setValue("operasyonTipi", nextOperation, { shouldDirty: true });
    }
  }, [selectedCategory, isEdit, form]);

  // Reset form when urun changes
  useEffect(() => {
    if (urun) {
      form.reset({
        kategori: urun.kategori ?? "urun",
        tedarikTipi: urun.tedarikTipi ?? "uretim",
        kod: urun.kod,
        ad: urun.ad,
        aciklama: urun.aciklama ?? "",
        birim: urun.birim,
        renk: urun.renk ?? "",
        imageUrl: urun.imageUrl ?? "",
        storageAssetId: urun.storageAssetId ?? "",
        imageAlt: urun.imageAlt ?? "",
        stok: urun.stok ?? 0,
        kritikStok: urun.kritikStok ?? 0,
        birimFiyat: urun.birimFiyat ?? undefined,
        kdvOrani: urun.kdvOrani ?? 20,
        operasyonTipi: urun.operasyonTipi ?? "tek_tarafli",
        isActive: urun.isActive,
        operasyonlar:
          urun.operasyonlar?.map((op) => ({
            operasyonAdi: op.operasyonAdi,
            sira: op.sira,
            kalipId: op.kalipId ?? undefined,
            hazirlikSuresiDk: op.hazirlikSuresiDk,
            cevrimSuresiSn: op.cevrimSuresiSn,
            montaj: op.montaj,
            makineler: op.makineler?.map((m) => ({ makineId: m.makineId, oncelikSira: m.oncelikSira })) ?? [],
          })) ?? [],
        birimDonusumleri:
          urun.birimDonusumleri?.map((d) => ({
            hedefBirim: d.hedefBirim,
            carpan: d.carpan,
          })) ?? [],
      });
    } else {
      form.reset({
        kategori: "urun",
        tedarikTipi: "uretim",
        kod: "",
        ad: "",
        aciklama: "",
        birim: "adet",
        renk: "",
        imageUrl: "",
        storageAssetId: "",
        imageAlt: "",
        stok: 0,
        kritikStok: 0,
        kdvOrani: 20,
        operasyonTipi: "tek_tarafli",
        isActive: true,
        operasyonlar: [],
        birimDonusumleri: [],
      });
    }
  }, [urun, open]);

  async function onSubmit(values: FormValues) {
    const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    const payload = {
      ...values,
      imageUrl: values.imageUrl?.trim() || undefined,
      imageAlt: values.imageAlt?.trim() || undefined,
      storageAssetId:
        values.storageAssetId && isUuid(values.storageAssetId.trim()) ? values.storageAssetId.trim() : undefined,
      aciklama: values.aciklama?.trim() || undefined,
      renk: values.renk?.trim() || undefined,
      // Clean kalipId sentinel
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
        await create(payload as any).unwrap();
        toast.success(t("admin.erp.common.created", { item: t("admin.erp.urunler.singular") }));
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? t("admin.erp.common.operationFailed"));
    }
  }

  const tForm = (key: string) => t(`admin.erp.urunler.form.${key}`);
  const tKategori = (k: string) => t(`admin.erp.urunler.kategoriLabel.${k}`);
  const tTedarik = (k: string) => t(`admin.erp.urunler.tedarikTipiLabel.${k}`);
  const tOperasyon = (k: string) => t(`admin.erp.urunler.operasyonTipiLabel.${k}`);

  const tRecete = (key: string) => t(`admin.erp.urunler.form.${key}`);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{isEdit ? t("admin.erp.urunler.editItem") : t("admin.erp.urunler.newItem")}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Kategori + Tedarik Tipi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {(categories.length
                    ? categories.map((item) => item.kod as UrunKategori)
                    : (["urun", "yarimamul", "hammadde"] as UrunKategori[])
                  ).map((k) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{tForm("kod")} *</Label>
              <Input {...form.register("kod")} placeholder={tForm("kodPlaceholder")} />
              {form.formState.errors.kod && (
                <p className="text-xs text-destructive">{form.formState.errors.kod.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{tForm("birim")} *</Label>
              <Input {...form.register("birim")} placeholder={tForm("birimPlaceholder")} />
            </div>
          </div>

          {/* Ad */}
          <div className="space-y-1">
            <Label>{tForm("ad")} *</Label>
            <Input {...form.register("ad")} placeholder={tForm("adPlaceholder")} />
            {form.formState.errors.ad && <p className="text-xs text-destructive">{form.formState.errors.ad.message}</p>}
          </div>

          {/* Açıklama */}
          <div className="space-y-1">
            <Label>{tForm("aciklama")}</Label>
            <Input {...form.register("aciklama")} placeholder={tForm("aciklamaPlaceholder")} />
          </div>

          {/* Görsel */}
          <div className="space-y-2">
            <Label>{tForm("gorsel")}</Label>
            <AdminImageUploadField
              label={tForm("gorsel")}
              helperText={tForm("gorselHelp")}
              bucket="public"
              folder="product-images"
              value={form.watch("imageUrl") || ""}
              onChange={(url) => form.setValue("imageUrl", url, { shouldDirty: true })}
              onSelectAsset={({ url, assetId }) => {
                form.setValue("imageUrl", url || "", { shouldDirty: true });
                form.setValue("storageAssetId", assetId || "", { shouldDirty: true });
              }}
              disabled={busy}
            />
            <input type="hidden" {...form.register("storageAssetId")} />
          </div>

          {/* Renk + Image Alt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{tForm("renk")}</Label>
              <Input {...form.register("renk")} placeholder={tForm("renkPlaceholder")} />
            </div>
            <div className="space-y-1">
              <Label>{tForm("imageAlt")}</Label>
              <Input {...form.register("imageAlt")} placeholder={tForm("imageAltPlaceholder")} />
            </div>
          </div>

          {/* Birim Fiyat + KDV */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{tForm("stok")}</Label>
              <Input type="number" step="0.0001" {...form.register("stok")} placeholder={tForm("stokPlaceholder")} />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Input type="number" step="1" {...form.register("kdvOrani")} placeholder={tForm("kdvOraniPlaceholder")} />
            </div>
          </div>

          {/* Operasyon Tipi — only for 'urun' kategori + 'uretim' tedarik */}
          {showOperasyonTipi && (
            <div className="space-y-1">
              <Label>{tForm("operasyonTipi")}</Label>
              <Select
                value={form.watch("operasyonTipi")}
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

          {/* Operasyonlar section */}
          {showProductionFields && opFields.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">{tForm("operasyonlarTitle")}</h3>
                {opFields.map((field, idx) => (
                  <div key={field.id} className="rounded-lg border p-4 space-y-3 bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          onCheckedChange={(v) => form.setValue(`operasyonlar.${idx}.montaj`, v, { shouldDirty: true })}
                        />
                        <Label className="text-xs">{tForm("montaj")}</Label>
                      </div>
                    </div>
                    <OperasyonMakineSecici
                      kalipId={form.watch(`operasyonlar.${idx}.kalipId`) || undefined}
                      makineler={form.watch(`operasyonlar.${idx}.makineler`) ?? []}
                      onChange={(m) => form.setValue(`operasyonlar.${idx}.makineler`, m, { shouldDirty: true })}
                      disabled={busy}
                      tForm={tForm}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Birim Dönüşümleri */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{tForm("birimDonusumleriTitle")}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendDonusum({ hedefBirim: "", carpan: 1 })}
              >
                <Plus className="size-3 mr-1" /> {tForm("donusumEkle")}
              </Button>
            </div>
            {donusumFields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">{tForm("hedefBirim")}</Label>
                  <Input
                    {...form.register(`birimDonusumleri.${idx}.hedefBirim`)}
                    placeholder={tForm("hedefBirimPlaceholder")}
                  />
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
            ))}
          </div>

          {/* Reçete — only when editing */}
          {isEdit && urun && (
            <>
              <Separator />
              <ReceteSection urunId={urun.id} birim={urun.birim} />
            </>
          )}

          {/* Aktif */}
          <div className="flex items-center gap-3">
            <Switch checked={form.watch("isActive")} onCheckedChange={(v) => form.setValue("isActive", v)} />
            <Label>{tForm("aktif")}</Label>
          </div>

          <SheetFooter className="pt-4 border-t mt-2 px-0 pb-1">
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

// ── ReceteSection ─────────────────────────────────────────────
interface ReceteSectionProps {
  urunId: string;
  birim: string;
}

interface ReceteRow {
  urunId: string;
  miktar: number;
  fireOrani: number;
  sira: number;
}

function ReceteSection({ urunId, birim }: ReceteSectionProps) {
  const { t } = useLocaleContext();
  const tForm = (key: string) => t(`admin.erp.urunler.form.${key}`);

  const { data: receteData, isLoading: receteLoading } = useGetUrunReceteAdminQuery(urunId);
  const { data: malzemeData } = useListUrunlerAdminQuery({ limit: 500 });
  const [saveRecete, saveState] = useSaveUrunReceteAdminMutation();
  const [deleteRecete, deleteState] = useDeleteUrunReceteAdminMutation();

  const [rows, setRows] = useState<ReceteRow[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Malzeme options: hammadde + yarimamul (exclude self)
  const malzemeOptions = useMemo(() => {
    if (!malzemeData?.items) return [];
    return malzemeData.items.filter(
      (u) => (u.kategori === "hammadde" || u.kategori === "yarimamul") && u.id !== urunId,
    );
  }, [malzemeData, urunId]);

  // Initialize rows from fetched recipe
  useEffect(() => {
    if (receteLoading || initialized) return;
    if (receteData?.items?.length) {
      setRows(
        receteData.items.map((item) => ({
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

  // Reset initialization when urunId changes
  useEffect(() => {
    setInitialized(false);
  }, [urunId]);

  function addRow() {
    setRows((prev) => [...prev, { urunId: "", miktar: 1, fireOrani: 0, sira: prev.length + 1 }]);
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
      await saveRecete({ urunId, items: validRows }).unwrap();
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
      toast.success(t("admin.erp.common.deleted", { item: "Reçete" }));
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast.error(msg ?? t("admin.erp.common.deleteFailed"));
    }
  }

  const busy = saveState.isLoading || deleteState.isLoading;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{tForm("receteTitle")}</h3>
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
              <Trash2 className="size-3 mr-1" /> {tForm("receteSil")}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={busy}>
            <Plus className="size-3 mr-1" /> {tForm("receteSatirEkle")}
          </Button>
        </div>
      </div>

      {rows.length === 0 && !receteLoading && (
        <p className="text-sm text-muted-foreground py-2">{tForm("receteYok")}</p>
      )}

      {rows.map((row, idx) => {
        const malzeme = malzemeOptions.find((u) => u.id === row.urunId);
        const rowCost = getRowCost(row);
        return (
          <div key={idx} className="rounded-lg border p-3 space-y-2 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
              {/* Malzeme */}
              <div className="sm:col-span-3 space-y-1">
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
              {/* Miktar */}
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
              {/* Fire % */}
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
              {/* Delete */}
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
            {/* Cost display */}
            {malzeme && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

      {/* Total cost + Save */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium">
            {tForm("receteToplamMaliyet")}:{" "}
            {toplamMaliyet.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
          </span>
          <Button type="button" size="sm" onClick={handleSave} disabled={busy}>
            {saveState.isLoading ? t("admin.erp.common.saving") : tForm("receteKaydet")}
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
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
