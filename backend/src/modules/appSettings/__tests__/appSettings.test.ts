import { describe, expect, it } from "bun:test";

import {
  listQuerySchema,
  upsertSchema,
  updateSchema,
  bulkUpsertSchema,
  deleteManyQuerySchema,
} from "../validation";

/* ================================================================
   listQuerySchema
   ================================================================ */

describe("appSettings listQuerySchema", () => {
  it("applies defaults (limit=200, offset=0)", () => {
    const parsed = listQuerySchema.parse({});
    expect(parsed.limit).toBe(200);
    expect(parsed.offset).toBe(0);
  });

  it("accepts optional q and prefix filters", () => {
    const parsed = listQuerySchema.parse({ q: "brand", prefix: "site." });
    expect(parsed.q).toBe("brand");
    expect(parsed.prefix).toBe("site.");
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

  it("rejects empty q string", () => {
    expect(listQuerySchema.safeParse({ q: "" }).success).toBe(false);
  });
});

/* ================================================================
   upsertSchema
   ================================================================ */

describe("appSettings upsertSchema", () => {
  it("accepts string value", () => {
    expect(upsertSchema.safeParse({ key: "brand_name", value: "Promats" }).success).toBe(true);
  });

  it("accepts number value", () => {
    expect(upsertSchema.safeParse({ key: "max_items", value: 100 }).success).toBe(true);
  });

  it("accepts boolean value", () => {
    expect(upsertSchema.safeParse({ key: "is_active", value: true }).success).toBe(true);
  });

  it("accepts null value", () => {
    expect(upsertSchema.safeParse({ key: "notes", value: null }).success).toBe(true);
  });

  it("accepts nested object value", () => {
    expect(upsertSchema.safeParse({ key: "config", value: { theme: "dark", fontSize: 14 } }).success).toBe(true);
  });

  it("accepts array value", () => {
    expect(upsertSchema.safeParse({ key: "tags", value: ["a", "b", "c"] }).success).toBe(true);
  });

  it("rejects empty key", () => {
    expect(upsertSchema.safeParse({ key: "", value: "test" }).success).toBe(false);
  });

  it("rejects key longer than 100 chars", () => {
    expect(upsertSchema.safeParse({ key: "K".repeat(101), value: "test" }).success).toBe(false);
  });
});

/* ================================================================
   updateSchema
   ================================================================ */

describe("appSettings updateSchema", () => {
  it("accepts any json-like value", () => {
    expect(updateSchema.safeParse({ value: "hello" }).success).toBe(true);
    expect(updateSchema.safeParse({ value: 42 }).success).toBe(true);
    expect(updateSchema.safeParse({ value: { nested: true } }).success).toBe(true);
  });

  it("rejects missing value", () => {
    expect(updateSchema.safeParse({}).success).toBe(false);
  });
});

/* ================================================================
   bulkUpsertSchema
   ================================================================ */

describe("appSettings bulkUpsertSchema", () => {
  it("accepts array of valid items", () => {
    const result = bulkUpsertSchema.safeParse({
      items: [
        { key: "a", value: 1 },
        { key: "b", value: "two" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items array", () => {
    expect(bulkUpsertSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("rejects missing items", () => {
    expect(bulkUpsertSchema.safeParse({}).success).toBe(false);
  });
});

/* ================================================================
   deleteManyQuerySchema
   ================================================================ */

describe("appSettings deleteManyQuerySchema", () => {
  it("accepts empty query (all optional)", () => {
    expect(deleteManyQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts key filter", () => {
    expect(deleteManyQuerySchema.parse({ key: "brand_name" }).key).toBe("brand_name");
  });

  it("accepts prefix filter", () => {
    expect(deleteManyQuerySchema.parse({ prefix: "site." }).prefix).toBe("site.");
  });

  it("rejects empty key string", () => {
    expect(deleteManyQuerySchema.safeParse({ key: "" }).success).toBe(false);
  });
});
