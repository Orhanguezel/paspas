// =============================================================
// FILE: src/modules/categories/validation.ts
// =============================================================
import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

const categoryCodeEnum = z.enum(["urun", "yarimamul", "hammadde"]);
const supplyTypeEnum = z.enum(["uretim", "satin_alma", "fason"]);
const operationTypeEnum = z.enum(["tek_tarafli", "cift_tarafli"]);

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal("0"),
  z.literal("1"),
  z.literal("true"),
  z.literal("false"),
]);

const baseCategorySchema = z
  .object({
    id: z.string().min(1).optional(),
    kod: categoryCodeEnum.optional(),
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),

    description: emptyToNull(z.string().optional().nullable()),
    image_url: emptyToNull(z.string().url().optional().nullable()), // LONGTEXT, limit yok
    alt: emptyToNull(z.string().max(255).optional().nullable()),

    icon: emptyToNull(z.string().max(100).optional().nullable()),

    has_cart: boolLike.optional(),

    is_active: boolLike.optional(),
    is_featured: boolLike.optional(),
    is_unlimited: boolLike.optional(),
    display_order: z.coerce.number().int().min(0).optional(),

    whatsapp_number: emptyToNull(z.string().max(50).optional().nullable()),
    phone_number: emptyToNull(z.string().max(50).optional().nullable()),
    varsayilan_tedarik_tipi: supplyTypeEnum.optional(),
    uretim_alanlari_aktif: boolLike.optional(),
    operasyon_tipi_gerekli: boolLike.optional(),
    varsayilan_operasyon_tipi: emptyToNull(operationTypeEnum.optional().nullable()),

    // FE’den gelebilecek ama DB’de olmayan alanları tolere et
    seo_title: emptyToNull(z.string().max(255).optional().nullable()),
    seo_description: emptyToNull(z.string().max(500).optional().nullable()),
  })
  .passthrough();

export const categoryCreateSchema = baseCategorySchema.superRefine(
  (data, ctx) => {
    if (!data.kod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "kod_required",
        path: ["kod"],
      });
    }
    if (!data.name && !data.kod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "name_required",
        path: ["name"],
      });
    }
    if (!data.slug && !data.kod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "slug_required",
        path: ["slug"],
      });
    }
    if ("parent_id" in (data as Record<string, unknown>)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "parent_id_not_supported_on_categories",
        path: ["parent_id"],
      });
    }
    validateErpRules(data, ctx);
  }
);

export const categoryUpdateSchema = baseCategorySchema
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "no_fields_to_update",
      });
    }
    if ("parent_id" in (data as Record<string, unknown>)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "parent_id_not_supported_on_categories",
        path: ["parent_id"],
      });
    }
    validateErpRules(data, ctx);
  });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

/** ✅ Storage asset ile kategori görselini ayarlama/silme (+ alt) */
export const categorySetImageSchema = z
  .object({
    /** null/undefined ⇒ görseli kaldır */
    asset_id: z.string().min(1).nullable().optional(),
    /** alt gelirse güncellenir; null/"" ⇒ alt temizlenir */
    alt: emptyToNull(z.string().max(255).optional().nullable()),
  })
  .strict();

export type CategorySetImageInput = z.infer<typeof categorySetImageSchema>;

function normalizeBoolLike(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  const s = String(value).toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return undefined;
}

function validateErpRules(
  data: Partial<z.infer<typeof baseCategorySchema>>,
  ctx: z.RefinementCtx,
) {
  if (!data.kod) return;

  const supplyType = data.varsayilan_tedarik_tipi;
  const productionFields = normalizeBoolLike(data.uretim_alanlari_aktif);
  const operationRequired = normalizeBoolLike(data.operasyon_tipi_gerekli);
  const operationType = data.varsayilan_operasyon_tipi;

  if (data.kod === "hammadde") {
    if (supplyType && supplyType !== "satin_alma") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hammadde_supply_must_be_satin_alma",
        path: ["varsayilan_tedarik_tipi"],
      });
    }
    if (productionFields === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hammadde_production_fields_must_be_hidden",
        path: ["uretim_alanlari_aktif"],
      });
    }
    if (operationRequired === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hammadde_operation_type_not_required",
        path: ["operasyon_tipi_gerekli"],
      });
    }
    if (operationType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hammadde_default_operation_type_not_supported",
        path: ["varsayilan_operasyon_tipi"],
      });
    }
  }

  if (data.kod === "yarimamul") {
    if (operationType === "cift_tarafli") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "yarimamul_cift_tarafli_not_supported",
        path: ["varsayilan_operasyon_tipi"],
      });
    }
  }
}
