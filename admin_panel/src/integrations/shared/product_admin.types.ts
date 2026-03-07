// =============================================================
// FILE: src/integrations/shared/product_admin.types.ts
// Admin "products" UI now maps backend /admin/properties module
// =============================================================

export type ProductItemType = 'property';

export type PropertyVariantValue = {
  variant_id: string;
  value: string;
  variant_name?: string;
  variant_slug?: string;
  value_type?: string;
  options?: string[] | null;
  unit_symbol?: string | null;
  unit_name?: string | null;
};

export interface AdminProductDto {
  id: string;
  user_id?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
  title: string;
  slug: string;
  excerpt?: string | null;
  description?: string | null;

  status: string;

  category_id?: string | null;
  category_name?: string | null;
  sub_category_id?: string | null;
  sub_category_name?: string | null;
  brand_id?: string | null;
  tag_ids?: string[];
  variant_values?: PropertyVariantValue[];

  address: string;
  district: string;
  city: string;
  neighborhood?: string | null;

  coordinates?: { lat: number; lng: number } | null;

  price?: number | string | null;
  currency?: string | null;
  is_negotiable?: boolean | 0 | 1;
  min_price_admin?: number | string | null;

  listing_no?: string | null;
  badge_text?: string | null;

  has_video?: boolean | 0 | 1;
  has_clip?: boolean | 0 | 1;
  has_virtual_tour?: boolean | 0 | 1;
  has_map?: boolean | 0 | 1;

  image_url?: string | null;
  image_asset_id?: string | null;
  alt?: string | null;

  is_active: boolean | 0 | 1;
  featured: boolean | 0 | 1;
  display_order?: number;

  meta_title?: string | null;
  meta_description?: string | null;

  created_at: string;
  updated_at: string;
}

export interface AdminProductListParams {
  q?: string;
  status?: string;
  category_id?: string;
  sub_category_id?: string;
  brand_id?: string;
  tag_ids?: string[] | string;
  district?: string;
  city?: string;
  neighborhood?: string;
  is_active?: boolean | string;
  featured?: boolean | string;
  limit?: number;
  offset?: number;
  sort?: 'price' | 'created_at' | 'updated_at';
  orderDir?: 'asc' | 'desc';
  order?: string;
}

export interface AdminProductListResult {
  items: AdminProductDto[];
  total: number;
}

export type PropertyAssetInput = {
  id?: string;
  asset_id?: string | null;
  url?: string | null;
  alt?: string | null;
  kind?: 'image' | 'video' | 'plan' | string;
  mime?: string | null;
  is_cover?: boolean;
  display_order?: number;
};

export interface AdminProductCreatePayload {
  title: string;
  slug: string;
  status: string;

  address: string;
  district: string;
  city: string;
  neighborhood?: string | null;
  coordinates?: { lat: number; lng: number } | null;

  excerpt?: string | null;
  description?: string | null;

  category_id?: string | null;
  sub_category_id?: string | null;
  brand_id?: string | null;
  tag_ids?: string[] | null;
  variant_values?: Array<{ variant_id: string; value: string }>;

  price?: number | null;
  currency?: string;
  is_negotiable?: boolean;
  min_price_admin?: number | null;

  listing_no?: string | null;
  badge_text?: string | null;
  featured?: boolean;

  image_url?: string | null;
  image_asset_id?: string | null;
  alt?: string | null;
  assets?: PropertyAssetInput[];

  meta_title?: string | null;
  meta_description?: string | null;

  has_video?: boolean;
  has_clip?: boolean;
  has_virtual_tour?: boolean;
  has_map?: boolean;

  is_active?: boolean;
  display_order?: number;
}

export type AdminProductUpdatePayload = Partial<AdminProductCreatePayload>;
