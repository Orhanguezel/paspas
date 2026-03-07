// =============================================================
// FILE: src/modules/storage/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";
import { sql as dsql } from "drizzle-orm";

import {
  storageListQuerySchema,
  storageUpdateSchema,
  type StorageListQuery,
  type StorageUpdateInput,
} from "./validation";

import {
  getCloudinaryConfig,
  uploadBufferAuto,
  destroyCloudinaryById,
  renameCloudinaryPublicId,
  type UploadResult,
} from "./cloudinary";

import { buildPublicUrl, normalizeFolder } from "./util";
import {
  listAndCount,
  getById,
  getByBucketPath,
  getByIds,
  insert as repoInsert,
  updateById as repoUpdateById,
  deleteById as repoDeleteById,
  deleteManyByIds as repoDeleteManyByIds,
  isDup,
} from "./repository";

/* --------------------------------- utils ---------------------------------- */

/** NULL/undefined alanları INSERT’ten at */
const omitNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

/** Dosya adı sanitize */
const sanitizeName = (name: string) => name.replace(/[^\w.\-]+/g, "_");

/** Per-request upload log base (user + ip + ua) */
function makeUploadLogBase(req: any) {
  const user = req?.user as { id?: string } | undefined;
  const xff = req?.headers?.["x-forwarded-for"];
  const ip =
    (typeof xff === "string" && xff.split(",")[0].trim()) ||
    req?.ip ||
    undefined;
  const uaRaw = req?.headers?.["user-agent"];
  const ua =
    typeof uaRaw === "string"
      ? uaRaw
      : Array.isArray(uaRaw)
      ? uaRaw.join(",")
      : undefined;

  return {
    where: "storage_upload",
    user_id: user?.id ? String(user.id) : null,
    ip,
    ua,
  };
}

/* ---------------------------------- ADMIN ---------------------------------- */

/** GET /admin/storage/assets */
export const adminListAssets: RouteHandler<{ Querystring: unknown }> = async (
  req,
  reply,
) => {
  const parsed = storageListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: {
        message: "invalid_query",
        issues: parsed.error.flatten(),
      },
    });
  }

  const q = parsed.data as StorageListQuery;
  const { rows, total } = await listAndCount(q);

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header(
    "access-control-expose-headers",
    "x-total-count, content-range",
  );

  return reply.send(rows);
};

/** GET /admin/storage/assets/:id */
export const adminGetAsset: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply,
) => {
  const row = await getById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });

  const cfg = await getCloudinaryConfig();

  return reply.send({
    ...row,
    url: buildPublicUrl(row.bucket, row.path, row.url, cfg ?? undefined),
  });
};

