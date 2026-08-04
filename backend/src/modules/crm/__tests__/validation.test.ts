import { describe, expect, it } from 'bun:test';
import { dealCreateSchema, dealMoveSchema, dealProductSchema, dealToOfferSchema, talepToDealSchema } from '../validation';

describe('CRM validation', () => {
  it('fırsat varsayılanlarını güvenli üretir', () => {
    const parsed = dealCreateSchema.parse({ title: 'OEM paspas fırsatı' });
    expect(parsed.amount).toBe(0);
    expect(parsed.currency).toBe('TRY');
  });

  it('olasılığı 0-100 aralığında sınırlar', () => {
    expect(dealCreateSchema.safeParse({ title: 'X', probability: 101 }).success).toBe(false);
  });

  it('talep dönüşümünde müşteri seçimini zorunlu tutar', () => {
    expect(talepToDealSchema.safeParse({}).success).toBe(false);
    expect(talepToDealSchema.safeParse({ yeniMusteri: { ad: 'Aday Firma' } }).success).toBe(true);
  });

  it('aşama taşıma için UUID ister', () => {
    expect(dealMoveSchema.safeParse({ stageId: 'x' }).success).toBe(false);
  });

  it('fırsat ürününde pozitif miktar ve ürün UUID ister', () => {
    expect(dealProductSchema.safeParse({ urunId: crypto.randomUUID(), miktar: 2 }).success).toBe(true);
    expect(dealProductSchema.safeParse({ urunId: crypto.randomUUID(), miktar: 0 }).success).toBe(false);
  });

  it('taslak teklif varsayılanlarını üretir', () => {
    expect(dealToOfferSchema.parse({})).toEqual({ dil: 'tr', kdvOrani: 20 });
  });
});
