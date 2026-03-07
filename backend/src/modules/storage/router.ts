// =============================================================
// FILE: src/modules/storage/router.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  publicServe,
  uploadToBucket,
  signPut,
  signMultipart,
} from "./controller";
import type { SignPutBody, SignMultipartBody } from "./validation";

export async function registerStorage(app: FastifyInstance) {
  const BASE = "/storage";

  // Public GET/HEAD: /storage/:bucket/*  → provider/local URL'ye 302 redirect
  app.get<{ Params: { bucket: string; "*": string } }>(
    `${BASE}/:bucket/*`,
    { config: { public: true } },
    publicServe,
  );

  // Server-side upload (FormData) — auth zorunlu
  app.post<{
    Params: { bucket: string };
    Querystring: { path?: string; upsert?: "0" | "1" | string };
  }>(
    `${BASE}/:bucket/upload`,
    { preHandler: [requireAuth] },
    uploadToBucket,
  );

  // S3 için sign-put — şu an kapalı
  app.post<{ Body: SignPutBody }>(
    `${BASE}/uploads/sign-put`,
    { preHandler: [requireAuth] },
    signPut,
  );

  // Cloudinary unsigned upload için imzalı form alanları
  app.post<{ Body: SignMultipartBody }>(
    `${BASE}/uploads/sign-multipart`,
    { preHandler: [requireAuth] },
    signMultipart,
  );
}
