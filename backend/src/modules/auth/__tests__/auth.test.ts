import { describe, expect, it } from "bun:test";

import {
  signupBody,
  tokenBody,
  updateBody,
  googleBody,
  adminListQuery,
  adminRoleBody,
  adminMakeByEmailBody,
} from "../validation";
import { bearerFrom } from "../controller";

/* ================================================================
   Validation Tests
   ================================================================ */

describe("signupBody validation", () => {
  it("accepts valid signup with email + password", () => {
    const result = signupBody.safeParse({
      email: "test@promats.com.tr",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts signup with full_name, phone and role", () => {
    const result = signupBody.safeParse({
      email: "user@promats.com.tr",
      password: "secret123",
      full_name: "Ali Yılmaz",
      phone: "+905551234567",
      options: { data: { role: "operator" } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    expect(signupBody.safeParse({ password: "secret123" }).success).toBe(false);
  });

  it("rejects missing password", () => {
    expect(signupBody.safeParse({ email: "a@b.com" }).success).toBe(false);
  });

  it("rejects invalid email format", () => {
    expect(signupBody.safeParse({ email: "not-email", password: "secret123" }).success).toBe(false);
  });

  it("rejects short password (< 6 chars)", () => {
    expect(signupBody.safeParse({ email: "a@b.com", password: "12345" }).success).toBe(false);
  });

  it("rejects admin role in signup", () => {
    const result = signupBody.safeParse({
      email: "a@b.com",
      password: "secret123",
      options: { data: { role: "admin" } },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid signup roles (sevkiyatci, operator, satin_almaci)", () => {
    for (const role of ["sevkiyatci", "operator", "satin_almaci"] as const) {
      const result = signupBody.safeParse({
        email: "a@b.com",
        password: "secret123",
        options: { data: { role } },
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects short full_name (< 2 chars)", () => {
    const result = signupBody.safeParse({
      email: "a@b.com",
      password: "secret123",
      full_name: "A",
    });
    expect(result.success).toBe(false);
  });
});

describe("tokenBody validation", () => {
  it("accepts valid email + password", () => {
    const result = tokenBody.safeParse({
      email: "admin@promats.com.tr",
      password: "admin123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional grant_type: password", () => {
    const result = tokenBody.safeParse({
      email: "a@b.com",
      password: "secret123",
      grant_type: "password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    expect(tokenBody.safeParse({ password: "secret123" }).success).toBe(false);
  });

  it("rejects missing password", () => {
    expect(tokenBody.safeParse({ email: "a@b.com" }).success).toBe(false);
  });

  it("rejects invalid grant_type", () => {
    const result = tokenBody.safeParse({
      email: "a@b.com",
      password: "secret123",
      grant_type: "client_credentials",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBody validation", () => {
  it("accepts optional email update", () => {
    expect(updateBody.safeParse({ email: "new@promats.com.tr" }).success).toBe(true);
  });

  it("accepts optional password update", () => {
    expect(updateBody.safeParse({ password: "newpass123" }).success).toBe(true);
  });

  it("accepts empty object (all fields optional)", () => {
    expect(updateBody.safeParse({}).success).toBe(true);
  });

  it("rejects invalid email format", () => {
    expect(updateBody.safeParse({ email: "bad" }).success).toBe(false);
  });

  it("rejects short password", () => {
    expect(updateBody.safeParse({ password: "123" }).success).toBe(false);
  });
});

describe("googleBody validation", () => {
  it("accepts valid id_token", () => {
    expect(googleBody.safeParse({ id_token: "a".repeat(100) }).success).toBe(true);
  });

  it("rejects missing id_token", () => {
    expect(googleBody.safeParse({}).success).toBe(false);
  });

  it("rejects short id_token (< 10 chars)", () => {
    expect(googleBody.safeParse({ id_token: "short" }).success).toBe(false);
  });
});

describe("adminListQuery validation", () => {
  it("applies default limit=50 and offset=0", () => {
    const parsed = adminListQuery.parse({});
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(0);
  });

  it("accepts custom limit and offset", () => {
    const parsed = adminListQuery.parse({ limit: "10", offset: "20" });
    expect(parsed.limit).toBe(10);
    expect(parsed.offset).toBe(20);
  });

  it("accepts optional search query", () => {
    const parsed = adminListQuery.parse({ q: "promats" });
    expect(parsed.q).toBe("promats");
  });

  it("rejects limit < 1", () => {
    expect(adminListQuery.safeParse({ limit: 0 }).success).toBe(false);
  });

  it("rejects limit > 200", () => {
    expect(adminListQuery.safeParse({ limit: 201 }).success).toBe(false);
  });

  it("rejects negative offset", () => {
    expect(adminListQuery.safeParse({ offset: -1 }).success).toBe(false);
  });
});

describe("adminRoleBody validation", () => {
  it("accepts user_id + role", () => {
    const result = adminRoleBody.safeParse({
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      role: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("accepts email + role", () => {
    const result = adminRoleBody.safeParse({
      email: "user@promats.com.tr",
      role: "operator",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when neither user_id nor email is provided", () => {
    const result = adminRoleBody.safeParse({ role: "admin" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "user_id_or_email_required")).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    expect(
      adminRoleBody.safeParse({
        email: "a@b.com",
        role: "superadmin",
      }).success,
    ).toBe(false);
  });

  it("accepts all valid roles", () => {
    for (const role of ["admin", "sevkiyatci", "operator", "satin_almaci"] as const) {
      expect(
        adminRoleBody.safeParse({
          email: "a@b.com",
          role,
        }).success,
      ).toBe(true);
    }
  });
});

describe("adminMakeByEmailBody validation", () => {
  it("accepts valid email", () => {
    expect(adminMakeByEmailBody.safeParse({ email: "new@promats.com.tr" }).success).toBe(true);
  });

  it("rejects missing email", () => {
    expect(adminMakeByEmailBody.safeParse({}).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(adminMakeByEmailBody.safeParse({ email: "invalid" }).success).toBe(false);
  });
});

/* ================================================================
   Helper Function Tests
   ================================================================ */

describe("bearerFrom helper", () => {
  it("extracts token from Authorization header", () => {
    const req = {
      headers: { authorization: "Bearer my-jwt-token" },
      cookies: {},
    } as any;
    expect(bearerFrom(req)).toBe("my-jwt-token");
  });

  it("falls back to access_token cookie", () => {
    const req = {
      headers: {},
      cookies: { access_token: "cookie-token-value" },
    } as any;
    expect(bearerFrom(req)).toBe("cookie-token-value");
  });

  it("falls back to accessToken cookie", () => {
    const req = {
      headers: {},
      cookies: { accessToken: "cookie-token-value" },
    } as any;
    expect(bearerFrom(req)).toBe("cookie-token-value");
  });

  it("returns null when no auth present", () => {
    const req = {
      headers: {},
      cookies: {},
    } as any;
    expect(bearerFrom(req)).toBeNull();
  });

  it("returns null for short cookie token", () => {
    const req = {
      headers: {},
      cookies: { access_token: "short" },
    } as any;
    expect(bearerFrom(req)).toBeNull();
  });

  it("prefers Authorization header over cookies", () => {
    const req = {
      headers: { authorization: "Bearer header-token" },
      cookies: { access_token: "cookie-token-value" },
    } as any;
    expect(bearerFrom(req)).toBe("header-token");
  });
});
