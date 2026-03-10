// =============================================================
// FILE: src/integrations/shared/adminUi.ts
// FINAL — Admin UI copy (site_settings.ui_admin) normalizer
// =============================================================

import { parseJsonObject, uiText } from '@/integrations/shared';
import type { AdminNavCopy } from '@/navigation/sidebar/sidebar-items';

export type AdminUiCommonCopy = {
  actions: {
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    refresh: string;
    search: string;
    filter: string;
    close: string;
    back: string;
    confirm: string;
  };
  states: {
    loading: string;
    error: string;
    empty: string;
    updating: string;
    saving: string;
  };
};

export type AdminUiPageCopy = Record<string, string>;

export type AdminUiCopy = {
  app_name: string;
  app_version?: string;
  developer_branding?: {
    name: string;
    url: string;
    full_name: string;
  };
  nav: AdminNavCopy;
  common: AdminUiCommonCopy;
  pages: Record<string, AdminUiPageCopy>;
};

const emptyCommon: AdminUiCommonCopy = {
  actions: {
    create: '',
    edit: '',
    delete: '',
    save: '',
    cancel: '',
    refresh: '',
    search: '',
    filter: '',
    close: '',
    back: '',
    confirm: '',
  },
  states: {
    loading: '',
    error: '',
    empty: '',
    updating: '',
    saving: '',
  },
};

const emptyNav: AdminNavCopy = {
  labels: {
    overview:   '',
    production: '',
    logistics:  '',
    system:     '',
  },
  items: {
    dashboard:         '',
    gorevler:          '',
    urunler:           '',
    musteriler:        '',
    makineler:         '',
    kaliplar:          '',
    tatil_gunleri:     '',
    satis_siparisleri: '',
    uretim_emirleri:   '',
    makine_havuzu:     '',
    is_yukler:         '',
    gantt:             '',
    stoklar:           '',
    satin_alma:        '',
    hareketler:        '',
    operator:          '',
    tanimlar:          '',
    vardiyalar:        '',
    durus_nedenleri:   '',
    tedarikci:         '',
    kullanicilar:      '',
    audit_logs:        '',
    giris_ayarlari:    '',
    site_settings:     '',
    storage:           '',
    db_admin:          '',
    hafta_sonu_planlari: '',
    calisma_planlari:  '',
    uretim_tanimlari:  '',
    sevkiyat:          '',
    mal_kabul:         '',
    kategoriler:       '',
    is_ortaklari:      '',
  },
};

export function normalizeAdminUiCopy(raw: unknown): AdminUiCopy {
  const o = parseJsonObject(raw);
  const navRaw = parseJsonObject(o.nav);
  const labelsRaw = parseJsonObject(navRaw.labels);
  const itemsRaw = parseJsonObject(navRaw.items);

  const labels: AdminNavCopy['labels'] = {
    overview:   uiText(labelsRaw.overview),
    production: uiText(labelsRaw.production),
    logistics:  uiText(labelsRaw.logistics),
    system:     uiText(labelsRaw.system),
  };

  const items: AdminNavCopy['items'] = {
    dashboard:         uiText(itemsRaw.dashboard),
    gorevler:          uiText(itemsRaw.gorevler),
    urunler:           uiText(itemsRaw.urunler),
    musteriler:        uiText(itemsRaw.musteriler),
    makineler:         uiText(itemsRaw.makineler),
    kaliplar:          uiText(itemsRaw.kaliplar),
    tatil_gunleri:     uiText(itemsRaw.tatil_gunleri),
    satis_siparisleri: uiText(itemsRaw.satis_siparisleri),
    uretim_emirleri:   uiText(itemsRaw.uretim_emirleri),
    makine_havuzu:     uiText(itemsRaw.makine_havuzu),
    is_yukler:         uiText(itemsRaw.is_yukler),
    gantt:             uiText(itemsRaw.gantt),
    stoklar:           uiText(itemsRaw.stoklar),
    satin_alma:        uiText(itemsRaw.satin_alma),
    hareketler:        uiText(itemsRaw.hareketler),
    operator:          uiText(itemsRaw.operator),
    tanimlar:          uiText(itemsRaw.tanimlar),
    vardiyalar:        uiText(itemsRaw.vardiyalar),
    durus_nedenleri:   uiText(itemsRaw.durus_nedenleri),
    tedarikci:         uiText(itemsRaw.tedarikci),
    kullanicilar:      uiText(itemsRaw.kullanicilar),
    audit_logs:        uiText(itemsRaw.audit_logs),
    giris_ayarlari:    uiText(itemsRaw.giris_ayarlari),
    site_settings:     uiText(itemsRaw.site_settings),
    storage:           uiText(itemsRaw.storage),
    db_admin:          uiText(itemsRaw.db_admin),
    hafta_sonu_planlari: uiText(itemsRaw.hafta_sonu_planlari),
    calisma_planlari:  uiText(itemsRaw.calisma_planlari),
    uretim_tanimlari:  uiText(itemsRaw.uretim_tanimlari),
    sevkiyat:          uiText(itemsRaw.sevkiyat),
    mal_kabul:         uiText(itemsRaw.mal_kabul),
    kategoriler:       uiText(itemsRaw.kategoriler),
    is_ortaklari:      uiText(itemsRaw.is_ortaklari),
  };

  const commonRaw = parseJsonObject(o.common);
  const actionsRaw = parseJsonObject(commonRaw.actions);
  const statesRaw = parseJsonObject(commonRaw.states);

  const common: AdminUiCommonCopy = {
    actions: {
      create: uiText(actionsRaw.create),
      edit: uiText(actionsRaw.edit),
      delete: uiText(actionsRaw.delete),
      save: uiText(actionsRaw.save),
      cancel: uiText(actionsRaw.cancel),
      refresh: uiText(actionsRaw.refresh),
      search: uiText(actionsRaw.search),
      filter: uiText(actionsRaw.filter),
      close: uiText(actionsRaw.close),
      back: uiText(actionsRaw.back),
      confirm: uiText(actionsRaw.confirm),
    },
    states: {
      loading: uiText(statesRaw.loading),
      error: uiText(statesRaw.error),
      empty: uiText(statesRaw.empty),
      updating: uiText(statesRaw.updating),
      saving: uiText(statesRaw.saving),
    },
  };

  const pagesRaw = parseJsonObject(o.pages);
  const pages: Record<string, AdminUiPageCopy> = {};
  for (const [k, v] of Object.entries(pagesRaw)) {
    const row = parseJsonObject(v);
    const out: AdminUiPageCopy = {};
    for (const [rk, rv] of Object.entries(row)) {
      out[rk] = uiText(rv);
    }
    pages[k] = out;
  }

  const devRaw = parseJsonObject(o.developer_branding);

  return {
    app_name: uiText(o.app_name),
    app_version: uiText(o.app_version),
    developer_branding: devRaw ? {
      name: uiText(devRaw.name),
      url: uiText(devRaw.url),
      full_name: uiText(devRaw.full_name),
    } : undefined,
    nav: {
      labels: { ...emptyNav.labels, ...labels },
      items: { ...emptyNav.items, ...items },
    },
    common: {
      actions: { ...emptyCommon.actions, ...common.actions },
      states: { ...emptyCommon.states, ...common.states },
    },
    pages,
  };
}
