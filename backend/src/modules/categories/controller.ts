// =============================================================
// FILE: src/modules/categories/controller.ts  (PUBLIC)
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { categories } from "./schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { CategoryCreateInput, CategoryUpdateInput } from "./validation";
import { toBool, nullIfEmpty } from "@/modules/_shared/normalizers";

const ERP_CATEGORY_DEFAULTS = {
  urun: {
    name: "Urun",
    slug: "urun",
    varsayilan_birim: "takim",
    varsayilan_kod_prefixi: "URN",
    recetede_kullanilabilir: false,
    varsayilan_tedarik_tipi: "uretim",
    uretim_alanlari_aktif: true,
    operasyon_tipi_gerekli: true,
    varsayilan_operasyon_tipi: "tek_tarafli",
    display_order: 10,
  },
  yarimamul: {
    name: "Yarimamul",
    slug: "yarimamul",
    varsayilan_birim: "adet",
    varsayilan_kod_prefixi: "YM",
    recetede_kullanilabilir: true,
    varsayilan_tedarik_tipi: "uretim",
    uretim_alanlari_aktif: true,
    operasyon_tipi_gerekli: false,
    varsayilan_operasyon_tipi: null,
    display_order: 20,
  },
  hammadde: {
    name: "Hammadde",
    slug: "hammadde",
    varsayilan_birim: "kg",
    varsayilan_kod_prefixi: "HM",
    recetede_kullanilabilir: true,
    varsayilan_tedarik_tipi: "satin_alma",
    uretim_alanlari_aktif: false,
    operasyon_tipi_gerekli: false,
    varsayilan_operasyon_tipi: null,
    display_order: 30,
  },
} as const;

type ErpCategoryCode = keyof typeof ERP_CATEGORY_DEFAULTS;

function resolveCategoryDefaults(code?: string | null) {
  if (!code) return null;
  return ERP_CATEGORY_DEFAULTS[code as ErpCategoryCode] ?? null;
}

const ORDER_WHITELIST = {
  display_order: categories.display_order,
  name: categories.name,
  created_at: categories.created_at,
  updated_at: categories.updated_at,
} as const;

function parseOrder(q: Record<string, unknown>) {
  const sort = typeof q.sort === "string" ? q.sort : undefined;
  const dir1 = typeof q.order === "string" ? q.order : undefined;
  const combined =
    typeof q.order === "string" && q.order.includes(".")
      ? q.order
      : undefined;

  let col: keyof typeof ORDER_WHITELIST = "created_at";
  let dir: "asc" | "desc" = "desc";

  if (combined) {
    const [c, d] = combined.split(".");
    if (c && c in ORDER_WHITELIST) col = c as keyof typeof ORDER_WHITELIST;
    if (d === "asc" || d === "desc") dir = d;
  } else {
    if (sort && sort in ORDER_WHITELIST)
      col = sort as keyof typeof ORDER_WHITELIST;
    if (dir1 === "asc" || dir1 === "desc") dir = dir1;
  }

  const colExpr = ORDER_WHITELIST[col];
  const primary = dir === "asc" ? asc(colExpr) : desc(colExpr);
  return { primary, primaryCol: col };
}

/** GET /categories (public) — üst kategoriler */
export const listCategories: RouteHandler<{
  Querystring: {
    q?: string;
    is_active?: string | number | boolean;
    is_featured?: string | number | boolean;
    limit?: string | number;
    offset?: string | number;
    sort?: string;
    order?: string;
  };
}> = async (req, reply) => {
  const q = req.query ?? {};
  const conds: any[] = [];

  if (q.q) {
    const s = `%${String(q.q).trim()}%`;
    conds.push(
      sql`${categories.name} LIKE ${s} OR ${categories.slug} LIKE ${s}`
    );
  }

  if (q.is_active !== undefined)
    conds.push(eq(categories.is_active, toBool(q.is_active)));
  if (q.is_featured !== undefined)
    conds.push(eq(categories.is_featured, toBool(q.is_featured)));

  const where = conds.length ? and(...conds) : undefined;

  const limit = Math.min(Number(q.limit ?? 50) || 50, 100);
  const offset = Math.max(Number(q.offset ?? 0) || 0, 0);
  const { primary, primaryCol } = parseOrder(q as any);

  const countBase = db.select({ total: sql<number>`COUNT(*)` }).from(categories);
  const [{ total }] = where ? await countBase.where(where as any) : await countBase;

  const rowsBase = db.select().from(categories);
  const rowsQ = where ? rowsBase.where(where as any) : rowsBase;

  const orderExprs: any[] = [primary as any];
  if (primaryCol !== "display_order") orderExprs.push(asc(categories.display_order));

  const rows = await rowsQ.orderBy(...orderExprs).limit(limit).offset(offset);

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(rows);
};

