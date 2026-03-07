// =============================================================
// FILE: src/integrations/endpoints/admin/dashboard_admin.endpoints.ts
// =============================================================
import { baseApi } from "@/integrations/baseApi";
import type { DashboardSummary } from "@/integrations/shared";
import { normalizeDashboardSummary } from "@/integrations/shared";

// ── Types ──────────────────────────────────────────────────────
export interface DashboardKpi {
  activeProductionOrders: number;
  completionRatePercent: number;
  activeMachineRatePercent: number;
  lowStockProductCount: number;
  purchaseOpenCount: number;
  salesOpenCount: number;
}

export interface DashboardTrendPoint {
  date: string;
  productionOrders: number;
  salesOrders: number;
  purchaseOrders: number;
  stockMovements: number;
}

export interface DashboardTrend {
  days: number;
  items: DashboardTrendPoint[];
}

export interface ActionItem {
  id: string;
  type: 'overdue_production' | 'overdue_sales' | 'overdue_purchase' | 'overdue_task' | 'critical_stock' | 'pending_purchase';
  severity: 'critical' | 'warning';
  title: string;
  subtitle: string;
  href: string;
  date: string | null;
}

export interface ActionCenterResult {
  items: ActionItem[];
  counts: { critical: number; warning: number };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function toNum(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function normalizeKpi(res: unknown): DashboardKpi {
  const r = isRecord(res) ? res : {};
  return {
    activeProductionOrders:  toNum(r.activeProductionOrders),
    completionRatePercent:   toNum(r.completionRatePercent),
    activeMachineRatePercent: toNum(r.activeMachineRatePercent),
    lowStockProductCount:    toNum(r.lowStockProductCount),
    purchaseOpenCount:       toNum(r.purchaseOpenCount),
    salesOpenCount:          toNum(r.salesOpenCount),
  };
}

function normalizeActionCenter(res: unknown): ActionCenterResult {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : [];
  const counts = isRecord(r.counts) ? r.counts : {};
  return {
    items: rawItems.map((raw) => {
      const p = isRecord(raw) ? raw : {};
      return {
        id: String(p.id ?? ''),
        type: String(p.type ?? 'overdue_production') as ActionItem['type'],
        severity: String(p.severity ?? 'warning') as ActionItem['severity'],
        title: String(p.title ?? ''),
        subtitle: String(p.subtitle ?? ''),
        href: String(p.href ?? ''),
        date: p.date ? String(p.date) : null,
      };
    }),
    counts: {
      critical: toNum(counts.critical),
      warning: toNum(counts.warning),
    },
  };
}

function normalizeTrend(res: unknown): DashboardTrend {
  const r = isRecord(res) ? res : {};
  const rawItems = Array.isArray(r.items) ? r.items : [];
  return {
    days: toNum(r.days, 30),
    items: rawItems.map((raw) => {
      const p = isRecord(raw) ? raw : {};
      return {
        date:            String(p.date ?? ''),
        productionOrders: toNum(p.productionOrders),
        salesOrders:      toNum(p.salesOrders),
        purchaseOrders:   toNum(p.purchaseOrders),
        stockMovements:   toNum(p.stockMovements),
      };
    }),
  };
}

// ── API ────────────────────────────────────────────────────────
export const dashboardAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDashboardSummaryAdmin: b.query<DashboardSummary, void>({
      query: () => ({ url: "/admin/dashboard/summary" }),
      transformResponse: (res: unknown) => normalizeDashboardSummary(res),
      providesTags: [{ type: "Dashboard" as const, id: "SUMMARY" }],
    }),

    getDashboardKpiAdmin: b.query<DashboardKpi, void>({
      query: () => ({ url: "/admin/dashboard/kpi" }),
      transformResponse: (res: unknown) => normalizeKpi(res),
      providesTags: [{ type: "Dashboard" as const, id: "KPI" }],
    }),

    getDashboardTrendAdmin: b.query<DashboardTrend, { days?: number } | void>({
      query: (params) => ({ url: "/admin/dashboard/trend", params: params ?? undefined }),
      transformResponse: (res: unknown) => normalizeTrend(res),
      providesTags: [{ type: "Dashboard" as const, id: "TREND" }],
    }),

    getDashboardActionCenterAdmin: b.query<ActionCenterResult, void>({
      query: () => ({ url: "/admin/dashboard/action-center" }),
      transformResponse: (res: unknown) => normalizeActionCenter(res),
      providesTags: [{ type: "Dashboard" as const, id: "ACTION_CENTER" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDashboardSummaryAdminQuery,
  useGetDashboardKpiAdminQuery,
  useGetDashboardTrendAdminQuery,
  useGetDashboardActionCenterAdminQuery,
} = dashboardAdminApi;
