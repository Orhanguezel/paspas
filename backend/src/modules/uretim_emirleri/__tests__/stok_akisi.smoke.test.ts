import { describe, expect, it } from "bun:test";

import {
  calculateReceteIhtiyaclari,
  previewRezervasyonSonrasi,
  previewStokDusSonrasi,
  previewStokGeriAlSonrasi,
} from "../hammadde_service";

describe("stok akisi smoke tests", () => {
  it("calculates recipe need with target quantity, planned quantity and fire ratio", () => {
    const ihtiyaclar = calculateReceteIhtiyaclari(
      [
        { urunId: "hm-plastik", miktar: 2, fireOrani: 10 },
        { urunId: "hm-etiket", miktar: 0.25, fireOrani: 0 },
      ],
      1,
      10,
    );

    expect(ihtiyaclar).toEqual([
      { urunId: "hm-plastik", miktar: 22 },
      { urunId: "hm-etiket", miktar: 3 },
    ]);
  });

  it("reserves, consumes and returns stock in the expected order", () => {
    const baslangic = { stok: 100, rezerveStok: 0, stokTakipAktif: true };

    const rezerve = previewRezervasyonSonrasi(baslangic, 22);
    expect(rezerve).toEqual({ stok: 100, rezerveStok: 22, stokTakipAktif: true });

    const tuketildi = previewStokDusSonrasi(rezerve, 22);
    expect(tuketildi).toEqual({ stok: 78, rezerveStok: 0, stokTakipAktif: true });

    const geriAlindi = previewStokGeriAlSonrasi(tuketildi, 22);
    expect(geriAlindi).toEqual({ stok: 100, rezerveStok: 22, stokTakipAktif: true });
  });

  it("does not change stock or reserved stock when stock tracking is disabled", () => {
    const baslangic = { stok: 5, rezerveStok: 0, stokTakipAktif: false };

    const rezerve = previewRezervasyonSonrasi(baslangic, 22);
    const tuketildi = previewStokDusSonrasi(rezerve, 22);
    const geriAlindi = previewStokGeriAlSonrasi(tuketildi, 22);

    expect(rezerve).toEqual(baslangic);
    expect(tuketildi).toEqual(baslangic);
    expect(geriAlindi).toEqual(baslangic);
  });

  it("never lets reserved stock go below zero during consumption", () => {
    const state = { stok: 50, rezerveStok: 3, stokTakipAktif: true };

    expect(previewStokDusSonrasi(state, 10)).toEqual({
      stok: 40,
      rezerveStok: 0,
      stokTakipAktif: true,
    });
  });
});
