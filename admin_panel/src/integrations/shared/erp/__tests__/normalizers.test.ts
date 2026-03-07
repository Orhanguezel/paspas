import { describe, expect, it } from 'vitest';
import { normalizeUrun, normalizeUrunList } from '../urunler.types';
import { normalizeMusteri, normalizeMusteriList } from '../musteriler.types';

/* ================================================================
   Urunler Normalizers
   ================================================================ */

describe('normalizeUrun', () => {
  it('normalizes valid API response', () => {
    const raw = {
      id: 'abc-123',
      kod: 'PVC-001',
      ad: 'PVC Sert',
      aciklama: 'Hammadde',
      birim: 'kg',
      renk: 'Siyah',
      stok: 1500,
      birimFiyat: 25.5,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    };
    const dto = normalizeUrun(raw);
    expect(dto.id).toBe('abc-123');
    expect(dto.kod).toBe('PVC-001');
    expect(dto.ad).toBe('PVC Sert');
    expect(dto.stok).toBe(1500);
    expect(dto.birimFiyat).toBe(25.5);
    expect(dto.isActive).toBe(true);
  });

  it('handles null optional fields', () => {
    const dto = normalizeUrun({ id: '1', kod: 'K', ad: 'A', birim: 'kg' });
    expect(dto.aciklama).toBeNull();
    expect(dto.renk).toBeNull();
    expect(dto.birimFiyat).toBeNull();
  });

  it('handles completely empty input', () => {
    const dto = normalizeUrun(null);
    expect(dto.id).toBe('');
    expect(dto.kod).toBe('');
    expect(dto.stok).toBe(0);
    expect(dto.isActive).toBe(true); // default fallback
  });

  it('coerces string numbers', () => {
    const dto = normalizeUrun({ stok: '100', birimFiyat: '25.5' });
    expect(dto.stok).toBe(100);
    expect(dto.birimFiyat).toBe(25.5);
  });

  it('coerces boolean-like isActive', () => {
    expect(normalizeUrun({ isActive: 1 }).isActive).toBe(true);
    expect(normalizeUrun({ isActive: '0' }).isActive).toBe(false);
    expect(normalizeUrun({ isActive: 0 }).isActive).toBe(false);
  });
});

describe('normalizeUrunList', () => {
  it('normalizes list response', () => {
    const res = {
      items: [
        { id: '1', kod: 'K1', ad: 'A1', birim: 'kg' },
        { id: '2', kod: 'K2', ad: 'A2', birim: 'adet' },
      ],
      total: 2,
    };
    const list = normalizeUrunList(res);
    expect(list.items).toHaveLength(2);
    expect(list.total).toBe(2);
    expect(list.items[0].kod).toBe('K1');
  });

  it('handles raw array input', () => {
    const list = normalizeUrunList([{ id: '1', kod: 'K', ad: 'A', birim: 'kg' }]);
    expect(list.items).toHaveLength(1);
    expect(list.total).toBe(1);
  });

  it('handles empty/null input', () => {
    expect(normalizeUrunList(null).items).toEqual([]);
    expect(normalizeUrunList({}).items).toEqual([]);
  });
});

/* ================================================================
   Musteriler Normalizers
   ================================================================ */

describe('normalizeMusteri', () => {
  it('normalizes valid customer data', () => {
    const raw = {
      id: 'cust-1',
      ad: 'Promats Bayi',
      tur: 'musteri',
      telefon: '+905551234567',
      adres: 'İstanbul',
      iskonto: 10,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    };
    const dto = normalizeMusteri(raw);
    expect(dto.ad).toBe('Promats Bayi');
    expect(dto.tur).toBe('musteri');
    expect(dto.iskonto).toBe(10);
    expect(dto.isActive).toBe(true);
  });

  it('handles null optional fields', () => {
    const dto = normalizeMusteri({ id: '1', ad: 'Test' });
    expect(dto.telefon).toBeNull();
    expect(dto.adres).toBeNull();
  });

  it('handles empty input', () => {
    const dto = normalizeMusteri(null);
    expect(dto.id).toBe('');
    expect(dto.ad).toBe('');
    expect(dto.iskonto).toBe(0);
  });
});

describe('normalizeMusteriList', () => {
  it('normalizes list response', () => {
    const res = {
      items: [{ id: '1', ad: 'A' }, { id: '2', ad: 'B' }],
      total: 2,
    };
    const list = normalizeMusteriList(res);
    expect(list.items).toHaveLength(2);
    expect(list.total).toBe(2);
  });
});
