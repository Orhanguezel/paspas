import { describe, expect, it } from "bun:test";

import {
  storageListQuerySchema,
  storageUpdateSchema,
  signPutBodySchema,
  signMultipartBodySchema,
} from "../validation";

/* ================================================================
   storageListQuerySchema
   ================================================================ */

describe("storage listQuerySchema", () => {
  it("applies defaults (limit=50, offset=0, sort=created_at, order=desc)", () => {
    const parsed = storageListQuerySchema.parse({});
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(0);
    expect(parsed.sort).toBe("created_at");
    expect(parsed.order).toBe("desc");
  });

  it("accepts optional filters", () => {
    const parsed = storageListQuerySchema.parse({
      q: "logo",
      bucket: "avatars",
      folder: "profiles",
      mime: "image/png",
    });
    expect(parsed.q).toBe("logo");
    expect(parsed.bucket).toBe("avatars");
  });

  it("accepts sort by name or size", () => {
    expect(storageListQuerySchema.parse({ sort: "name" }).sort).toBe("name");
    expect(storageListQuerySchema.parse({ sort: "size" }).sort).toBe("size");
  });

  it("rejects invalid sort field", () => {
    expect(storageListQuerySchema.safeParse({ sort: "invalid" }).success).toBe(false);
  });

  it("rejects limit < 1", () => {
    expect(storageListQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("rejects limit > 200", () => {
    expect(storageListQuerySchema.safeParse({ limit: 201 }).success).toBe(false);
  });

  it("rejects negative offset", () => {
    expect(storageListQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
  });
});

/* ================================================================
   storageUpdateSchema
   ================================================================ */

describe("storage updateSchema", () => {
  it("accepts name update", () => {
    expect(storageUpdateSchema.safeParse({ name: "new-name.jpg" }).success).toBe(true);
  });

  it("accepts folder update (nullable)", () => {
    expect(storageUpdateSchema.safeParse({ folder: "avatars" }).success).toBe(true);
    expect(storageUpdateSchema.safeParse({ folder: null }).success).toBe(true);
  });

  it("accepts metadata update", () => {
    expect(storageUpdateSchema.safeParse({ metadata: { alt: "logo" } }).success).toBe(true);
  });

  it("rejects empty update body", () => {
    const result = storageUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "no_fields_to_update")).toBe(true);
    }
  });

  it("rejects empty name", () => {
    expect(storageUpdateSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

/* ================================================================
   signPutBodySchema
   ================================================================ */

describe("storage signPutBodySchema", () => {
  it("accepts valid body", () => {
    expect(signPutBodySchema.safeParse({ filename: "photo.jpg", content_type: "image/jpeg" }).success).toBe(true);
  });

  it("accepts optional folder", () => {
    const parsed = signPutBodySchema.parse({ filename: "f.png", content_type: "image/png", folder: "uploads" });
    expect(parsed.folder).toBe("uploads");
  });

  it("rejects missing filename", () => {
    expect(signPutBodySchema.safeParse({ content_type: "image/png" }).success).toBe(false);
  });

  it("rejects missing content_type", () => {
    expect(signPutBodySchema.safeParse({ filename: "f.png" }).success).toBe(false);
  });

  it("rejects extra unknown fields (strict)", () => {
    expect(signPutBodySchema.safeParse({ filename: "f.png", content_type: "image/png", extra: true }).success).toBe(false);
  });
});

/* ================================================================
   signMultipartBodySchema
   ================================================================ */

describe("storage signMultipartBodySchema", () => {
  it("accepts valid body with filename only", () => {
    expect(signMultipartBodySchema.safeParse({ filename: "data.csv" }).success).toBe(true);
  });

  it("accepts optional content_type and folder", () => {
    const parsed = signMultipartBodySchema.parse({
      filename: "data.csv",
      content_type: "text/csv",
      folder: "imports",
    });
    expect(parsed.content_type).toBe("text/csv");
    expect(parsed.folder).toBe("imports");
  });

  it("rejects missing filename", () => {
    expect(signMultipartBodySchema.safeParse({}).success).toBe(false);
  });

  it("rejects extra unknown fields (strict)", () => {
    expect(signMultipartBodySchema.safeParse({ filename: "f.png", unknown: 1 }).success).toBe(false);
  });
});
