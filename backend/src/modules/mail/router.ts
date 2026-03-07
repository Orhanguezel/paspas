// ===================================================================
// FILE: src/modules/mail/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  sendTestMail,
  sendMailHandler,
  sendOrderCreatedMailHandler,
} from "./controller";

const BASE = "/mail";

export async function registerMail(app: FastifyInstance) {
  app.post(`${BASE}/test`, { preHandler: [requireAuth] }, sendTestMail);
  app.post(`${BASE}/send`, { preHandler: [requireAuth] }, sendMailHandler);
  app.post(
    `${BASE}/order-created`,
    { preHandler: [requireAuth] },
    sendOrderCreatedMailHandler,
  );
}
