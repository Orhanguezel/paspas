// =============================================================
// FILE: src/integrations/shared/product_faqs_admin.types.ts
// product_faqs tablo şemasına göre (backend admin.faqs.controller)
// =============================================================

export interface AdminProductFaqDto {
  id: string;
  product_id: string;
  locale: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean | 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface AdminProductFaqCreatePayload {
  id?: string;
  question: string;
  answer: string;
  display_order?: number;
  is_active?: boolean;
}

export interface AdminProductFaqListParams {
  productId: string;
  locale: string;
}

export interface AdminProductFaqReplacePayload {
  items: AdminProductFaqCreatePayload[];
}
