// =============================================================
// FILE: src/integrations/rtk/tags.ts
// RTK Query cache/tag listesi (public API modülleri)
// =============================================================

export const metahubTags = [
  'Auth',
  'User',
  'AdminUsers',
  'Profiles',
  'Profile',
  'UserRoles',
  'UserRole',
  'SiteSettings',
  'SiteSettingsBulk',
  'CustomPages',
  'CustomPageSlug',
  'CustomPage',
  'Faqs',
  'Services',
  'MenuItems',
  'MenuItem',
  'MenuItemPublic',
  'Contacts',
  'EmailTemplates',
  'EmailTemplate',
  'FooterSections',
  'FooterSectionsBySlug',
  'Mail',
  'Newsletter',
  'Notifications',
  'Notification',
  'Support',
  'Storage',
  'Health',
  'DbAdmin',
  'DbSnapshot',
  'DbModule',
  'DbManifest',
  'AuditAuthEvent',
  'AuditRequestLog',
  'AuditMetric',
] as const;

export type MetahubTag = (typeof metahubTags)[number];
