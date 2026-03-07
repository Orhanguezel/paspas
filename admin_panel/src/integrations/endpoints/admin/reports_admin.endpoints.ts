// =============================================================
// FILE: src/integrations/endpoints/admin/reports_admin.endpoints.ts
// Admin Reports RTK endpoints (backend-required)
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { KpiRow, UserPerformanceRow, LocationRow, ReportRole } from '@/integrations/shared';

export const reportsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    adminReportsKpi: b.query<KpiRow[], { from?: string; to?: string } | void>({
      query: (params) => ({
        url: '/admin/reports/kpi',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (res: unknown): KpiRow[] => (Array.isArray(res) ? (res as KpiRow[]) : []),
    }),

    adminReportsUsersPerformance: b.query<
      UserPerformanceRow[],
      { from?: string; to?: string; role?: ReportRole } | void
    >({
      query: (params) => ({
        url: '/admin/reports/users-performance',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (res: unknown): UserPerformanceRow[] =>
        Array.isArray(res) ? (res as UserPerformanceRow[]) : [],
    }),

    adminReportsLocations: b.query<LocationRow[], { from?: string; to?: string } | void>({
      query: (params) => ({
        url: '/admin/reports/locations',
        method: 'GET',
        params: params ?? {},
      }),
      transformResponse: (res: unknown): LocationRow[] =>
        Array.isArray(res) ? (res as LocationRow[]) : [],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAdminReportsKpiQuery,
  useAdminReportsUsersPerformanceQuery,
  useAdminReportsLocationsQuery,
} = reportsAdminApi;
