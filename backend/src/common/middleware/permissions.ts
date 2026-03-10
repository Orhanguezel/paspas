import type { FastifyReply, FastifyRequest } from 'fastify';
import { eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { rolePermissions } from '@/modules/userRoles/schema';

import { requireAuth } from './auth';
import type { AppRole } from './roles';

export type AdminPermissionKey =
  | 'admin.dashboard'
  | 'admin.urunler'
  | 'admin.receteler'
  | 'admin.musteriler'
  | 'admin.satis_siparisleri'
  | 'admin.satis_pazarlama'
  | 'admin.uretim_emirleri'
  | 'admin.makine_havuzu'
  | 'admin.is_yukler'
  | 'admin.gantt'
  | 'admin.stoklar'
  | 'admin.satin_alma'
  | 'admin.hareketler'
  | 'admin.sevkiyat'
  | 'admin.gorevler'
  | 'admin.giris_ayarlari'
  | 'admin.operator'
  | 'admin.tanimlar'
  | 'admin.tedarikci'
  | 'admin.app_settings'
  | 'admin.users'
  | 'admin.storage'
  | 'admin.db_admin'
  | 'admin.audit'
  | 'admin.properties'
  | 'admin.flash_sale'
  | 'admin.contacts'
  | 'admin.mal_kabul'
  | 'admin.reviews';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';
export type AdminPermissionActionKey = `${AdminPermissionKey}.${PermissionAction}`;

export type PermissionCatalogItem = {
  key: AdminPermissionActionKey;
  name: string;
  group: string | null;
  description: string | null;
};

const ADMIN_ONLY: AppRole[] = ['admin'];
const ADMIN_AND_OPERATOR: AppRole[] = ['admin', 'operator'];
const ADMIN_AND_SEVKIYATCI: AppRole[] = ['admin', 'sevkiyatci'];
const ADMIN_AND_SATIN_ALMACI: AppRole[] = ['admin', 'satin_almaci'];
const ALL_ERP_ROLES: AppRole[] = ['admin', 'sevkiyatci', 'operator', 'satin_almaci'];

const ADMIN_PERMISSION_MAP: Record<AdminPermissionKey, AppRole[]> = {
  'admin.dashboard': ALL_ERP_ROLES,
  'admin.urunler': ['admin', 'operator', 'satin_almaci'],
  'admin.receteler': ['admin', 'operator'],
  'admin.musteriler': ['admin', 'sevkiyatci', 'satin_almaci'],
  'admin.satis_siparisleri': ADMIN_AND_SEVKIYATCI,
  'admin.satis_pazarlama': ADMIN_AND_SEVKIYATCI,
  'admin.uretim_emirleri': ADMIN_AND_OPERATOR,
  'admin.makine_havuzu': ADMIN_AND_OPERATOR,
  'admin.is_yukler': ADMIN_AND_OPERATOR,
  'admin.gantt': ['admin', 'operator', 'sevkiyatci'],
  'admin.stoklar': ['admin', 'operator', 'sevkiyatci', 'satin_almaci'],
  'admin.satin_alma': ADMIN_AND_SATIN_ALMACI,
  'admin.tedarikci': ADMIN_AND_SATIN_ALMACI,
  'admin.hareketler': ALL_ERP_ROLES,
  'admin.mal_kabul': ADMIN_AND_SATIN_ALMACI,
  'admin.sevkiyat': ADMIN_AND_SEVKIYATCI,
  'admin.gorevler': ALL_ERP_ROLES,
  'admin.giris_ayarlari': ADMIN_ONLY,
  'admin.operator': ADMIN_AND_OPERATOR,
  'admin.tanimlar': ['admin', 'operator', 'satin_almaci'],
  'admin.app_settings': ADMIN_ONLY,
  'admin.users': ADMIN_ONLY,
  'admin.storage': ADMIN_ONLY,
  'admin.db_admin': ADMIN_ONLY,
  'admin.audit': ADMIN_ONLY,
  'admin.properties': ADMIN_ONLY,
  'admin.flash_sale': ADMIN_ONLY,
  'admin.contacts': ADMIN_ONLY,
  'admin.reviews': ADMIN_ONLY,
};

const MODULE_META: Record<AdminPermissionKey, { label: string; group: string }> = {
  'admin.dashboard': { label: 'Dashboard', group: 'Yonetim' },
  'admin.urunler': { label: 'Urunler', group: 'ERP' },
  'admin.receteler': { label: 'Receteler', group: 'ERP' },
  'admin.musteriler': { label: 'Musteriler', group: 'ERP' },
  'admin.satis_siparisleri': { label: 'Satis Siparisleri', group: 'ERP' },
  'admin.satis_pazarlama': { label: 'Satis & Pazarlama', group: 'ERP' },
  'admin.uretim_emirleri': { label: 'Uretim Emirleri', group: 'ERP' },
  'admin.makine_havuzu': { label: 'Makine Havuzu', group: 'ERP' },
  'admin.is_yukler': { label: 'Makine Is Yukleri', group: 'ERP' },
  'admin.gantt': { label: 'Gantt', group: 'ERP' },
  'admin.stoklar': { label: 'Stoklar', group: 'ERP' },
  'admin.satin_alma': { label: 'Satin Alma', group: 'ERP' },
  'admin.hareketler': { label: 'Hareketler', group: 'ERP' },
  'admin.mal_kabul': { label: 'Mal Kabul', group: 'ERP' },
  'admin.sevkiyat': { label: 'Sevkiyat', group: 'ERP' },
  'admin.gorevler': { label: 'Gorevler', group: 'ERP' },
  'admin.giris_ayarlari': { label: 'Giris Ayarlari', group: 'Yonetim' },
  'admin.operator': { label: 'Operator', group: 'ERP' },
  'admin.tanimlar': { label: 'Tanimlar', group: 'ERP' },
  'admin.tedarikci': { label: 'Tedarikci', group: 'ERP' },
  'admin.app_settings': { label: 'Site Ayarlari', group: 'Yonetim' },
  'admin.users': { label: 'Kullanicilar', group: 'Yonetim' },
  'admin.storage': { label: 'Medyalar', group: 'Yonetim' },
  'admin.db_admin': { label: 'Veritabani', group: 'Yonetim' },
  'admin.audit': { label: 'Audit', group: 'Yonetim' },
  'admin.properties': { label: 'Properties', group: 'Legacy' },
  'admin.flash_sale': { label: 'Flash Sale', group: 'Legacy' },
  'admin.contacts': { label: 'Contacts', group: 'Legacy' },
  'admin.reviews': { label: 'Reviews', group: 'Legacy' },
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Goruntule',
  create: 'Olustur',
  update: 'Guncelle',
  delete: 'Sil',
};

function normalizeRole(value: unknown): AppRole | undefined {
  if (typeof value !== 'string') return undefined;
  if (value === 'admin' || value === 'operator' || value === 'sevkiyatci' || value === 'satin_almaci') return value;
  if (value === 'seller') return 'sevkiyatci';
  if (value === 'moderator') return 'satin_almaci';
  if (value === 'user') return 'operator';
  return undefined;
}

function getEffectiveRoles(req: FastifyRequest): AppRole[] {
  const user = (req as { user?: { role?: unknown; roles?: unknown[]; is_admin?: boolean } }).user ?? {};
  const set = new Set<AppRole>();
  const mainRole = normalizeRole(user.role);
  if (mainRole) set.add(mainRole);
  if (Array.isArray(user.roles)) {
    for (const rawRole of user.roles) {
      const role = normalizeRole(rawRole);
      if (role) set.add(role);
    }
  }
  if (user.is_admin === true) set.add('admin');
  return Array.from(set);
}

function inferActionFromMethod(method: string): PermissionAction {
  const upper = method.toUpperCase();
  if (upper === 'POST') return 'create';
  if (upper === 'PATCH' || upper === 'PUT') return 'update';
  if (upper === 'DELETE') return 'delete';
  return 'view';
}

function buildPermissionKey(key: AdminPermissionKey, action: PermissionAction): AdminPermissionActionKey {
  return `${key}.${action}` as AdminPermissionActionKey;
}

export const ERP_PERMISSION_CATALOG: PermissionCatalogItem[] = (Object.keys(MODULE_META) as AdminPermissionKey[]).flatMap((moduleKey) =>
  (Object.keys(ACTION_LABELS) as PermissionAction[]).map((action) => ({
    key: buildPermissionKey(moduleKey, action),
    name: `${MODULE_META[moduleKey].label} ${ACTION_LABELS[action]}`,
    group: MODULE_META[moduleKey].group,
    description: `${MODULE_META[moduleKey].label} modulu icin ${ACTION_LABELS[action].toLowerCase()} yetkisi`,
  })),
);

export function getDefaultPermissionKeysForRole(role: AppRole): AdminPermissionActionKey[] {
  const allowedModules = (Object.keys(ADMIN_PERMISSION_MAP) as AdminPermissionKey[]).filter((key) =>
    (ADMIN_PERMISSION_MAP[key] ?? ADMIN_ONLY).includes(role),
  );

  return allowedModules.flatMap((moduleKey) =>
    (['view', 'create', 'update', 'delete'] as PermissionAction[]).map((action) => buildPermissionKey(moduleKey, action)),
  );
}

async function getStoredPermissionKeysForRoles(roles: AppRole[]): Promise<Map<AppRole, Set<string>>> {
  const map = new Map<AppRole, Set<string>>();
  if (roles.length === 0) return map;
  const rows = await db
    .select()
    .from(rolePermissions)
    .where(inArray(rolePermissions.role, roles));

  for (const role of roles) {
    const set = new Set(
      rows
        .filter((row) => normalizeRole(row.role) === role && Number(row.is_allowed) === 1)
        .map((row) => row.permission_key),
    );
    if (set.size > 0) map.set(role, set);
  }
  return map;
}

export async function listPermissionCatalog(): Promise<PermissionCatalogItem[]> {
  return ERP_PERMISSION_CATALOG;
}

export async function resolveRolePermissionKeys(role: AppRole): Promise<string[]> {
  const stored = await db
    .select()
    .from(rolePermissions)
    .where(eq(rolePermissions.role, role));
  const allowed = stored
    .filter((row) => Number(row.is_allowed) === 1)
    .map((row) => row.permission_key);
  if (allowed.length > 0) return allowed;
  return getDefaultPermissionKeysForRole(role);
}

export async function canAccessAdminPermission(
  req: FastifyRequest,
  key: AdminPermissionKey,
): Promise<boolean> {
  const roles = getEffectiveRoles(req);
  if (roles.length === 0) return false;

  const action = inferActionFromMethod(req.method);
  const needed = buildPermissionKey(key, action);
  const storedMap = await getStoredPermissionKeysForRoles(roles);

  return roles.some((role) => {
    const stored = storedMap.get(role);
    if (stored) return stored.has(needed);
    return getDefaultPermissionKeysForRole(role).includes(needed);
  });
}

export async function requireAdminPermission(
  req: FastifyRequest,
  reply: FastifyReply,
  key: AdminPermissionKey,
) {
  if (await canAccessAdminPermission(req, key)) return;
  reply.code(403).send({ error: { message: 'forbidden' } });
  return;
}

export function makeAdminPermissionGuard(key: AdminPermissionKey) {
  return async function adminPermissionGuard(req: FastifyRequest, reply: FastifyReply) {
    await requireAuth(req, reply);
    if (reply.sent) return;
    await requireAdminPermission(req, reply, key);
  };
}
