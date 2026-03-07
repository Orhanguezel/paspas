// =============================================================
// FILE: src/modules/storage/controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "node:crypto";
import type { MultipartFile } from "@fastify/multipart";

import { getCloudinaryConfig, uploadBufferAuto } from "./cloudinary";
import { buildPublicUrl, stripLeadingSlashes } from "./util";

import {
  signMultipartBodySchema,
  type SignPutBody,
  type SignMultipartBody,
} from "./validation";

import {
  getByBucketPath,
  insert as repoInsert,
  isDup as repoIsDup,
} from "./repository";

/* --------------------------------- helpers -------------------------------- */

/** NULL/undefined alanları INSERT’ten at */
const omitNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

// --- path helpers ---
const normalizePath = (bucket: string, raw: string) => {
  let p = stripLeadingSlashes(raw).replace(/\/{2,}/g, "/");
  if (p.startsWith(bucket + "/")) p = p.slice(bucket.length + 1);
  return p;
};

const toBool = (v: string | undefined): boolean => {
  if (!v) return false;
  const s = v.toLowerCase();
  return ["1", "true", "yes", "on"].includes(s);
};

/* ---------------------------------- PUBLIC --------------------------------- */

/** GET/HEAD /storage/:bucket/* → provider URL'ye 302 */
export const publicServe: RouteHandler<{
  Params: { bucket: string; "*": string };
}> = async (req, reply) => {
  const { bucket } = req.params;
  const raw = req.params["*"] || "";
  const path = normalizePath(bucket, raw);

  req.log.info(
    { bucket, path, raw },
    "storage_public_serve_request",
  );

  const row = await getByBucketPath(bucket, path);
  if (!row) {
    req.log.warn(
      { bucket, path },
      "storage_public_serve_not_found",
    );
    return reply.code(404).send({ message: "not_found" });
  }

  const cfg = await getCloudinaryConfig();
  const redirectUrl = buildPublicUrl(bucket, path, row.url, cfg ?? undefined);

  req.log.info(
    { bucket, path, redirectUrl },
    "storage_public_serve_redirect",
  );

  return reply.redirect(302, redirectUrl);
};

