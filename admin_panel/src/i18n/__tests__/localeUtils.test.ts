import { describe, expect, it } from 'vitest';
import {
  normLocaleTag,
  uniqKeepOrder,
  normalizeLocales,
  resolveDefaultLocale,
  pickFromAcceptLanguage,
  pickFromCookie,
} from '../localeUtils';

describe('normLocaleTag', () => {
  it('normalizes basic locale strings', () => {
    expect(normLocaleTag('TR')).toBe('tr');
    expect(normLocaleTag('en-US')).toBe('en');
    expect(normLocaleTag('de_DE')).toBe('de');
  });

  it('trims whitespace', () => {
    expect(normLocaleTag('  tr  ')).toBe('tr');
  });

  it('returns empty for falsy values', () => {
    expect(normLocaleTag(null)).toBe('');
    expect(normLocaleTag(undefined)).toBe('');
    expect(normLocaleTag('')).toBe('');
  });
});

describe('uniqKeepOrder', () => {
  it('removes duplicates keeping first occurrence', () => {
    expect(uniqKeepOrder(['tr', 'en', 'tr', 'de'])).toEqual(['tr', 'en', 'de']);
  });

  it('normalizes while deduping', () => {
    expect(uniqKeepOrder(['TR', 'tr', 'EN'])).toEqual(['tr', 'en']);
  });

  it('filters empty strings', () => {
    expect(uniqKeepOrder(['', 'tr', ''])).toEqual(['tr']);
  });
});

describe('normalizeLocales', () => {
  it('handles simple string array', () => {
    expect(normalizeLocales(['tr', 'en'])).toEqual(['tr', 'en']);
  });

  it('handles object array with code/is_active', () => {
    expect(normalizeLocales([
      { code: 'tr', is_active: true, is_default: true },
      { code: 'en', is_active: true },
      { code: 'fr', is_active: false },
    ])).toEqual(['tr', 'en']);
  });

  it('puts default locale first', () => {
    expect(normalizeLocales([
      { code: 'en', is_active: true },
      { code: 'tr', is_active: true, is_default: true },
    ])).toEqual(['tr', 'en']);
  });

  it('handles legacy wrapper format', () => {
    expect(normalizeLocales({ locales: ['tr', 'en'] })).toEqual(['tr', 'en']);
  });

  it('handles JSON string input', () => {
    expect(normalizeLocales('["tr","en"]')).toEqual(['tr', 'en']);
  });

  it('returns empty for invalid input', () => {
    expect(normalizeLocales(null)).toEqual([]);
    expect(normalizeLocales(42)).toEqual([]);
  });
});

describe('resolveDefaultLocale', () => {
  it('returns default when in active list', () => {
    expect(resolveDefaultLocale('tr', ['tr', 'en'])).toBe('tr');
  });

  it('returns first active when default not in list', () => {
    expect(resolveDefaultLocale('fr', ['tr', 'en'])).toBe('tr');
  });

  it('returns empty for no active locales', () => {
    expect(resolveDefaultLocale('tr', [])).toBe('');
  });
});

describe('pickFromAcceptLanguage', () => {
  it('picks matching locale from Accept-Language header', () => {
    expect(pickFromAcceptLanguage('tr-TR,tr;q=0.9,en;q=0.8', ['tr', 'en'])).toBe('tr');
  });

  it('picks first active when no match', () => {
    expect(pickFromAcceptLanguage('fr,es', ['tr', 'en'])).toBe('tr');
  });

  it('returns first active for null header', () => {
    expect(pickFromAcceptLanguage(null, ['en', 'tr'])).toBe('en');
  });

  it('returns empty for no active locales', () => {
    expect(pickFromAcceptLanguage('tr', [])).toBe('');
  });
});

describe('pickFromCookie', () => {
  it('returns locale when in active list', () => {
    expect(pickFromCookie('tr', ['tr', 'en'])).toBe('tr');
  });

  it('returns null when not in active list', () => {
    expect(pickFromCookie('fr', ['tr', 'en'])).toBeNull();
  });

  it('returns null for undefined cookie', () => {
    expect(pickFromCookie(undefined, ['tr'])).toBeNull();
  });
});
