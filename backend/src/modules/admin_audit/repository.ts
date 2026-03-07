import { and, asc, desc, eq, gte, like, lte, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db/client';

import { adminAuditLogs } from './schema';
import type { NewAdminAuditLog } from './schema';
import type { ListAuditQuery } from './validation';

type AuditModuleKey =
  | 'dashboard'
  | 'musteriler'
  | 'urunler'
  | 'satis_siparisleri'
  | 'uretim_emirleri'
  | 'makine_havuzu'
  | 'is_yukler'
  | 'gantt'
  | 'stoklar'
  | 'satin_alma'
  | 'hareketler'
  | 'operator'
  | 'tanimlar'
  | 'tedarikci'
  | 'kullanicilar'
  | 'site_ayarlari'
  | 'medyalar'
  | 'veritabani'
  | 'audit'
  | 'diger';

type AuditImpactLevel = 'bilgi' | 'uyari' | 'kritik';

export type AdminAuditLogListItem = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  method: string;
  path: string;
  route: string | null;
  status_code: number;
  request_id: string | null;
  ip: string | null;
  user_agent: string | null;
  payload: unknown;
  created_at: Date;
  module_key: AuditModuleKey;
  module_label: string;
  impact_level: AuditImpactLevel;
  success: boolean;
};

export type AuditSummary = {
  totalKayit: number;
  basarili: number;
  hatali: number;
  kritik: number;
  bugun: number;
};

type ListResult = {
  items: AdminAuditLogListItem[];
  total: number;
  summary: AuditSummary;
};

const MODULE_RULES: Array<{ key: AuditModuleKey; label: string; patterns: string[] }> = [
  { key: 'dashboard', label: 'Dashboard', patterns: ['/admin/dashboard'] },
  { key: 'musteriler', label: 'Musteriler', patterns: ['/admin/musteriler'] },
  { key: 'urunler', label: 'Urunler', patterns: ['/admin/urunler', '/admin/receteler'] },
  { key: 'satis_siparisleri', label: 'Satis Siparisleri', patterns: ['/admin/satis-siparisleri'] },
  { key: 'uretim_emirleri', label: 'Uretim Emirleri', patterns: ['/admin/uretim-emirleri'] },
  { key: 'makine_havuzu', label: 'Makine Havuzu', patterns: ['/admin/makine-havuzu', '/admin/makineler'] },
  { key: 'is_yukler', label: 'Makine Is Yukleri', patterns: ['/admin/is-yukler'] },
  { key: 'gantt', label: 'Gantt', patterns: ['/admin/gantt'] },
  { key: 'stoklar', label: 'Stoklar', patterns: ['/admin/stoklar'] },
  { key: 'satin_alma', label: 'Satin Alma', patterns: ['/admin/satin-alma'] },
  { key: 'hareketler', label: 'Hareketler', patterns: ['/admin/hareketler'] },
  { key: 'operator', label: 'Operator', patterns: ['/admin/operator'] },
  { key: 'tanimlar', label: 'Tanimlar', patterns: ['/admin/tanimlar'] },
  { key: 'tedarikci', label: 'Tedarikci', patterns: ['/admin/tedarikci'] },
  { key: 'kullanicilar', label: 'Kullanicilar', patterns: ['/admin/users', '/user_roles'] },
  { key: 'site_ayarlari', label: 'Site Ayarlari', patterns: ['/admin/site_settings', '/admin/site-settings'] },
  { key: 'medyalar', label: 'Medyalar', patterns: ['/admin/storage'] },
  { key: 'veritabani', label: 'Veritabani', patterns: ['/admin/db'] },
  { key: 'audit', label: 'Audit', patterns: ['/admin/audit-logs'] },
];

