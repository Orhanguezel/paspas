import { describe, expect, it } from "vitest";

import { normalizeMeFromStatus } from "@/integrations/shared/users/auth.public";
import { normalizeAdminUser } from "@/integrations/shared/users/adminUsers.normalize";
import { canAccessAdminPath } from "../permissions";

describe("çoklu ERP rolü", () => {
  it("durum ve kullanıcı kaydındaki tüm rolleri korur", () => {
    const status = normalizeMeFromStatus({
      authenticated: true,
      is_admin: false,
      user: { id: "test-user", email: "test@example.invalid", role: "satin_almaci", roles: ["satin_almaci", "operator"] },
    });
    expect(status?.roles).toEqual(["satin_almaci", "operator"]);
    const user = normalizeAdminUser({ id: "test-user", role: "satin_almaci", roles: ["satin_almaci", "operator"] } as Parameters<typeof normalizeAdminUser>[0]);
    expect(user.roles).toEqual(["satin_almaci", "operator"]);
  });

  it("satın alma ve operatör sayfalarına birlikte erişir", () => {
    const roles = ["satin_almaci", "operator"] as const;
    expect(canAccessAdminPath([...roles], "/admin/mal-kabul")).toBe(true);
    expect(canAccessAdminPath([...roles], "/admin/operator")).toBe(true);
    expect(canAccessAdminPath([...roles], "/admin/users")).toBe(false);
  });
});