/** POST /admin/storage/assets (multipart single file) */
export const adminCreateAsset: RouteHandler = async (req, reply) => {
  const cfg = await getCloudinaryConfig();
  const baseLog = makeUploadLogBase(req);

  if (!cfg) {
    req.log.error(
      { ...baseLog },
      "storage upload: storage_not_configured (no cfg)",
    );
    return reply.code(501).send({ message: "storage_not_configured" });
  }

  const mp: MultipartFile | undefined = await (req as any).file();
  if (!mp) {
    req.log.warn(
      { ...baseLog },
      "storage upload: no file in multipart request",
    );
    return reply.code(400).send({ message: "file_required" });
  }

  const buf = await mp.toBuffer();

  const fields = mp.fields as Record<string, MultipartValue>;
  const s = (k: string): string | undefined =>
    fields[k] ? String(fields[k].value) : undefined;

  const bucket = s("bucket") ?? "default";
  const folderRaw = s("folder") ?? cfg.defaultFolder ?? null;
  const folder = normalizeFolder(folderRaw) ?? undefined;

  let metadata: Record<string, string> | null = null;
  const metaRaw = s("metadata");
  if (metaRaw) {
    try {
      metadata = JSON.parse(metaRaw) as Record<string, string>;
    } catch {
      metadata = null;
    }
  }

  const cleanName = sanitizeName(mp.filename || "file");
  const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

  const fileLog = {
    ...baseLog,
    action: "single_upload",
    driver: cfg.driver,
    cloud: cfg.cloudName,
    filename: cleanName,
    fieldname: mp.fieldname,
    mimetype: mp.mimetype,
    bytes: buf.length,
    bucket,
    folder,
  };

  req.log.info(
    fileLog,
    "storage upload: file received, starting provider upload",
  );

  // 1) Upload (Cloudinary veya local)
  let up: UploadResult;
  try {
    up = await uploadBufferAuto(cfg, buf, {
      folder,
      publicId: publicIdBase,
      mime: mp.mimetype,
    });
  } catch (e) {
    const err = e as {
      http_code?: number;
      name?: string;
      message?: string;
      error?: unknown;
      response?: unknown;
    };

    req.log.error(
      {
        ...fileLog,
        err_name: err?.name,
        err_msg: err?.message,
        http_code: err?.http_code,
        cld_error: err?.error ?? err?.response ?? null,
      },
      "storage upload: provider upload failed",
    );

    const http = Number(err?.http_code) || 502;
    return reply
      .code(http >= 400 && http < 500 ? http : 502)
      .send({
        error: {
          where: "cloudinary_upload",
          name: err?.name,
          message: err?.message,
          http_code: err?.http_code,
          cld_error: err?.error || err?.response || null,
        },
      });
  }

  req.log.info(
    {
      ...fileLog,
      provider_public_id: up.public_id,
      provider_url: up.secure_url,
      provider_bytes: up.bytes,
      provider_format: up.format,
      provider_resource_type: up.resource_type,
    },
    "storage upload: provider upload succeeded",
  );

  // 2) DB INSERT
  const path = folder ? `${folder}/${cleanName}` : cleanName;
  const size = typeof up.bytes === "number" ? up.bytes : buf.length;
  const width = typeof up.width === "number" ? up.width : null;
  const height = typeof up.height === "number" ? up.height : null;
  const etagRaw = up.etag ?? null;
  const etag = typeof etagRaw === "string" ? etagRaw.slice(0, 64) : null;

  const provider_resource_type = (up.resource_type || "image") as string;
  const provider_format = (up.format || null) as string | null;
  const provider_version = typeof up.version === "number" ? up.version : null;

  const recId = randomUUID();
  const provider = cfg.driver === "local" ? "local" : "cloudinary";

  const recBase = {
    id: recId,
    user_id: (req as any).user?.id ? String((req as any).user.id) : null,
    name: cleanName,
    bucket,
    path,
    folder: folder ?? null,
    mime: mp.mimetype,
    size,
    width,
    height,
    url: up.secure_url || null,
    hash: etag,
    etag,
    provider,
    provider_public_id: up.public_id ?? null,
    provider_resource_type,
    provider_format,
    provider_version,
    metadata,
  };

  try {
    await repoInsert(omitNullish(recBase));
    req.log.info(
      {
        ...fileLog,
        rec_id: recId,
        db_path: path,
        db_bucket: bucket,
      },
      "storage upload: db insert succeeded",
    );
  } catch (e) {
    const err = e as {
      message?: string;
      code?: string;
      errno?: string;
      cause?: unknown;
    };

    if (isDup(err)) {
      const existing = await getByBucketPath(bucket, path);
      if (existing) {
        req.log.warn(
          { ...fileLog, rec_id: existing.id },
          "storage upload: duplicate key, returning existing row",
        );
        return reply.code(200).send({
          ...existing,
          // ✅ netlik (opsiyonel ama faydalı)
          asset_id: existing.id,
          url: buildPublicUrl(existing.bucket, existing.path, existing.url, cfg),
          created_at: existing.created_at,
          updated_at: existing.updated_at,
        });
      }
    }

    req.log.error(
      {
        ...fileLog,
        db_err_msg: err?.message,
        db_code: err?.code ?? err?.errno ?? null,
        db_cause: err?.cause ?? null,
      },
      "storage upload: db insert failed",
    );

    return reply.code(502).send({
      error: {
        where: "db_insert",
        message: err?.message || "db_insert_failed",
        code: err?.code || err?.errno || null,
        cause: err?.cause || null,
      },
    });
  }

  // ✅ A) asset_id alias
  const nowIso = new Date().toISOString();

  return reply.code(201).send({
    ...recBase,
    asset_id: recBase.id, // ✅ netlik
    url: buildPublicUrl(recBase.bucket, recBase.path, recBase.url, cfg),
    created_at: nowIso,
    updated_at: nowIso,
  });
};

