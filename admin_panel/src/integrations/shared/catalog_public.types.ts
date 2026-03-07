// =============================================================
// FILE: src/integrations/types/catalog_public.types.ts
// Ensotek – Public Catalog Request Types
// - DTO & Status single source: ./catalog.types
// =============================================================

import type { BoolLike,CatalogRequestDto } from '@/integrations/shared';

export type CreateCatalogRequestPublicBody = {
  locale?: string;
  country_code?: string; // backend upper-case transform ediyor

  customer_name: string;
  company_name?: string | null;

  email: string;
  phone?: string | null;

  message?: string | null;

  consent_marketing?: BoolLike;
  consent_terms: BoolLike; // zorunlu
};

/**
 * Public POST response:
 * Controller: reply.send(row ?? { id })
 * Normalde row döner (CatalogRequestDto)
 */
export type CreateCatalogRequestPublicResponse = CatalogRequestDto | { id: string };
