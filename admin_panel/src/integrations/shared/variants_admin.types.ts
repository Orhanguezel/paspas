export type VariantValueType = 'text' | 'number' | 'boolean' | 'single_select' | 'multi_select';

export interface VariantView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  value_type: VariantValueType;
  category_id: string;
  sub_category_id: string | null;
  unit_id: string | null;
  options_json: string[] | null;
  is_required: boolean | 0 | 1;
  is_filterable: boolean | 0 | 1;
  is_active: boolean | 0 | 1;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface VariantListParams {
  q?: string;
  category_id?: string;
  sub_category_id?: string;
  unit_id?: string;
  value_type?: VariantValueType;
  is_active?: boolean;
  is_filterable?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'display_order' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface VariantCreatePayload {
  name: string;
  slug: string;
  description?: string | null;
  value_type: VariantValueType;
  category_id: string;
  sub_category_id?: string | null;
  unit_id?: string | null;
  options_json?: string[] | null;
  is_required?: boolean;
  is_filterable?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export type VariantPatchPayload = Partial<VariantCreatePayload>;