/** PATCH /admin/storage/assets/:id (rename folder/name + metadata) */
export const adminPatchAsset: RouteHandler<{
  Params: { id: string };
  Body: StorageUpdateInput;
}> = async (req, reply) => {
  const parsed = storageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: {
        message: "invalid_body",
        issues: parsed.error.flatten(),
      },
    });
  }
  const patch = parsed.data;

  const cur = await getById(req.params.id);
  if (!cur) return reply.code(404).send({ error: { message: "not_found" } });

  const cfg = await getCloudinaryConfig();

  const targetFolder =
    typeof patch.folder !== "undefined"
      ? normalizeFolder(patch.folder)
      : cur.folder ?? null;

  const targetName =
    typeof patch.name !== "undefined" ? sanitizeName(patch.name) : cur.name;

  const folderChanged = targetFolder !== (cur.folder ?? null);
  const nameChanged = targetName !== cur.name;

  const sets: Record<string, unknown> = {
    updated_at: dsql`CURRENT_TIMESTAMP(3)`,
  };

  // ✅ B) local/cloudinary newPublicId ayrımı (TAM BLOK)
  if (folderChanged || nameChanged) {
    const isLocal = (cur.provider || "") === "local";

    if (cur.provider_public_id) {
      let newPublicId: string;

      if (isLocal) {
        // ✅ LOCAL: provider_public_id dosya yolu (extension dahil)
        // targetName zaten "photo.jpg" gibi ext içeriyor
        newPublicId = targetFolder ? `${targetFolder}/${targetName}` : targetName;
      } else {
        // ✅ CLOUDINARY: public_id ext'siz
        const baseName = targetName.replace(/^\//, "").replace(/\.[^.]+$/, "");
        newPublicId = targetFolder ? `${targetFolder}/${baseName}` : baseName;
      }

      const renamed = await renameCloudinaryPublicId(
        cur.provider_public_id,
        newPublicId,
        cur.provider_resource_type || "image",
        cur.provider || undefined,
      );

      sets.name = targetName;
      sets.folder = targetFolder;
      sets.path = targetFolder ? `${targetFolder}/${targetName}` : targetName;
      sets.provider_public_id = renamed.public_id ?? newPublicId;
      sets.url = renamed.secure_url ?? cur.url;
      sets.provider_version =
        typeof renamed.version === "number"
          ? renamed.version
          : cur.provider_version;
      sets.provider_format = renamed.format ?? cur.provider_format;
    } else {
      // sadece DB tarafı rename
      sets.name = targetName;
      sets.folder = targetFolder;
      sets.path = targetFolder ? `${targetFolder}/${targetName}` : targetName;
    }
  } else {
    if (typeof patch.name !== "undefined") sets.name = targetName;
    if (typeof patch.folder !== "undefined") sets.folder = targetFolder;
  }

  if (typeof patch.metadata !== "undefined") {
    sets.metadata = patch.metadata ?? null;
  }

  await repoUpdateById(req.params.id, sets);
  const fresh = await getById(req.params.id);
  if (!fresh) return reply.code(404).send({ error: { message: "not_found" } });

  return reply.send({
    ...fresh,
    url: buildPublicUrl(fresh.bucket, fresh.path, fresh.url, cfg ?? undefined),
  });
};

/** DELETE /admin/storage/assets/:id (Cloudinary + DB) */
export const adminDeleteAsset: RouteHandler<{
  Params: { id: string };
}> = async (req, reply) => {
  const row = await getById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });

  // ✅ C) local’da ext kırpma yok (TAM BLOK)
  try {
    const isLocal = (row.provider || "") === "local";
    const publicId =
      row.provider_public_id ||
      (isLocal ? row.path : row.path.replace(/\.[^.]+$/, ""));

    await destroyCloudinaryById(
      publicId,
      row.provider_resource_type || undefined,
      row.provider || undefined,
    );
  } catch {
    // provider tarafı silinmese bile DB'den silmeye devam
  }

  await repoDeleteById(req.params.id);
  return reply.code(204).send();
};

