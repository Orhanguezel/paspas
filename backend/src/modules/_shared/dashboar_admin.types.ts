// ===================================================================
// FILE: src/modules/dashboard/admin.types.ts
// FINAL — Dashboard DTO/types
// ===================================================================

export type RangeKey = '7d' | '30d' | '90d';
export type TrendBucket = 'day' | 'week';

export type DashboardAnalyticsDto = {
  range: RangeKey;
  fromYmd: string; // YYYY-MM-DD (inclusive)
  toYmdExclusive: string; // YYYY-MM-DD (exclusive)
  meta: { bucket: TrendBucket };

  totals: {
    bookings_total: number;
    bookings_new: number;
    bookings_confirmed: number;
    bookings_completed: number;
    bookings_cancelled: number;
    bookings_other: number;

    slots_total: number;
    slots_reserved: number;

    resources_total: number;
    services_total: number;
    faqs_total: number;
    email_templates_total: number;
    site_settings_total: number;
    custom_pages_total: number;
    menu_items_total: number;
    slider_total: number;
    footer_sections_total: number;
    reviews_total: number;
    users_total: number;
    storage_assets_total: number;

    contact_messages_unread: number;
    contact_messages_total: number;
  };

  resources: Array<{
    resource_id: string;
    resource_name: string;
    bookings_total: number;
    bookings_new: number;
    bookings_confirmed: number;
    bookings_completed: number;
    bookings_cancelled: number;
    slots_total: number;
    slots_reserved: number;
  }>;

  trend: Array<{
    bucket: string; // YYYY-MM-DD | YYYY-Wxx
    bookings_total: number;
    bookings_new: number;
    bookings_confirmed: number;
    bookings_completed: number;
    bookings_cancelled: number;
  }>;
};
