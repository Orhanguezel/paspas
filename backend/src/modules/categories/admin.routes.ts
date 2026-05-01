// =============================================================
// FILE: src/modules/categories/admin.routes.ts   (ADMIN ROUTES)
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import { makeAdminPermissionGuard } from "@/common/middleware/permissions";

import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  CategorySetImageInput,
} from "./validation";

import {
  adminCreateCategory,
  adminPutCategory,
  adminPatchCategory,
  adminDeleteCategory,
  adminRepairDefaultCategories,
  adminReorderCategories,
  adminToggleActive,
  adminToggleFeatured,
  adminSetCategoryImage,
  adminListCategories,
  adminGetCategoryById,
  adminGetCategoryBySlug,
  type AdminListCategoriesQS,
} from "./admin.controller";

// İdempotent guard (plugin iki kez register edilirse tekrar route ekleme)
declare module "fastify" {
  interface FastifyInstance {
    categoriesAdminRoutesRegistered?: boolean;
  }
}

export async function registerCategoriesAdmin(app: FastifyInstance) {
  if (app.categoriesAdminRoutesRegistered) return;
  app.categoriesAdminRoutesRegistered = true;

  const BASE = "/categories";

  const readGuard = makeAdminPermissionGuard('admin.tanimlar');

  // ⬇️ LIST endpointini /list'e aldık — /api/admin/categories ile çakışma kalkar
  app.get<{ Querystring: AdminListCategoriesQS }>(
    `${BASE}/list`,
    { preHandler: readGuard },
    adminListCategories
  );

  // Tekil okuma
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: readGuard },
    adminGetCategoryById
  );

  // Slug ile okuma
  app.get<{ Params: { slug: string } }>(
    `${BASE}/by-slug/:slug`,
    { preHandler: readGuard },
    adminGetCategoryBySlug
  );

  // CRUD
  app.post<{ Body: CategoryCreateInput }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateCategory
  );

  app.post(
    `${BASE}/repair-defaults`,
    { preHandler: [requireAuth, requireAdmin] },
    adminRepairDefaultCategories
  );

  app.put<{ Params: { id: string }; Body: CategoryUpdateInput }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminPutCategory
  );

  app.patch<{ Params: { id: string }; Body: CategoryUpdateInput }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminPatchCategory
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteCategory
  );

  // Sıralama
  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    `${BASE}/reorder`,
    { preHandler: [requireAuth, requireAdmin] },
    adminReorderCategories
  );

  // Toggle'lar
  app.patch<{ Params: { id: string }; Body: { is_active: boolean } }>(
    `${BASE}/:id/active`,
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleActive
  );

  app.patch<{ Params: { id: string }; Body: { is_featured: boolean } }>(
    `${BASE}/:id/featured`,
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleFeatured
  );

  // Kapak görseli (storage) + alt
  app.patch<{ Params: { id: string }; Body: CategorySetImageInput }>(
    `${BASE}/:id/image`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetCategoryImage
  );
}
