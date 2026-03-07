import { describe, expect, it } from "bun:test";

import { adminDashboardTrend } from "../admin.controller";
import { trendQuerySchema } from "../validation";

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

describe("dashboard validation", () => {
  it("uses default days when query is empty", () => {
    const parsed = trendQuerySchema.parse({});
    expect(parsed.days).toBe(30);
  });

  it("accepts min and max boundary values", () => {
    expect(trendQuerySchema.safeParse({ days: 7 }).success).toBe(true);
    expect(trendQuerySchema.safeParse({ days: 180 }).success).toBe(true);
  });

  it("rejects days out of range", () => {
    expect(trendQuerySchema.safeParse({ days: 6 }).success).toBe(false);
    expect(trendQuerySchema.safeParse({ days: 181 }).success).toBe(false);
  });
});

describe("dashboard controller", () => {
  it("returns 400 on invalid trend query", async () => {
    const req = {
      query: { days: 3 },
      log: { error: () => {} },
    } as any;
    const reply = createFakeReply() as any;

    await adminDashboardTrend(req, reply);

    expect(reply.statusCode).toBe(400);
    expect(reply.payload).toMatchObject({
      error: { message: "gecersiz_sorgu_parametreleri" },
    });
  });
});

