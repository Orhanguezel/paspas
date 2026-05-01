import { describe, expect, it } from "bun:test";

import { buildUretimKirilimSummary } from "../service";

describe("vardiya_analizi production summary", () => {
  it("sums gun sonu, devam et and bitir records instead of keeping only the last value", () => {
    const summary = buildUretimKirilimSummary([
      {
        urunId: "urun-1",
        urunAd: "Star Gri",
        urunKod: "ST-001",
        netMiktar: 250,
        fireMiktar: 3,
      },
      {
        urunId: "urun-1",
        urunAd: "Star Gri",
        urunKod: "ST-001",
        netMiktar: 110,
        fireMiktar: 2,
      },
    ]);

    expect(summary.uretimToplam).toBe(360);
    expect(summary.fireToplam).toBe(5);
    expect(summary.urunKirilimi).toEqual([
      {
        urunId: "urun-1",
        urunAd: "Star Gri",
        urunKod: "ST-001",
        miktar: 360,
      },
    ]);
  });
});
