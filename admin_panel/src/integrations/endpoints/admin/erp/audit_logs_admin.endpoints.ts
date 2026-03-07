// =============================================================
// FILE: src/integrations/endpoints/admin/erp/audit_logs_admin.endpoints.ts
// Paspas ERP — Admin Audit Logs RTK Query endpoints
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  AdminAuditLogListParams,
  AdminAuditLogListResponse,
} from '@/integrations/shared/erp/audit_logs.types';
import { normalizeAdminAuditLogList } from '@/integrations/shared/erp/audit_logs.types';

const BASE = '/admin/audit-logs';

function readTotal(meta: unknown, fallback: number): number {
  const m = meta as { response?: { headers?: Headers } } | undefined;
  const raw = m?.response?.headers?.get('x-total-count');
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const auditLogsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listAdminAuditLogs: b.query<AdminAuditLogListResponse, AdminAuditLogListParams | void>({
      query: (params) => ({ url: BASE, params: params ?? undefined }),
      transformResponse: (res: unknown, meta) => {
        const normalized = normalizeAdminAuditLogList(res);
        const total = readTotal(meta, normalized.items.length);
        return normalizeAdminAuditLogList(res, total);
      },
      providesTags: [{ type: 'AuditLogs' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useListAdminAuditLogsQuery } = auditLogsAdminApi;
