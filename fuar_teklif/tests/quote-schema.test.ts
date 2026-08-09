import { expect, test } from 'bun:test';
import { quoteCreateSchema } from '../src/quotes/schema';

test('quote requires at least one product line', () => {
  const base = { customerId: '11111111-1111-4111-8111-111111111111', currency: 'USD' };
  expect(quoteCreateSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
  expect(quoteCreateSchema.safeParse({ ...base, lines: [{ productId: '22222222-2222-4222-8222-222222222222', amount: 1, unit: 'pallet' }] }).success).toBe(true);
});

test('quote accepts multiple product lines and all quantity units', () => {
  const base = { customerId: '11111111-1111-4111-8111-111111111111', currency: 'EUR' };
  const parsed = quoteCreateSchema.parse({ ...base, lines: [
    { productId: '22222222-2222-4222-8222-222222222222', amount: 2, unit: 'pallet' },
    { productId: '33333333-3333-4333-8333-333333333333', amount: 10, unit: 'carton' },
  ] });
  expect(parsed.lines).toHaveLength(2);
});
