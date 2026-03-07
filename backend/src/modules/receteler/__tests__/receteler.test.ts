import { describe, expect, it } from "bun:test";

import { createRecete, listReceteler, updateRecete } from "../controller";
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

describe("receteler validation", () => {
  it("applies default list query values", () => {
    const parsed = listQuerySchema.parse({});

    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(0);
    expect(parsed.sort).toBe("created_at");
    expect(parsed.order).toBe("desc");
  });

  it("coerces isActive query from string", () => {
    expect(listQuerySchema.parse({ isActive: "1" }).isActive).toBe(true);
    expect(listQuerySchema.parse({ isActive: "0" }).isActive).toBe(false);
  });

  it("rejects invalid query and create body", () => {
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ sort: "x" }).success).toBe(false);

    expect(createSchema.safeParse({ kod: "R-1", ad: "Recete", items: [] }).success).toBe(false);
    expect(
      createSchema.safeParse({
        kod: "R-1",
        ad: "Recete",
        items: [{ urunId: "not-uuid", miktar: 1 }],
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

describe("receteler controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = {
      query: { limit: 0 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await listReceteler(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_sorgu_parametreleri" },
    });
  });

  it("returns 400 on invalid create body", async () => {
    const req = {
      body: { kod: "R-1", ad: "Recete", items: [] },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await createRecete(req, reply);

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

    await updateRecete(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_istek_govdesi" },
    });
  });
});
