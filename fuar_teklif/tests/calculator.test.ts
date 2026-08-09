import { describe, expect, test } from 'bun:test';
import { assertMoq, calculateLineTotal, calculateLogistics, calculateTotals, convertQuantity } from '../src/domain/calculator';

const conversion = { setsPerCarton: 6, cartonsPerPallet: 20 };

describe('Fuar teklif hesap motoru', () => {
  test('3 paleti 60 koli ve 360 takıma dönüştürür', () => {
    expect(convertQuantity(3, 'pallet', conversion)).toEqual({ sets: 360, cartons: 60, pallets: 3 });
  });

  test('360 takım x 9 USD tutarını 3240 hesaplar', () => {
    expect(calculateLineTotal(convertQuantity(3, 'pallet', conversion), 9)).toBe(3240);
  });

  test('tam koli olmayan takım girişini reddeder', () => {
    expect(() => convertQuantity(7, 'set', conversion)).toThrow('full_carton_required');
  });

  test('MOQ kontrolü normalize takım miktarı üzerinden yapılır', () => {
    expect(() => assertMoq(convertQuantity(1, 'carton', conversion), 2, 'carton', conversion)).toThrow('moq_not_met');
  });

  test('koli CBM değerini dört ondalık hassasiyetle hesaplar', () => {
    const result = calculateLogistics(convertQuantity(10, 'carton', conversion), 'loose', {
      cartonWidthCm: 40, cartonLengthCm: 60, cartonHeightCm: 25,
      palletWidthCm: 80, palletLengthCm: 120, palletHeightCm: 150,
      netWeightPerSetKg: 1.2, grossWeightPerCartonKg: 8, palletTareKg: 20,
    });
    expect(result.cbm).toBe(0.6);
    expect(result.grossWeightKg).toBe(80);
  });

  test('paletli yükte palet darasını ekler', () => {
    const result = calculateLogistics(convertQuantity(2, 'pallet', conversion), 'palletized', {
      cartonWidthCm: 40, cartonLengthCm: 60, cartonHeightCm: 25,
      palletWidthCm: 80, palletLengthCm: 120, palletHeightCm: 150,
      netWeightPerSetKg: 1, grossWeightPerCartonKg: 8, palletTareKg: 20,
    });
    expect(result.grossWeightKg).toBe(360);
    expect(result.cbm).toBe(2.88);
  });

  test('EXW navlunu toplama dahil etmez; CIF dahil eder', () => {
    const common = { grossProductTotal: 1000, customerDiscountPercent: 10, extraDiscountPercent: 5, freight: 200 };
    expect(calculateTotals({ ...common, deliveryMethod: 'EXW' }).grandTotal).toBe(855);
    expect(calculateTotals({ ...common, deliveryMethod: 'CIF' }).grandTotal).toBe(1055);
  });
});
