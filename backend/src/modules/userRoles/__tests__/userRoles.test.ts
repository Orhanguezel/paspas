import { describe, expect, it } from "bun:test";

import { userRoleListQuerySchema, createUserRoleSchema } from "../validation";

/* ================================================================
   Validation Tests
   ================================================================ */

describe("userRoleListQuerySchema", () => {
  it("accepts empty query (all optional)", () => {
    expect(userRoleListQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts user_id filter", () => {
    const parsed = userRoleListQuerySchema.parse({
      user_id: "erp-demo-oper-0003-000000000003",
    });
    expect(parsed.user_id).toBe("erp-demo-oper-0003-000000000003");
  });

  it("accepts role filter for ERP roles", () => {
    for (const role of ["admin", "sevkiyatci", "operator", "satin_almaci"] as const) {
      expect(userRoleListQuerySchema.parse({ role }).role).toBe(role);
    }
  });

  it("accepts legacy role filters", () => {
    for (const role of ["moderator", "seller", "user"] as const) {
      expect(userRoleListQuerySchema.parse({ role }).role).toBe(role);
    }
  });

  it("rejects invalid role", () => {
    expect(userRoleListQuerySchema.safeParse({ role: "superadmin" }).success).toBe(false);
  });

  it("rejects empty user_id", () => {
    expect(userRoleListQuerySchema.safeParse({ user_id: "" }).success).toBe(false);
  });

  it("accepts direction asc/desc", () => {
    expect(userRoleListQuerySchema.parse({ direction: "asc" }).direction).toBe("asc");
    expect(userRoleListQuerySchema.parse({ direction: "desc" }).direction).toBe("desc");
  });

  it("rejects invalid direction", () => {
    expect(userRoleListQuerySchema.safeParse({ direction: "up" }).success).toBe(false);
  });
});

describe("createUserRoleSchema", () => {
  it("accepts valid user_id + role", () => {
      const result = createUserRoleSchema.safeParse({
      user_id: "erp-demo-oper-0003-000000000003",
      role: "operator",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all ERP roles", () => {
    for (const role of ["admin", "sevkiyatci", "operator", "satin_almaci"] as const) {
      expect(
        createUserRoleSchema.safeParse({
          user_id: "erp-demo-oper-0003-000000000003",
          role,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects legacy roles in create (only ERP roles allowed)", () => {
    for (const role of ["moderator", "seller", "user"] as const) {
      expect(
        createUserRoleSchema.safeParse({
          user_id: "erp-demo-oper-0003-000000000003",
          role,
        }).success,
      ).toBe(false);
    }
  });

  it("rejects missing user_id", () => {
    expect(createUserRoleSchema.safeParse({ role: "admin" }).success).toBe(false);
  });

  it("rejects missing role", () => {
    expect(
        createUserRoleSchema.safeParse({
          user_id: "erp-demo-oper-0003-000000000003",
        }).success,
    ).toBe(false);
  });

  it("rejects empty user_id format", () => {
    expect(createUserRoleSchema.safeParse({ user_id: "", role: "admin" }).success).toBe(false);
  });
});
