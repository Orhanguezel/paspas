import { describe, expect, it } from "bun:test";

import { createUretimEmri, listUretimEmirleri, updateUretimEmri } from "../controller";
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

describe("uretim_emirleri validation", () => {
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
    expect(listQuerySchema.safeParse({ siparisId: "x" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ urunId: "x" }).success).toBe(false);
    expect(listQuerySchema.safeParse({ durum: "beklemede" }).success).toBe(false);
  });

  it("validates create body constraints", () => {
    const valid = createSchema.safeParse({
      emirNo: "U-001",
      urunId: "11111111-1111-1111-1111-111111111111",
      planlananMiktar: 50,
      baslangicTarihi: "2026-03-04",
    });

    expect(valid.success).toBe(true);
    expect(createSchema.safeParse({ emirNo: "", urunId: "x", planlananMiktar: 0 }).success).toBe(false);
    expect(
      createSchema.safeParse({
        emirNo: "U-1",
        urunId: "11111111-1111-1111-1111-111111111111",
        planlananMiktar: 1,
        baslangicTarihi: "04-03-2026",
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

describe("uretim_emirleri controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = {
      query: { limit: 0 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await listUretimEmirleri(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_sorgu_parametreleri" },
    });
  });

  it("returns 400 on invalid create body", async () => {
    const req = {
      body: { emirNo: "", planlananMiktar: 0 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await createUretimEmri(req, reply);

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

    await updateUretimEmri(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_istek_govdesi" },
    });
  });
});
