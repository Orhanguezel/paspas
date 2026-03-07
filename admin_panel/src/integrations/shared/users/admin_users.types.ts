// =============================================================
// FILE: src/integrations/types/admin_users.types.ts
// Ensotek – Admin Users tipleri
// =============================================================

import type { UserRoleName } from '@/integrations/shared';

/**
 * Backend rolleri:
 *   "admin" | "sevkiyatci" | "operator" | "satin_almaci"
 * Zaten UserRoleName ile uyumlu.
 */
export type AdminUserRoleName = UserRoleName;

/**
 * Admin list/get endpoint'lerinin döndürdüğü DTO
 * (admin.controller.list / get ile uyumlu)
 */
export type AdminUserDto = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  erp_personel_kodu?: string | null;
  erp_departman?: string | null;
  erp_ekip?: string | null;
  varsayilan_makine_id?: string | null;
  varsayilan_makine_kod?: string | null;
  varsayilan_makine_ad?: string | null;
  erp_notlar?: string | null;
  email_verified: 0 | 1; // MySQL tinyint – 0/1 olarak geliyor
  is_active: 0 | 1; // MySQL tinyint – 0/1 olarak geliyor
  created_at: string; // ISO string (Date serialize)
  last_login_at: string | null; // null olabilir
  role: AdminUserRoleName;
};

/**
 * GET /admin/users query parametreleri
 * (listQuery zod şeması ile uyumlu)
 */
export type AdminUserListQueryParams = {
  q?: string;
  role?: AdminUserRoleName;
  is_active?: boolean; // backend boolean veya 0/1 kabul ediyor
  sort?: 'created_at' | 'email' | 'last_login_at';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

/**
 * PATCH /admin/users/:id body
 * (updateUserBody ile uyumlu)
 */
export type AdminUserUpdatePayload = {
  full_name?: string | null;
  phone?: string | null;
  email?: string;
  erp_personel_kodu?: string | null;
  erp_departman?: string | null;
  erp_ekip?: string | null;
  varsayilan_makine_id?: string | null;
  erp_notlar?: string | null;
  is_active?: boolean;
};

/**
 * POST /admin/users/:id/active body
 */
export type AdminUserSetActivePayload = {
  is_active: boolean;
};

/**
 * POST /admin/users/:id/roles body
 */
export type AdminUserSetRolesPayload = {
  roles: AdminUserRoleName[];
};

/**
 * POST /admin/users/:id/password body
 */
export type AdminUserSetPasswordPayload = {
  password: string;
};

/**
 * Ortak { ok: true } cevabı
 */
export type AdminOkResponse = {
  ok: boolean;
};
