import type { SiparisIslemSatiri } from "@/integrations/shared/erp/satis_siparisleri.types";

export function canCloseSiparisItems(items: SiparisIslemSatiri[]): boolean {
  return (
    items.length > 0 &&
    items.every((item) => item.uretimDurumu === "beklemede" || item.uretimDurumu === "uretim_tamamlandi")
  );
}

export type IslemDisplay = {
  kind: "empty" | "status" | "progress" | "complete";
  text: string;
};

function formatQuantity(value: number): string {
  return value.toLocaleString("tr-TR");
}

export function getUretimDisplay(item: SiparisIslemSatiri): IslemDisplay {
  if (item.uretimDurumu === "uretim_tamamlandi") {
    return { kind: "complete", text: "Tamamlandı" };
  }
  if (item.uretilenMiktar > 0) {
    return {
      kind: "progress",
      text: `${formatQuantity(item.uretilenMiktar)} / ${formatQuantity(item.miktar)}`,
    };
  }
  if (item.uretimDurumu === "makineye_atandi") {
    return { kind: "status", text: "Makineye Atandı" };
  }
  if (item.uretimDurumu === "uretime_aktarildi") {
    return { kind: "status", text: "Üretime Aktarıldı" };
  }
  if (item.uretimDurumu === "uretiliyor") {
    return { kind: "status", text: "Üretiliyor" };
  }
  if (item.uretimDurumu === "duraklatildi") {
    return { kind: "status", text: "Duraklatıldı" };
  }
  return { kind: "empty", text: "" };
}

export function getSevkDisplay(item: SiparisIslemSatiri): IslemDisplay {
  if (item.sevkEdilenMiktar <= 0) return { kind: "empty", text: "" };
  if (item.sevkEdilenMiktar >= item.miktar) {
    return { kind: "complete", text: "Tamamlandı" };
  }
  return {
    kind: "progress",
    text: `${formatQuantity(item.sevkEdilenMiktar)} / ${formatQuantity(item.miktar)}`,
  };
}

export function getBitisDisplay(item: SiparisIslemSatiri): {
  value: string | null;
  kind: "gercek" | "planlanan";
} {
  if (item.uretimDurumu === "uretim_tamamlandi" && item.gercekBitis) {
    return { value: item.gercekBitis, kind: "gercek" };
  }
  return { value: item.planlananBitis, kind: "planlanan" };
}