/** GET /categories/:id (public) */
export const getCategoryById: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(rows[0]);
};

/** GET /categories/by-slug/:slug (public) */
export const getCategoryBySlug: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const { slug } = req.params;
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(rows[0]);
};

/** GET /categories/counts — aktif ilan sayısını kategori bazında döner */
export const getCategoryCounts: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select({ category_id: categories.id })
    .from(categories)
    .where(eq(categories.is_active, true));

  return reply.send(rows.map((r) => ({ category_id: r.category_id, count: 0 })));
};

/** Ortak payload yardımcıları (admin controller da kullanıyor) */
export function buildInsertPayload(input: CategoryCreateInput) {
  const id = input.id ?? randomUUID();
  const code = String(input.kod ?? "").trim() as ErpCategoryCode;
  const defaults = resolveCategoryDefaults(code);
  const name = String(input.name ?? defaults?.name ?? "").trim();
  const slug = String(input.slug ?? defaults?.slug ?? "").trim();

  return {
    id,
    kod: code,
    name,
    slug,
    description: (nullIfEmpty(input.description) as string | null) ?? null,
    image_url: (nullIfEmpty(input.image_url) as string | null) ?? null,
    storage_asset_id: null,
    alt: (nullIfEmpty(input.alt) as string | null) ?? null,
    icon: (nullIfEmpty(input.icon) as string | null) ?? null,

    // boolean kolonlar
    has_cart: input.has_cart === undefined ? true : toBool(input.has_cart),
    is_active: input.is_active === undefined ? true : toBool(input.is_active),
    is_featured:
      input.is_featured === undefined ? false : toBool(input.is_featured),
    is_unlimited:
      input.is_unlimited === undefined ? false : toBool(input.is_unlimited),

    display_order: input.display_order ?? defaults?.display_order ?? 0,

    whatsapp_number: (nullIfEmpty(input.whatsapp_number) as string | null) ?? null,
    phone_number: (nullIfEmpty(input.phone_number) as string | null) ?? null,
    varsayilan_birim: String(input.varsayilan_birim ?? defaults?.varsayilan_birim ?? "adet").trim(),
    varsayilan_kod_prefixi: String(
      input.varsayilan_kod_prefixi ?? defaults?.varsayilan_kod_prefixi ?? "URN",
    ).trim(),
    recetede_kullanilabilir:
      input.recetede_kullanilabilir === undefined
        ? defaults?.recetede_kullanilabilir ?? false
        : toBool(input.recetede_kullanilabilir),
    varsayilan_tedarik_tipi:
      input.varsayilan_tedarik_tipi ?? defaults?.varsayilan_tedarik_tipi ?? "uretim",
    uretim_alanlari_aktif:
      input.uretim_alanlari_aktif === undefined
        ? defaults?.uretim_alanlari_aktif ?? true
        : toBool(input.uretim_alanlari_aktif),
    operasyon_tipi_gerekli:
      input.operasyon_tipi_gerekli === undefined
        ? defaults?.operasyon_tipi_gerekli ?? true
        : toBool(input.operasyon_tipi_gerekli),
    varsayilan_operasyon_tipi:
      (nullIfEmpty(input.varsayilan_operasyon_tipi) as string | null) ??
      defaults?.varsayilan_operasyon_tipi ??
      null,
  };
}

