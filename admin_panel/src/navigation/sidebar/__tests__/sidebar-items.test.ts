import { describe, expect, it } from "vitest";

import { buildAdminSidebarItems } from "../sidebar-items";

describe("Fuar sidebar group", () => {
  it("keeps Fuar separate from the standard quote module", () => {
    const groups = buildAdminSidebarItems(null, undefined, "admin");
    const quoteGroup = groups.find((group) => group.label === "Teklif Modülü");
    const fuarGroup = groups.find((group) => group.label === "Fuar Teklif");

    expect(quoteGroup?.items.map((item) => item.url)).toEqual(["/admin/teklif-talepleri", "/admin/teklifler"]);
    expect(fuarGroup?.items).toHaveLength(1);
    expect(fuarGroup?.items[0]?.url).toBe("/admin/fuar");
    expect(fuarGroup?.items[0]?.subItems?.map((item) => item.url)).toEqual([
      "/admin/fuar",
      "/admin/fuar/katalog",
      "/admin/fuar/urunler",
      "/admin/fuar/musteriler",
      "/admin/fuar/teklifler",
    ]);
  });

  it("does not expose the Fuar group to non-admin roles", () => {
    const groups = buildAdminSidebarItems(null, undefined, "operator");
    expect(groups.some((group) => group.label === "Fuar Teklif")).toBe(false);
  });
});
