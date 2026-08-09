export const FUAR_CART_KEY = "paspas:fuar-teklif-cart:v1";

export type FuarCartLine = {
  productId: string;
  amount: number;
  unit: "set" | "carton" | "pallet";
};

export function readFuarCart(): FuarCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(FUAR_CART_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is FuarCartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as FuarCartLine).productId === "string" &&
        Number.isInteger((line as FuarCartLine).amount) &&
        (line as FuarCartLine).amount > 0 &&
        ["set", "carton", "pallet"].includes((line as FuarCartLine).unit),
    );
  } catch {
    return [];
  }
}

export function writeFuarCart(lines: FuarCartLine[]) {
  localStorage.setItem(FUAR_CART_KEY, JSON.stringify(lines));
}
