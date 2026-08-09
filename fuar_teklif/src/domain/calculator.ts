export type Unit = 'set' | 'carton' | 'pallet';
export type LoadingType = 'loose' | 'palletized';
export type DeliveryMethod = 'EXW' | 'FOB' | 'CIF';

export type Conversion = {
  setsPerCarton: number;
  cartonsPerPallet: number;
};

export type Quantity = {
  sets: number;
  cartons: number;
  pallets: number;
};

export type PackageFacts = {
  cartonWidthCm: number;
  cartonLengthCm: number;
  cartonHeightCm: number;
  palletWidthCm: number;
  palletLengthCm: number;
  palletHeightCm: number;
  netWeightPerSetKg: number;
  grossWeightPerCartonKg: number;
  palletTareKg: number;
};

export function convertQuantity(amount: number, unit: Unit, conversion: Conversion): Quantity {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('quantity_must_be_positive_integer');
  if (!Number.isInteger(conversion.setsPerCarton) || conversion.setsPerCarton <= 0) throw new Error('invalid_sets_per_carton');
  if (!Number.isInteger(conversion.cartonsPerPallet) || conversion.cartonsPerPallet <= 0) throw new Error('invalid_cartons_per_pallet');
  const setsPerPallet = conversion.setsPerCarton * conversion.cartonsPerPallet;
  const sets = unit === 'set' ? amount : unit === 'carton' ? amount * conversion.setsPerCarton : amount * setsPerPallet;
  if (sets % conversion.setsPerCarton !== 0) throw new Error('full_carton_required');
  const cartons = sets / conversion.setsPerCarton;
  const pallets = cartons / conversion.cartonsPerPallet;
  if (unit === 'pallet' && !Number.isInteger(pallets)) throw new Error('full_pallet_required');
  return { sets, cartons, pallets };
}

export function assertMoq(quantity: Quantity, moqAmount: number, moqUnit: Unit, conversion: Conversion): void {
  const minimum = convertQuantity(moqAmount, moqUnit, conversion);
  if (quantity.sets < minimum.sets) throw new Error('moq_not_met');
}

const volumeM3 = (widthCm: number, lengthCm: number, heightCm: number) =>
  (widthCm * lengthCm * heightCm) / 1_000_000;

export function calculateLogistics(quantity: Quantity, loadingType: LoadingType, facts: PackageFacts) {
  const cbm = loadingType === 'palletized'
    ? volumeM3(facts.palletWidthCm, facts.palletLengthCm, facts.palletHeightCm) * Math.ceil(quantity.pallets)
    : volumeM3(facts.cartonWidthCm, facts.cartonLengthCm, facts.cartonHeightCm) * quantity.cartons;
  const netWeightKg = facts.netWeightPerSetKg * quantity.sets;
  const grossWeightKg = facts.grossWeightPerCartonKg * quantity.cartons
    + (loadingType === 'palletized' ? facts.palletTareKg * Math.ceil(quantity.pallets) : 0);
  return { cbm: Math.round(cbm * 10_000) / 10_000, netWeightKg, grossWeightKg };
}

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateTotals(input: {
  grossProductTotal: number;
  customerDiscountPercent: number;
  extraDiscountPercent: number;
  freight: number;
  deliveryMethod: DeliveryMethod;
}) {
  const customerDiscount = money(input.grossProductTotal * input.customerDiscountPercent / 100);
  const afterCustomerDiscount = money(input.grossProductTotal - customerDiscount);
  const extraDiscount = money(afterCustomerDiscount * input.extraDiscountPercent / 100);
  const productTotal = money(afterCustomerDiscount - extraDiscount);
  const freight = input.deliveryMethod === 'EXW' ? 0 : money(input.freight);
  return {
    grossProductTotal: money(input.grossProductTotal),
    customerDiscount,
    afterCustomerDiscount,
    extraDiscount,
    productTotal,
    freight,
    grandTotal: money(productTotal + freight),
  };
}

export function calculateLineTotal(quantity: Quantity, unitPricePerSet: number): number {
  return money(quantity.sets * unitPricePerSet);
}
