import { describe, expect, it } from "bun:test";

import { buildShiftWindow, buildShiftWindowFromStart, isRecentShiftClose } from "../repository";

describe("vardiya smoke", () => {
  it("uses the configured daytime shift start for late login", () => {
    const window = buildShiftWindow(new Date("2026-04-30T10:15:00"), {
      vardiyaTipi: "gunduz",
      ad: "Gündüz",
      baslangicSaati: "07:30",
      bitisSaati: "19:30",
    });

    expect(window.baslangic.getHours()).toBe(7);
    expect(window.baslangic.getMinutes()).toBe(30);
    expect(window.bitis.getHours()).toBe(19);
    expect(window.bitis.getMinutes()).toBe(30);
  });

  it("calculates automatic close time from an open daytime shift start", () => {
    const window = buildShiftWindowFromStart(new Date("2026-04-30T07:30:00"), {
      vardiyaTipi: "gunduz",
      ad: "Gündüz",
      baslangicSaati: "07:30",
      bitisSaati: "19:30",
    });

    expect(window.baslangic.toISOString()).toBe(new Date("2026-04-30T07:30:00").toISOString());
    expect(window.bitis.toISOString()).toBe(new Date("2026-04-30T19:30:00").toISOString());
  });

  it("calculates automatic close time for overnight shifts", () => {
    const window = buildShiftWindowFromStart(new Date("2026-04-30T19:30:00"), {
      vardiyaTipi: "gece",
      ad: "Gece",
      baslangicSaati: "19:30",
      bitisSaati: "07:30",
    });

    expect(window.baslangic.toISOString()).toBe(new Date("2026-04-30T19:30:00").toISOString());
    expect(window.bitis.toISOString()).toBe(new Date("2026-05-01T07:30:00").toISOString());
  });

  it("treats recently closed shifts as editable for late production entry", () => {
    expect(
      isRecentShiftClose(new Date("2026-04-30T19:30:00"), new Date("2026-05-01T13:29:59")),
    ).toBe(true);
    expect(
      isRecentShiftClose(new Date("2026-04-30T19:30:00"), new Date("2026-05-01T13:30:01")),
    ).toBe(false);
  });
});
