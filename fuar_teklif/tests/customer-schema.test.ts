import { expect, test } from 'bun:test';
import { customerCreateSchema } from '../src/customers/schema';

test('customer discount stays between zero and one hundred', () => {
  expect(customerCreateSchema.parse({ code: 'C-1', name: 'Acme', defaultDiscountPercent: 12 }).defaultDiscountPercent).toBe(12);
  expect(customerCreateSchema.safeParse({ code: 'C-1', name: 'Acme', defaultDiscountPercent: 101 }).success).toBe(false);
});
