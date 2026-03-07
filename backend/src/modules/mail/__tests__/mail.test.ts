import { describe, expect, it } from "bun:test";

import { sendMailSchema, orderCreatedMailSchema } from "../validation";

/* ================================================================
   sendMailSchema
   ================================================================ */

describe("mail sendMailSchema", () => {
  it("accepts valid email with text", () => {
    expect(sendMailSchema.safeParse({ to: "a@b.com", subject: "Test", text: "Hello" }).success).toBe(true);
  });

  it("accepts valid email with html", () => {
    expect(sendMailSchema.safeParse({ to: "a@b.com", subject: "Test", html: "<p>Hi</p>" }).success).toBe(true);
  });

  it("accepts subject only (text and html optional)", () => {
    expect(sendMailSchema.safeParse({ to: "a@b.com", subject: "Test" }).success).toBe(true);
  });

  it("rejects missing to", () => {
    expect(sendMailSchema.safeParse({ subject: "Test" }).success).toBe(false);
  });

  it("rejects invalid email format", () => {
    expect(sendMailSchema.safeParse({ to: "bad", subject: "Test" }).success).toBe(false);
  });

  it("rejects missing subject", () => {
    expect(sendMailSchema.safeParse({ to: "a@b.com" }).success).toBe(false);
  });

  it("rejects empty subject", () => {
    expect(sendMailSchema.safeParse({ to: "a@b.com", subject: "" }).success).toBe(false);
  });

  it("rejects subject longer than 255 chars", () => {
    expect(sendMailSchema.safeParse({ to: "a@b.com", subject: "S".repeat(256) }).success).toBe(false);
  });
});

/* ================================================================
   orderCreatedMailSchema
   ================================================================ */

describe("mail orderCreatedMailSchema", () => {
  const valid = {
    to: "musteri@promats.com.tr",
    customer_name: "Ali Yılmaz",
    order_number: "SIP-2026-001",
    final_amount: "12500.00",
    status: "pending",
  };

  it("accepts valid order mail payload", () => {
    expect(orderCreatedMailSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional site_name and locale", () => {
    const result = orderCreatedMailSchema.parse({
      ...valid,
      site_name: "Promats",
      locale: "tr",
    });
    expect(result.site_name).toBe("Promats");
    expect(result.locale).toBe("tr");
  });

  it("rejects missing to", () => {
    const { to, ...rest } = valid;
    expect(orderCreatedMailSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing customer_name", () => {
    const { customer_name, ...rest } = valid;
    expect(orderCreatedMailSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing order_number", () => {
    const { order_number, ...rest } = valid;
    expect(orderCreatedMailSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing final_amount", () => {
    const { final_amount, ...rest } = valid;
    expect(orderCreatedMailSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing status", () => {
    const { status, ...rest } = valid;
    expect(orderCreatedMailSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects locale longer than 10 chars", () => {
    expect(orderCreatedMailSchema.safeParse({ ...valid, locale: "x".repeat(11) }).success).toBe(false);
  });
});
