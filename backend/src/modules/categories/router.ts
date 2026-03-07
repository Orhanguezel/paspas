// =============================================================
// FILE: src/modules/categories/router.ts   (PUBLIC ROUTES ONLY)
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryCounts,
} from "./controller";

export async function registerCategories(app: FastifyInstance) {
  // PUBLIC READ
  app.get("/categories", { config: { public: true } }, listCategories);
  app.get("/categories/counts", { config: { public: true } }, getCategoryCounts);
  app.get<{ Params: { id: string } }>(
    "/categories/:id",
    { config: { public: true } },
    getCategoryById
  );
  app.get<{ Params: { slug: string } }>(
    "/categories/by-slug/:slug",
    { config: { public: true } },
    getCategoryBySlug
  );
}
