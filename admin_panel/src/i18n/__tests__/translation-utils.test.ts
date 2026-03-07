import { describe, expect, it } from 'vitest';
import {
  getValueByPath,
  getStringByPath,
  interpolate,
  buildTranslator,
} from '../translation-utils';

describe('getValueByPath', () => {
  const obj = {
    admin: {
      erp: {
        urunler: {
          title: 'Ürünler',
          columns: { kod: 'Kod', ad: 'Ad' },
        },
      },
    },
  };

  it('resolves nested path', () => {
    expect(getValueByPath(obj, 'admin.erp.urunler.title')).toBe('Ürünler');
  });

  it('resolves deeply nested path', () => {
    expect(getValueByPath(obj, 'admin.erp.urunler.columns.kod')).toBe('Kod');
  });

  it('returns undefined for missing path', () => {
    expect(getValueByPath(obj, 'admin.erp.missing.key')).toBeUndefined();
  });

  it('returns undefined for empty path', () => {
    expect(getValueByPath(obj, '')).toBeUndefined();
  });

  it('returns object for intermediate path', () => {
    expect(getValueByPath(obj, 'admin.erp.urunler.columns')).toEqual({ kod: 'Kod', ad: 'Ad' });
  });

  it('handles null/undefined obj', () => {
    expect(getValueByPath(null, 'key')).toBeUndefined();
    expect(getValueByPath(undefined, 'key')).toBeUndefined();
  });
});

describe('getStringByPath', () => {
  const obj = { a: 'hello', b: { c: 'world' }, d: 42 };

  it('returns string value', () => {
    expect(getStringByPath(obj, 'a')).toBe('hello');
    expect(getStringByPath(obj, 'b.c')).toBe('world');
  });

  it('returns undefined for non-string', () => {
    expect(getStringByPath(obj, 'd')).toBeUndefined();
    expect(getStringByPath(obj, 'b')).toBeUndefined();
  });
});

describe('interpolate', () => {
  it('replaces {key} placeholders', () => {
    expect(interpolate('Toplam {count} ürün', { count: 42 })).toBe('Toplam 42 ürün');
  });

  it('replaces multiple placeholders', () => {
    expect(interpolate('{name} - {code}', { name: 'Test', code: 'K1' })).toBe('Test - K1');
  });

  it('replaces all occurrences of same key', () => {
    expect(interpolate('{x} and {x}', { x: 'hi' })).toBe('hi and hi');
  });

  it('returns template as-is without params', () => {
    expect(interpolate('Hello')).toBe('Hello');
    expect(interpolate('Hello', undefined)).toBe('Hello');
  });
});

describe('buildTranslator', () => {
  const translations = {
    tr: {
      admin: {
        erp: {
          urunler: { title: 'Ürünler' },
          common: { totalCount: 'Toplam {count} {item}' },
        },
      },
    },
    en: {
      admin: {
        erp: {
          urunler: { title: 'Products' },
          common: { totalCount: 'Total {count} {item}' },
        },
      },
    },
  };

  it('translates using primary locale', () => {
    const t = buildTranslator({
      translations,
      locales: ['tr', 'en'],
      fallbackChain: ['tr', 'en'],
    });
    expect(t('admin.erp.urunler.title')).toBe('Ürünler');
  });

  it('falls back to second locale', () => {
    const t = buildTranslator({
      translations: { tr: {}, en: translations.en },
      locales: ['tr', 'en'],
      fallbackChain: ['tr', 'en'],
    });
    expect(t('admin.erp.urunler.title')).toBe('Products');
  });

  it('interpolates params', () => {
    const t = buildTranslator({
      translations,
      locales: ['tr', 'en'],
      fallbackChain: ['tr'],
    });
    expect(t('admin.erp.common.totalCount', { count: '5', item: 'ürün' })).toBe('Toplam 5 ürün');
  });

  it('returns key when not found', () => {
    const t = buildTranslator({
      translations,
      locales: ['tr'],
      fallbackChain: ['tr'],
    });
    expect(t('admin.erp.missing.key')).toBe('admin.erp.missing.key');
  });

  it('returns fallback string when provided', () => {
    const t = buildTranslator({
      translations,
      locales: ['tr'],
      fallbackChain: ['tr'],
    });
    expect(t('missing', undefined, 'Varsayılan')).toBe('Varsayılan');
  });

  it('returns empty for empty key', () => {
    const t = buildTranslator({
      translations,
      locales: ['tr'],
      fallbackChain: ['tr'],
    });
    expect(t('')).toBe('');
  });
});
