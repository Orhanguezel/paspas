// =============================================================
// FILE: src/integrations/hooks.ts
// Barrel exports for RTK Query hooks (Xilan)
// =============================================================

// =========================
// Public / Shared endpoints
// =========================

// Auth (Public)
export * from '@/integrations/endpoints/users/auth_public.endpoints';
export * from '@/integrations/endpoints/users/profiles.endpoints';
export * from '@/integrations/endpoints/users/user_roles.endpoints';

// Public Endpoints
export * from '@/integrations/endpoints/public/site_settings_public.endpoints';

// =========================
// Admin endpoints
// =========================

// Core / Auth / Dashboard / DB
export * from '@/integrations/endpoints/admin/users/auth_admin.endpoints';
export * from '@/integrations/endpoints/admin/users/roles_admin.endpoints';

export * from '@/integrations/endpoints/admin/dashboard_admin.endpoints';
export * from '@/integrations/endpoints/admin/db_admin.endpoints';
export * from '@/integrations/endpoints/admin/test_center.endpoints';
export * from '@/integrations/endpoints/admin/page_feedback.endpoints';
export * from '@/integrations/endpoints/admin/proje_teklifi_notlari.endpoints';

// Content / CMS
export * from '@/integrations/endpoints/admin/custom_pages_admin.endpoints';
export * from '@/integrations/endpoints/admin/contacts_admin.endpoints';
export * from '@/integrations/endpoints/admin/reviews_admin.endpoints';
export * from '@/integrations/endpoints/admin/faqs_admin.endpoints';
export * from '@/integrations/endpoints/admin/sliders_admin.endpoints';
export * from '@/integrations/endpoints/admin/services_admin.endpoints';
export * from '@/integrations/endpoints/admin/flash_sale_admin.endpoints';
export * from '@/integrations/endpoints/admin/theme_admin.endpoints';

// System / Infra / RBAC
export * from '@/integrations/endpoints/admin/audit_admin.endpoints';
export * from '@/integrations/endpoints/admin/site_settings_admin.endpoints';
export * from '@/integrations/endpoints/admin/integration_settings_admin.endpoints';
export * from '@/integrations/endpoints/admin/storage_admin.endpoints';
export * from '@/integrations/endpoints/admin/users/roles_admin.endpoints';
export * from '@/integrations/endpoints/admin/email_templates_admin.endpoints';
export * from '@/integrations/endpoints/admin/mail_admin.endpoints';
export * from '@/integrations/endpoints/admin/newsletter_admin.endpoints';
export * from '@/integrations/endpoints/admin/notifications_admin.endpoints';
export * from '@/integrations/endpoints/admin/offers_admin.endpoints';
export * from '@/integrations/endpoints/admin/reports_admin.endpoints';
export * from '@/integrations/endpoints/admin/popups_admin.endpoints';
export * from '@/integrations/endpoints/admin/menu_items_admin.endpoints';
export * from '@/integrations/endpoints/admin/projects_admin.endpoints';
export * from '@/integrations/endpoints/admin/pricing_admin.endpoints';
export * from '@/integrations/endpoints/admin/resume.admin.endpoints';
export * from '@/integrations/endpoints/admin/skill.admin.endpoints';
export * from '@/integrations/endpoints/admin/brands.admin.endpoints';
export * from '@/integrations/endpoints/admin/listing_tags.admin.endpoints';
export * from '@/integrations/endpoints/admin/banners_admin.endpoints';
export * from '@/integrations/endpoints/admin/footer_sections_admin.endpoints';
export * from '@/integrations/endpoints/admin/resources_admin.endpoints';
export * from '@/integrations/endpoints/admin/availability_admin.endpoints';
export * from '@/integrations/endpoints/admin/telegram_inbound.endpoints';
export * from '@/integrations/endpoints/admin/telegram_webhook.endpoints';
export * from '@/integrations/endpoints/admin/telegram_admin.endpoints';

export * from '@/integrations/endpoints/admin/chat_admin.endpoints';
export * from '@/integrations/endpoints/admin/catalog_admin.endpoints';
export * from '@/integrations/endpoints/admin/categories_admin.endpoints';
export * from '@/integrations/endpoints/admin/library_admin.endpoints';
export * from '@/integrations/endpoints/admin/product_specs_admin.endpoints';
export * from '@/integrations/endpoints/admin/products_admin.endpoints';
export * from '@/integrations/endpoints/admin/products_admin.faqs.endpoints';
export * from '@/integrations/endpoints/admin/products_admin.reviews.endpoints';
export * from '@/integrations/endpoints/admin/references_admin.endpoints';
export * from '@/integrations/endpoints/admin/subcategories_admin.endpoints';
export * from '@/integrations/endpoints/admin/variants_admin.endpoints';
export * from '@/integrations/endpoints/admin/units_admin.endpoints';
export * from '@/integrations/endpoints/admin/announcements_admin.endpoints';
export * from '@/integrations/endpoints/admin/articles_admin.endpoints';
export * from '@/integrations/endpoints/admin/news_aggregator_admin.endpoints';
export * from '@/integrations/endpoints/admin/wallet_admin.endpoints';
export * from '@/integrations/endpoints/admin/coupons_admin.endpoints';

// ERP Modules
export * from '@/integrations/endpoints/admin/erp/urunler_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/musteriler_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/receteler_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/satis_siparisleri_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/uretim_emirleri_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/makine_havuzu_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/is_yukler_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/gantt_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/stoklar_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/satin_alma_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/hareketler_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/operator_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/tanimlar_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/tedarikci_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/audit_logs_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/gorevler_admin.endpoints';
export * from '@/integrations/endpoints/admin/erp/giris_ayarlari_admin.endpoints';
