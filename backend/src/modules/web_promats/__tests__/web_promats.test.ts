import { describe, expect, test } from 'bun:test';
import { webPromatsTestUtils } from '../router';

const {
  languageId,
  cmsTarget,
  editablePayload,
  asset,
  product,
  page,
} = webPromatsTestUtils;

describe('web_promats public DTO helpers', () => {
  test('locale query maps tr/en and defaults to tr', () => {
    expect(languageId({})).toBe(1);
    expect(languageId({ lang: 'tr' })).toBe(1);
    expect(languageId({ locale: 'en' })).toBe(2);
    expect(() => languageId({ lang: 'de' })).toThrow();
  });

  test('asset paths are normalized without changing absolute paths', () => {
    expect(asset(null)).toBeNull();
    expect(asset('uploads/a.png')).toBe('/uploads/a.png');
    expect(asset('/uploads/a.png')).toBe('/uploads/a.png');
  });

  test('product DTO carries the legacy content contract and features', () => {
    const result = product({
      id: 7,
      language_id: 1,
      sort_order: 2,
      name: 'Orbital',
      slug: 'orbital',
      s1_1_text: 'Başlık',
      s1_4_image: 'uploads/hero.webp',
      s5_1_text: '10 cm',
    }, [{
      id: 8,
      product_id: 7,
      type: 1,
      sort_order: 0,
      image: '/uploads/feature.webp',
      feature: 'Özellik',
    }]);

    expect(result.slug).toBe('orbital');
    expect(result.hero.image).toBe('/uploads/hero.webp');
    expect(result.sections.dimensions[0]).toBe('10 cm');
    expect(result.features).toEqual([{
      id: 8,
      productId: 7,
      type: 1,
      sortOrder: 0,
      image: '/uploads/feature.webp',
      feature: 'Özellik',
    }]);
  });

  test('page DTO includes gallery only when requested', () => {
    const row = {
      id: 3,
      language_id: 2,
      sort_order: 1,
      position: 4,
      title: 'Page',
      image: null,
      detail: 'Detail',
      url: null,
      slug: 'page',
    };
    expect(page(row)).not.toHaveProperty('gallery');
    expect(page(row, [{ id: 9, image: 'g.jpg', sort_order: 2 }]).gallery).toEqual([
      { id: 9, image: '/g.jpg', sortOrder: 2 },
    ]);
  });
});

describe('web_promats admin write guards', () => {
  test('only whitelisted CMS tables resolve', () => {
    expect(cmsTarget('products')).toEqual({
      key: 'products',
      table: 'web_promats_products',
    });
    expect(cmsTarget('users')).toBeNull();
    expect(cmsTarget('web_promats_products')).toBeNull();
  });

  test('editable payload drops identifiers and unknown columns', () => {
    expect(editablePayload('products', {
      id: 99,
      name: 'Yeni ürün',
      slug: 'yeni-urun',
      status: 0,
      injected_column: 'DROP',
    })).toEqual({
      name: 'Yeni ürün',
      slug: 'yeni-urun',
      status: 0,
    });
  });

  test('empty editor values become SQL null values', () => {
    expect(editablePayload('articles', {
      title: 'Makale',
      excerpt: '',
    })).toEqual({
      title: 'Makale',
      excerpt: null,
    });
  });
});
