// packages/db/src/schema/portal.ts
// Portal'a özel tablolar. ERP tablolarına FK ile bağlanır ama ERP onlara dokunmaz.

import { pgTable, uuid, varchar, integer, boolean, timestamp, numeric, jsonb, bigserial, inet, text, index } from "drizzle-orm/pg-core";
import { customers } from "./erp"; // ERP introspection'dan gelen tipler

export const portalUsers = pgTable("portal_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("dealer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  mustChangePw: boolean("must_change_pw").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  customerIdx: index("idx_portal_users_customer").on(t.customerId),
}));

export const portalSessions = pgTable("portal_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => portalUsers.id, { onDelete: "cascade" }),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const cart = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => portalUsers.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => cart.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull(), // products tablosu ERP'de
  vehicleMake: varchar("vehicle_make", { length: 50 }),
  vehicleModel: varchar("vehicle_model", { length: 100 }),
  vehicleYear: integer("vehicle_year"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  listPrice: numeric("list_price", { precision: 12, scale: 2 }).notNull(),
  discountPct: numeric("discount_pct", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const portalOrderDrafts = pgTable("portal_order_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  userId: uuid("user_id").notNull().references(() => portalUsers.id),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  // pending → submitted → erp_synced → erp_failed
  erpOrderId: integer("erp_order_id"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  payload: jsonb("payload").notNull(),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const portalAudit = pgTable("portal_audit", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => portalUsers.id),
  customerId: integer("customer_id"),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 100 }),
  metadata: jsonb("metadata"),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userTimeIdx: index("idx_audit_user_time").on(t.userId, t.createdAt),
}));

export type PortalUser = typeof portalUsers.$inferSelect;
export type NewPortalUser = typeof portalUsers.$inferInsert;
export type Cart = typeof cart.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type OrderDraft = typeof portalOrderDrafts.$inferSelect;
