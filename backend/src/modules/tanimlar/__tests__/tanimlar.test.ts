import { describe, expect, it } from "bun:test";

import { createKalip, updateKalip, createTatil, updateTatil } from "../controller";
import { createKalipSchema, patchKalipSchema, createTatilSchema, patchTatilSchema } from "../validation";

type FakeReply = {
  statusCode?: number;
  payload?: unknown;
  code: (statusCode: number) => FakeReply;
  send: (payload: unknown) => unknown;
};

function createFakeReply(): FakeReply {
  return {
    code(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    send(payload: unknown) {
      this.payload = payload;
      return payload;
    },
  };
}

/* ================================================================
   Kalıp Validation
   ================================================================ */

describe("kalıp validation", () => {
  it("accepts valid kalıp create body", () => {
    expect(createKalipSchema.safeParse({ kod: "KLP-001", ad: "Universal 3D" }).success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = createKalipSchema.parse({
      kod: "KLP-002",
      ad: "SUV 4D",
      aciklama: "SUV araçlar için",
      isActive: true,
    });
    expect(result.aciklama).toBe("SUV araçlar için");
    expect(result.isActive).toBe(true);
  });

  it("rejects empty kod", () => {
    expect(createKalipSchema.safeParse({ kod: "", ad: "Test" }).success).toBe(false);
  });

  it("rejects empty ad", () => {
    expect(createKalipSchema.safeParse({ kod: "K1", ad: "" }).success).toBe(false);
  });

  it("rejects kod longer than 64 chars", () => {
    expect(createKalipSchema.safeParse({ kod: "K".repeat(65), ad: "Test" }).success).toBe(false);
  });

  it("rejects empty patch body", () => {
    const result = patchKalipSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "en_az_bir_alan_gonderilmeli")).toBe(true);
    }
  });

  it("accepts partial patch with only ad", () => {
    expect(patchKalipSchema.safeParse({ ad: "Yeni Ad" }).success).toBe(true);
  });
});

/* ================================================================
   Tatil Validation
   ================================================================ */

describe("tatil validation", () => {
  it("accepts valid tatil create body", () => {
    expect(createTatilSchema.safeParse({ ad: "Yılbaşı", tarih: "2026-01-01" }).success).toBe(true);
  });

  it("accepts optional aciklama", () => {
    const result = createTatilSchema.parse({
      ad: "Ramazan Bayramı",
      tarih: "2026-03-20",
      aciklama: "1. gün",
    });
    expect(result.aciklama).toBe("1. gün");
  });

  it("rejects empty ad", () => {
    expect(createTatilSchema.safeParse({ ad: "", tarih: "2026-01-01" }).success).toBe(false);
  });

  it("rejects invalid date format", () => {
    expect(createTatilSchema.safeParse({ ad: "Test", tarih: "01-01-2026" }).success).toBe(false);
    expect(createTatilSchema.safeParse({ ad: "Test", tarih: "not-a-date" }).success).toBe(false);
  });

  it("rejects missing tarih", () => {
    expect(createTatilSchema.safeParse({ ad: "Test" }).success).toBe(false);
  });

  it("rejects empty patch body", () => {
    const result = patchTatilSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "en_az_bir_alan_gonderilmeli")).toBe(true);
    }
  });
});

/* ================================================================
   Controller Tests
   ================================================================ */

describe("tanimlar controller - kalıp", () => {
  it("returns 400 on invalid create body", async () => {
    const req = { body: { kod: "", ad: "" }, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await createKalip(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_istek_govdesi" } });
  });

  it("returns 400 on empty patch body", async () => {
    const req = { params: { id: "test-id" }, body: {}, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await updateKalip(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_istek_govdesi" } });
  });
});

describe("tanimlar controller - tatil", () => {
  it("returns 400 on invalid create body", async () => {
    const req = { body: { ad: "" }, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await createTatil(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_istek_govdesi" } });
  });

  it("returns 400 on empty patch body", async () => {
    const req = { params: { id: "test-id" }, body: {}, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await updateTatil(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_istek_govdesi" } });
  });
});
