import { describe, expect, it } from "bun:test";

import { calculateOperasyonKaynakPlanlananMiktar, pickOperasyonKaynakKalemler } from "../service";

describe("siparisten uretime smoke", () => {
  it("prefers operasyonel YM recipe rows over legacy yarimamul rows", () => {
    const refs = pickOperasyonKaynakKalemler([
      { urun_id: "legacy-ym", kategori: "yarimamul", miktar: "1.0000" },
      { urun_id: "oym-sag", kategori: "operasyonel_ym", miktar: "1.0000" },
      { urun_id: "oym-sol", kategori: "operasyonel_ym", miktar: "1.0000" },
    ]);

    expect(refs.map((ref) => ref.urun_id)).toEqual(["oym-sag", "oym-sol"]);
  });

  it("falls back to legacy yarimamul rows when no operasyonel YM exists", () => {
    const refs = pickOperasyonKaynakKalemler([
      { urun_id: "hammadde-1", kategori: "hammadde", miktar: "5.0000" },
      { urun_id: "legacy-ym", kategori: "yarimamul", miktar: "2.0000" },
    ]);

    expect(refs.map((ref) => ref.urun_id)).toEqual(["legacy-ym"]);
  });

  it("multiplies recipe row quantity by order quantity for planned production", () => {
    expect(calculateOperasyonKaynakPlanlananMiktar("1.0000", "10.0000")).toBe(10);
    expect(calculateOperasyonKaynakPlanlananMiktar("2.0000", "10.0000")).toBe(20);
  });
});
