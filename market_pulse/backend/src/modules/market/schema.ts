import {
  mysqlTable,
  char,
  varchar,
  text,
  tinyint,
  datetime,
  decimal,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const marketTargets = mysqlTable('market_targets', {
  id:               char('id', { length: 36 }).primaryKey().notNull(),
  name:             varchar('name', { length: 255 }).notNull(),
  category:         varchar('category', { length: 50 }).notNull().default('dealer'),
  status:           varchar('status', { length: 30 }).notNull().default('active'),
  website:          varchar('website', { length: 500 }),
  phone:            varchar('phone', { length: 50 }),
  email:            varchar('email', { length: 255 }),
  contact_name:     varchar('contact_name', { length: 255 }),
  city:             varchar('city', { length: 100 }),
  district:         varchar('district', { length: 100 }),
  instagram_url:    varchar('instagram_url', { length: 500 }),
  google_maps_url:  varchar('google_maps_url', { length: 500 }),
  notes:            text('notes'),
  churn_risk_score:   decimal('churn_risk_score', { precision: 4, scale: 1 }).default('0.0'),
  last_seen_at:       datetime('last_seen_at'),
  paspas_customer_id: char('paspas_customer_id', { length: 36 }),
  created_at:         datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at:         datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const marketLeads = mysqlTable('market_leads', {
  id:           char('id', { length: 36 }).primaryKey().notNull(),
  name:         varchar('name', { length: 255 }).notNull(),
  category:     varchar('category', { length: 100 }),
  source:       varchar('source', { length: 100 }).notNull().default('manual'),
  status:       varchar('status', { length: 50 }).notNull().default('new'),
  priority:     varchar('priority', { length: 20 }).notNull().default('medium'),
  score:        decimal('score', { precision: 4, scale: 1 }).notNull().default('0.0'),
  website:      varchar('website', { length: 500 }),
  phone:        varchar('phone', { length: 50 }),
  email:        varchar('email', { length: 255 }),
  contact_name: varchar('contact_name', { length: 255 }),
  city:         varchar('city', { length: 100 }),
  district:     varchar('district', { length: 100 }),
  notes:        text('notes'),
  assigned_to:  varchar('assigned_to', { length: 255 }),
  created_at:   datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at:   datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const marketSignals = mysqlTable('market_signals', {
  id:          char('id', { length: 36 }).primaryKey().notNull(),
  target_id:   char('target_id', { length: 36 }),
  lead_id:     char('lead_id', { length: 36 }),
  signal_type: varchar('signal_type', { length: 100 }).notNull().default('manual'),
  severity:    varchar('severity', { length: 20 }).notNull().default('medium'),
  title:       varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  source_url:  varchar('source_url', { length: 1000 }),
  is_reviewed: tinyint('is_reviewed').notNull().default(0),
  reviewed_at: datetime('reviewed_at'),
  created_at:  datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type TargetRow = typeof marketTargets.$inferSelect;
export type LeadRow   = typeof marketLeads.$inferSelect;
export type SignalRow  = typeof marketSignals.$inferSelect;

export function targetToDto(r: TargetRow) {
  return {
    id:             r.id,
    name:           r.name,
    category:       r.category,
    status:         r.status,
    website:        r.website ?? null,
    phone:          r.phone ?? null,
    email:          r.email ?? null,
    contactName:    r.contact_name ?? null,
    city:           r.city ?? null,
    district:       r.district ?? null,
    instagramUrl:   r.instagram_url ?? null,
    googleMapsUrl:  r.google_maps_url ?? null,
    notes:          r.notes ?? null,
    churnRiskScore:   Number(r.churn_risk_score ?? 0),
    lastSeenAt:       r.last_seen_at ?? null,
    paspasCustomerId: r.paspas_customer_id ?? null,
    createdAt:        r.created_at,
    updatedAt:        r.updated_at,
  };
}

export function leadToDto(r: LeadRow) {
  return {
    id:          r.id,
    name:        r.name,
    category:    r.category ?? null,
    source:      r.source,
    status:      r.status,
    priority:    r.priority,
    score:       Number(r.score ?? 0),
    website:     r.website ?? null,
    phone:       r.phone ?? null,
    email:       r.email ?? null,
    contactName: r.contact_name ?? null,
    city:        r.city ?? null,
    district:    r.district ?? null,
    notes:       r.notes ?? null,
    assignedTo:  r.assigned_to ?? null,
    createdAt:   r.created_at,
    updatedAt:   r.updated_at,
  };
}

export function signalToDto(r: SignalRow) {
  return {
    id:          r.id,
    targetId:    r.target_id ?? null,
    leadId:      r.lead_id ?? null,
    signalType:  r.signal_type,
    severity:    r.severity,
    title:       r.title,
    description: r.description ?? null,
    sourceUrl:   r.source_url ?? null,
    isReviewed:  r.is_reviewed === 1,
    reviewedAt:  r.reviewed_at ?? null,
    createdAt:   r.created_at,
  };
}
