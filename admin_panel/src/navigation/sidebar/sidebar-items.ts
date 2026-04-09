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
  CalendarRange,
  CircleOff,
  Clock,
  ClipboardCheck,
  Cpu,
  Database,
  Factory,
  Fence,
  FileSearch,
  FolderTree,
  HardDrive,
  KeyRound,
  LayoutDashboard,
  Package,
  Play,
  Ruler,
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
  subItems?: AdminNavConfigItem[];
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

      // V2: görevler (tasks/notifications) buraya eklenecek
      // { key: 'gorevler', url: '/admin/gorevler', icon: ClipboardList, roles: ['admin', 'operator', 'satin_almaci', 'nakliyeci'] },
      {
        key: 'is_ortaklari',
        url: '/admin/musteriler',  
        icon: Users, 
        roles: ['admin', 'satin_almaci'],
        subItems: [
          { key: 'musteriler',  url: '/admin/musteriler',   icon: Users,     roles: ['admin'] },
          { key: 'tedarikci',   url: '/admin/tedarikci',    icon: Building2, roles: ['admin', 'satin_almaci'] },
        ],
      },
      { key: 'urunler',           url: '/admin/urunler',           icon: Package,         roles: ['admin'] },

      {
        key: 'uretim_tanimlari',
        url: '/admin/makineler',
        icon: Timer,
        roles: ['admin'],
        subItems: [
          { key: 'makineler',       url: '/admin/makineler',                     icon: Timer,      roles: ['admin'] },
          { key: 'kaliplar',        url: '/admin/tanimlar?tab=kaliplar',         icon: Fence,      roles: ['admin'] },
          { key: 'durus_nedenleri', url: '/admin/tanimlar?tab=durus-nedenleri',  icon: CircleOff,  roles: ['admin'] },
          { key: 'birimler',        url: '/admin/tanimlar?tab=birimler',         icon: Ruler,      roles: ['admin'] },
        ],
      },
      {
        key: 'calisma_planlari',
        url: '/admin/tanimlar?tab=tatiller',
        icon: CalendarDays,
        roles: ['admin'],
        subItems: [
          { key: 'tatil_gunleri',       url: '/admin/tanimlar?tab=tatiller',             icon: CalendarDays,   roles: ['admin'] },
          { key: 'vardiyalar',          url: '/admin/tanimlar?tab=vardiyalar',           icon: Clock,          roles: ['admin'] },
          { key: 'hafta_sonu_planlari', url: '/admin/tanimlar?tab=hafta-sonu-planlari',  icon: CalendarRange,  roles: ['admin'] },
        ],
      },
    ],
  },
  // ─── Üretim Süreçleri ───
  {
    id: 2,
    key: 'production',
    items: [
      { key: 'satis_siparisleri', url: '/admin/satis-siparisleri', icon: ShoppingCart, roles: ['admin', 'nakliyeci'] },
      { key: 'uretim_emirleri',   url: '/admin/uretim-emirleri',   icon: Factory,     roles: ['admin'] },
      { key: 'is_yukler',         url: '/admin/is-yukler',         icon: Cpu,         roles: ['admin'] },
      { key: 'gantt',             url: '/admin/gantt',             icon: Calendar,    roles: ['admin', 'operator', 'nakliyeci'] },
    ],
  },
  // ─── Lojistik & Stok ───
  {
    id: 3,
    key: 'logistics',
    items: [
      { key: 'sevkiyat',          url: '/admin/sevkiyat',          icon: Truck,      roles: ['admin', 'nakliyeci'] },
      { key: 'stoklar',           url: '/admin/stoklar',           icon: BarChart2,  roles: ['admin', 'satin_almaci'] },
      { key: 'satin_alma',        url: '/admin/satin-alma',        icon: Truck,      roles: ['admin', 'satin_almaci'] },
      { key: 'mal_kabul',         url: '/admin/mal-kabul',         icon: ClipboardCheck, roles: ['admin', 'satin_almaci'] },
      { key: 'hareketler',        url: '/admin/hareketler',        icon: Activity,   roles: ['admin', 'satin_almaci', 'nakliyeci'] },
    ],
  },
  {
    id: 4,
    key: 'system',
    items: [
      { key: 'site_settings',     url: '/admin/sistem',           icon: Settings,   roles: ['admin'] },
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
  is_ortaklari:      'İş Ortakları',
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
  vardiyalar:        'Vardiyalar',
  durus_nedenleri:   'Duruş Nedenleri',
  birimler:          'Birimler',
  hafta_sonu_planlari: 'Hafta Sonu Planları',
  calisma_planlari:  'Çalışma Planları',
  uretim_tanimlari:  'Üretim Tanımları',
  tedarikci:         'Tedarikçiler',
  kategoriler:       'Kategoriler',
  sevkiyat:          'Sevkiyat',
  mal_kabul:         'Mal Kabul',
  audit_logs:        'Audit Logları',
  kullanicilar:      'Kullanıcılar',
  giris_ayarlari:    'Giriş Ayarları',
  storage:           'Medyalar',
  site_settings:     'Sistem & Ayarlar',
  db_admin:          'Veritabanı',
};

export function buildAdminSidebarItems(
  copy?: Partial<AdminNavCopy> | null,
  t?: TranslateFn,
  role: AdminSidebarRole = 'admin',
): NavGroup[] {
  const labels = copy?.labels ?? ({} as AdminNavCopy['labels']);
  const items = copy?.items ?? ({} as AdminNavCopy['items']);

  const getTitle = (item: AdminNavConfigItem): string => {
    const tKey = `admin.dashboard.items.${item.key}` as any;
    const translated = t ? t(tKey) : '';
    return (
      items[item.key] ||
      (translated && translated !== tKey ? translated : '') ||
      FALLBACK_TITLES[item.key] ||
      item.key
    );
  };

  const mapSubItems = (subItems: AdminNavConfigItem[] | undefined): NavSubItem[] | undefined => {
    if (!subItems?.length) return undefined;
    return subItems
      .filter((sub) => {
        const allowed = sub.roles ?? getAdminNavRoles(sub.key);
        if (!allowed?.length) return role === 'admin';
        return allowed.includes(role);
      })
      .map((sub) => ({
        title: getTitle(sub),
        url: sub.url,
        icon: sub.icon,
        comingSoon: sub.comingSoon,
      }));
  };

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
          .map((item) => ({
            title: getTitle(item),
            url: item.url,
            icon: item.icon,
            comingSoon: item.comingSoon,
            subItems: mapSubItems(item.subItems),
          })),
      };
    })
    .filter((group) => group.items.length > 0);
}
