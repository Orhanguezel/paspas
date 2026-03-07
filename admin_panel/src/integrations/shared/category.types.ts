// =============================================================
// FILE: src/integrations/types/category.types.ts
// Ensotek – Kategori tipleri (DB/DTO + payloadlar)
// =============================================================

/**
 * Backend'deki CategoryRow ile bire bir DTO
 */
export interface CategoryDto {
  id: string;
  kod: string;
  name: string;
  slug: string;

  description: string | null;

  image_url: string | null;
  storage_asset_id: string | null;

  alt: string | null;
  icon: string | null;

  is_active: boolean;
  is_featured: boolean;
  has_cart: boolean;
  is_unlimited: boolean;
  display_order: number;

  whatsapp_number: string | null;
  phone_number: string | null;
  varsayilan_tedarik_tipi: 'uretim' | 'satin_alma' | 'fason';
  uretim_alanlari_aktif: boolean;
  operasyon_tipi_gerekli: boolean;
  varsayilan_operasyon_tipi: 'tek_tarafli' | 'cift_tarafli' | null;

  created_at: string;
  updated_at: string;
}

/**
 * Admin list endpoint'ine giden query parametreleri
 * (AdminListCategoriesQS ile uyumlu)
 */
export interface CategoryListQueryParams {
  q?: string;
  is_active?: boolean | string;
  is_featured?: boolean | string;
  limit?: number;
  offset?: number;
  sort?: 'display_order' | 'name' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

/**
 * Create payload – categoryCreateSchema ile uyumlu olacak şekilde
 */
export interface CategoryCreatePayload {
  id?: string; // genelde backend randomUUID, ama opsiyonel bırakıyoruz
  kod: 'urun' | 'yarimamul' | 'hammadde';

  name?: string;
  slug?: string;

  description?: string | null;
  image_url?: string | null;
  alt?: string | null;

  icon?: string | null;

  // boolLike ile uyumlu tip
  is_active?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  is_featured?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  has_cart?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  is_unlimited?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';

  display_order?: number;

  whatsapp_number?: string | null;
  phone_number?: string | null;
  varsayilan_tedarik_tipi?: 'uretim' | 'satin_alma' | 'fason';
  uretim_alanlari_aktif?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  operasyon_tipi_gerekli?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  varsayilan_operasyon_tipi?: 'tek_tarafli' | 'cift_tarafli' | null;
}

/**
 * Update payload – categoryUpdateSchema.partial()
 *  - id body’de beklenmediği için hariç tutuldu
 */
export type CategoryUpdatePayload = Partial<Omit<CategoryCreatePayload, 'id'>>;

/**
 * Sıralama endpoint’i için payload
 * POST /admin/categories/reorder
 */
export interface CategoryReorderItem {
  id: string;
  display_order: number;
}

export interface CategoryReorderPayload {
  items: CategoryReorderItem[];
}

/**
 * Kapak görseli ayarlama payload’ı
 * PATCH /admin/categories/:id/image
 */
export interface CategorySetImagePayload {
  id: string;
  asset_id?: string | null;
  alt?: string | null;
}

/**
 * Public list için de aynı query tipini kullanabiliriz.
 * (listCategories controller ile uyumlu)
 */
export type CategoryPublicListQueryParams = CategoryListQueryParams;