/** POST /storage/:bucket/upload (FormData) — server-side upload */
export const uploadToBucket: RouteHandler<{
  Params: { bucket: string };
  Querystring: { path?: string; upsert?: string };
}> = async (req, reply) => {
  const { bucket } = req.params;

  // 🔍 Debug: kim, nereden, nasıl gelmiş?
  req.log.info(
    {
      route: "uploadToBucket",
      bucket,
      query: req.query,
      user: (req as any).user ?? null,
      cookies: (req as any).cookies ?? null,
      hasFileMethod: typeof (req as any).file === "function",
      ip: (req as any).ip,
      origin: req.headers.origin,
      referer: req.headers.referer,
    },
    "storage_upload_start",
  );

  const cfg = await getCloudinaryConfig();
  if (!cfg) {
    req.log.error(
      { route: "uploadToBucket" },
      "storage_not_configured",
    );
    return reply.code(501).send({ message: "storage_not_configured" });
  }

  let mp: MultipartFile | undefined;
  try {
    mp = await (req as any).file();
  } catch (err) {
    req.log.error(
      { err },
      "storage_multipart_parse_error",
    );
    return reply.code(400).send({
      error: {
        code: "multipart_parse_error",
        message: "invalid_multipart_body",
      },
    });
  }

  if (!mp) {
    req.log.warn(
      { bucket },
      "storage_upload_no_file",
    );
    return reply.code(400).send({ message: "file_required" });
  }

  const buf = await mp.toBuffer();

  const desiredRaw = (req.query?.path ?? mp.filename ?? "file").trim();
  const desired = normalizePath(bucket, desiredRaw);

  const cleanName = desired
    .split("/")
    .pop()!
    .replace(/[^\w.\-]+/g, "_");

  const folder = desired.includes("/")
    ? desired.split("/").slice(0, -1).join("/")
    : undefined;

  const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

  req.log.info(
    {
      bucket,
      originalFilename: mp.filename,
      mimetype: mp.mimetype,
      size: buf.length,
      folder,
      publicIdBase,
      driver: cfg.driver,
    },
    "storage_upload_pre_upload",
  );

  let up: any;
  try {
    up = await uploadBufferAuto(cfg, buf, {
      folder,
      publicId: publicIdBase,
      mime: mp.mimetype,
    });
  } catch (e: any) {
    const http = Number(e?.http_code) || 502;

    req.log.error(
      {
        err: e,
        bucket,
        folder,
        publicIdBase,
        driver: cfg.driver,
        http_code: e?.http_code,
        cld_error: e?.error || e?.response || null,
      },
      "storage_upload_buffer_failed",
    );

    return reply
      .code(http >= 400 && http < 500 ? http : 502)
      .send({
        error: {
          code: "storage_upload_error",
          name: e?.name,
          message: e?.message,
          http_code: e?.http_code,
          cld_error: e?.error || e?.response || null,
        },
      });
  }

  const path = folder ? `${folder}/${cleanName}` : cleanName;
  const recId = randomUUID();
  const provider = cfg.driver === "local" ? "local" : "cloudinary";

  const recordBase = {
    id: recId,
    user_id: (req as any).user?.id
      ? String((req as any).user.id)
      : null,
    name: cleanName,
    bucket,
    path,
    folder: folder ?? null,
    mime: mp.mimetype,
    size: typeof up.bytes === "number" ? up.bytes : buf.length,
    width: typeof up.width === "number" ? up.width : null,
    height: typeof up.height === "number" ? up.height : null,
    url: up.secure_url || null,
    hash: up.etag ?? null,
    etag: up.etag ?? null,
    provider,
    provider_public_id: up.public_id ?? null,
    provider_resource_type: up.resource_type ?? null,
    provider_format: up.format ?? null,
    provider_version:
      typeof up.version === "number" ? up.version : null,
    metadata: null as Record<string, string> | null,
  };

  const upsert = toBool(req.query?.upsert);

  try {
    await repoInsert(omitNullish(recordBase));
  } catch (e: any) {
    req.log.error(
      {
        err: e,
        bucket,
        path,
        upsert,
        recordBase,
      },
      "storage_upload_db_insert_failed",
    );

    if (repoIsDup(e)) {
      if (!upsert) {
        return reply.code(409).send({
          error: {
            code: "storage_conflict",
            message: "asset_already_exists",
          },
        });
      }

      const existing = await getByBucketPath(bucket, path);
      if (existing) {
        req.log.info(
          { bucket, path, existingId: existing.id },
          "storage_upload_conflict_existing_returned",
        );

        return reply.send({
          id: existing.id,
          bucket: existing.bucket,
          path: existing.path,
          folder: existing.folder ?? null,
          url: buildPublicUrl(
            existing.bucket,
            existing.path,
            existing.url,
            cfg,
          ),
          width: existing.width ?? null,
          height: existing.height ?? null,
          provider: existing.provider,
          provider_public_id:
            existing.provider_public_id ?? null,
          provider_resource_type:
            existing.provider_resource_type ?? null,
          provider_format: existing.provider_format ?? null,
          provider_version:
            existing.provider_version ?? null,
          etag: existing.etag ?? null,
        });
      }

      return reply.code(409).send({
        error: {
          code: "storage_conflict",
          message: "asset_exists",
        },
      });
    }

    return reply.code(502).send({
      error: {
        code: "storage_db_error",
        message: e?.message ?? "db_insert_failed",
        db_code: e?.code ?? e?.errno ?? null,
      },
    });
  }

  req.log.info(
    {
      id: recId,
      bucket,
      path,
      provider,
      user_id: recordBase.user_id,
    },
    "storage_upload_success",
  );

  return reply.send({
    id: recId,
    bucket,
    path,
    folder: folder ?? null,
    url: buildPublicUrl(bucket, path, up.secure_url, cfg),
    width: up.width ?? null,
    height: up.height ?? null,
    provider,
    provider_public_id: up.public_id ?? null,
    provider_resource_type: up.resource_type ?? null,
    provider_format: up.format ?? null,
    provider_version:
      typeof up.version === "number" ? up.version : null,
    etag: up.etag ?? null,
  });
};

/** POST /storage/uploads/sign-put → S3 yoksa 501 */
export const signPut: RouteHandler<{ Body: SignPutBody }> = async (
  _req,
  reply,
) => {
  return reply.code(501).send({ message: "s3_not_configured" });
};

/** POST /storage/uploads/sign-multipart → Cloudinary unsigned upload */
export const signMultipart: RouteHandler<{
  Body: SignMultipartBody;
}> = async (req, reply) => {
  const parsed = signMultipartBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: {
        message: "invalid_body",
        issues: parsed.error.flatten(),
      },
    });
  }

  const cfg = await getCloudinaryConfig();
  if (!cfg || cfg.driver === "local") {
    req.log.error(
      { route: "signMultipart" },
      "cloudinary_unsigned_not_configured",
    );
    return reply
      .code(501)
      .send({ message: "cloudinary_not_configured" });
  }

  const uploadPreset = cfg.unsignedUploadPreset;
  if (!uploadPreset) {
    req.log.error(
      { route: "signMultipart" },
      "cloudinary_unsigned_preset_missing",
    );
    return reply
      .code(501)
      .send({ message: "unsigned_upload_disabled" });
  }

  const { filename, folder } = parsed.data;
  const clean = (filename || "file").replace(/[^\w.\-]+/g, "_");
  const publicId = clean.replace(/\.[^.]+$/, "");

  const upload_url = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;

  const fields: Record<string, string> = {
    upload_preset: uploadPreset,
    folder: folder ?? "",
    public_id: publicId,
  };

  req.log.info(
    {
      route: "signMultipart",
      folder,
      publicId,
      cloudName: cfg.cloudName,
    },
    "storage_sign_multipart_success",
  );

  return reply.send({ upload_url, fields });
};
