// =============================================================
// FILE: src/integrations/shared/reports.ts
// Admin reports DTOs
// =============================================================

export type ReportRole = 'seller' | 'driver';

export type KpiRow = {
  period: 'day' | 'week' | 'month' | string;
  bucket: string;
  orders_total: number;
  delivered_orders: number;
  chickens_delivered: number;
  success_rate: number; // 0..1
};

export type UserPerformanceRow = {
  user_id: string;
  role: ReportRole | string;
  orders_total: number;
  delivered_orders: number;
  cancelled_orders: number;
  chickens_delivered: number;
  success_rate: number; // 0..1
  incentive_amount_total: number;
  incentive_deliveries_count: number;
  incentive_chickens_count: number;
};

export type LocationRow = {
  city_id: string | null;
  city_name: string | null;
  district_id: string | null;
  district_name: string | null;
  orders_total: number;
  delivered_orders: number;
  cancelled_orders: number;
  chickens_delivered: number;
  success_rate: number; // 0..1
};
