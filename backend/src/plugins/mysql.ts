import fp from "fastify-plugin";
import mysql from "@fastify/mysql";
import { env } from "@/core/env";

export default fp(async (app) => {
  await app.register(mysql, {
    promise: true,
    connectionString:
      `mysql://${encodeURIComponent(env.DB.user)}:${encodeURIComponent(env.DB.password)}@` +
      `${env.DB.host}:${env.DB.port}/${env.DB.name}?timezone=Z&charset=utf8mb4_unicode_ci`,
  });

  // ✅ Type guard: runtime kontrol -> TS artık 'defined' algılar
  if (!app.mysql) {
    app.log.error("MySQL plugin did not initialize");
    throw new Error("MySQL not initialized");
  }

  // ✅ Alias + decorate: projede 'app.db' de kullanabileceksin
  const db = app.mysql;
  app.decorate("db", db);

  const [rows] = await db.query<any[]>("SELECT 1 AS ok");
  app.log.info({ mysqlOk: rows?.[0]?.ok === 1 }, "MySQL connected");
});
