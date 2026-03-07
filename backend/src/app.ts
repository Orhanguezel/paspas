// src/app.ts
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

import fs from 'node:fs';
import path from 'node:path';

import authPlugin from "./plugins/authPlugin";
import mysqlPlugin from '@/plugins/mysql';
import { registerSwagger } from '@/plugins/swagger';

import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';
import { buildLoggerOptions, buildRequestLoggerConfig, registerRequestLoggingHooks } from '@/core/logger';
import { registerAdminAuditHook } from '@/common/hooks/adminAudit';

// Altyapı modülleri
import { registerAuth } from '@/modules/auth/router';
import { registerUserAdmin } from '@/modules/auth/admin.routes';
import { registerStorage } from '@/modules/storage/router';
import { registerStorageAdmin } from '@/modules/storage/admin.routes';
import { registerProfiles } from '@/modules/profiles/router';
import { registerNotifications } from '@/modules/notifications/router';
import { registerMail } from '@/modules/mail/router';
import { registerUserRoles } from '@/modules/userRoles/router';
import { registerSiteSettings } from '@/modules/siteSettings/router';
import { registerSiteSettingsAdmin } from '@/modules/siteSettings/admin.routes';
import { registerAppSettingsAdmin } from '@/modules/appSettings/router';
import { registerDbAdmin } from '@/modules/db_admin/admin.routes';
import { registerAdminAudit } from '@/modules/admin_audit/router';
import { registerDashboardAdmin } from '@/modules/dashboard/admin.routes';
import { registerMusteriler } from '@/modules/musteriler/router';
import { registerUrunler } from '@/modules/urunler/router';
import { registerReceteler } from '@/modules/receteler/router';
import { registerSatisSiparisleri } from '@/modules/satis_siparisleri/router';
import { registerUretimEmirleri } from '@/modules/uretim_emirleri/router';
import { registerMakineHavuzu } from '@/modules/makine_havuzu/router';
import { registerIsYukleri } from '@/modules/is_yukler/router';
import { registerGantt } from '@/modules/gantt/router';
import { registerStoklar } from '@/modules/stoklar/router';
import { registerSatinAlma } from '@/modules/satin_alma/router';
import { registerHareketler } from '@/modules/hareketler/router';
import { registerOperator } from '@/modules/operator/router';
import { registerTanimlar } from '@/modules/tanimlar/router';
import { registerTedarikci } from '@/modules/tedarikci/router';
import { registerCategories } from '@/modules/categories/router';
import { registerCategoriesAdmin } from '@/modules/categories/admin.routes';
import { registerGorevler } from '@/modules/gorevler/router';
import { registerGirisAyarlari } from '@/modules/giris_ayarlari/router';

// Storage config (site_settings + env)
import { getStorageSettings } from '@/modules/siteSettings/service';

function parseCorsOrigins(v?: string | string[]): boolean | string[] {
  if (!v) return true;
  if (Array.isArray(v)) return v;
  const s = String(v).trim();
  if (!s) return true;
  const arr = s.split(",").map(x => x.trim()).filter(Boolean);
  return arr.length ? arr : true;
}

function pickUploadsRoot(rawFromSettings?: string | null): string {
  const fallback = path.join(process.cwd(), "uploads");
  const envRoot = env.LOCAL_STORAGE_ROOT && String(env.LOCAL_STORAGE_ROOT).trim();
  const candidate = envRoot || (rawFromSettings || "").trim() || fallback;

  const ensureDir = (p: string): string => {
    try {
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    } catch {
      if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
      return fallback;
    }
  };

  return ensureDir(candidate);
}

function pickUploadsPrefix(rawFromSettings?: string | null): string {
  const envBase = env.LOCAL_STORAGE_BASE_URL && String(env.LOCAL_STORAGE_BASE_URL).trim();
  let p = envBase || (rawFromSettings || "").trim() || "/uploads";
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/+$/, "");
  return `${p}/`;
}

