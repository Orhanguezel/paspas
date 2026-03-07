// =============================================================
// FILE: src/integrations/shared/product_specs_admin.types.ts
// product_specs tablo şemasına göre (backend admin.specs.controller)
// =============================================================

export type ProductSpecCategory = 'physical' | 'material' | 'service' | 'custom';

export interface AdminProductSpecDto {
  id: string;
  product_id: string;
  locale: string;
  name: string;
  value: string;
  category: ProductSpecCategory;
  order_num: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProductSpecCreatePayload {
  id?: string;
  name: string;
  value: string;
  category?: ProductSpecCategory;
  order_num?: number;
}

export interface AdminProductSpecListParams {
  productId: string;
  locale: string;
}

export interface AdminProductSpecReplacePayload {
  items: AdminProductSpecCreatePayload[];
}
