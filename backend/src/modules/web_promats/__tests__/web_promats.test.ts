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

  // Regresyon: eski CMS kayitlari `/userfiles` altina goreli saklaniyor.
  // Once yalniz basa `/` konuyordu ve `/images/...` adresi 404 veriyordu;
  // site calisiyordu cunku frontend eksigi kendi tarafinda tamamliyordu.
  // TeklifRota entegrasyonu 20 gorselin 9'unda 404 aldi (2026-08-18).
  test('eski CMS gorsel yollari /userfiles altina tasinir', () => {
    expect(asset('images/product/orbital-tekli.png')).toBe('/userfiles/images/product/orbital-tekli.png');
    expect(asset('/images/product/orbital-tekli.png')).toBe('/userfiles/images/product/orbital-tekli.png');
    expect(asset('images/banner/slider1.jpg')).toBe('/userfiles/images/banner/slider1.jpg');
  });

  test('tam yollar oldugu gibi birakilir (cift on ek olusmaz)', () => {
    expect(asset('/userfiles/images/product/catalog-2026/star-serisi/cover.jpg'))
      .toBe('/userfiles/images/product/catalog-2026/star-serisi/cover.jpg');
    expect(asset('/uploads/page-feedback/x/image1.png')).toBe('/uploads/page-feedback/x/image1.png');
    expect(asset('/assets/logo.svg')).toBe('/assets/logo.svg');
    expect(asset('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  test('bos ve bosluklu degerler null doner', () => {
    expect(asset('')).toBeNull();
    expect(asset('   ')).toBeNull();
    expect(asset(undefined)).toBeNull();
  });

  // `/userfiles` on eki, adi ona benzeyen bir klasoru yutmamali.
  test('benzer isimli klasor tam yol sayilmaz', () => {
    expect(asset('/userfilesx/a.png')).toBe('/userfiles/userfilesx/a.png');
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
    // Kasitli davranis degisikligi (2026-08-18): on eki olmayan eski CMS yolu
    // artik `/userfiles` altina tasiniyor; onceki beklenti `/g.jpg` idi ve bu
    // adres canlida 404 veriyordu.
    expect(page(row, [{ id: 9, image: 'g.jpg', sort_order: 2 }]).gallery).toEqual([
      { id: 9, image: '/userfiles/g.jpg', sortOrder: 2 },
    ]);
    // Panelden yuklenen galeri gorselleri tam yol tutuyor; dokunulmamali.
    expect(page(row, [{ id: 10, image: '/uploads/x/a.png', sort_order: 1 }]).gallery).toEqual([
      { id: 10, image: '/uploads/x/a.png', sortOrder: 1 },
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