export async function createApp() {
  const { default: buildFastify } =
    (await import('fastify')) as unknown as {
      default: (opts?: Parameters<FastifyInstance['log']['child']>[0]) => FastifyInstance
    };

  const app = buildFastify({
    logger: buildLoggerOptions(),
    disableRequestLogging: true,
    ...buildRequestLoggerConfig(),
  }) as FastifyInstance;

  // --- CORS ---
  await app.register(cors, {
    origin: parseCorsOrigins(env.CORS_ORIGIN as any),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 'Authorization', 'Prefer', 'Accept', 'Accept-Language',
      'x-skip-auth', 'Range',
    ],
    exposedHeaders: ['x-total-count', 'content-range', 'range'],
  });

  // --- Cookie ---
  const cookieSecret =
    (globalThis as any).Bun?.env?.COOKIE_SECRET ??
    process.env.COOKIE_SECRET ?? 'cookie-secret';

  await app.register(cookie, {
    secret: cookieSecret,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      path: '/',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
    },
  });

  // --- JWT ---
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
  });

  // Guard & MySQL
  await app.register(authPlugin);
  await app.register(mysqlPlugin);
  await registerSwagger(app);
  registerRequestLoggingHooks(app);
  registerAdminAuditHook(app);

  // === Uploads static serve ===
  let storageSettings: Awaited<ReturnType<typeof getStorageSettings>> | null = null;
  try {
    storageSettings = await getStorageSettings();
  } catch {
    storageSettings = null;
  }

  const uploadsRoot = pickUploadsRoot(storageSettings?.localRoot);
  const uploadsPrefix = pickUploadsPrefix(storageSettings?.localBaseUrl);

  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: uploadsPrefix,
    decorateReply: false,
  });

  // Multipart
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  app.get('/health', async () => ({ ok: true }));
  app.get('/api/health', async () => ({ ok: true }));

  // === TÜM ROUTER'LAR /api ALTINDA ===
  await app.register(async (api) => {

    // --- Admin modüller → /api/admin/... ---
    await api.register(registerUserAdmin,         { prefix: '/admin' });
    await api.register(registerSiteSettingsAdmin, { prefix: '/admin' });
    await api.register(registerAppSettingsAdmin,  { prefix: '/admin' });
    await api.register(registerStorageAdmin,      { prefix: '/admin' });
    await api.register(registerDbAdmin,           { prefix: '/admin' });
    await api.register(registerAdminAudit,        { prefix: '/admin' });
    await api.register(registerDashboardAdmin,    { prefix: '/admin' });
    await api.register(registerMusteriler,        { prefix: '/admin' });
    await api.register(registerUrunler,           { prefix: '/admin' });
    await api.register(registerReceteler,         { prefix: '/admin' });
    await api.register(registerSatisSiparisleri, { prefix: '/admin' });
    await api.register(registerUretimEmirleri,   { prefix: '/admin' });
    await api.register(registerMakineHavuzu,     { prefix: '/admin' });
    await api.register(registerIsYukleri,        { prefix: '/admin' });
    await api.register(registerGantt,            { prefix: '/admin' });
    await api.register(registerStoklar,          { prefix: '/admin' });
    await api.register(registerSatinAlma,        { prefix: '/admin' });
    await api.register(registerHareketler,       { prefix: '/admin' });
    await api.register(registerOperator,         { prefix: '/admin' });
    await api.register(registerTanimlar,         { prefix: '/admin' });
    await api.register(registerTedarikci,        { prefix: '/admin' });
    await api.register(registerCategoriesAdmin,  { prefix: '/admin' });
    await api.register(registerGorevler,         { prefix: '/admin' });
    await api.register(registerGirisAyarlari,    { prefix: '/admin' });

    // --- Public modüller → /api/... ---
    await registerAuth(api);
    await registerStorage(api);
    await registerProfiles(api);
    await registerNotifications(api);
    await registerMail(api);
    await registerUserRoles(api);
    await registerSiteSettings(api);
    await registerCategories(api);

  }, { prefix: '/api' });

  registerErrorHandlers(app);

  return app;
}
