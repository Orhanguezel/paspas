// =============================================================
// FILE: src/modules/_shared/categories.ts
// Schema'dan bağımsız category helper'ları
// NOT: Schema'ya bağımlı olanlar categories/helpers.ts'de
// =============================================================
import { nullIfEmpty, toBool } from '@/modules/_shared';

/**
 * Build base payload for category create/update
 */
export function buildBasePayload(data: any): Record<string, unknown> {
  return {
    module_key: (data.module_key ?? 'general').trim(),
    image_url: nullIfEmpty(data.image_url) ?? null,
    storage_asset_id: nullIfEmpty(data.storage_asset_id) ?? null,
    alt: nullIfEmpty(data.alt) ?? null,
    icon: nullIfEmpty(data.icon) ?? null,
    is_active: data.is_active === undefined ? true : toBool(data.is_active),
    is_featured: data.is_featured === undefined ? false : toBool(data.is_featured),
    display_order: data.display_order ?? 0,
  };
}

/**
 * Build i18n rows for category create
 */
export function buildI18nRows(
  categoryId: string,
  locales: string[],
  data: {
    name: string;
    slug: string;
    description?: string | null;
    alt?: string | null;
    i18n_data?: any;
  },
): Array<{
  category_id: string;
  locale: string;
  name: string;
  slug: string;
  description: string | null;
  alt: string | null;
  i18n_data: string | null;
}> {
  const baseName = String(data.name ?? '').trim();
  const baseSlug = String(data.slug ?? '').trim();
  const baseDescription = nullIfEmpty(data.description) ?? null;
  const baseAlt = nullIfEmpty(data.alt) ?? null;
  const baseI18nData = data.i18n_data ? JSON.stringify(data.i18n_data) : null;

  return locales.map((loc) => ({
    category_id: categoryId,
    locale: loc,
    name: baseName,
    slug: baseSlug,
    description: baseDescription,
    alt: baseAlt,
    i18n_data: baseI18nData,
  }));
}
