import 'server-only';

import { getServerApiBase } from '@/i18n/apiBase.server';
import { fetchSetting } from '@/i18n/server';
import homeFeatures from '@/config/pages/home-features.json';
import { getPublicAppName } from '@/lib/site-config';

function pickLocaleKeyForFeatures(locale: string): 'tr' | 'en' | 'de' {
  const k = locale.split('-')[0]?.toLowerCase();
  if (k === 'de') return 'de';
  if (k === 'en') return 'en';
  return 'tr';
}

function settingString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'url' in value) {
    return String((value as { url?: unknown }).url || '');
  }
  return '';
}

/** FeaturesNew görselleri — yalnızca sunucu bileşenlerinden çağrılmalı (client registry içinde fetch yok). */
export async function fetchFeaturesNewImageUrls(locale: string): Promise<string[]> {
  const lk = pickLocaleKeyForFeatures(locale);
  const raw = homeFeatures as Record<'tr' | 'en' | 'de', { features: { settingKey: string }[] }>;
  const copy = raw[lk] || raw.en;
  const rows = await Promise.all(
    copy.features.map((f) => fetchSetting(f.settingKey, '*', { revalidate: 600 })),
  );
  return rows.map((row) => settingString(row?.value));
}

export interface HomeSection {
  id: string;
  slug: string;
  label: string;
  component_key: string;
  order_index: number;
  is_active: number;
  config: Record<string, unknown> | null;
}

const DEFAULT_LAYOUT: HomeSection[] = [
  { id: 'home-hero', slug: 'hero', label: 'Hero', component_key: 'HeroNew', order_index: 10, is_active: 1, config: null },
  { id: 'home-neden', slug: 'neden', label: `Neden ${getPublicAppName()}`, component_key: 'FeaturesNew', order_index: 20, is_active: 1, config: null },
  { id: 'home-vaitler', slug: 'vaitler', label: 'Temel yapı', component_key: 'PromisesSection', order_index: 30, is_active: 1, config: null },
  { id: 'home-nasil', slug: 'nasil', label: 'Nasıl çalışır', component_key: 'HomeIntroSection', order_index: 40, is_active: 1, config: null },
  { id: 'home-cta', slug: 'iletisim', label: 'İletişim', component_key: 'HomeCTABanner', order_index: 50, is_active: 1, config: null },
];

function normalizeLayout(list: HomeSection[]): HomeSection[] {
  return [...list]
    .filter((s) => Number(s.is_active) === 1)
    .sort((a, b) => a.order_index - b.order_index);
}

export async function fetchHomeLayout(): Promise<HomeSection[]> {
  const fallback = normalizeLayout(DEFAULT_LAYOUT);
  const base = getServerApiBase();
  if (!base) return fallback;
  try {
    const res = await fetch(`${base}/home/layout`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    const json = await res.json();
    const raw = json?.data ?? json;
    const data = Array.isArray(raw) ? (raw as HomeSection[]) : [];
    if (!data.length) return fallback;
    return normalizeLayout(data);
  } catch {
    return fallback;
  }
}
