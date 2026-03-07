// =============================================================
// FILE: src/integrations/shared/subscription.types.ts
// Abonelik planları — DTO + payload tipleri
// =============================================================

// ------------------------------------------------------------------
// DTOs
// ------------------------------------------------------------------

export interface SubscriptionPlanFeatureDto {
  id: number;
  plan_id: number;
  feature_key: string;
  feature_value: string; // "-1" = sınırsız, "30" = 30 gün, "true"/"false"
  is_enabled: boolean;
}

export interface SubscriptionPlanDto {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_monthly: string;   // DECIMAL → backend string döner
  price_yearly:  string | null;
  is_active:  boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  /** Detay endpoint'te gelir */
  features?: SubscriptionPlanFeatureDto[];
}

export interface UserSubscriptionDto {
  id: number;
  user_id: string;
  plan_id: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------
// Payloads
// ------------------------------------------------------------------

export interface PlanCreatePayload {
  slug: string;
  name: string;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number | null;
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number;
}

export type PlanUpdatePayload = Partial<PlanCreatePayload>;

export interface FeatureItem {
  key: string;
  value: string;
  is_enabled?: boolean;
}

export interface FeaturesBulkPayload {
  features: FeatureItem[];
}

export interface AssignPlanPayload {
  plan_id: number;
  expires_at?: string | null;
}

// ------------------------------------------------------------------
// Feature key sabitleri (UI'da gösterilecek bilinen anahtarlar)
// ------------------------------------------------------------------
export const KNOWN_FEATURE_KEYS = [
  'max_active_listings',
  'listing_duration_days',
  'can_add_video',
  'can_feature_listing',
  'can_boost_listing',
] as const;

export type KnownFeatureKey = typeof KNOWN_FEATURE_KEYS[number];
