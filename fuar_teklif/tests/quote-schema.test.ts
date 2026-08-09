import { expect, test } from 'bun:test';
import { quoteCreateSchema } from '../src/quotes/schema';

test('quote requires at least one product line', () => {
  const base = { customerId: '11111111-1111-4111-8111-111111111111', currency: 'USD' };
  expect(quoteCreateSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
  expect(quoteCreateSchema.safeParse({ ...base, lines: [{ productId: '22222222-2222-4222-8222-222222222222', amount: 1, unit: 'pallet' }] }).success).toBe(true);
});
