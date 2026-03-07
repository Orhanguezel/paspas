import { describe, expect, it } from "bun:test";

import { createIsYuku, listIsYukleri, updateIsYuku } from "../controller";
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

describe("is_yukler validation", () => {
  it("applies default list query values", () => {
    const parsed = listQuerySchema.parse({});

    expect(parsed.limit).toBe(200);
    expect(parsed.offset).toBe(0);
  });

  it("rejects invalid list filters", () => {
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ makineId: "x" }).success).toBe(false);
  });

  it("validates create body constraints", () => {
    expect(
      createSchema.safeParse({
        makineId: "11111111-1111-1111-1111-111111111111",
        uretimEmriId: "22222222-2222-2222-2222-222222222222",
      }).success,
    ).toBe(true);

    expect(
      createSchema.safeParse({
        makineId: "x",
        uretimEmriId: "22222222-2222-2222-2222-222222222222",
      }).success,
    ).toBe(false);

    expect(
      createSchema.safeParse({
        makineId: "11111111-1111-1111-1111-111111111111",
        uretimEmriId: "22222222-2222-2222-2222-222222222222",
        sira: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects empty patch body", () => {
    const parsed = patchSchema.safeParse({});

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.message === "en_az_bir_alan_gonderilmeli")).toBe(true);
    }
  });
});

describe("is_yukler controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = {
      query: { limit: 0 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await listIsYukleri(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_sorgu_parametreleri" },
    });
  });

  it("returns 400 on invalid create body", async () => {
    const req = {
      body: { makineId: "x" },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await createIsYuku(req, reply);

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

    await updateIsYuku(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_istek_govdesi" },
    });
  });
});