function buildWhere(query: ListAuditQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (query.q) {
    conditions.push(or(
      like(adminAuditLogs.actor_email, `%${query.q}%`),
      like(adminAuditLogs.action, `%${query.q}%`),
      like(adminAuditLogs.resource, `%${query.q}%`),
      like(adminAuditLogs.path, `%${query.q}%`),
      like(adminAuditLogs.request_id, `%${query.q}%`),
    ) as SQL);
  }
  if (query.actorUserId) {
    conditions.push(eq(adminAuditLogs.actor_user_id, query.actorUserId));
  }
  if (query.method) {
    conditions.push(eq(adminAuditLogs.method, query.method));
  }
  if (query.resource) {
    conditions.push(eq(adminAuditLogs.resource, query.resource));
  }
  if (query.moduleKey) {
    const rule = MODULE_RULES.find((item) => item.key === query.moduleKey);
    if (rule) {
      conditions.push(or(...rule.patterns.map((pattern) => like(adminAuditLogs.path, `${pattern}%`))) as SQL);
    }
  }
  if (query.statusCode !== undefined) {
    conditions.push(eq(adminAuditLogs.status_code, query.statusCode));
  }
  if (query.dateFrom) {
    conditions.push(gte(adminAuditLogs.created_at, new Date(`${query.dateFrom}T00:00:00.000Z`)));
  }
  if (query.dateTo) {
    conditions.push(lte(adminAuditLogs.created_at, new Date(`${query.dateTo}T23:59:59.999Z`)));
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

function detectModule(path: string): { key: AuditModuleKey; label: string } {
  for (const rule of MODULE_RULES) {
    if (rule.patterns.some((pattern) => path.startsWith(pattern))) {
      return { key: rule.key, label: rule.label };
    }
  }
  return { key: 'diger', label: 'Diger' };
}

function detectImpactLevel(method: string, statusCode: number): AuditImpactLevel {
  if (statusCode >= 500) return 'kritik';
  if (statusCode >= 400) return 'uyari';
  if (method === 'DELETE') return 'uyari';
  return 'bilgi';
}

export async function repoListAuditLogs(query: ListAuditQuery): Promise<ListResult> {
  const where = buildWhere(query);
  const orderBy = query.order === 'asc' ? asc(adminAuditLogs.created_at) : desc(adminAuditLogs.created_at);

  const [items, countResult, summaryRows] = await Promise.all([
    db.select().from(adminAuditLogs).where(where).orderBy(orderBy).limit(query.limit).offset(query.offset),
    db.select({ count: sql<number>`count(*)` }).from(adminAuditLogs).where(where),
    db.select({
      total_kayit: sql<number>`count(*)`,
      basarili: sql<number>`sum(case when ${adminAuditLogs.status_code} < 400 then 1 else 0 end)`,
      hatali: sql<number>`sum(case when ${adminAuditLogs.status_code} >= 400 then 1 else 0 end)`,
      kritik: sql<number>`sum(case when ${adminAuditLogs.status_code} >= 500 then 1 else 0 end)`,
      bugun: sql<number>`sum(case when date(${adminAuditLogs.created_at}) = current_date() then 1 else 0 end)`,
    }).from(adminAuditLogs).where(where),
  ]);

  const mappedItems = items.map((item) => {
    const moduleInfo = detectModule(item.path);
    return {
      ...item,
      module_key: moduleInfo.key,
      module_label: moduleInfo.label,
      impact_level: detectImpactLevel(item.method, item.status_code),
      success: item.status_code < 400,
    };
  }) as AdminAuditLogListItem[];

  const summary = summaryRows[0];
  return {
    items: mappedItems,
    total: Number(countResult[0]?.count ?? 0),
    summary: {
      totalKayit: Number(summary?.total_kayit ?? 0),
      basarili: Number(summary?.basarili ?? 0),
      hatali: Number(summary?.hatali ?? 0),
      kritik: Number(summary?.kritik ?? 0),
      bugun: Number(summary?.bugun ?? 0),
    },
  };
}

export async function insertAdminAuditLog(payload: NewAdminAuditLog): Promise<void> {
  await db.insert(adminAuditLogs).values(payload);
}