export function buildUpdatePayload(patch: CategoryUpdateInput) {
  const set: Record<string, unknown> = {
    updated_at: (sql as any)`CURRENT_TIMESTAMP(3)`,
  };

  const defaults = resolveCategoryDefaults(
    patch.kod !== undefined ? String(patch.kod).trim() : undefined,
  );

  if (patch.kod !== undefined) set.kod = String(patch.kod).trim();
  if (patch.name !== undefined) set.name = String(patch.name).trim();
  if (patch.slug !== undefined) set.slug = String(patch.slug).trim();
  if (patch.description !== undefined)
    set.description = nullIfEmpty(patch.description) as string | null;
  if (patch.image_url !== undefined)
    set.image_url = nullIfEmpty(patch.image_url) as string | null;
  if (patch.alt !== undefined)
    set.alt = nullIfEmpty(patch.alt) as string | null;
  if (patch.icon !== undefined) set.icon = nullIfEmpty(patch.icon) as string | null;

  if (patch.has_cart !== undefined) set.has_cart = toBool(patch.has_cart);
  if (patch.is_active !== undefined) set.is_active = toBool(patch.is_active);
  if (patch.is_featured !== undefined) set.is_featured = toBool(patch.is_featured);
  if (patch.is_unlimited !== undefined) set.is_unlimited = toBool(patch.is_unlimited);

  if (patch.display_order !== undefined)
    set.display_order = Number(patch.display_order) || 0;

  if (patch.whatsapp_number !== undefined)
    set.whatsapp_number = nullIfEmpty(patch.whatsapp_number) as string | null;
  if (patch.phone_number !== undefined)
    set.phone_number = nullIfEmpty(patch.phone_number) as string | null;
  if (patch.varsayilan_birim !== undefined)
    set.varsayilan_birim = String(patch.varsayilan_birim).trim();
  if (patch.varsayilan_kod_prefixi !== undefined)
    set.varsayilan_kod_prefixi = String(patch.varsayilan_kod_prefixi).trim();
  if (patch.recetede_kullanilabilir !== undefined)
    set.recetede_kullanilabilir = toBool(patch.recetede_kullanilabilir);
  if (patch.varsayilan_tedarik_tipi !== undefined)
    set.varsayilan_tedarik_tipi = patch.varsayilan_tedarik_tipi;
  if (patch.uretim_alanlari_aktif !== undefined)
    set.uretim_alanlari_aktif = toBool(patch.uretim_alanlari_aktif);
  if (patch.operasyon_tipi_gerekli !== undefined)
    set.operasyon_tipi_gerekli = toBool(patch.operasyon_tipi_gerekli);
  if (patch.varsayilan_operasyon_tipi !== undefined)
    set.varsayilan_operasyon_tipi = nullIfEmpty(patch.varsayilan_operasyon_tipi) as string | null;

  if (patch.kod !== undefined && patch.name === undefined && defaults?.name) {
    set.name = defaults.name;
  }
  if (patch.kod !== undefined && patch.slug === undefined && defaults?.slug) {
    set.slug = defaults.slug;
  }
  if (patch.kod !== undefined && patch.display_order === undefined && defaults?.display_order !== undefined) {
    set.display_order = defaults.display_order;
  }
  if (patch.kod !== undefined && patch.varsayilan_tedarik_tipi === undefined && defaults?.varsayilan_tedarik_tipi) {
    set.varsayilan_tedarik_tipi = defaults.varsayilan_tedarik_tipi;
  }
  if (patch.kod !== undefined && patch.varsayilan_birim === undefined && defaults?.varsayilan_birim) {
    set.varsayilan_birim = defaults.varsayilan_birim;
  }
  if (patch.kod !== undefined && patch.varsayilan_kod_prefixi === undefined && defaults?.varsayilan_kod_prefixi) {
    set.varsayilan_kod_prefixi = defaults.varsayilan_kod_prefixi;
  }
  if (patch.kod !== undefined && patch.recetede_kullanilabilir === undefined && defaults) {
    set.recetede_kullanilabilir = defaults.recetede_kullanilabilir;
  }
  if (patch.kod !== undefined && patch.uretim_alanlari_aktif === undefined && defaults) {
    set.uretim_alanlari_aktif = defaults.uretim_alanlari_aktif;
  }
  if (patch.kod !== undefined && patch.operasyon_tipi_gerekli === undefined && defaults) {
    set.operasyon_tipi_gerekli = defaults.operasyon_tipi_gerekli;
  }
  if (patch.kod !== undefined && patch.varsayilan_operasyon_tipi === undefined) {
    set.varsayilan_operasyon_tipi = defaults?.varsayilan_operasyon_tipi ?? null;
  }

  return set;
}
