import { describe, expect, it } from "bun:test";

import { profileUpsertSchema } from "../validation";

describe("profileUpsertSchema", () => {
  it("accepts empty object (all optional)", () => {
    expect(profileUpsertSchema.safeParse({}).success).toBe(true);
  });

  it("accepts full_name", () => {
    expect(profileUpsertSchema.parse({ full_name: "Ali Yılmaz" }).full_name).toBe("Ali Yılmaz");
  });

  it("accepts phone", () => {
    expect(profileUpsertSchema.parse({ phone: "+905551234567" }).phone).toBe("+905551234567");
  });

  it("accepts absolute URL as avatar_url", () => {
    expect(profileUpsertSchema.safeParse({ avatar_url: "https://example.com/avatar.jpg" }).success).toBe(true);
  });

  it("accepts relative path as avatar_url", () => {
    expect(profileUpsertSchema.safeParse({ avatar_url: "/uploads/avatars/photo.jpg" }).success).toBe(true);
  });

  it("rejects invalid avatar_url (not URL or path)", () => {
    expect(profileUpsertSchema.safeParse({ avatar_url: "just-a-string" }).success).toBe(false);
  });

  it("accepts address fields", () => {
    const result = profileUpsertSchema.safeParse({
      address_line1: "İkitelli OSB Mah.",
      city: "İstanbul",
      country: "Türkiye",
      postal_code: "34490",
    });
    expect(result.success).toBe(true);
  });

  it("rejects full_name longer than 191 chars", () => {
    expect(profileUpsertSchema.safeParse({ full_name: "A".repeat(192) }).success).toBe(false);
  });

  it("rejects empty full_name", () => {
    expect(profileUpsertSchema.safeParse({ full_name: "" }).success).toBe(false);
  });

  it("rejects phone longer than 64 chars", () => {
    expect(profileUpsertSchema.safeParse({ phone: "1".repeat(65) }).success).toBe(false);
  });

  it("rejects avatar_url longer than 2048 chars", () => {
    expect(profileUpsertSchema.safeParse({ avatar_url: "https://x.com/" + "a".repeat(2040) }).success).toBe(false);
  });

  it("rejects postal_code longer than 32 chars", () => {
    expect(profileUpsertSchema.safeParse({ postal_code: "1".repeat(33) }).success).toBe(false);
  });
});
