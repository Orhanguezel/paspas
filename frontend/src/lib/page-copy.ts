/**
 * Sayfa gövde metinleri: varsayılan olarak src/config/pages/*.json.
 * Üretimde içerik DB/site_settings veya CMS API ile beslenmeli; JSON yalnızca fallback.
 */

type LocaleKey = 'tr' | 'en' | 'de';

function pickLocale(locale: string): LocaleKey {
  const k = locale.split('-')[0]?.toLowerCase();
  if (k === 'de') return 'de';
  if (k === 'en') return 'en';
  return 'tr';
}

export function injectAppName(template: string, app: string): string {
  return template.replace(/\{\{appName\}\}/g, app);
}

/** JSON içinden locale dallanması */
export function branchLocale<T extends Record<string, unknown>>(root: T, locale: string): T[keyof T] | null {
  const k = pickLocale(locale);
  const v = (root as Record<string, unknown>)[k];
  return (v ?? null) as T[keyof T] | null;
}

export type EditorialPolicyCopy = {
  title: string;
  description: string;
  back: string;
  authorRoleTitle: string;
  authorExpertiseLabels: string[];
  credentialsNote: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
};

export async function getEditorialPolicyCopy(
  locale: string,
  appName: string,
): Promise<EditorialPolicyCopy> {
  const mod = await import('@/config/pages/editorial-policy.json');
  const raw = mod.default as Record<LocaleKey, EditorialPolicyCopy>;
  const k = pickLocale(locale);
  const base = raw[k] || raw.en;
  const inject = (s: string) => injectAppName(s, appName);
  return {
    title: inject(base.title),
    description: inject(base.description),
    back: inject(base.back),
    authorRoleTitle: inject(base.authorRoleTitle),
    authorExpertiseLabels: base.authorExpertiseLabels.map(inject),
    credentialsNote: inject(base.credentialsNote),
    sections: base.sections.map((sec) => ({
      title: inject(sec.title),
      paragraphs: sec.paragraphs.map(inject),
    })),
  };
}

export type HeroCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  headline: string;
  tagline: string;
  primaryCTA: string;
  secondaryCTA: string;
  scrollHint: string;
};

export async function getHomeHeroCopy(locale: string, appName: string): Promise<HeroCopy> {
  const mod = await import('@/config/pages/home-hero.json');
  const raw = mod.default as Record<LocaleKey, HeroCopy>;
  const k = pickLocale(locale);
  const base = raw[k] || raw.en;
  const inject = (s: string) => injectAppName(s, appName);
  return {
    eyebrow: inject(base.eyebrow),
    title: inject(base.title),
    subtitle: inject(base.subtitle),
    headline: inject(base.headline),
    tagline: inject(base.tagline),
    primaryCTA: inject(base.primaryCTA),
    secondaryCTA: inject(base.secondaryCTA),
    scrollHint: inject(base.scrollHint),
  };
}
