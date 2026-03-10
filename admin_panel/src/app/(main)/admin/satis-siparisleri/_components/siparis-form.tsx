"use client";

// =============================================================
// FILE: src/app/(main)/admin/satis-siparisleri/_components/siparis-form.tsx
// Paspas ERP — Sipariş oluştur / düzenle formu
// =============================================================

import { useCallback, useEffect, useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocaleContext } from "@/i18n/LocaleProvider";
import { useListMusterilerAdminQuery } from "@/integrations/endpoints/admin/erp/musteriler_admin.endpoints";
import {
  useCreateSatisSiparisiAdminMutation,
  useGetNextSiparisNoAdminQuery,
  useGetSatisSiparisiAdminQuery,
  useUpdateSatisSiparisiAdminMutation,
} from "@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints";
import { useListUrunlerAdminQuery } from "@/integrations/endpoints/admin/erp/urunler_admin.endpoints";
import type { SatisSiparisDto } from "@/integrations/shared/erp/satis_siparisleri.types";

const durumValues = ["taslak", "planlandi", "onaylandi", "uretimde", "kismen_sevk", "tamamlandi", "kapali", "iptal"] as const;
// Only these statuses can be manually set; the rest are auto-derived
const durumManualValues = ["kapali", "iptal"] as const;

const kalemSchema = z.object({
  urunId: z.string().min(1, "Ürün seçiniz"),
  miktar: z.coerce.number().positive("Pozitif olmalı"),
  birimFiyat: z.coerce.number().min(0).default(0),
  sira: z.coerce.number().int().min(0).default(0),
});

