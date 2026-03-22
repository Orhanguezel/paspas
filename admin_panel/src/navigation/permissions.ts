// =============================================================
// FILE: src/navigation/permissions.ts
// Promat ERP — 4 rol tanımı + sayfa erişim kontrolü
// =============================================================

export type PanelRole = 'admin' | 'operator' | 'satin_almaci' | 'nakliyeci';

export type AdminNavKey =
  | 'dashboard'
  | 'urunler'
  | 'musteriler'
  | 'is_ortaklari'
  | 'makineler'
  | 'kaliplar'
  | 'tatil_gunleri'
  | 'vardiyalar'
  | 'durus_nedenleri'
  | 'hafta_sonu_planlari'
  | 'calisma_planlari'
  | 'uretim_tanimlari'
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
  | 'kategoriler'
  | 'sevkiyat'
  | 'mal_kabul'
  | 'storage'
  | 'db_admin';

// Her rolün varsayılan giriş sayfası (login sonrası yönlendirme)
export const ROLE_HOME: Record<PanelRole, string> = {
  admin:        '/admin/dashboard',
  operator:     '/admin/operator',
  satin_almaci: '/admin/satin-alma',
  nakliyeci:    '/admin/sevkiyat',
};

// Modül → izin verilen roller
const NAV_ROLES: Record<AdminNavKey, PanelRole[]> = {
  dashboard:         ['admin'],
  urunler:           ['admin', 'operator', 'satin_almaci', 'nakliyeci'],
  musteriler:        ['admin', 'nakliyeci', 'satin_almaci'],
  is_ortaklari:      ['admin', 'satin_almaci'],
  makineler:         ['admin', 'operator', 'nakliyeci'],
  kaliplar:          ['admin', 'operator'],
  tatil_gunleri:     ['admin'],
  vardiyalar:        ['admin'],
  durus_nedenleri:   ['admin'],
  hafta_sonu_planlari: ['admin'],
  calisma_planlari: ['admin'],
  uretim_tanimlari: ['admin'],
  satis_siparisleri: ['admin', 'nakliyeci'],
  uretim_emirleri:   ['admin', 'operator'],
  makine_havuzu:     ['admin', 'operator', 'nakliyeci'],
  is_yukler:         ['admin', 'operator'],
  gantt:             ['admin', 'operator', 'nakliyeci'],
  stoklar:           ['admin', 'operator', 'satin_almaci', 'nakliyeci'],
  satin_alma:        ['admin', 'satin_almaci'],
  sevkiyat:          ['admin', 'nakliyeci'],
  hareketler:        ['admin', 'operator', 'satin_almaci', 'nakliyeci'],
  gorevler:          ['admin', 'operator', 'satin_almaci', 'nakliyeci'],
  giris_ayarlari:    ['admin'],
  kullanicilar:      ['admin'],
  operator:          ['admin', 'operator'],
  tanimlar:          ['admin', 'operator', 'satin_almaci', 'nakliyeci'],
  tedarikci:         ['admin', 'satin_almaci'],
  kategoriler:       ['admin'],
  audit_logs:        ['admin'],
  site_settings:     ['admin'],
  mal_kabul:         ['admin', 'satin_almaci'],
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
    { prefix: '/admin/gantt',              key: 'gantt' },
    { prefix: '/admin/gorevler',           key: 'gorevler' },
    { prefix: '/admin/giris-ayarlari',     key: 'giris_ayarlari' },
    { prefix: '/admin/users',              key: 'kullanicilar' },
    { prefix: '/admin/musteriler',         key: 'musteriler' },
    { prefix: '/admin/dashboard',          key: 'dashboard' },
    { prefix: '/admin/sevkiyat',           key: 'sevkiyat' },
    { prefix: '/admin/mal-kabul',          key: 'mal_kabul' },
    { prefix: '/admin/tedarikci',          key: 'tedarikci' },
    { prefix: '/admin/urunler',            key: 'urunler' },
    { prefix: '/admin/uretim-emirleri',    key: 'uretim_emirleri' },
    { prefix: '/admin/makine-havuzu',      key: 'makine_havuzu' },
    { prefix: '/admin/is-yukler',          key: 'is_yukler' },
    { prefix: '/admin/tanimlar',           key: 'tanimlar' },
    { prefix: '/admin/receteler',          key: 'urunler' },
  ];

  const clean = pathname.split('?')[0] ?? pathname;

  // Profil sayfasi tum roller icin erisime acik
  if (clean === '/admin/profile' || clean.startsWith('/admin/profile/')) return true;

  for (const { prefix, key } of PATH_ROLE_MAP) {
    if (clean === prefix || clean.startsWith(`${prefix}/`)) {
      return NAV_ROLES[key].includes(role);
    }
  }

  return false;
}
