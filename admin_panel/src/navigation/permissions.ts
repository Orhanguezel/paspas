// =============================================================
// FILE: src/navigation/permissions.ts
// Promat ERP — 4 rol tanımı + sayfa erişim kontrolü
// =============================================================

export type PanelRole = "admin" | "operator" | "satin_almaci" | "nakliyeci";

export type AdminNavKey =
  | "dashboard"
  | "urunler"
  | "musteriler"
  | "firma_bulma"
  | "firma_kurulumu"
  | "crm"
  | "firsat"
  | "is_ortaklari"
  | "makineler"
  | "kaliplar"
  | "birimler"
  | "tatil_gunleri"
  | "vardiyalar"
  | "durus_nedenleri"
  | "hafta_sonu_planlari"
  | "makine_kapama"
  | "calisma_planlari"
  | "uretim_tanimlari"
  | "satis_siparisleri"
  | "uretim_emirleri"
  | "makine_havuzu"
  | "is_yukler"
  | "gantt"
  | "stoklar"
  | "satin_alma"
  | "hareketler"
  | "gorevler"
  | "giris_ayarlari"
  | "kullanicilar"
  | "operator"
  | "tanimlar"
  | "audit_logs"
  | "site_settings"
  | "tedarikci"
  | "kategoriler"
  | "sevkiyat"
  | "mal_kabul"
  | "storage"
  | "db_admin"
  | "test_center"
  | "admin_documentation"
  | "vardiya_analizi"
  | "web_sayfasi"
  | "yazilim_gorevleri"
  | "promats_mcp"
  | "teklif_talepleri"
  | "teklifler"
  | "iletisim_mesajlari";

// Her rolün varsayılan giriş sayfası (login sonrası yönlendirme)
export const ROLE_HOME: Record<PanelRole, string> = {
  admin: "/admin/dashboard",
  operator: "/admin/operator",
  satin_almaci: "/admin/satin-alma",
  nakliyeci: "/admin/sevkiyat",
};

// Modül → izin verilen roller
const NAV_ROLES: Record<AdminNavKey, PanelRole[]> = {
  dashboard: ["admin"],
  urunler: ["admin", "operator", "satin_almaci"],
  musteriler: ["admin", "satin_almaci"],
  firma_bulma: ["admin", "nakliyeci"],
  firma_kurulumu: ["admin"],
  crm: ["admin"],
  firsat: ["admin", "nakliyeci"],
  is_ortaklari: ["admin", "satin_almaci"],
  makineler: ["admin", "operator"],
  kaliplar: ["admin", "operator"],
  birimler: ["admin"],
  tatil_gunleri: ["admin"],
  vardiyalar: ["admin"],
  durus_nedenleri: ["admin"],
  hafta_sonu_planlari: ["admin"],
  makine_kapama: ["admin"],
  calisma_planlari: ["admin"],
  uretim_tanimlari: ["admin"],
  satis_siparisleri: ["admin"],
  uretim_emirleri: ["admin", "operator"],
  makine_havuzu: ["admin", "operator"],
  is_yukler: ["admin", "operator"],
  gantt: ["admin", "operator"],
  stoklar: ["admin", "operator", "satin_almaci"],
  satin_alma: ["admin", "satin_almaci"],
  sevkiyat: ["admin", "nakliyeci"],
  hareketler: ["admin", "operator", "satin_almaci"],
  gorevler: ["admin", "operator", "satin_almaci"],
  giris_ayarlari: ["admin"],
  kullanicilar: ["admin"],
  operator: ["admin", "operator"],
  tanimlar: ["admin", "operator", "satin_almaci"],
  tedarikci: ["admin", "satin_almaci"],
  kategoriler: ["admin"],
  audit_logs: ["admin"],
  site_settings: ["admin"],
  mal_kabul: ["admin", "satin_almaci"],
  storage: ["admin"],
  db_admin: ["admin"],
  test_center: ["admin"],
  admin_documentation: ["admin"],
  vardiya_analizi: ["admin"],
  web_sayfasi: ["admin"],
  yazilim_gorevleri: ["admin"],
  promats_mcp: ["admin"],
  teklif_talepleri: ["admin", "nakliyeci"],
  teklifler: ["admin", "nakliyeci"],
  iletisim_mesajlari: ["admin"],
};

export function getAdminNavRoles(key: AdminNavKey): PanelRole[] {
  return NAV_ROLES[key] ?? ["admin"];
}

// Bir rolün belirli bir URL'e erişip erişemeyeceğini kontrol eder
export function canAccessAdminPath(role: PanelRole | PanelRole[], pathname: string): boolean {
  const roles = Array.isArray(role) ? role : [role];
  if (roles.includes("admin")) return true;

  // Her modülün URL prefix'ini izinli rollerle eşleştir
  const PATH_ROLE_MAP: Array<{ prefix: string; key: AdminNavKey }> = [
    { prefix: "/admin/operator", key: "operator" },
    { prefix: "/admin/satin-alma", key: "satin_alma" },
    { prefix: "/admin/stoklar", key: "stoklar" },
    { prefix: "/admin/satis-siparisleri", key: "satis_siparisleri" },
    { prefix: "/admin/hareketler", key: "hareketler" },
    { prefix: "/admin/gantt", key: "gantt" },
    { prefix: "/admin/gorevler", key: "gorevler" },
    { prefix: "/admin/giris-ayarlari", key: "giris_ayarlari" },
    { prefix: "/admin/users", key: "kullanicilar" },
    { prefix: "/admin/musteriler", key: "musteriler" },
    { prefix: "/admin/firma-bulma", key: "firma_bulma" },
    { prefix: "/admin/firma-kurulumu", key: "firma_kurulumu" },
    { prefix: "/admin/crm", key: "crm" },
    { prefix: "/admin/firsat", key: "firsat" },
    { prefix: "/admin/dashboard", key: "dashboard" },
    { prefix: "/admin/sevkiyat", key: "sevkiyat" },
    { prefix: "/admin/mal-kabul", key: "mal_kabul" },
    { prefix: "/admin/tedarikci", key: "tedarikci" },
    { prefix: "/admin/urunler", key: "urunler" },
    { prefix: "/admin/uretim-emirleri", key: "uretim_emirleri" },
    { prefix: "/admin/makine-havuzu", key: "makine_havuzu" },
    { prefix: "/admin/is-yukler", key: "is_yukler" },
    { prefix: "/admin/tanimlar", key: "tanimlar" },
    { prefix: "/admin/receteler", key: "urunler" },
    { prefix: "/admin/test-merkezi", key: "test_center" },
    { prefix: "/admin/dokumantasyon", key: "admin_documentation" },
    { prefix: "/admin/web-sayfasi", key: "web_sayfasi" },
    { prefix: "/admin/yazilim-gorevleri", key: "yazilim_gorevleri" },
    { prefix: "/admin/promats-mcp", key: "promats_mcp" },
    { prefix: "/admin/teklif-talepleri", key: "teklif_talepleri" },
    { prefix: "/admin/teklifler", key: "teklifler" },
    { prefix: "/admin/contacts", key: "iletisim_mesajlari" },
  ];

  const clean = pathname.split("?")[0] ?? pathname;

  // Profil sayfasi tum roller icin erisime acik
  if (clean === "/admin/profile" || clean.startsWith("/admin/profile/")) return true;

  for (const { prefix, key } of PATH_ROLE_MAP) {
    if (clean === prefix || clean.startsWith(`${prefix}/`)) {
      return roles.some((current) => NAV_ROLES[key].includes(current));
    }
  }

  return false;
}
