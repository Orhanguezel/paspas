// =============================================================
// FILE: src/modules/router.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { makeAuthController } from "./controller";

export async function registerAuth(app: FastifyInstance) {
  const c = makeAuthController(app);

  const BASE = "/auth";

  // Public
  app.post(
    `${BASE}/signup`,
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    c.signup,
  );
  app.post(
    `${BASE}/token`,
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    c.token,
  );
  app.post(
    `${BASE}/token/refresh`,
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    c.refresh,
  );

  // Şifre sıfırlama
  app.post(
    `${BASE}/password-reset/request`,
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    c.passwordResetRequest,
  );
  app.post(
    `${BASE}/password-reset/confirm`,
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    c.passwordResetConfirm,
  );


  // Authenticated-ish
  app.get(`${BASE}/user`, c.me);
  app.get(`${BASE}/status`, c.status);

  // Profile/account updates
  app.put(`${BASE}/user`, c.update);

  // Logout
  app.post(`${BASE}/logout`, c.logout);
  
}
