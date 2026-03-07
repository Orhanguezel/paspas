// =============================================================
// FILE: src/navigation/permissions.ts
// Promat ERP — 4 rol tanımı + sayfa erişim kontrolü
// =============================================================

export type PanelRole = 'admin' | 'operator' | 'satin_almaci' | 'nakliyeci';

export type AdminNavKey =
  | 'dashboard'
  | 'urunler'
  | 'musteriler'
  | 'makineler'
  | 'kaliplar'
  | 'tatil_gunleri'
  | 'vardiyalar'
  | 'durus_nedenleri'
  | 'satis_siparisleri'
  | 'uretim_emirleri'
  | 'makine_havuzu'
  | 'is_yukler'
  | 'gantt'
  | 'stoklar'
  | 'satin_alma'
  | 'hareketler'
  | 'gorevler'
  | 'giris_ayarlari'
  | 'kullanicilar'
  | 'operator'
  | 'tanimlar'
  | 'audit_logs'
  | 'site_settings'
  | 'tedarikci'
  | 'storage'
  | 'db_admin';

// Her rolün varsayılan giriş sayfası (login sonrası yönlendirme)
export const ROLE_HOME: Record<PanelRole, string> = {
  admin:        '/admin/dashboard',
  operator:     '/admin/operator',
  satin_almaci: '/admin/satin-alma',
  nakliyeci:    '/admin/satis-siparisleri',
};

// Modül → izin verilen roller
const NAV_ROLES: Record<AdminNavKey, PanelRole[]> = {
  dashboard:         ['admin'],
  urunler:           ['admin'],
  musteriler:        ['admin'],
  makineler:         ['admin'],
  kaliplar:          ['admin'],
  tatil_gunleri:     ['admin'],
  vardiyalar:        ['admin'],
  durus_nedenleri:   ['admin'],
  satis_siparisleri: ['admin', 'nakliyeci'],
  uretim_emirleri:   ['admin'],
  makine_havuzu:     ['admin'],
  is_yukler:         ['admin'],
  gantt:             ['admin'],
  stoklar:           ['admin', 'satin_almaci'],
  satin_alma:        ['admin', 'satin_almaci'],
  hareketler:        ['admin', 'satin_almaci', 'nakliyeci'],
  gorevler:          ['admin', 'operator', 'satin_almaci', 'nakliyeci'],
  giris_ayarlari:    ['admin'],
  kullanicilar:      ['admin'],
  operator:          ['admin', 'operator'],
  tanimlar:          ['admin'],
  tedarikci:         ['admin', 'satin_almaci'],
  audit_logs:        ['admin'],
  site_settings:     ['admin'],
  storage:           ['admin'],
  db_admin:          ['admin'],
};

export function getAdminNavRoles(key: AdminNavKey): PanelRole[] {
  return NAV_ROLES[key] ?? ['admin'];
}

// Bir rolün belirli bir URL'e erişip erişemeyeceğini kontrol eder
export function canAccessAdminPath(role: PanelRole, pathname: string): boolean {
  if (role === 'admin') return true;

  // Her modülün URL prefix'ini izinli rollerle eşleştir
  const PATH_ROLE_MAP: Array<{ prefix: string; key: AdminNavKey }> = [
    { prefix: '/admin/operator',           key: 'operator' },
    { prefix: '/admin/satin-alma',         key: 'satin_alma' },
    { prefix: '/admin/stoklar',            key: 'stoklar' },
    { prefix: '/admin/satis-siparisleri',  key: 'satis_siparisleri' },
    { prefix: '/admin/hareketler',         key: 'hareketler' },
    { prefix: '/admin/gorevler',           key: 'gorevler' },
    { prefix: '/admin/giris-ayarlari',     key: 'giris_ayarlari' },
    { prefix: '/admin/users',              key: 'kullanicilar' },
    { prefix: '/admin/tedarikci',          key: 'tedarikci' },
    { prefix: '/admin/dashboard',          key: 'dashboard' },
  ];

  const clean = pathname.split('?')[0] ?? pathname;

  for (const { prefix, key } of PATH_ROLE_MAP) {
    if (clean === prefix || clean.startsWith(`${prefix}/`)) {
      return NAV_ROLES[key].includes(role);
    }
  }

  return false;
}
