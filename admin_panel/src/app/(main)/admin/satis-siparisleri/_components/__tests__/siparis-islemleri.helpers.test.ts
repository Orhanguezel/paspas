import { describe, expect, it } from "vitest";

import type { SiparisIslemSatiri } from "@/integrations/shared/erp/satis_siparisleri.types";

import { getBitisDisplay, getSevkDisplay, getUretimDisplay } from "../siparis-islemleri.helpers";

const baseItem: SiparisIslemSatiri = {
  kalemId: "kalem",
  siparisId: "siparis",
  siparisNo: "SS-1",
  musteriId: "musteri",
  musteriAd: "Müşteri",
  urunId: "urun",
  urunAd: "Ürün",
  urunKod: "U-1",
  urunAltGrup: null,
  urunStok: 0,
  urunBirim: "adet",
  miktar: 100,
  aktarilanMiktar: 0,
  kalanMiktar: 100,
  uretilenMiktar: 0,
  uretimKalanMiktar: 100,
  birimFiyat: 0,
  uretimDurumu: "beklemede",
  sevkEdilenMiktar: 0,
  sevkKalanMiktar: 100,
  uretimEmriId: null,
  planlananBitis: null,
  gercekBitis: null,
  terminTarihi: null,
};

describe("sipariş işlemleri sunum kuralları", () => {
  it("üretime aktarılmamış ve sevk edilmemiş miktarları boş gösterir", () => {
    expect(getUretimDisplay(baseItem)).toEqual({ kind: "empty", text: "" });
    expect(getSevkDisplay(baseItem)).toEqual({ kind: "empty", text: "" });
  });

  it("makineye atama, ilerleme ve bitirme durumlarını ayırır", () => {
    expect(getUretimDisplay({ ...baseItem, uretimDurumu: "makineye_atandi" }).text).toBe("Makineye Atandı");
    expect(getUretimDisplay({ ...baseItem, uretimDurumu: "uretiliyor" }).text).toBe("Üretiliyor");
    expect(getUretimDisplay({ ...baseItem, uretimDurumu: "uretiliyor", uretilenMiktar: 35 }).text).toBe("35 / 100");
    expect(getUretimDisplay({ ...baseItem, uretimDurumu: "uretim_tamamlandi", uretilenMiktar: 100 }).text).toBe(
      "Tamamlandı",
    );
  });

  it("sevk ilerlemesini sipariş miktarına göre gösterir", () => {
    expect(getSevkDisplay({ ...baseItem, sevkEdilenMiktar: 15 }).text).toBe("15 / 100");
    expect(getSevkDisplay({ ...baseItem, sevkEdilenMiktar: 100 })).toEqual({ kind: "complete", text: "Tamamlandı" });
  });

  it("üretim tamamlanınca gerçek bitiş tarihini seçer", () => {
    const item = {
      ...baseItem,
      uretimDurumu: "uretim_tamamlandi" as const,
      planlananBitis: "2026-08-10T10:00:00Z",
      gercekBitis: "2026-08-09T15:30:00Z",
    };
    expect(getBitisDisplay(item)).toEqual({ value: "2026-08-09T15:30:00Z", kind: "gercek" });
  });
});
