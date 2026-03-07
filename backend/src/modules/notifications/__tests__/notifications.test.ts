import { describe, expect, it } from "bun:test";

import {
  notificationCreateSchema,
  notificationUpdateSchema,
} from "../validation";

/* ================================================================
   notificationCreateSchema
   ================================================================ */

describe("notification createSchema", () => {
  it("accepts valid notification", () => {
    const result = notificationCreateSchema.safeParse({
      title: "Yeni sipariş",
      message: "Sipariş #123 oluşturuldu",
      type: "order",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional user_id", () => {
    const result = notificationCreateSchema.safeParse({
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Bildirim",
      message: "Test mesajı",
      type: "info",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    expect(
      notificationCreateSchema.safeParse({
        message: "msg",
        type: "info",
      }).success,
    ).toBe(false);
  });

  it("rejects missing message", () => {
    expect(
      notificationCreateSchema.safeParse({
        title: "Title",
        type: "info",
      }).success,
    ).toBe(false);
  });

  it("rejects missing type", () => {
    expect(
      notificationCreateSchema.safeParse({
        title: "Title",
        message: "msg",
      }).success,
    ).toBe(false);
  });

  it("rejects empty title", () => {
    expect(
      notificationCreateSchema.safeParse({
        title: "",
        message: "msg",
        type: "info",
      }).success,
    ).toBe(false);
  });

  it("rejects title longer than 255 chars", () => {
    expect(
      notificationCreateSchema.safeParse({
        title: "T".repeat(256),
        message: "msg",
        type: "info",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid user_id format", () => {
    expect(
      notificationCreateSchema.safeParse({
        user_id: "not-uuid",
        title: "Title",
        message: "msg",
        type: "info",
      }).success,
    ).toBe(false);
  });
});

/* ================================================================
   notificationUpdateSchema
   ================================================================ */

describe("notification updateSchema", () => {
  it("accepts is_read boolean", () => {
    expect(notificationUpdateSchema.safeParse({ is_read: true }).success).toBe(true);
    expect(notificationUpdateSchema.safeParse({ is_read: false }).success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    expect(notificationUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects non-boolean is_read", () => {
    expect(notificationUpdateSchema.safeParse({ is_read: "yes" }).success).toBe(false);
  });
});
