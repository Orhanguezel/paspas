import { describe, expect, it } from "bun:test";

import { adjustStok, listStoklar } from "../controller";
import { adjustStockSchema, listQuerySchema } from "../validation";

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

describe("stoklar validation", () => {
  it("applies default list query values", () => {
    const parsed = listQuerySchema.parse({});

    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(0);
    expect(parsed.sort).toBe("ad");
    expect(parsed.order).toBe("asc");
  });

  it("accepts category and status filters", () => {
    const parsed = listQuerySchema.parse({
      kategori: "hammadde",
      durum: "kritik",
      kritikOnly: "true",
    });

    expect(parsed.kategori).toBe("hammadde");
    expect(parsed.durum).toBe("kritik");
    expect(parsed.kritikOnly).toBe(true);
  });

  it("rejects invalid list query values", () => {
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ sort: "created_at" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ order: "up" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ durum: "orta" }).success).toBe(false);
  });

  it("validates stock adjustment body", () => {
    expect(adjustStockSchema.safeParse({ miktarDegisimi: 5 }).success).toBe(true);
    expect(adjustStockSchema.safeParse({ miktarDegisimi: -3, aciklama: "Duzeltme" }).success).toBe(true);
    expect(adjustStockSchema.safeParse({}).success).toBe(false);
    expect(adjustStockSchema.safeParse({ miktarDegisimi: "x" }).success).toBe(false);
  });
});

describe("stoklar controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = {
      query: { limit: 0 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await listStoklar(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_sorgu_parametreleri" },
    });
  });

  it("returns 400 on invalid adjust body", async () => {
    const req = {
      params: { id: "test-id" },
      body: {},
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await adjustStok(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_istek_govdesi" },
    });
  });
});
