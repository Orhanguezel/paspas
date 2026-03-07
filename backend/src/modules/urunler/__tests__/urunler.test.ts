import { describe, expect, it } from "bun:test";

import { createUrun, listUrunler, updateUrun } from "../controller";
import { createSchema, listQuerySchema, patchSchema } from "../validation";

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

describe("urunler validation", () => {
  it("applies default pagination and sorting values", () => {
    const parsed = listQuerySchema.parse({});

    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(0);
    expect(parsed.sort).toBe("created_at");
    expect(parsed.order).toBe("desc");
  });

  it("coerces isActive from string query values", () => {
    expect(listQuerySchema.parse({ isActive: "1" }).isActive).toBe(true);
    expect(listQuerySchema.parse({ isActive: "0" }).isActive).toBe(false);
  });

  it("rejects invalid list query values", () => {
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ sort: "x" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ order: "up" }).success).toBe(false);
  });

  it("requires mandatory create fields", () => {
    expect(createSchema.safeParse({}).success).toBe(false);
    expect(createSchema.safeParse({ kod: "", ad: "Urun" }).success).toBe(false);
    expect(createSchema.safeParse({ kod: "K1", ad: "" }).success).toBe(false);
  });

  it("rejects empty patch payload", () => {
    const parsed = patchSchema.safeParse({});

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message === "en_az_bir_alan_gonderilmeli")).toBe(true);
    }
  });
});

describe("urunler controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = {
      query: { limit: 0 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await listUrunler(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_sorgu_parametreleri" },
    });
  });

  it("returns 400 on invalid create body", async () => {
    const req = {
      body: { kod: "", ad: "" },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await createUrun(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_istek_govdesi" },
    });
  });

  it("returns 400 on empty patch body", async () => {
    const req = {
      params: { id: "test-id" },
      body: {},
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await updateUrun(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_istek_govdesi" },
    });
  });
});
