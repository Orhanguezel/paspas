// =============================================================
// FILE: src/modules/categories/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  longtext,
  text,
  int,
  tinyint,
  datetime,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { storageAssets } from "@/modules/storage/schema";

export const categories = mysqlTable(
  "categories",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    kod: varchar("kod", { length: 32 }).notNull().default("urun"),

    /** FE Category.label */
    name: varchar("name", { length: 255 }).notNull(),
    /** FE Category.value — slug’ı value olarak kullanacağız */
    slug: varchar("slug", { length: 255 }).notNull(),

    description: text("description"),

    // ✅ TEKİL STORAGE PATTERN (birebir)
    image_url: longtext("image_url"),
    storage_asset_id: char("storage_asset_id", { length: 36 }).references(() => storageAssets.id, {
      onDelete: "set null",
    }),
    alt: varchar("alt", { length: 255 }),

    icon: varchar("icon", { length: 100 }),

    has_cart: tinyint("has_cart").notNull().default(1).$type<boolean>(),

    /** aktif/öne çıkarılmış ve sıralama */
    is_active: tinyint("is_active").notNull().default(1).$type<boolean>(),
    is_featured: tinyint("is_featured").notNull().default(0).$type<boolean>(),
    /** 1 = bu kategoride ilan verme abonelik/limit gerektirmez (ör. Cenaze İlanları) */
    is_unlimited: tinyint("is_unlimited").notNull().default(0).$type<boolean>(),
    display_order: int("display_order").notNull().default(0),

    /** Kategorinin iletişim numaraları (ilan detayı / kategori sayfasında gösterilir) */
    whatsapp_number: varchar("whatsapp_number", { length: 50 }),
    phone_number: varchar("phone_number", { length: 50 }),

    /** ERP kategori davranislari */
    varsayilan_birim: varchar("varsayilan_birim", { length: 32 }).notNull().default("adet"),
    varsayilan_kod_prefixi: varchar("varsayilan_kod_prefixi", { length: 16 }).notNull().default("URN"),
    recetede_kullanilabilir: tinyint("recetede_kullanilabilir").notNull().default(0).$type<boolean>(),
    varsayilan_tedarik_tipi: varchar("varsayilan_tedarik_tipi", { length: 32 })
      .notNull()
      .default("uretim"),
    uretim_alanlari_aktif: tinyint("uretim_alanlari_aktif").notNull().default(1).$type<boolean>(),
    operasyon_tipi_gerekli: tinyint("operasyon_tipi_gerekli").notNull().default(1).$type<boolean>(),
    varsayilan_operasyon_tipi: varchar("varsayilan_operasyon_tipi", { length: 32 }),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    ux_kod: uniqueIndex("categories_kod_uq").on(t.kod),
    ux_slug: uniqueIndex("categories_slug_uq").on(t.slug),
    categories_active_idx: index("categories_active_idx").on(t.is_active),
    categories_order_idx: index("categories_order_idx").on(t.display_order),
    categories_storage_asset_idx: index("categories_storage_asset_idx").on(t.storage_asset_id),
  })
);

export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;
