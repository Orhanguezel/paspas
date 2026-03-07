import { describe, expect, it } from "bun:test";

import { listOperatorIsleri, finishOperatorIsi } from "../controller";
import { createGunlukGirisBodySchema, finishBodySchema, listQuerySchema } from "../validation";

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

describe("operator listQuerySchema", () => {
  it("applies defaults (limit=100, offset=0)", () => {
    const parsed = listQuerySchema.parse({});
    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(0);
  });

  it("accepts durum filter (hazirlaniyor)", () => {
    expect(listQuerySchema.parse({ durum: "hazirlaniyor" }).durum).toBe("hazirlaniyor");
  });

  it("accepts durum filter (uretimde)", () => {
    expect(listQuerySchema.parse({ durum: "uretimde" }).durum).toBe("uretimde");
  });

  it("rejects invalid durum value", () => {
    expect(listQuerySchema.safeParse({ durum: "yanlis" }).success).toBe(false);
  });

  it("rejects limit < 1", () => {
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("rejects negative offset", () => {
    expect(listQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
  });
});

describe("operator finishBodySchema", () => {
  it("accepts valid finish body with default durum", () => {
    const parsed = finishBodySchema.parse({ uretilenMiktar: 150 });
    expect(parsed.uretilenMiktar).toBe(150);
    expect(parsed.durum).toBe("tamamlandi");
  });

  it("accepts explicit durum values", () => {
    for (const durum of ["hazirlaniyor", "uretimde", "tamamlandi", "iptal"] as const) {
      expect(finishBodySchema.parse({ uretilenMiktar: 10, durum }).durum).toBe(durum);
    }
  });

  it("rejects negative uretilenMiktar", () => {
    expect(finishBodySchema.safeParse({ uretilenMiktar: -1 }).success).toBe(false);
  });

  it("accepts zero uretilenMiktar", () => {
    expect(finishBodySchema.safeParse({ uretilenMiktar: 0 }).success).toBe(true);
  });

  it("rejects missing uretilenMiktar", () => {
    expect(finishBodySchema.safeParse({}).success).toBe(false);
  });
});

describe("operator createGunlukGirisBodySchema", () => {
  it("accepts valid daily payload", () => {
    const parsed = createGunlukGirisBodySchema.parse({
      ekUretimMiktari: 12,
      gunlukDurum: "durdu",
      makineArizasi: true,
      durusNedeni: "Planli bakim",
      notlar: "Hat 2 gecikme",
      emirDurumu: "uretimde",
    });
    expect(parsed.ekUretimMiktari).toBe(12);
    expect(parsed.gunlukDurum).toBe("durdu");
    expect(parsed.makineArizasi).toBe(true);
  });

  it("rejects unknown gunlukDurum", () => {
    expect(createGunlukGirisBodySchema.safeParse({ gunlukDurum: "foo" }).success).toBe(false);
  });
});

/* ================================================================
   Controller Tests
   ================================================================ */

describe("operator controller", () => {
  it("returns 400 on invalid list query", async () => {
    const req = { query: { limit: 0 }, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await listOperatorIsleri(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_sorgu_parametreleri" } });
  });

  it("returns 400 on invalid finish body", async () => {
    const req = { params: { id: "test-id" }, body: {}, log: { error: () => {} } } as any;
    const reply = createFakeReply() as any;
    await finishOperatorIsi(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({ error: { message: "gecersiz_istek_govdesi" } });
  });
});