/** POST /admin/storage/assets/bulk-delete { ids: string[] } */
export const adminBulkDelete: RouteHandler<{
  Body: { ids: string[] };
}> = async (req, reply) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
  if (!ids.length) return reply.send({ deleted: 0 });

  const rows = await getByIds(ids);
  if (!rows.length) return reply.send({ deleted: 0 });

  // ✅ D) local’da ext kırpma yok (TAM BLOK)
  for (const r of rows) {
    const isLocal = (r.provider || "") === "local";
    const pid =
      r.provider_public_id ||
      (isLocal ? r.path : r.path.replace(/\.[^.]+$/, ""));

    try {
      await destroyCloudinaryById(
        pid,
        r.provider_resource_type || undefined,
        r.provider || undefined,
      );
    } catch {
      // provider'ı silmesek bile DB'den silmeye devam
    }
  }

  await repoDeleteManyByIds(rows.map((r) => r.id));
  return reply.send({ deleted: rows.length });
};

/** POST /admin/storage/assets/bulk (multipart mixed: fields + files...) */
export const adminBulkCreateAssets: RouteHandler = async (req, reply) => {
  const cfg = await getCloudinaryConfig();
  const baseLog = makeUploadLogBase(req);

  if (!cfg) {
    req.log.error(
      { ...baseLog },
      "storage bulk upload: storage_not_configured (no cfg)",
    );
    return reply.code(501).send({ message: "storage_not_configured" });
  }

  const partsIt =
    typeof (req as any).parts === "function" ? (req as any).parts() : null;
  if (!partsIt || typeof partsIt[Symbol.asyncIterator] !== "function") {
    req.log.warn(
      { ...baseLog },
      "storage bulk upload: multipart_required (no parts iterator)",
    );
    return reply.code(400).send({ message: "multipart_required" });
  }

  // Form-level defaults
  let formBucket: string | undefined;
  let formFolder: string | null | undefined;
  let formMeta: Record<string, string> | null = null;

  const out: unknown[] = [];

  for await (const part of partsIt) {
    if (part.type === "field") {
      if (part.fieldname === "bucket") formBucket = String(part.value || "");
      if (part.fieldname === "folder")
        formFolder = normalizeFolder(String(part.value || ""));
      if (part.fieldname === "metadata") {
        try {
          formMeta = JSON.parse(String(part.value || ""));
        } catch {
          formMeta = null;
        }
      }
      continue;
    }

    if (part.type !== "file") continue;

    const buf = await part.toBuffer();
    const bucket = formBucket || "default";
    const folder = formFolder ?? undefined;

    const cleanName = sanitizeName(part.filename || "file");
    const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

    const fileLog = {
      ...baseLog,
      action: "bulk_upload",
      driver: cfg.driver,
      cloud: cfg.cloudName,
      filename: cleanName,
      fieldname: part.fieldname,
      mimetype: part.mimetype,
      bytes: buf.length,
      bucket,
      folder,
    };

    req.log.info(
      fileLog,
      "storage bulk upload: file received, starting provider upload",
    );

    let up: UploadResult;
    try {
      up = await uploadBufferAuto(cfg, buf, {
        folder,
        publicId: publicIdBase,
        mime: part.mimetype,
      });
    } catch (e) {
      const err = e as { message?: string; http_code?: number };
      req.log.error(
        {
          ...fileLog,
          err_msg: err?.message,
          http_code: err?.http_code ?? null,
        },
        "storage bulk upload: provider upload failed",
      );

      out.push({
        file: cleanName,
        error: {
          where: "cloudinary_upload",
          message: err?.message,
          http: err?.http_code ?? null,
        },
      });
      continue;
    }

    req.log.info(
      {
        ...fileLog,
        provider_public_id: up.public_id,
        provider_url: up.secure_url,
        provider_bytes: up.bytes,
        provider_format: up.format,
        provider_resource_type: up.resource_type,
      },
      "storage bulk upload: provider upload succeeded",
    );

    const path = folder ? `${folder}/${cleanName}` : cleanName;
    const recId = randomUUID();
    const provider = cfg.driver === "local" ? "local" : "cloudinary";

    const recBase = {
      id: recId,
      user_id: (req as any).user?.id ? String((req as any).user.id) : null,
      name: cleanName,
      bucket,
      path,
      folder: folder ?? null,
      mime: part.mimetype,
      size: typeof up.bytes === "number" ? up.bytes : buf.length,
      width: typeof up.width === "number" ? up.width : null,
      height: typeof up.height === "number" ? up.height : null,
      url: up.secure_url || null,
      hash: up.etag ?? null,
      etag: up.etag ?? null,
      provider,
      provider_public_id: up.public_id ?? null,
      provider_resource_type: (up.resource_type || "image") as string,
      provider_format: up.format ?? null,
      provider_version: typeof up.version === "number" ? up.version : null,
      metadata: formMeta,
    };

    try {
      await repoInsert(omitNullish(recBase));
      req.log.info(
        {
          ...fileLog,
          rec_id: recId,
          db_path: path,
          db_bucket: bucket,
        },
        "storage bulk upload: db insert succeeded",
      );

      // ✅ E) item’lara asset_id ekle (success)
      out.push({
        ...recBase,
        asset_id: recBase.id,
        url: buildPublicUrl(recBase.bucket, recBase.path, recBase.url, cfg),
      });
    } catch (e) {
      const err = e as { message?: string };

      if (isDup(err)) {
        const existing = await getByBucketPath(bucket, path);
        if (existing) {
          req.log.warn(
            { ...fileLog, rec_id: existing.id },
            "storage bulk upload: duplicate key, returning existing row",
          );

          // ✅ E) duplicate existing’te de asset_id
          out.push({
            ...existing,
            asset_id: existing.id,
            url: buildPublicUrl(existing.bucket, existing.path, existing.url, cfg),
          });
          continue;
        }
      }

      req.log.error(
        {
          ...fileLog,
          db_err_msg: err?.message ?? null,
        },
        "storage bulk upload: db insert failed",
      );

      out.push({
        file: cleanName,
        error: {
          where: "db_insert",
          message: err?.message ?? "db_insert_failed",
        },
      });
    }
  }

  return reply.send({ count: out.length, items: out });
};

