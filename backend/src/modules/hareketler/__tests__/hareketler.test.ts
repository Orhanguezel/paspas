import { describe, expect, it } from "bun:test";

import { listHareketler, createHareket } from "../controller";
import { listQuerySchema, createSchema } from "../validation";

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
   Validation Tests
   ================================================================ */

describe("hareketler listQuerySchema", () => {
  it("applies defaults (limit=100, offset=0, sort=created_at, order=desc)", () => {
    const parsed = listQuerySchema.parse({});
    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(0);
    expect(parsed.sort).toBe("created_at");
    expect(parsed.order).toBe("desc");
  });

  it("accepts optional urunId filter", () => {
    const parsed = listQuerySchema.parse({
      urunId: "u0000001-0000-4000-8000-000000000015",
    });
    expect(parsed.urunId).toBe("u0000001-0000-4000-8000-000000000015");
  });

  it("accepts hareketTipi filter values", () => {
    for (const tip of ["giris", "cikis", "duzeltme"] as const) {
      expect(listQuerySchema.parse({ hareketTipi: tip }).hareketTipi).toBe(tip);
    }
  });

  it("rejects invalid hareketTipi", () => {
    expect(listQuerySchema.safeParse({ hareketTipi: "sevkiyat" }).success).toBe(false);
  });

  it("rejects limit < 1", () => {
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("rejects limit > 500", () => {
    expect(listQuerySchema.safeParse({ limit: 501 }).success).toBe(false);
  });

  it("rejects negative offset", () => {
    expect(listQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
  });

  it("rejects empty urunId", () => {
    expect(listQuerySchema.safeParse({ urunId: "" }).success).toBe(false);
  });
});

describe("hareketler createSchema", () => {
  const valid = {
    urunId: "u0000001-0000-4000-8000-000000000015",
    hareketTipi: "giris" as const,
    miktar: 100,
  };

  it("accepts valid create body", () => {
    expect(createSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional referansTipi, referansId and aciklama", () => {
    const result = createSchema.parse({
      ...valid,
      referansTipi: "manuel",
      referansId: "h0000001-0000-4000-8000-000000000001",
      aciklama: "Test açıklama",
    });
    expect(result.referansTipi).toBe("manuel");
    expect(result.aciklama).toBe("Test açıklama");
  });

  it("rejects missing urunId", () => {
    expect(createSchema.safeParse({ hareketTipi: "giris", miktar: 10 }).success).toBe(false);
  });

  it("rejects missing hareketTipi", () => {
    expect(createSchema.safeParse({ urunId: valid.urunId, miktar: 10 }).success).toBe(false);
  });

  it("rejects missing miktar", () => {
    expect(createSchema.safeParse({ urunId: valid.urunId, hareketTipi: "cikis" }).success).toBe(false);
  });

  it("rejects aciklama longer than 500 chars", () => {
    expect(createSchema.safeParse({ ...valid, aciklama: "A".repeat(501) }).success).toBe(false);
  });

  it("rejects referansTipi longer than 32 chars", () => {
    expect(createSchema.safeParse({ ...valid, referansTipi: "X".repeat(33) }).success).toBe(false);
  });
});

/* ================================================================
   Controller Tests
   ================================================================ */

describe("hareketler controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = { query: { limit: 0 }, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await listHareketler(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_sorgu_parametreleri" } });
  });

  it("returns 400 on invalid create body", async () => {
    const req = { body: {}, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await createHareket(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_istek_govdesi" } });
  });
});
