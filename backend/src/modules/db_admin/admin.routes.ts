// =============================================================
// FILE: src/routes/admin/registerDbAdmin.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { makeAdminPermissionGuard } from "@/common/middleware/permissions";
import {
  adminGetDbInfo,
  adminExportSql,
  adminImportSqlText,
  adminImportSqlFromUrl,
  adminImportSqlFromFile,
  // NEW snapshot handlers
  adminListDbSnapshots,
  adminCreateDbSnapshot,
  adminRestoreDbSnapshot,
  adminDeleteDbSnapshot,
} from "./admin.controller";

export async function registerDbAdmin(app: FastifyInstance) {
  const guard = makeAdminPermissionGuard('admin.db_admin');

  // DB info (stats + environment detection)
  app.get("/db/info", { preHandler: guard }, adminGetDbInfo);

  // Export (full backup - download)
  app.get("/db/export", { preHandler: guard }, adminExportSql);

  // Import seçenekleri
  app.post("/db/import-sql", { preHandler: guard }, adminImportSqlText);
  app.post("/db/import-url", { preHandler: guard }, adminImportSqlFromUrl);
  app.post("/db/import-file", { preHandler: guard }, adminImportSqlFromFile);

  // === SNAPSHOT API ===
  // Sunucuda saklanan snapshot listesi
  app.get("/db/snapshots", { preHandler: guard }, adminListDbSnapshots);

  // Yeni snapshot oluştur (uploads/db_snapshots içine .sql kaydeder)
  app.post("/db/snapshots", { preHandler: guard }, adminCreateDbSnapshot);

  // Snapshot'tan geri yükle
  app.post(
    "/db/snapshots/:id/restore",
    { preHandler: guard },
    adminRestoreDbSnapshot
  );

  // Snapshot sil
  app.delete(
    "/db/snapshots/:id",
    { preHandler: guard },
    adminDeleteDbSnapshot
  );
}
