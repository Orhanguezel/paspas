export interface UnitView {
  id: string;
  name: string;
  slug: string;
  symbol: string;
  type: string;
  precision: number;
  is_active: boolean | 0 | 1;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UnitListParams {
  q?: string;
  type?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'type' | 'display_order' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface UnitCreatePayload {
  name: string;
  slug: string;
  symbol: string;
  type: string;
  precision?: number;
  is_active?: boolean;
  display_order?: number;
}

export type UnitPatchPayload = Partial<UnitCreatePayload>;

