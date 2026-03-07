export interface ListingTagView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  sub_category_id: string | null;
  is_active: boolean | 0 | 1;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ListingTagListParams {
  q?: string;
  category_id?: string;
  sub_category_id?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'display_order' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

