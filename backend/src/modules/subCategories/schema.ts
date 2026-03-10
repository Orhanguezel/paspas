// =============================================================
// FILE: src/modules/subCategories/schema.ts
// =============================================================
import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  char,
  varchar,
  text,
  longtext,
  int,
  tinyint,
  datetime,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

import { categories } from '@/modules/categories/schema';
import { storageAssets } from '@/modules/storage/schema';

export const subCategories = mysqlTable(
  'sub_categories',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    category_id: char('category_id', { length: 36 })
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),

    image_url: longtext('image_url'),
    storage_asset_id: char('storage_asset_id', { length: 36 }).references(
      () => storageAssets.id,
      { onDelete: 'set null' },
    ),
    alt: varchar('alt', { length: 255 }),
    icon: varchar('icon', { length: 100 }),

    is_active: tinyint('is_active').notNull().default(1).$type<boolean>(),
    is_featured: tinyint('is_featured').notNull().default(0).$type<boolean>(),
    has_cart: tinyint('has_cart').notNull().default(1).$type<boolean>(),
    display_order: int('display_order').notNull().default(0),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    ux_slug: uniqueIndex('sub_categories_slug_uq').on(t.slug),
    sc_category_idx: index('sub_categories_category_idx').on(t.category_id),
    sc_active_idx: index('sub_categories_active_idx').on(t.is_active),
    sc_order_idx: index('sub_categories_order_idx').on(t.display_order),
  }),
);

export type SubCategoryRow = typeof subCategories.$inferSelect;
export type NewSubCategoryRow = typeof subCategories.$inferInsert;