/** GET /admin/storage/folders → string[] */
export const adminListFolders: RouteHandler = async (_req, reply) => {
  const folders = await (await import("./repository")).listFolders();
  return reply.send(folders);
};

/** GET /admin/storage/_diag/cloud */
export const adminDiagCloudinary: RouteHandler = async (req, reply) => {
  const cfg = await getCloudinaryConfig();
  if (!cfg || cfg.driver === "local") {
    return reply.code(501).send({ message: "cloudinary_not_configured" });
  }

  try {
    await (cloudinary as any).api.ping();
  } catch (e) {
    const err = e as { name?: string; message?: string; http_code?: number };
    return reply.code(502).send({
      step: "api.ping",
      error: {
        name: err?.name,
        msg: err?.message,
        http: err?.http_code,
      },
    });
  }

  const tiny = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg/4qQpwAAAAASUVORK5CYII=",
    "base64",
  );

  try {
    const up = await uploadBufferAuto(cfg, tiny, {
      folder: "diag",
      publicId: `ping_${Date.now()}`,
    });

    return reply.send({
      ok: true,
      cloud: cfg.cloudName,
      uploaded: {
        public_id: up.public_id,
        secure_url: up.secure_url,
      },
    });
  } catch (e) {
    const err = e as {
      name?: string;
      message?: string;
      http_code?: number;
      error?: unknown;
      response?: unknown;
    };
    return reply.code(502).send({
      step: "uploader.upload",
      error: {
        name: err?.name,
        msg: err?.message,
        http: err?.http_code,
        cld: err?.error || err?.response || null,
      },
    });
  }
};
