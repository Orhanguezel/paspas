// =============================================================
// FILE: src/integrations/shared/erp/audit_logs.types.ts
// Paspas ERP — Admin Audit Log DTO & normalizers
// =============================================================

export type AuditMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuditOrder = 'asc' | 'desc';

export interface AdminAuditLogDto {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  method: AuditMethod | string;
  path: string;
  route: string | null;
  status_code: number;
  request_id: string | null;
  ip: string | null;
  user_agent: string | null;
  payload: unknown;
  created_at: string;
  module_key: string;
  module_label: string;
  impact_level: 'bilgi' | 'uyari' | 'kritik' | string;
  success: boolean;
}

export interface AdminAuditSummaryDto {
  totalKayit: number;
  basarili: number;
  hatali: number;
  kritik: number;
  bugun: number;
}

export interface AdminAuditLogListResponse {
  items: AdminAuditLogDto[];
  total: number;
  summary: AdminAuditSummaryDto;
}

export interface AdminAuditLogListParams {
  q?: string;
  actorUserId?: string;
  method?: AuditMethod;
  moduleKey?: string;
  resource?: string;
  statusCode?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  order?: AuditOrder;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function toStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeAdminAuditLog(raw: unknown): AdminAuditLogDto {
  const r = isRecord(raw) ? raw : {};

  return {
    id: toStr(r.id),
    actor_user_id: r.actor_user_id == null ? null : toStr(r.actor_user_id),
    actor_email: r.actor_email == null ? null : toStr(r.actor_email),
    actor_role: r.actor_role == null ? null : toStr(r.actor_role),
    action: toStr(r.action),
    resource: r.resource == null ? null : toStr(r.resource),
    resource_id: r.resource_id == null ? null : toStr(r.resource_id),
    method: toStr(r.method).toUpperCase(),
    path: toStr(r.path),
    route: r.route == null ? null : toStr(r.route),
    status_code: toNum(r.status_code),
    request_id: r.request_id == null ? null : toStr(r.request_id),
    ip: r.ip == null ? null : toStr(r.ip),
    user_agent: r.user_agent == null ? null : toStr(r.user_agent),
    payload: r.payload ?? null,
    created_at: toStr(r.created_at),
    module_key: toStr(r.module_key, 'diger'),
    module_label: toStr(r.module_label, 'Diger'),
    impact_level: toStr(r.impact_level, 'bilgi'),
    success: Boolean(r.success),
  };
}

export function normalizeAdminAuditLogList(
  response: unknown,
  totalHint?: number,
): AdminAuditLogListResponse {
  const r = isRecord(response) ? response : {};
  const rawItems = Array.isArray(r.items) ? r.items : Array.isArray(response) ? response : [];

  return {
    items: (rawItems as unknown[]).map(normalizeAdminAuditLog),
    total: totalHint ?? toNum(r.total, rawItems.length),
    summary: {
      totalKayit: toNum(isRecord(r.summary) ? r.summary.totalKayit : 0),
      basarili: toNum(isRecord(r.summary) ? r.summary.basarili : 0),
      hatali: toNum(isRecord(r.summary) ? r.summary.hatali : 0),
      kritik: toNum(isRecord(r.summary) ? r.summary.kritik : 0),
      bugun: toNum(isRecord(r.summary) ? r.summary.bugun : 0),
    },
  };
}