const schema = z.object({
  siparisNo: z.string().min(1, "Sipariş no zorunlu"),
  musteriId: z.string().min(1, "Müşteri seçiniz"),
  siparisTarihi: z.string().min(1, "Tarih zorunlu"),
  terminTarihi: z.string().optional(),
  durum: z.enum(durumValues).default("taslak"),
  aciklama: z.string().optional(),
  items: z.array(kalemSchema).min(1, "En az bir kalem ekleyin"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  siparis?: SatisSiparisDto | null;
}

export default function SiparisForm({ open, onClose, siparis }: Props) {
  const { t } = useLocaleContext();
  const isEdit = !!siparis;
  const [create, createState] = useCreateSatisSiparisiAdminMutation();
  const [update, updateState] = useUpdateSatisSiparisiAdminMutation();
  const busy = createState.isLoading || updateState.isLoading;

  const { data: detailData } = useGetSatisSiparisiAdminQuery(siparis?.id ?? "", { skip: !isEdit || !siparis?.id });
  const siparisDetail = isEdit ? detailData : null;

  const { data: musterilerData } = useListMusterilerAdminQuery({ tur: "musteri" });
  const { data: urunlerData } = useListUrunlerAdminQuery({});
  const { data: nextNoData } = useGetNextSiparisNoAdminQuery(undefined, { skip: isEdit });

  const musteriler = musterilerData?.items ?? [];
  const urunler = urunlerData?.items ?? [];

  const musteriIskontoMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const musteri of musteriler) {
      map.set(musteri.id, musteri.iskonto ?? 0);
    }
    return map;
  }, [musteriler]);

  const urunFiyatMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of urunler) {
      if (u.birimFiyat != null) map.set(u.id, u.birimFiyat);
    }
    return map;
  }, [urunler]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      siparisNo: "",
      musteriId: "",
      siparisTarihi: "",
      terminTarihi: "",
      durum: "taslak",
      aciklama: "",
      items: [{ urunId: "", miktar: 1, birimFiyat: 0, sira: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = form.watch("items");

  const handleUrunChange = useCallback(
    (idx: number, urunId: string) => {
      form.setValue(`items.${idx}.urunId`, urunId);
      const fiyat = urunFiyatMap.get(urunId);
      if (fiyat != null) {
        form.setValue(`items.${idx}.birimFiyat`, fiyat);
      }
    },
    [form, urunFiyatMap],
  );

  useEffect(() => {
    if (isEdit && siparisDetail) {
      form.reset({
        siparisNo: siparisDetail.siparisNo,
        musteriId: siparisDetail.musteriId,
        siparisTarihi: siparisDetail.siparisTarihi,
        terminTarihi: siparisDetail.terminTarihi ?? "",
        durum: siparisDetail.durum,
        aciklama: siparisDetail.aciklama ?? "",
        items: siparisDetail.items?.map((k) => ({
          urunId: k.urunId,
          miktar: k.miktar,
          birimFiyat: k.birimFiyat,
          sira: k.sira,
        })) ?? [{ urunId: "", miktar: 1, birimFiyat: 0, sira: 0 }],
      });
    } else if (!isEdit) {
      const today = new Date().toISOString().slice(0, 10);
      form.reset({
        siparisNo: nextNoData?.siparisNo ?? "",
        musteriId: "",
        siparisTarihi: today,
        terminTarihi: "",
        durum: "taslak",
        aciklama: "",
        items: [{ urunId: "", miktar: 1, birimFiyat: 0, sira: 0 }],
      });
    }
  }, [form, isEdit, nextNoData, siparisDetail]);

  const selectedMusteriId = form.watch("musteriId");
  const selectedMusteriIskonto = musteriIskontoMap.get(selectedMusteriId) ?? 0;

  const totals = useMemo(() => {
    const araToplam = watchedItems.reduce(
      (sum, item) => sum + (Number(item.miktar) || 0) * (Number(item.birimFiyat) || 0),
      0,
    );
    const iskontoOrani = selectedMusteriIskonto;
    const iskontoTutar = iskontoOrani > 0 ? araToplam * (iskontoOrani / 100) : 0;
    const iskontoluToplam = araToplam - iskontoTutar;
    const kdvToplam = watchedItems.reduce((sum, item) => {
      const urun = urunler.find((urunItem) => urunItem.id === item.urunId);
      const kdvOrani = urun?.kdvOrani ?? 20;
      const satirNet = (Number(item.miktar) || 0) * (Number(item.birimFiyat) || 0) * (1 - iskontoOrani / 100);
      return sum + satirNet * (kdvOrani / 100);
    }, 0);

    return {
      araToplam,
      iskontoTutar,
      kdvToplam,
      genelToplam: iskontoluToplam + kdvToplam,
    };
  }, [selectedMusteriIskonto, urunler, watchedItems]);

  // Müşteri değiştiğinde birim fiyat güncellenmez — fiyat her zaman indirimsiz baz fiyattır.
  // İskonto, toplam hesaplamasında ayrıca gösterilir.

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      terminTarihi: values.terminTarihi || undefined,
      aciklama: values.aciklama || undefined,
    };
    try {
      if (isEdit && siparis) {
        await update({ id: siparis.id, body: payload }).unwrap();
        toast.success(t("admin.erp.common.updated", { item: t("admin.erp.satisSiparisleri.singular") }));
      } else {
        await create(payload).unwrap();
        toast.success(t("admin.erp.common.created", { item: t("admin.erp.satisSiparisleri.singular") }));
      }
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "data" in err &&
        typeof err.data === "object" &&
        err.data !== null &&
        "error" in err.data &&
        typeof err.data.error === "object" &&
        err.data.error !== null &&
        "message" in err.data.error &&
        typeof err.data.error.message === "string"
          ? err.data.error.message
          : t("admin.erp.common.operationFailed");
      toast.error(message === "siparis_kilitli" ? t("admin.erp.satisSiparisleri.form.kilitliBilgi") : message);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            {isEdit ? t("admin.erp.satisSiparisleri.editItem") : t("admin.erp.satisSiparisleri.newItem")}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Üst alanlar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("admin.erp.satisSiparisleri.form.siparisNo")} *</Label>
              <Input
                {...form.register("siparisNo")}
                placeholder={t("admin.erp.satisSiparisleri.form.siparisNoPlaceholder")}
                disabled={siparis?.kilitli}
              />
              {form.formState.errors.siparisNo && (
                <p className="text-xs text-destructive">{form.formState.errors.siparisNo.message}</p>
              )}
            </div>
            {isEdit && (
              <div className="space-y-1">
                <Label>{t("admin.erp.satisSiparisleri.form.durum")}</Label>
                <Select
                  value={form.watch("durum")}
                  onValueChange={(v) => form.setValue("durum", v as FormValues["durum"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durumManualValues.map((d) => (
                      <SelectItem key={d} value={d}>
                        {t(`admin.erp.satisSiparisleri.statuses.${d}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("admin.erp.satisSiparisleri.form.durumOtomatikBilgi")}
                </p>
              </div>
            )}
          </div>

          {/* Müşteri */}
          <div className="space-y-1">
            <Label>{t("admin.erp.satisSiparisleri.form.musteri")} *</Label>
            <Select value={selectedMusteriId} onValueChange={(v) => form.setValue("musteriId", v)}>
              <SelectTrigger disabled={siparis?.kilitli}>
                <SelectValue placeholder={t("admin.erp.satisSiparisleri.form.musteriPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {musteriler.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.musteriId && (
              <p className="text-xs text-destructive">{form.formState.errors.musteriId.message}</p>
            )}
            {selectedMusteriId && (
              <p className="text-xs text-muted-foreground">
                {t("admin.erp.satisSiparisleri.form.musteriIskontoBilgi", {
                  oran: selectedMusteriIskonto,
                })}
              </p>
            )}
            {siparis?.kilitli && <p className="text-xs text-amber-600">{t("admin.erp.satisSiparisleri.form.kilitliBilgi")}</p>}
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t("admin.erp.satisSiparisleri.form.siparisTarihi")} *</Label>
              <Input type="date" {...form.register("siparisTarihi")} disabled={siparis?.kilitli} />
            </div>
            <div className="space-y-1">
              <Label>{t("admin.erp.satisSiparisleri.form.terminTarihi")}</Label>
              <Input type="date" {...form.register("terminTarihi")} />
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-1">
            <Label>{t("admin.erp.satisSiparisleri.form.aciklama")}</Label>
            <Input
              {...form.register("aciklama")}
              placeholder={t("admin.erp.satisSiparisleri.form.aciklamaPlaceholder")}
            />
          </div>

          {/* Kalemler */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("admin.erp.satisSiparisleri.form.kalemler")} *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ urunId: "", miktar: 1, birimFiyat: 0, sira: fields.length })}
                disabled={siparis?.kilitli}
              >
                <Plus className="mr-1 size-3" /> {t("admin.erp.satisSiparisleri.form.kalemEkle")}
              </Button>
            </div>
            {form.formState.errors.items?.root && (
              <p className="text-xs text-destructive">{form.formState.errors.items.root.message}</p>
            )}
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="grid grid-cols-1 sm:grid-cols-[minmax(220px,1fr)_100px_100px_36px] gap-2 items-end"
              >
                {/* Ürün */}
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">{t("admin.erp.satisSiparisleri.form.urun")}</Label>}
                  <Select
                    value={form.watch(`items.${idx}.urunId`)}
                    onValueChange={(v) => handleUrunChange(idx, v)}
                    disabled={siparis?.kilitli}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={t("admin.erp.satisSiparisleri.form.urunPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {urunler.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.items?.[idx]?.urunId && (
                    <p className="text-xs text-destructive">{form.formState.errors.items[idx]?.urunId?.message}</p>
                  )}
                </div>
                {/* Miktar */}
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">{t("admin.erp.satisSiparisleri.form.miktar")}</Label>}
                  <Input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    className="h-8 text-sm"
                    {...form.register(`items.${idx}.miktar`)}
                    disabled={siparis?.kilitli}
                  />
                </div>
                {/* Fiyat */}
                <div className="space-y-1">
                  {idx === 0 && <Label className="text-xs">{t("admin.erp.satisSiparisleri.form.fiyat")}</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-8 text-sm"
                    {...form.register(`items.${idx}.birimFiyat`)}
                    disabled={siparis?.kilitli}
                  />
                </div>
                {/* Sil */}
                <div className="justify-self-end sm:justify-self-auto">
                  {idx === 0 && <div className="hidden sm:block h-4" />}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1 || siparis?.kilitli}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="font-medium tabular-nums">
                  {totals.araToplam.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </span>
              </div>
              {totals.iskontoTutar > 0 && (
                <div className="flex items-center justify-between text-destructive">
                  <span>İskonto</span>
                  <span className="font-medium tabular-nums">
                    -{totals.iskontoTutar.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">KDV</span>
                <span className="font-medium tabular-nums">
                  {totals.kdvToplam.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-1">
                <span className="font-semibold">Genel Toplam</span>
                <span className="font-semibold tabular-nums">
                  {totals.genelToplam.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </span>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t mt-2 px-0 pb-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t("admin.common.cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("admin.erp.common.saving") : isEdit ? t("admin.common.save") : t("admin.common.save")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
