// =============================================================
// FILE: src/seo/seoSchema.ts
// guezelwebdesign – SEO Schema (STRICT) + DB-backed Defaults
// SINGLE SOURCE OF TRUTH: open_graph.images[]
// =============================================================

import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);

export const seoOpenGraphSchema = z
  .object({
    type: z.enum(['website', 'article', 'product']).default('website'),
    /** ✅ SINGLE SOURCE: images[] only */
    images: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const seoTwitterSchema = z
  .object({
    card: z
      .enum(['summary', 'summary_large_image', 'app', 'player'])
      .default('summary_large_image'),
    site: z.string().trim().optional(),
    creator: z.string().trim().optional(),
  })
  .strict();

export const seoRobotsSchema = z
  .object({
    noindex: z.boolean().default(false),
    index: z.boolean().default(true),
    follow: z.boolean().default(true),
  })
  .strict();

export const seoSchema = z
  .object({
    site_name: nonEmpty,
    title_default: nonEmpty,
    title_template: nonEmpty,
    description: z.string().trim().optional(),

    open_graph: seoOpenGraphSchema.default({
      type: 'website',
      images: ['/img/og-default.jpg'],
    }),

    twitter: seoTwitterSchema.default({
      card: 'summary_large_image',
      site: '',
      creator: '',
    }),

    robots: seoRobotsSchema.default({
      noindex: false,
      index: true,
      follow: true,
    }),
  })
  .strict();

export type SeoObject = z.infer<typeof seoSchema>;

export const siteMetaDefaultSchema = z
  .object({
    title: nonEmpty,
    description: nonEmpty,
    keywords: z.string().trim().optional(),
  })
  .strict();

export type SiteMetaDefaultObject = z.infer<typeof siteMetaDefaultSchema>;

export const DEFAULT_OG_IMAGE = '/img/og-default.jpg';

/**
 * ✅ Global fallback – DB boş/kırık olduğunda kullanılır.
 * Asıl değerler site_settings.seo içinden gelir.
 */
export const DEFAULT_SEO_GLOBAL: SeoObject = {
  site_name: 'guezelwebdesign Industrial Cooling Towers',
  title_default: 'guezelwebdesign Industrial Cooling Towers and Engineering',
  title_template: '%s – guezelwebdesign',
  description:
    'Industrial cooling towers, engineering, installation and service solutions for efficient process cooling.',
  open_graph: {
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    site: '',
    creator: '',
  },
  robots: {
    noindex: false,
    index: true,
    follow: true,
  },
};

/**
 * ✅ Locale bazlı meta fallback – DB’de locale karşılığı yoksa kullanılır.
 * Asıl değerler, varsa, site_settings.site_meta_default (veya benzeri) içinden gelecektir.
 */
export const DEFAULT_SITE_META_DEFAULT_BY_LOCALE: Record<string, SiteMetaDefaultObject> = {
  tr: {
    title: 'guezelwebdesign – Endüstriyel Su Soğutma Kuleleri ve Mühendislik',
    description:
      'Endüstriyel soğutma kuleleri, modernizasyon ve enerji verimliliği çözümleri. Keşif, üretim, montaj, bakım ve yedek parça.',
    keywords: 'guezelwebdesign, endüstriyel, soğutma kulesi, enerji verimliliği, b2b',
  },
  en: {
    title: 'guezelwebdesign – Industrial Cooling Towers and Engineering',
    description:
      'Industrial cooling towers and energy efficiency solutions. Engineering, manufacturing, installation, modernization, testing and spare parts.',
    keywords: 'guezelwebdesign, industrial, cooling towers, energy efficiency, b2b',
  },
  de: {
    title: 'guezelwebdesign – Industrielle Kuehltuerme und Engineering',
    description:
      'Industrielle Kuehlturmtechnik und Energieeffizienzloesungen. Planung, Fertigung, Montage, Modernisierung, Leistungstests und Ersatzteile.',
    keywords: 'guezelwebdesign, industriell, kuehlturm, energieeffizienz, b2b',
  },
};

/* ------------------------------------------------------------------
 * HELPERS – DB site_settings.value -> Tip güvenli SEO objeleri
 * ------------------------------------------------------------------ */

function tryParseJson(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  const s = input.trim();
  if (!s) return {};
  if (!((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']')))) {
    return input;
  }
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/**
 * site_settings.seo (veya site_seo) için parse helper:
 *
 *  - input: DB’den gelen value (JSON, text, object vs.)
 *  - output: SeoObject
 *  - davranış:
 *      * Zod ile validate eder
 *      * Eksik alanları DEFAULT_SEO_GLOBAL ile doldurur
 *      * Bozuk/parse edilemeyen durumda tam fallback: DEFAULT_SEO_GLOBAL
 */
export function parseSeoFromSettings(input: unknown): SeoObject {
  const base = DEFAULT_SEO_GLOBAL;

  if (input === null || input === undefined) {
    return base;
  }

  const raw = tryParseJson(input);

  try {
    // DB value genelde "partial" olacağı için partial schema + merge kullanıyoruz
    const partial = seoSchema.partial().parse(raw) as Partial<SeoObject>;

    return {
      ...base,
      ...partial,
      open_graph: {
        ...base.open_graph,
        ...(partial.open_graph ?? {}),
      },
      twitter: {
        ...base.twitter,
        ...(partial.twitter ?? {}),
      },
      robots: {
        ...base.robots,
        ...(partial.robots ?? {}),
      },
    };
  } catch {
    return base;
  }
}

/**
 * site_settings.site_meta_default (locale bazlı meta) için parse helper:
 *
 *  Beklenen format (DB value):
 *  {
 *    "tr": { "title": "...", "description": "...", "keywords": "..." },
 *    "en": { ... },
 *    "de": { ... }
 *  }
 *
 *  - Her locale için siteMetaDefaultSchema ile validate edilir.
 *  - Hatalı/bilinmeyen localeler için DEFAULT_SITE_META_DEFAULT_BY_LOCALE kullanılır.
 */
export function parseSiteMetaDefaultByLocale(
  input: unknown,
): Record<string, SiteMetaDefaultObject> {
  const base = DEFAULT_SITE_META_DEFAULT_BY_LOCALE;

  if (input === null || input === undefined) {
    return base;
  }

  const raw = tryParseJson(input);

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return base;
  }

  const result: Record<string, SiteMetaDefaultObject> = {};

  for (const [locale, val] of Object.entries(raw as Record<string, unknown>)) {
    try {
      result[locale] = siteMetaDefaultSchema.parse(val);
    } catch {
      const fb = base[locale] || base.en || base.tr;
      if (fb) result[locale] = fb;
    }
  }

  // En azından base’deki localelerin hepsi olsun
  for (const [loc, def] of Object.entries(base)) {
    if (!result[loc]) {
      result[loc] = def;
    }
  }

  return result;
}
