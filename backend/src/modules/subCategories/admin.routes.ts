// =============================================================
// FILE: src/modules/subCategories/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';

import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';

import type { SubCategoryCreateInput, SubCategoryUpdateInput, SubCategorySetImageInput } from './validation';
import {
  adminListSubCategories,
  adminGetSubCategoryById,
  adminGetSubCategoryBySlug,
  adminCreateSubCategory,
  adminPatchSubCategory,
  adminDeleteSubCategory,
  adminReorderSubCategories,
  adminToggleSubCategoryActive,
  adminToggleSubCategoryFeatured,
  adminSetSubCategoryImage,
  type AdminListSubCategoriesQS,
} from './admin.controller';

declare module 'fastify' {
  interface FastifyInstance {
    subCategoriesAdminRoutesRegistered?: boolean;
  }
}

export async function registerSubCategoriesAdmin(app: FastifyInstance) {
  if (app.subCategoriesAdminRoutesRegistered) return;
  app.subCategoriesAdminRoutesRegistered = true;

  const BASE = '/sub-categories';
  const pre = [requireAuth, requireAdmin];

  app.get<{ Querystring: AdminListSubCategoriesQS }>(
    `${BASE}/list`, { preHandler: pre }, adminListSubCategories,
  );
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`, { preHandler: pre }, adminGetSubCategoryById,
  );
  app.get<{ Params: { slug: string }; Querystring: { category_id?: string } }>(
    `${BASE}/by-slug/:slug`, { preHandler: pre }, adminGetSubCategoryBySlug,
  );

  app.post<{ Body: SubCategoryCreateInput }>(
    BASE, { preHandler: pre }, adminCreateSubCategory,
  );
  app.patch<{ Params: { id: string }; Body: SubCategoryUpdateInput }>(
    `${BASE}/:id`, { preHandler: pre }, adminPatchSubCategory,
  );
  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`, { preHandler: pre }, adminDeleteSubCategory,
  );

  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    `${BASE}/reorder`, { preHandler: pre }, adminReorderSubCategories,
  );
  app.patch<{ Params: { id: string }; Body: { is_active: boolean } }>(
    `${BASE}/:id/active`, { preHandler: pre }, adminToggleSubCategoryActive,
  );
  app.patch<{ Params: { id: string }; Body: { is_featured: boolean } }>(
    `${BASE}/:id/featured`, { preHandler: pre }, adminToggleSubCategoryFeatured,
  );
  app.patch<{ Params: { id: string }; Body: SubCategorySetImageInput }>(
    `${BASE}/:id/image`, { preHandler: pre }, adminSetSubCategoryImage,
  );
}
