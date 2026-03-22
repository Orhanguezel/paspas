'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useGetSiteSettingAdminByKeyQuery,
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/endpoints/admin/site_settings_admin.endpoints';
import { useAppDispatch } from '@/stores/hooks';
import { preferencesActions } from '@/stores/preferencesSlice';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import type { ThemeMode, ThemePreset } from '@/lib/preferences/theme';
import type { SidebarVariant, SidebarCollapsible, NavbarStyle, ContentLayout } from '@/lib/preferences/layout';
import type { FontKey } from '@/lib/fonts/registry';
import { applyThemeMode, applyThemePreset } from '@/lib/preferences/theme-utils';
import {
  applyContentLayout,
  applyNavbarStyle,
  applySidebarCollapsible,
  applySidebarVariant,
  applyFont,
} from '@/lib/preferences/layout-utils';
import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';
import { useStatusQuery } from '@/integrations/hooks';
import { normalizeMeFromStatus } from '@/integrations/shared';
import type { AuthStatusResponse } from '@/integrations/shared';

export type AdminPageMeta = Record<string, { title: string; description?: string; metrics?: string[] }>;

export type AdminCompanyInfo = {
  companyName: string;
  legalName: string;
  slogan: string;
  email: string;
  phone: string;
  address: string;
  productionAddress: string;
  website: string;
  headerTitle: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
  footerTitle: string;
};

type AdminSettingsContextValue = {
  pageMeta: AdminPageMeta;
  branding: AdminBrandingConfig;
  companyInfo: AdminCompanyInfo;
  loading: boolean;
  /** Mevcut tercihleri DB'ye kaydeder (debounced 1s) */
  saveAdminConfig: () => void;
};

const AdminSettingsContext = createContext<AdminSettingsContextValue>({
  pageMeta: {},
  branding: DEFAULT_BRANDING,
  companyInfo: {
    companyName: DEFAULT_BRANDING.app_copyright,
    legalName: '',
    slogan: '',
    email: '',
    phone: '',
    address: '',
    productionAddress: '',
    website: '',
    headerTitle: DEFAULT_BRANDING.app_name,
    sidebarTitle: DEFAULT_BRANDING.app_copyright,
    sidebarSubtitle: 'Uretim Yonetim Sistemi',
    footerTitle: DEFAULT_BRANDING.app_copyright,
  },
  loading: false,
  saveAdminConfig: () => {},
});

export const useAdminSettings = () => useContext(AdminSettingsContext);

function asObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickText(...values: unknown[]): string {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const setAdminLocale = usePreferencesStore((s) => s.setAdminLocale);
  const adminLocale = usePreferencesStore((s) => s.adminLocale);

  // Admin-only endpoint'leri non-admin kullanıcılar için skip et
  const { data: statusData } = useStatusQuery();
  const me = normalizeMeFromStatus(statusData as AuthStatusResponse | undefined);
  const isAdmin = me?.isAdmin ?? false;

  /* --- Zustand setters --- */
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const setThemePreset = usePreferencesStore((s) => s.setThemePreset);
  const setFont = usePreferencesStore((s) => s.setFont);
  const setContentLayout = usePreferencesStore((s) => s.setContentLayout);
  const setNavbarStyle = usePreferencesStore((s) => s.setNavbarStyle);
  const setSidebarVariant = usePreferencesStore((s) => s.setSidebarVariant);
  const setSidebarCollapsible = usePreferencesStore((s) => s.setSidebarCollapsible);

  /* --- Zustand values (ref ile izle — save sırasında oku) --- */
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const themePreset = usePreferencesStore((s) => s.themePreset);
  const font = usePreferencesStore((s) => s.font);
  const contentLayout = usePreferencesStore((s) => s.contentLayout);
  const navbarStyle = usePreferencesStore((s) => s.navbarStyle);
  const sidebarVariant = usePreferencesStore((s) => s.sidebarVariant);
  const sidebarCollapsible = usePreferencesStore((s) => s.sidebarCollapsible);

  // Ref: save sırasında güncel değerleri oku (stale closure önleme)
  const prefsRef = useRef({ themeMode, themePreset, font, contentLayout, navbarStyle, sidebarVariant, sidebarCollapsible, adminLocale });
  prefsRef.current = { themeMode, themePreset, font, contentLayout, navbarStyle, sidebarVariant, sidebarCollapsible, adminLocale };

  // 1. Fetch Global Config (admin-only)
  const { data: configRow, isLoading: configLoading } = useGetSiteSettingAdminByKeyQuery('ui_admin_config', { skip: !isAdmin });

  const config = useMemo(() => {
    if (!configRow?.value) return null;
    try {
      return typeof configRow.value === 'string' ? JSON.parse(configRow.value) : configRow.value;
    } catch { return null; }
  }, [configRow]);

  const configRef = useRef(config);
  configRef.current = config;

  // 2. Fetch Page Meta
  const locale = adminLocale || config?.default_locale || 'tr';
  const { data: pagesRows, isLoading: pagesLoading } = useListSiteSettingsAdminQuery({
    keys: ['ui_admin_pages'],
    locale,
    limit: 1,
  }, { skip: !isAdmin });
  const pagesRow = pagesRows?.find((row) => row.key === 'ui_admin_pages') ?? null;

  const { data: companyRows, isLoading: companyLoading } = useListSiteSettingsAdminQuery({
    keys: ['company_profile', 'contact_info'],
    limit: 10,
  }, { skip: !isAdmin });

  const pageMeta = useMemo(() => {
    if (!pagesRow?.value) return {};
    try {
      return typeof pagesRow.value === 'string' ? JSON.parse(pagesRow.value) : pagesRow.value;
    } catch { return {}; }
  }, [pagesRow]);

  // 3. Extract branding from config
  const branding = useMemo<AdminBrandingConfig>(() => {
    if (!config?.branding) return DEFAULT_BRANDING;
    return {
      ...DEFAULT_BRANDING,
      ...config.branding,
      meta: { ...DEFAULT_BRANDING.meta, ...config.branding.meta },
    };
  }, [config]);

  const companyInfo = useMemo<AdminCompanyInfo>(() => {
    const rows = Array.isArray(companyRows) ? companyRows : [];
    const companyProfile = asObject(rows.find((row) => row.key === 'company_profile')?.value);
    const contactInfo = asObject(rows.find((row) => row.key === 'contact_info')?.value);

    const companyName = pickText(
      companyProfile.company_name,
      branding.app_copyright,
      branding.app_name.replace(/\badmin\s*panel\b/gi, '').trim(),
    );
    const legalName = pickText(companyProfile.legal_name);
    const slogan = pickText(companyProfile.slogan);
    const email = pickText(companyProfile.email, contactInfo.email);
    const phone = pickText(companyProfile.phone, contactInfo.phone, contactInfo.whatsapp);
    const address = pickText(companyProfile.address, contactInfo.address);
    const productionAddress = pickText(companyProfile.production_address);
    const website = pickText(companyProfile.website);
    const headerBase = pickText(branding.app_name, `${companyName} Uretim ERP`);
    const headerTitle = /admin\s*panel/i.test(headerBase)
      ? headerBase
      : `${headerBase} Admin Panel`;

    return {
      companyName,
      legalName,
      slogan,
      email,
      phone,
      address,
      productionAddress,
      website,
      headerTitle,
      sidebarTitle: pickText(companyName, branding.app_name),
      sidebarSubtitle: pickText(slogan, legalName, 'Uretim Yonetim Sistemi'),
      footerTitle: pickText(legalName, companyName, branding.app_name),
    };
  }, [companyRows, branding]);

  /* ================================================================ */
  /*  4. DB → Redux + Zustand sync + DOM apply (ilk yükleme)           */
  /* ================================================================ */
  useEffect(() => {
    if (!config) return;

    // Redux sync
    if (config.theme) {
      if (config.theme.mode) dispatch(preferencesActions.setThemeMode(config.theme.mode as ThemeMode));
      if (config.theme.preset) dispatch(preferencesActions.setThemePreset(config.theme.preset as ThemePreset));
      if (config.theme.font) dispatch(preferencesActions.setFont(config.theme.font as FontKey));
    }
    if (config.layout) {
      if (config.layout.sidebar_variant) dispatch(preferencesActions.setSidebarVariant(config.layout.sidebar_variant as SidebarVariant));
      if (config.layout.sidebar_collapsible) dispatch(preferencesActions.setSidebarCollapsible(config.layout.sidebar_collapsible as SidebarCollapsible));
      if (config.layout.navbar_style) dispatch(preferencesActions.setNavbarStyle(config.layout.navbar_style as NavbarStyle));
      if (config.layout.content_layout) dispatch(preferencesActions.setContentLayout(config.layout.content_layout as ContentLayout));
    }
    // Mark redux as synced so PreferencesEffects knows DB data is loaded
    dispatch(preferencesActions.syncFromDom({}));

    // Zustand sync (UI kontrolleri Zustand okur)
    if (config.default_locale) {
      setAdminLocale(config.default_locale);
    }
    if (config.theme) {
      if (config.theme.mode) setThemeMode(config.theme.mode as ThemeMode);
      if (config.theme.preset) setThemePreset(config.theme.preset as ThemePreset);
      if (config.theme.font) setFont(config.theme.font as FontKey);
    }
    if (config.layout) {
      if (config.layout.sidebar_variant) setSidebarVariant(config.layout.sidebar_variant as SidebarVariant);
      if (config.layout.sidebar_collapsible) setSidebarCollapsible(config.layout.sidebar_collapsible as SidebarCollapsible);
      if (config.layout.navbar_style) setNavbarStyle(config.layout.navbar_style as NavbarStyle);
      if (config.layout.content_layout) setContentLayout(config.layout.content_layout as ContentLayout);
    }

    // ✅ DOM Apply — DB'den gelen değerleri DOM'a uygula
    if (config.theme) {
      if (config.theme.mode) applyThemeMode(config.theme.mode as 'light' | 'dark');
      if (config.theme.preset) applyThemePreset(config.theme.preset);
      if (config.theme.font) applyFont(config.theme.font);
    }
    if (config.layout) {
      if (config.layout.content_layout) applyContentLayout(config.layout.content_layout as 'centered' | 'full-width');
      if (config.layout.navbar_style) applyNavbarStyle(config.layout.navbar_style as 'sticky' | 'scroll');
      if (config.layout.sidebar_variant) applySidebarVariant(config.layout.sidebar_variant);
      if (config.layout.sidebar_collapsible) applySidebarCollapsible(config.layout.sidebar_collapsible);
    }
  }, [
    config, dispatch,
    setThemeMode, setThemePreset, setFont,
    setContentLayout, setNavbarStyle, setSidebarVariant, setSidebarCollapsible,
    setAdminLocale,
  ]);

  /* ================================================================ */
  /*  5. saveAdminConfig — child component'ler her değişiklikte çağırır */
  /*     Debounced 1s: art arda değişiklikleri birleştirir              */
  /* ================================================================ */
  const [updateSetting] = useUpdateSiteSettingAdminMutation();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveAdminConfig = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      const c = configRef.current;
      const p = prefsRef.current;
      if (!c) return;

      const newValue = {
        ...c,
        default_locale: p.adminLocale || c.default_locale,
        theme: {
          mode: p.themeMode,
          preset: p.themePreset,
          font: p.font,
        },
        layout: {
          sidebar_variant: p.sidebarVariant,
          sidebar_collapsible: p.sidebarCollapsible,
          navbar_style: p.navbarStyle,
          content_layout: p.contentLayout,
        },
      };

      updateSetting({ key: 'ui_admin_config', value: newValue, locale: '*' });
    }, 1000);
  }, [updateSetting]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const ctxValue = useMemo<AdminSettingsContextValue>(() => ({
    pageMeta: pageMeta as AdminPageMeta,
    branding,
    companyInfo,
    loading: configLoading || pagesLoading || companyLoading,
    saveAdminConfig,
  }), [pageMeta, branding, companyInfo, configLoading, pagesLoading, companyLoading, saveAdminConfig]);

  return (
    <AdminSettingsContext.Provider value={ctxValue}>
      {children}
    </AdminSettingsContext.Provider>
  );
}
