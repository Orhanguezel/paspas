import 'server-only';

import { getServerApiBase } from '@/i18n/apiBase.server';
import { DEFAULT_TOKENS } from './defaults';
import type { DesignTokens } from './types';

export type PromatsThemeTokens = {
  brand?: string;
  sectionBg?: {
    s2?: string;
    s4?: string;
    s5?: string;
    s6?: string;
    s7?: string;
    s8?: string;
    black?: string;
  };
  headerBlackBg?: string;
  text?: {
    body?: string;
    heading?: string;
    onDark?: string;
    muted?: string;
    pro?: string;
    con?: string;
  };
  assets?: {
    heroArrowLeft?: string;
    heroArrowRight?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parsePromatsTheme(value: unknown): PromatsThemeTokens | null {
  if (!isRecord(value)) return null;
  const raw = isRecord(value.promats) ? value.promats : null;
  if (!raw) return null;
  const sectionBg = isRecord(raw.sectionBg) ? raw.sectionBg : {};
  const text = isRecord(raw.text) ? raw.text : {};
  const assets = isRecord(raw.assets) ? raw.assets : {};
  return {
    brand: asString(raw.brand),
    headerBlackBg: asString(raw.headerBlackBg),
    sectionBg: {
      s2: asString(sectionBg.s2),
      s4: asString(sectionBg.s4),
      s5: asString(sectionBg.s5),
      s6: asString(sectionBg.s6),
      s7: asString(sectionBg.s7),
      s8: asString(sectionBg.s8),
      black: asString(sectionBg.black),
    },
    text: {
      body: asString(text.body),
      heading: asString(text.heading),
      onDark: asString(text.onDark),
      muted: asString(text.muted),
      pro: asString(text.pro),
      con: asString(text.con),
    },
    assets: {
      heroArrowLeft: asString(assets.heroArrowLeft),
      heroArrowRight: asString(assets.heroArrowRight),
    },
  };
}

function isDesignTokens(value: unknown): value is DesignTokens {
  if (!value || typeof value !== 'object') return false;
  const tokens = value as Partial<DesignTokens>;
  return Boolean(tokens.colors?.brand_primary && tokens.radius && tokens.shadows && tokens.branding);
}

function mergeTokens(value: DesignTokens): DesignTokens {
  return {
    ...DEFAULT_TOKENS,
    ...value,
    colors: { ...DEFAULT_TOKENS.colors, ...value.colors },
    typography: { ...DEFAULT_TOKENS.typography, ...value.typography },
    radius: { ...DEFAULT_TOKENS.radius, ...value.radius },
    shadows: { ...DEFAULT_TOKENS.shadows, ...value.shadows },
    branding: { ...DEFAULT_TOKENS.branding, ...value.branding },
  };
}

export async function fetchDesignTokens(): Promise<DesignTokens> {
  try {
    const API_BASE = getServerApiBase();
    if (!API_BASE) return DEFAULT_TOKENS;

    // getServerApiBase: host sonunda /api yoksa ekler — fetchSetting ile aynı kök.
    const response = await fetch(`${API_BASE}/site_settings/design_tokens`, {
      next: { revalidate: 30, tags: ['design_tokens'] },
    });

    if (!response.ok) return DEFAULT_TOKENS;

    const data = await response.json();
    const rawValue = typeof data?.value === 'string' ? JSON.parse(data.value) : data?.value;

    if (!isDesignTokens(rawValue)) return DEFAULT_TOKENS;
    return mergeTokens(rawValue);
  } catch {
    return DEFAULT_TOKENS;
  }
}

export async function fetchCustomCss(): Promise<string> {
  try {
    const API_BASE = getServerApiBase();
    if (!API_BASE) return '';

    const response = await fetch(`${API_BASE}/site_settings/custom_css`, {
      next: { revalidate: 30, tags: ['custom_css'] },
    });

    if (!response.ok) return '';

    const data = await response.json();
    return typeof data?.value === 'string' ? data.value : '';
  } catch {
    return '';
  }
}

export async function fetchPromatsThemeTokens(): Promise<PromatsThemeTokens | null> {
  try {
    const API_BASE = getServerApiBase();
    if (!API_BASE) return null;

    const response = await fetch(`${API_BASE}/theme`, {
      next: { revalidate: 30, tags: ['theme_config'] },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return parsePromatsTheme(data);
  } catch {
    return null;
  }
}
