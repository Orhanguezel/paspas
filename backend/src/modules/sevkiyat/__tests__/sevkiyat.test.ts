import { describe, expect, it } from 'bun:test';

import {
  bekleyenlerQuerySchema,
  sevkEmriCreateSchema,
  sevkEmriListQuerySchema,
  sevkEmriPatchSchema,
  siparissizQuerySchema,
} from '../validation';

describe('sevkiyat validation', () => {
  it('uses expected defaults for bekleyenler query', () => {
    const parsed = bekleyenlerQuerySchema.parse({});
    expect(parsed.stokFiltre).toBe('stoklu');
    expect(parsed.limit).toBe(200);
    expect(parsed.offset).toBe(0);
  });

  it('uses expected defaults for siparissiz query', () => {
    const parsed = siparissizQuerySchema.parse({});
    expect(parsed.limit).toBe(200);
    expect(parsed.offset).toBe(0);
  });

  it('accepts valid sevk emri create payload', () => {
    const parsed = sevkEmriCreateSchema.safeParse({
      siparisId: 'siparis-1',
      siparisKalemId: 'kalem-1',
      musteriId: 'musteri-1',
      urunId: 'urun-1',
      miktar: 12.5,
      tarih: '2026-03-10',
      notlar: 'test sevk emri',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects zero or negative shipment quantity', () => {
    expect(sevkEmriCreateSchema.safeParse({
      musteriId: 'musteri-1',
      urunId: 'urun-1',
      miktar: 0,
    }).success).toBe(false);

    expect(sevkEmriCreateSchema.safeParse({
      musteriId: 'musteri-1',
      urunId: 'urun-1',
      miktar: -5,
    }).success).toBe(false);
  });

  it('accepts only supported shipment status transitions', () => {
    expect(sevkEmriPatchSchema.safeParse({ durum: 'onaylandi' }).success).toBe(true);
    expect(sevkEmriPatchSchema.safeParse({ durum: 'sevk_edildi' }).success).toBe(true);
    expect(sevkEmriPatchSchema.safeParse({ durum: 'hazirlaniyor' }).success).toBe(false);
  });

  it('uses expected defaults for sevk emri list query', () => {
    const parsed = sevkEmriListQuerySchema.parse({});
    expect(parsed.limit).toBe(100);
    expect(parsed.offset).toBe(0);
    expect(parsed.sort).toBe('created_at');
    expect(parsed.order).toBe('desc');
  });
});
