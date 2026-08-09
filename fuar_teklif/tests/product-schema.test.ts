import { describe, expect, test } from 'bun:test';
import { productCreateSchema, productUpdateSchema } from '../src/products/schema';

describe('Fuar product validation', () => {
  test('accepts packing and MOQ facts', () => {
    const product = productCreateSchema.parse({ code: 'MAT-01', name: 'Maximum Mat', setsPerCarton: 6, cartonsPerPallet: 20, moqAmount: 1, moqUnit: 'pallet' });
    expect(product.originCountry).toBe('Türkiye'); expect(product.unit).toBe('set');
  });
  test('rejects invalid conversions', () => {
    expect(() => productCreateSchema.parse({ code: 'MAT-01', name: 'Mat', setsPerCarton: 0, cartonsPerPallet: 20, moqAmount: 1, moqUnit: 'pallet' })).toThrow();
  });
  test('requires at least one update field', () => { expect(productUpdateSchema.safeParse({}).success).toBe(false); });
});
