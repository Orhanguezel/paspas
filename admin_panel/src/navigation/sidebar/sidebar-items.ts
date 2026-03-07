// =============================================================
// FILE: src/navigation/sidebar/sidebar-items.ts
// Paspas Üretim ERP — Sidebar navigasyonu (gruplu)
// =============================================================

import {
  Activity,
  BarChart2,
  Building2,
  Calendar,
  CalendarDays,
  CircleOff,
  Clock,
  ClipboardList,
  Cpu,
  Database,
  Factory,
  Fence,
  FileSearch,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Package,
  Play,
  Settings,
  ShoppingCart,
  Timer,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { TranslateFn } from '@/i18n';
import { getAdminNavRoles } from '@/navigation/permissions';
import type { AdminNavKey } from '@/navigation/permissions';
import type { PanelRole } from '@/navigation/permissions';

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export type AdminSidebarRole = PanelRole;

export type AdminNavItemKey = AdminNavKey;

export type AdminNavGroupKey = 'overview' | 'production' | 'logistics' | 'system';

export type AdminNavConfigItem = {
  key: AdminNavItemKey;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  roles?: AdminSidebarRole[];
};

export type AdminNavConfigGroup = {
  id: number;
  key: AdminNavGroupKey;
  items: AdminNavConfigItem[];
};

export const adminNavConfig: AdminNavConfigGroup[] = [
  // ─── Genel ───
  {
    id: 1,
    key: 'overview',
    items: [
      { key: 'dashboard',         url: '/admin/dashboard',         icon: LayoutDashboard, roles: ['admin'] },
      { key: 'gorevler',          url: '/admin/gorevler',          icon: ClipboardList,   roles: ['admin', 'operator', 'satin_almaci', 'nakliyeci'] },
      { key: 'musteriler',        url: '/admin/musteriler',        icon: Users,           roles: ['admin'] },
      { key: 'tedarikci',         url: '/admin/tedarikci',         icon: Building2,       roles: ['admin', 'satin_almaci'] },
      { key: 'urunler',           url: '/admin/urunler',           icon: Package,         roles: ['admin'] },
      { key: 'makineler',         url: '/admin/makineler',         icon: Timer,           roles: ['admin'] },
      { key: 'kaliplar',          url: '/admin/tanimlar?tab=kaliplar',        icon: Fence,       roles: ['admin'] },
      { key: 'tatil_gunleri',     url: '/admin/tanimlar?tab=tatiller',        icon: CalendarDays, roles: ['admin'] },
      { key: 'vardiyalar',        url: '/admin/tanimlar?tab=vardiyalar',      icon: Clock,       roles: ['admin'] },
      { key: 'durus_nedenleri',   url: '/admin/tanimlar?tab=durus-nedenleri', icon: CircleOff,   roles: ['admin'] },
    ],
  },
  // ─── Üretim Süreçleri ───
  {
    id: 2,
    key: 'production',
    items: [
      { key: 'satis_siparisleri', url: '/admin/satis-siparisleri', icon: ShoppingCart, roles: ['admin', 'nakliyeci'] },
      { key: 'uretim_emirleri',   url: '/admin/uretim-emirleri',   icon: Factory,     roles: ['admin'] },
      { key: 'makine_havuzu',     url: '/admin/makine-havuzu',     icon: Timer,       roles: ['admin'] },
      { key: 'is_yukler',         url: '/admin/is-yukler',         icon: Cpu,         roles: ['admin'] },
      { key: 'gantt',             url: '/admin/gantt',             icon: Calendar,    roles: ['admin'] },
      { key: 'operator',          url: '/admin/operator',          icon: Play,        roles: ['admin', 'operator'] },
    ],
  },
  // ─── Lojistik & Stok ───
  {
    id: 3,
    key: 'logistics',
    items: [
      { key: 'stoklar',           url: '/admin/stoklar',           icon: BarChart2,  roles: ['admin', 'satin_almaci'] },
      { key: 'satin_alma',        url: '/admin/satin-alma',        icon: Truck,      roles: ['admin', 'satin_almaci'] },
      { key: 'hareketler',        url: '/admin/hareketler',        icon: Activity,   roles: ['admin', 'satin_almaci', 'nakliyeci'] },
    ],
  },
  // ─── Sistem Yönetimi ───
  {
    id: 4,
    key: 'system',
    items: [
      { key: 'kullanicilar',       url: '/admin/users',             icon: Users,      roles: ['admin'] },
      { key: 'storage',           url: '/admin/storage',           icon: HardDrive,  roles: ['admin'] },
      { key: 'giris_ayarlari',    url: '/admin/giris-ayarlari',    icon: KeyRound,   roles: ['admin'] },
      { key: 'site_settings',     url: '/admin/site-settings',     icon: Settings,   roles: ['admin'] },
      { key: 'db_admin',          url: '/admin/db',                icon: Database,   roles: ['admin'] },
      { key: 'audit_logs',        url: '/admin/audit-logs',        icon: FileSearch, roles: ['admin'] },
    ],
  },
];

export type AdminNavCopy = {
  labels: Record<AdminNavGroupKey, string>;
  items: Record<AdminNavItemKey, string>;
};

const FALLBACK_GROUP_LABELS: Record<AdminNavGroupKey, string> = {
  overview:   'Genel',
  production: 'Üretim Süreçleri',
  logistics:  'Lojistik & Stok',
  system:     'Sistem Yönetimi',
};

const FALLBACK_TITLES: Record<AdminNavItemKey, string> = {
  dashboard:         'Dashboard',
  gorevler:          'Görevler',
  urunler:           'Ürünler',
  musteriler:        'Müşteriler',
  makineler:         'Makineler',
  kaliplar:          'Kalıplar',
  tatil_gunleri:     'Tatil Günleri',
  satis_siparisleri: 'Satış Siparişleri',
  uretim_emirleri:   'Üretim Emirleri',
  makine_havuzu:     'Makine Havuzu',
  is_yukler:         'Makine İş Yükleri',
  gantt:             'Gantt Planı',
  stoklar:           'Malzeme Stokları',
  satin_alma:        'Satın Alma',
  hareketler:        'Hareketler',
  operator:          'Operatör',
  tanimlar:          'Tanımlar',
  tedarikci:         'Tedarikçiler',
  audit_logs:        'Audit Logları',
  kullanicilar:      'Kullanıcılar',
  giris_ayarlari:    'Giriş Ayarları',
  storage:           'Medyalar',
  site_settings:     'Site Ayarları',
  db_admin:          'Veritabanı',
};

export function buildAdminSidebarItems(
  copy?: Partial<AdminNavCopy> | null,
  t?: TranslateFn,
  role: AdminSidebarRole = 'admin',
): NavGroup[] {
  const labels = copy?.labels ?? ({} as AdminNavCopy['labels']);
  const items = copy?.items ?? ({} as AdminNavCopy['items']);

  return adminNavConfig
    .map((group) => {
      const label =
        labels[group.key] ||
        (t ? t(`admin.sidebar.groups.${group.key}` as any) : '') ||
        FALLBACK_GROUP_LABELS[group.key] ||
        '';

      return {
        id: group.id,
        label,
        items: group.items
          .filter((item) => {
            const allowed = item.roles ?? getAdminNavRoles(item.key);
            if (!allowed?.length) return role === 'admin';
            return allowed.includes(role);
          })
          .map((item) => {
            const tKey = `admin.dashboard.items.${item.key}` as any;
            const translated = t ? t(tKey) : '';
            const title =
              items[item.key] ||
              (translated && translated !== tKey ? translated : '') ||
              FALLBACK_TITLES[item.key] ||
              item.key;

            return {
              title,
              url: item.url,
              icon: item.icon,
              comingSoon: item.comingSoon,
            };
          }),
      };
    })
    .filter((group) => group.items.length > 0);
}
