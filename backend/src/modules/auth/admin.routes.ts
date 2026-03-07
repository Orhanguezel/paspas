// src/modules/auth/admin.routes.ts
import type { FastifyInstance } from "fastify";
import { makeAdminController } from "./admin.controller";
import { makeAdminPermissionGuard } from "@/common/middleware/permissions";

export async function registerUserAdmin(app: FastifyInstance) {
  const c = makeAdminController(app);

  // 🔹 FE uçları ile uyumlu: /admin/users
  const BASE = "/users";

  const adminGuard = makeAdminPermissionGuard('admin.users');

  app.get(`${BASE}`,               { preHandler: adminGuard }, c.list);
  app.post(`${BASE}`,              { preHandler: adminGuard }, c.create);
  app.get(`${BASE}/:id`,           { preHandler: adminGuard }, c.get);
  app.patch(`${BASE}/:id`,         { preHandler: adminGuard }, c.update);
  app.post(`${BASE}/:id/active`,   { preHandler: adminGuard }, c.setActive);
  app.post(`${BASE}/:id/roles`,    { preHandler: adminGuard }, c.setRoles);
  app.post(`${BASE}/:id/password`, { preHandler: adminGuard }, c.setPassword);
  app.delete(`${BASE}/:id`,        { preHandler: adminGuard }, c.remove);
}
