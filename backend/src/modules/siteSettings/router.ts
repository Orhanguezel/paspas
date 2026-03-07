// =============================================================
// FILE: src/modules/siteSettings/router.ts (PUBLIC)
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listSiteSettings,
  getSiteSettingByKey,
  getAppLocales,
  getDefaultLocale,
} from "./controller";

const BASE = "/site_settings";

export async function registerSiteSettings(app: FastifyInstance) {
  // Public read-only uçlar
  app.get(`${BASE}`,                 { config: { public: true } }, listSiteSettings);
  app.get(`${BASE}/app-locales`,     { config: { public: true } }, getAppLocales);
  app.get(`${BASE}/default-locale`,  { config: { public: true } }, getDefaultLocale);
  app.get(`${BASE}/:key`,            { config: { public: true } }, getSiteSettingByKey);
}
