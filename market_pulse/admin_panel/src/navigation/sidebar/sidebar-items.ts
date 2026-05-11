// =============================================================
// FILE: src/navigation/sidebar/sidebar-items.ts
// FINAL — GuezelWebDesign — Sidebar items (labels are dynamic via site_settings.ui_admin)
// - Dashboard base: /admin/dashboard
// - Admin pages: /admin/...  (route group "(admin)" URL'e dahil olmaz)
// =============================================================

import {
  Activity,
  Bell,
  Building2,
  ClipboardCheck,
  Code2,
  Clock,
  Database,
  FileSearch,
  Flame,
  HardDrive,
  BookOpenText,
  LayoutDashboard,
  Mail,
  MapPin,
  Radar,
  Search,
  Settings,
  SlidersHorizontal,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { TranslateFn } from '@/i18n';

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  /** Optional dynamic badge (e.g. unread count) */
  badgeKey?: string;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export type AdminNavItemKey =
  | 'dashboard'
  | 'site_settings'
  | 'users'
  | 'user_roles'
  | 'notifications'
  | 'storage'
  | 'db'
  | 'external_db'
  | 'audit'
  | 'profile'
  | 'market_pulse'
  | 'market_targets'
  | 'market_leads'
  | 'market_lead_candidates'
  | 'market_lead_amazon'
  | 'market_lead_b2b'
  | 'market_lead_fair'
  | 'market_lead_icp'
  | 'market_lead_outreach'
  | 'market_signals'
  | 'market_reports'
  | 'market_test_center'
  | 'market_developer_notes'
  | 'market_docs';

export type AdminNavGroupKey = 'general' | 'system' | 'market';

export type AdminNavConfigItem = {
  key: AdminNavItemKey;
  url: string;
  icon?: LucideIcon;
  badgeKey?: string;
};

export type AdminNavConfigGroup = {
  id: number;
  key: AdminNavGroupKey;
  items: AdminNavConfigItem[];
};

export const adminNavConfig: AdminNavConfigGroup[] = [
  {
    id: 1,
    key: 'general',
    items: [
      { key: 'dashboard', url: '/admin/market', icon: LayoutDashboard },
      { key: 'users', url: '/admin/users', icon: Users },
      { key: 'user_roles', url: '/admin/user-roles', icon: UserCheck },
      { key: 'profile', url: '/admin/profile', icon: Clock },
    ],
  },
  {
    id: 2,
    key: 'system',
    items: [
      { key: 'notifications', url: '/admin/notifications', icon: Bell, badgeKey: 'notifications_unread' },
      { key: 'site_settings', url: '/admin/site-settings', icon: Settings },
      { key: 'storage', url: '/admin/storage', icon: HardDrive },
      { key: 'db', url: '/admin/db', icon: Database },
      { key: 'external_db', url: '/admin/external-db', icon: Database },
      { key: 'audit', url: '/admin/audit', icon: FileSearch },
    ],
  },
  {
    id: 3,
    key: 'market',
    items: [
      { key: 'market_pulse',   url: '/admin/market',         icon: Radar },
      { key: 'market_targets', url: '/admin/market/targets', icon: Building2 },
      { key: 'market_leads',   url: '/admin/market/leads',   icon: Users },
      { key: 'market_lead_candidates', url: '/admin/market/lead-machine/candidates', icon: Flame, badgeKey: 'lead_candidates_pending' },
      { key: 'market_lead_amazon', url: '/admin/market/lead-machine/amazon', icon: Search },
      { key: 'market_lead_b2b', url: '/admin/market/lead-machine/b2b', icon: Building2 },
      { key: 'market_lead_fair', url: '/admin/market/lead-machine/fair', icon: MapPin },
      { key: 'market_lead_icp', url: '/admin/market/lead-machine/icp', icon: SlidersHorizontal },
      { key: 'market_lead_outreach', url: '/admin/market/lead-machine/outreach', icon: Mail },
      { key: 'market_signals', url: '/admin/market/signals', icon: Activity },
      { key: 'market_reports', url: '/admin/market/reports', icon: FileSearch },
      { key: 'market_test_center', url: '/admin/market/test-center', icon: ClipboardCheck },
      { key: 'market_developer_notes', url: '/admin/market/developer-notes', icon: Code2 },
      { key: 'market_docs', url: '/admin/market/docs', icon: BookOpenText },
    ],
  },
];

export type AdminNavCopy = {
  labels: Record<AdminNavGroupKey, string>;
  items: Record<AdminNavItemKey, string>;
};

// Fallback titles for when translations are missing
const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  dashboard: 'Panel',
  site_settings: 'Ayarlar',
  users: 'Kullanıcılar',
  user_roles: 'Rol Yönetimi',
  notifications: 'Bildirimler',
  storage: 'Dosya Yöneticisi',
  db: 'Veritabanı',
  external_db: 'Harici Veritabanları',
  audit: 'Denetim Kayıtları',
  profile: 'Profil',
  market_pulse:    'MarketPulse',
  market_targets:  'Hedef Firmalar',
  market_leads:    'Lead Pipeline',
  market_lead_candidates: 'Lead Adayları',
  market_lead_amazon: 'Amazon Arama',
  market_lead_b2b: 'B2B Arama',
  market_lead_fair: 'Fuar Tarama',
  market_lead_icp: 'ICP Profilleri',
  market_lead_outreach: 'Outreach Taslakları',
  market_signals:  'Sinyaller',
  market_reports:  'Raporlar',
  market_test_center: 'Test Merkezi',
  market_developer_notes: 'Yazılımcı Notları',
  market_docs:     'Dokümantasyon',
};

export function buildAdminSidebarItems(
  copy?: Partial<AdminNavCopy> | null,
  t?: TranslateFn,
): NavGroup[] {
  const labels = copy?.labels ?? ({} as AdminNavCopy['labels']);
  const items = copy?.items ?? ({} as AdminNavCopy['items']);

  return adminNavConfig.map((group) => {
    // 1. Try copy.labels[group.key]
    // 2. Try t(`admin.sidebar.groups.${group.key}`)
    // 3. Fallback to empty (or key)
    const tGroup = t ? t(`admin.sidebar.groups.${group.key}` as any) : '';
    const label =
      labels[group.key] || (tGroup && !tGroup.includes('admin.sidebar') ? tGroup : '') || '';

    return {
      id: group.id,
      label,
      items: group.items.map((item) => {
        // 1. Try copy.items[item.key]
        // 2. Try t(`admin.dashboard.items.${item.key}`)
        // 3. Fallback to FALLBACK_TITLES
        // 4. Fallback to key
        const tItem = t ? t(`admin.dashboard.items.${item.key}` as any) : '';
        const title =
          items[item.key] ||
          (tItem && !tItem.includes('admin.dashboard') ? tItem : '') ||
          FALLBACK_TITLES[item.key] ||
          item.key;

        return {
          title,
          url: item.url,
          icon: item.icon,
          badgeKey: item.badgeKey,
        };
      }),
    };
  });
}
