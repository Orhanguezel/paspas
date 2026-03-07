export type BannerLinkTarget = '_self' | '_blank';

export interface BannerAdminView {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  image_asset_id: string | null;
  image_effective_url: string | null;
  thumbnail_url: string | null;
  thumbnail_asset_id: string | null;
  alt: string | null;
  background_color: string | null;
  title_color: string | null;
  description_color: string | null;
  button_text: string | null;
  button_color: string | null;
  button_hover_color: string | null;
  button_text_color: string | null;
  link_url: string | null;
  link_target: BannerLinkTarget;
  is_active: boolean;
  display_order: number;
  desktop_row: number;
  desktop_columns: number;
  advertiser_name: string | null;
  contact_info: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannerListParams {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'display_order' | 'title' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface BannerCreatePayload {
  title: string;
  slug?: string;
  subtitle?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_asset_id?: string | null;
  alt?: string | null;
  thumbnail_url?: string | null;
  thumbnail_asset_id?: string | null;
  background_color?: string | null;
  title_color?: string | null;
  description_color?: string | null;
  button_text?: string | null;
  button_color?: string | null;
  button_hover_color?: string | null;
  button_text_color?: string | null;
  link_url?: string | null;
  link_target?: BannerLinkTarget;
  is_active?: boolean;
  display_order?: number;
  desktop_row?: number;
  desktop_columns?: number;
  advertiser_name?: string | null;
  contact_info?: string | null;
  start_at?: string | null;
  end_at?: string | null;
}

export type BannerPatchPayload = Partial<BannerCreatePayload>;
