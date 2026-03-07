import { describe, expect, it } from "bun:test";

import { createMusteri, listMusteriler, updateMusteri } from "../controller";
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

describe("musteriler validation", () => {
  it("applies default list query values", () => {
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

  it("rejects invalid list filters", () => {
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ tur: "x" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ sort: "kod" }).success).toBe(false);
  });

  it("validates create body constraints", () => {
    expect(createSchema.safeParse({ ad: "" }).success).toBe(false);
    expect(createSchema.safeParse({ ad: "A", iskonto: -1 }).success).toBe(false);
    expect(createSchema.safeParse({ ad: "A", iskonto: 101 }).success).toBe(false);
    expect(createSchema.safeParse({ ad: "A", tur: "musteri", iskonto: 10 }).success).toBe(true);
    expect(
      createSchema.safeParse({
        ad: "A",
        cariKodu: "CR-001",
        sevkiyatNotu: "Arka depo teslim",
      }).success,
    ).toBe(true);
  });

  it("rejects empty patch body", () => {
    const parsed = patchSchema.safeParse({});

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message === "en_az_bir_alan_gonderilmeli")).toBe(true);
    }
  });
});

describe("musteriler controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = {
      query: { limit: 0 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await listMusteriler(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_sorgu_parametreleri" },
    });
  });

  it("returns 400 on invalid create body", async () => {
    const req = {
      body: { ad: "", iskonto: 150 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await createMusteri(req, reply);

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

    await updateMusteri(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_istek_govdesi" },
    });
  });
});
