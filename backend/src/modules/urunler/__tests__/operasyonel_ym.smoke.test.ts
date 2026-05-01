import { describe, expect, it } from "bun:test";

import {
  buildAsilUrunOperasyonlariFromKaynakOperasyonlar,
  deriveOperasyonTipiFromKaynakRefs,
  OperasyonelYmTutarsizligiError,
  selectOperasyonKaynakRefs,
} from "../service";

describe("operasyonel YM smoke", () => {
  it("prefers operasyonel YM over legacy yarimamul refs", () => {
    const refs = selectOperasyonKaynakRefs([
      { urunId: "legacy-ym", kategori: "yarimamul", sira: 1, index: 0 },
      { urunId: "oym-2", kategori: "operasyonel_ym", sira: 2, index: 1 },
      { urunId: "oym-1", kategori: "operasyonel_ym", sira: 1, index: 2 },
    ]);

    expect(refs.map((ref) => ref.urunId)).toEqual(["oym-1", "oym-2"]);
  });

  it("falls back to legacy yarimamul refs when no operasyonel YM exists", () => {
    const refs = selectOperasyonKaynakRefs([
      { urunId: "hammadde-1", kategori: "hammadde", sira: 1, index: 0 },
      { urunId: "legacy-2", kategori: "yarimamul", sira: 2, index: 1 },
      { urunId: "legacy-1", kategori: "yarimamul", sira: 1, index: 2 },
    ]);

    expect(refs.map((ref) => ref.urunId)).toEqual(["legacy-1", "legacy-2"]);
  });

  it("deduplicates operation source refs by product id", () => {
    const refs = selectOperasyonKaynakRefs([
      { urunId: "oym-1", kategori: "operasyonel_ym", sira: 2, index: 0 },
      { urunId: "oym-1", kategori: "operasyonel_ym", sira: 1, index: 1 },
      { urunId: "oym-2", kategori: "operasyonel_ym", sira: 3, index: 2 },
    ]);

    expect(refs.map((ref) => ref.urunId)).toEqual(["oym-1", "oym-2"]);
  });

  it("derives operation type from operasyonel YM count", () => {
    expect(deriveOperasyonTipiFromKaynakRefs([])).toBeNull();
    expect(deriveOperasyonTipiFromKaynakRefs([{ urunId: "oym-1" }])).toBe("tek_tarafli");
    expect(deriveOperasyonTipiFromKaynakRefs([{ urunId: "oym-1" }, { urunId: "oym-2" }])).toBe("cift_tarafli");
  });

  it("rejects recipes with more than two operasyonel YM refs", () => {
    expect(() =>
      deriveOperasyonTipiFromKaynakRefs([{ urunId: "oym-1" }, { urunId: "oym-2" }, { urunId: "oym-3" }]),
    ).toThrow(OperasyonelYmTutarsizligiError);
    expect(() =>
      deriveOperasyonTipiFromKaynakRefs([{ urunId: "oym-1" }, { urunId: "oym-2" }, { urunId: "oym-3" }]),
    ).toThrow("urun_recetesinde_en_fazla_iki_operasyonel_ym_olur");
  });

  it("copies kalip, timing, montaj and machine options from operasyonel YM operations", () => {
    const operations = buildAsilUrunOperasyonlariFromKaynakOperasyonlar(
      [
        {
          id: "op-sol",
          urun_id: "oym-sol",
          sira: 7,
          operasyon_adi: "Sol Baskı",
          kalip_id: "kalip-sol",
          hazirlik_suresi_dk: 25,
          cevrim_suresi_sn: "12.50",
          montaj: 0,
          is_active: 1,
          created_at: new Date("2026-04-30T00:00:00Z"),
          updated_at: new Date("2026-04-30T00:00:00Z"),
        },
        {
          id: "op-sag",
          urun_id: "oym-sag",
          sira: 3,
          operasyon_adi: "Sağ Baskı",
          kalip_id: "kalip-sag",
          hazirlik_suresi_dk: 40,
          cevrim_suresi_sn: "15.25",
          montaj: 1,
          is_active: 1,
          created_at: new Date("2026-04-30T00:00:00Z"),
          updated_at: new Date("2026-04-30T00:00:00Z"),
        },
      ],
      new Map([
        [
          "op-sol",
          [
            { id: "map-1", urunOperasyonId: "op-sol", makineId: "makine-a", oncelikSira: 1 },
            { id: "map-2", urunOperasyonId: "op-sol", makineId: "makine-b", oncelikSira: 2 },
          ],
        ],
        ["op-sag", [{ id: "map-3", urunOperasyonId: "op-sag", makineId: "makine-c", oncelikSira: 1 }]],
      ]),
    );

    expect(operations).toEqual([
      {
        operasyonAdi: "Sol Baskı",
        sira: 1,
        kalipId: "kalip-sol",
        hazirlikSuresiDk: 25,
        cevrimSuresiSn: 12.5,
        montaj: false,
        makineler: [
          { makineId: "makine-a", oncelikSira: 1 },
          { makineId: "makine-b", oncelikSira: 2 },
        ],
      },
      {
        operasyonAdi: "Sağ Baskı",
        sira: 2,
        kalipId: "kalip-sag",
        hazirlikSuresiDk: 40,
        cevrimSuresiSn: 15.25,
        montaj: true,
        makineler: [{ makineId: "makine-c", oncelikSira: 1 }],
      },
    ]);
  });
});
