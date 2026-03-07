import { describe, expect, it } from "bun:test";

import { siteSettingUpsertSchema, siteSettingBulkUpsertSchema } from "../validation";

describe("siteSettingUpsertSchema", () => {
  it("accepts string value", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "brand_name", value: "Promats" }).success).toBe(true);
  });

  it("accepts number value", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "port", value: 8078 }).success).toBe(true);
  });

  it("accepts boolean value", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "active", value: true }).success).toBe(true);
  });

  it("accepts null value", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "notes", value: null }).success).toBe(true);
  });

  it("accepts nested object", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "theme", value: { primary: "#000" } }).success).toBe(true);
  });

  it("accepts array value", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "tags", value: ["a", "b"] }).success).toBe(true);
  });

  it("rejects empty key", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "", value: "x" }).success).toBe(false);
  });

  it("rejects key longer than 100 chars", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "K".repeat(101), value: "x" }).success).toBe(false);
  });

  it("rejects missing value", () => {
    expect(siteSettingUpsertSchema.safeParse({ key: "test" }).success).toBe(false);
  });
});

describe("siteSettingBulkUpsertSchema", () => {
  it("accepts array of valid items", () => {
    const result = siteSettingBulkUpsertSchema.safeParse({
      items: [
        { key: "a", value: 1 },
        { key: "b", value: "two" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items array", () => {
    expect(siteSettingBulkUpsertSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("rejects missing items", () => {
    expect(siteSettingBulkUpsertSchema.safeParse({}).success).toBe(false);
  });

  it("rejects items with invalid entry", () => {
    expect(
      siteSettingBulkUpsertSchema.safeParse({
        items: [{ key: "", value: "x" }],
      }).success,
    ).toBe(false);
  });
});
