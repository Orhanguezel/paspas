// =============================================================
// FILE: src/integrations/shared/dashboard.types.ts
// FINAL — Dashboard Analytics Types (admin)
// =============================================================

export type DashboardRangeKey = "7d" | "30d" | "90d";
export type DashboardTrendBucket = "day" | "week";

export type AdminDashboardAnalyticsQuery = {
  range?: DashboardRangeKey;
};

export interface DashboardAnalyticsDto {
  range: DashboardRangeKey;
  from: string; // ISO
  to: string; // ISO
  meta: {
    bucket: DashboardTrendBucket;
  };

  totals: {
    delivered_orders: number;
    total_units_delivered: number;
    total_incentives: number;
  };

  drivers: Array<{
    driver_id: string;
    driver_name: string;
    delivered_orders: number;
    units_delivered: number;
    incentives: number;
  }>;

  sellers: Array<{
    seller_id: string;
    seller_name: string;
    delivered_orders: number;
    units_delivered: number;
    incentives: number;
  }>;

  product_mix: Array<{
    product_id: string;
    product_title: string;
    units_delivered: number;
  }>;

  species_mix: Array<{
    species: string;
    units_delivered: number;
  }>;

  trend: Array<{
    bucket: string; // YYYY-MM-DD | YYYY-Wxx
    delivered_orders: number;
    units_delivered: number;
    incentives: number;
  }>;
}

export interface DashboardCountItemDto {
  key: string;
  label: string;
  count: number;
}

export type DashboardSummaryItem = DashboardCountItemDto;

export type DashboardSummary = {
  items: DashboardCountItemDto[];
};

export interface DashboardRecentOrderDto {
  order_id: string;
  order_number: string;
  driver_name: string;
  seller_name: string;
  total_units: number;
  total_incentive: number;
  delivered_at: string; // ISO
}

const DASHBOARD_KEY_MAP: Record<string, string> = {
  menuitem: "menu_items",
  slider: "sliders",
  pricing_plans: "pricing",
  skillCounters: "skills",
  brandLogos: "brands",
};

const DASHBOARD_TOTALS_KEY_MAP: Record<string, string> = {
  resources_total: "resources",
  services_total: "services",
  faqs_total: "faqs",
  email_templates_total: "email_templates",
  site_settings_total: "site_settings",
  custom_pages_total: "custom_pages",
  menu_items_total: "menu_items",
  slider_total: "sliders",
  footer_sections_total: "footer_sections",
  reviews_total: "reviews",
  users_total: "users",
  storage_assets_total: "storage",
  contact_messages_total: "contacts",
  db_snapshots_total: "db",
  audit_logs_total: "audit",
  availability_total: "availability",
  notifications_total: "notifications",
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toCountItem(raw: unknown): DashboardCountItemDto {
  const source = isRecord(raw) ? raw : {};
  const rawKey = String(source.key ?? "").trim();
  const key = DASHBOARD_KEY_MAP[rawKey] ?? rawKey;
  const label = String(source.label ?? "").trim();
  const countNum = Number(source.count ?? 0);
  return {
    key,
    label: label || key,
    count: Number.isFinite(countNum) ? countNum : 0,
  };
}

export function normalizeDashboardSummary(res: unknown): DashboardSummary {
  const root = isRecord(res) ? res : {};

  const totalsRaw = isRecord(root.totals) ? root.totals : null;
  if (totalsRaw) {
    const items = Object.entries(DASHBOARD_TOTALS_KEY_MAP)
      .map(([totalKey, key]) => {
        const countRaw = totalsRaw[totalKey];
        const countNum = Number(countRaw ?? 0);
        return {
          key,
          label: key,
          count: Number.isFinite(countNum) ? countNum : 0,
        } as DashboardCountItemDto;
      })
      .filter((item) => item.count >= 0);

    return { items };
  }

  const itemsRaw = Array.isArray(res) ? res : Array.isArray(root.items) ? root.items : [];
  const items = itemsRaw.map(toCountItem).filter((x: DashboardCountItemDto) => x.key.length > 0);
  return { items };
}
