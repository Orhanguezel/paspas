import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core';

export const adminAuditLogs = mysqlTable('admin_audit_logs', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  actor_user_id: char('actor_user_id', { length: 36 }),
  actor_email: varchar('actor_email', { length: 191 }),
  actor_role: varchar('actor_role', { length: 64 }),
  action: varchar('action', { length: 128 }).notNull(),
  resource: varchar('resource', { length: 128 }),
  resource_id: char('resource_id', { length: 36 }),
  method: varchar('method', { length: 8 }).notNull(),
  path: varchar('path', { length: 255 }).notNull(),
  route: varchar('route', { length: 255 }),
  status_code: int('status_code', { unsigned: true }).notNull(),
  request_id: varchar('request_id', { length: 64 }),
  ip: varchar('ip', { length: 64 }),
  user_agent: varchar('user_agent', { length: 255 }),
  payload: json('payload'),
  created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (t) => [
  index('idx_admin_audit_created_at').on(t.created_at),
  index('idx_admin_audit_actor_user_id').on(t.actor_user_id),
  index('idx_admin_audit_action').on(t.action),
  index('idx_admin_audit_status_code').on(t.status_code),
]);

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLogs.$inferInsert;
