// =============================================================
// FILE: src/integrations/types/catalog.types.ts
// Ensotek – Catalog Request Types (SINGLE SOURCE OF TRUTH)
// =============================================================

export const CATALOG_REQUEST_STATUSES = ['new', 'sent', 'failed', 'archived'] as const;

export type CatalogRequestStatus = (typeof CATALOG_REQUEST_STATUSES)[number];

export type CatalogRequestDto = {
  id: string;

  status: CatalogRequestStatus;

  locale: string | null;
  country_code: string | null;

  customer_name: string;
  company_name: string | null;

  email: string;
  phone: string | null;

  message: string | null;

  consent_marketing: number; // tinyint(1)
  consent_terms: number; // tinyint(1)

  admin_notes: string | null;

  email_sent_at: string | null; // ISO string
  created_at: string; // ISO string
  updated_at: string; // ISO string
};

/**
 * Admin LIST query params
 * Backend: catalogListQuerySchema
 * - order: string (eg: "created_at.desc")
 * - sort/orderDir alternative
 */
export type CatalogRequestListQueryParams = {
  order?: string;
  sort?: 'created_at' | 'updated_at';
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;

  status?: CatalogRequestStatus;
  locale?: string;
  country_code?: string;

  q?: string;
  email?: string;

  created_from?: string; // "YYYY-MM-DD" or ISO
  created_to?: string; // "YYYY-MM-DD" or ISO
};

export type PatchCatalogRequestAdminBody = {
  status?: CatalogRequestStatus;
  admin_notes?: string | null;
};

/**
 * POST /catalog-requests/:id/resend returns updated row (CatalogRequestDto)
 */
export type ResendCatalogRequestResult = CatalogRequestDto;

/**
 * DELETE /catalog-requests/:id returns 204 (no body)
 */
export type DeleteCatalogRequestResult = void;
