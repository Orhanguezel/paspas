import type { FastifyInstance } from "fastify";
import { makeAdminPermissionGuard } from "@/common/middleware/permissions";
import {
  listUserRoles,
  createUserRole,
  deleteUserRole,
  listPermissions,
  listRoles,
  getRole,
  setRolePermissions,
} from "./controller";

export async function registerUserRoles(app: FastifyInstance) {
  const guard = makeAdminPermissionGuard("admin.users");

  // Kullanici rol yonetimi: admin.users izni zorunlu
  app.get("/user_roles",
    {
      preHandler: guard,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    listUserRoles
  );

  app.post("/user_roles",
    {
      preHandler: guard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    createUserRole
  );

  app.delete("/user_roles/:id",
    {
      preHandler: guard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    deleteUserRole
  );

  app.get("/admin/permissions",
    {
      preHandler: guard,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    listPermissions
  );

  app.get("/admin/roles",
    {
      preHandler: guard,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    listRoles
  );

  app.get("/admin/roles/:slug",
    {
      preHandler: guard,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    getRole
  );

  app.post("/admin/roles/:slug/permissions",
    {
      preHandler: guard,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    setRolePermissions
  );
}
