// src/modules/storage/admin.routes.ts
import type { FastifyInstance } from "fastify";
import { makeAdminPermissionGuard } from "@/common/middleware/permissions";
import {
  adminListAssets,
  adminGetAsset,
  adminInlineAsset,
  adminCreateAsset,
  adminPatchAsset,
  adminDeleteAsset,
  adminBulkDelete,
  adminListFolders,
  adminDiagCloudinary,
  adminBulkCreateAssets, 
} from "./admin.controller";

import type { StorageUpdateInput } from "./validation";

export async function registerStorageAdmin(app: FastifyInstance) {
  const BASE = "/storage";
  const guard = makeAdminPermissionGuard('admin.storage');

  app.get<{ Querystring: unknown }>(
    `${BASE}/assets`,
    { preHandler: guard },
    adminListAssets
  );

  app.get<{ Params: { id: string } }>(
    `${BASE}/assets/:id`,
    { preHandler: guard },
    adminGetAsset
  );

  app.get<{ Params: { id: string } }>(
    `${BASE}/assets/:id/inline`,
    { preHandler: guard },
    adminInlineAsset
  );

  app.post(
    `${BASE}/assets`,
    { preHandler: guard },
    adminCreateAsset
  );

  // Bulk upload (çoklu dosya)
  app.post(
    `${BASE}/assets/bulk`,
    { preHandler: guard },
    adminBulkCreateAssets
  );

  // PATCH body tipini belirt
  app.patch<{ Params: { id: string }; Body: StorageUpdateInput }>(
    `${BASE}/assets/:id`,
    { preHandler: guard },
    adminPatchAsset
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE}/assets/:id`,
    { preHandler: guard },
    adminDeleteAsset
  );

  app.post<{ Body: { ids: string[] } }>(
    `${BASE}/assets/bulk-delete`,
    { preHandler: guard },
    adminBulkDelete
  );

  app.get(
    `${BASE}/folders`,
    { preHandler: guard },
    adminListFolders
  );

  app.get(
    `${BASE}/_diag/cloud`,
    { preHandler: guard },
    adminDiagCloudinary
  );
}
