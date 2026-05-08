import { describe, expect, test } from 'bun:test';
import { shouldFetchKeepa } from '../keepa.client';

describe('amazon keepa client', () => {
  test('fetches only for insufficient data or high risk products', () => {
    expect(shouldFetchKeepa({ confidence: 'INSUFFICIENT_DATA', score: null })).toBe(true);
    expect(shouldFetchKeepa({ confidence: 'HIGH', score: 7.2 })).toBe(true);
    expect(shouldFetchKeepa({ confidence: 'HIGH', score: 6.8 })).toBe(false);
  });
});
