// =============================================================
// FILE: src/integrations/shared/product_reviews_admin.types.ts
// product_reviews tablo şemasına göre (backend admin.reviews.controller)
// =============================================================

export interface AdminProductReviewDto {
  id: string;
  product_id: string;
  user_id?: string | null;
  rating: number;
  comment?: string | null;
  is_active: boolean | 0 | 1;
  customer_name?: string | null;
  review_date: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProductReviewCreatePayload {
  rating: number;
  comment?: string;
  is_active?: boolean;
  customer_name?: string;
  review_date?: string;
}

export interface AdminProductReviewListParams {
  productId: string;
  order?: 'asc' | 'desc';
}
