import { randomUUID } from 'node:crypto';

import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/modules/auth/schema';
import { siteSettings } from '@/modules/siteSettings/schema';
import { userRoles } from '@/modules/userRoles/schema';

import type { UpdateLoginSettingsBody } from './validation';

type LoginRole = 'admin' | 'sevkiyatci' | 'operator' | 'satin_almaci';

export type LoginRoleUserItem = {
  userId: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

export type LoginRoleSummary = {
  role: LoginRole;
  activeCount: number;
  totalCount: number;
  primaryUserId: string | null;
  primaryUserName: string | null;
  primaryUserEmail: string | null;
  lastLoginAt: string | null;
  users: LoginRoleUserItem[];
};

export type LoginSettingsDto = {
  settings: {
    showQuickLogin: boolean;
    allowPasswordLogin: boolean;
    roleCardsEnabled: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumber: boolean;
      requireSpecialChar: boolean;
    };
    redirects: Record<LoginRole, string>;
    enabledRoles: LoginRole[];
  };
  runtime: {
    publicUrl: string;
    frontendUrl: string;
    corsOrigins: string[];
    tempLoginEnabled: boolean;
    adminAllowlist: string[];
  };
  branding: {
    loginLogoUrl: string | null;
  };
  roles: LoginRoleSummary[];
  summary: {
    totalLoginUsers: number;
    activeLoginUsers: number;
    passiveLoginUsers: number;
  };
  gaps: string[];
};

const DEFAULT_SETTINGS: LoginSettingsDto['settings'] = {
  showQuickLogin: false,
  allowPasswordLogin: true,
  roleCardsEnabled: true,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: false,
  },
  redirects: {
    admin: '/admin/dashboard',
    sevkiyatci: '/admin/sevkiyat',
    operator: '/admin/operator',
    satin_almaci: '/admin/satin-alma',
  },
  enabledRoles: ['admin', 'sevkiyatci', 'operator', 'satin_almaci'],
};

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildGaps(dto: {
  tempLoginEnabled: boolean;
  roles: LoginRoleSummary[];
  passwordPolicy: LoginSettingsDto['settings']['passwordPolicy'];
}): string[] {
  const gaps: string[] = [];
  if (dto.tempLoginEnabled) gaps.push('ALLOW_TEMP_LOGIN aktif; prod oncesi kapatilmasi gerekir.');
  if (dto.passwordPolicy.minLength < 8) {
    gaps.push('Sifre minimum uzunlugu 8 karakterin altinda.');
  }
  if (!dto.passwordPolicy.requireUppercase) {
    gaps.push('Sifre politikasi buyuk harf zorunlulugu icermiyor.');
  }
  if (!dto.passwordPolicy.requireNumber) {
    gaps.push('Sifre politikasi rakam zorunlulugu icermiyor.');
  }
  for (const role of dto.roles) {
    if (role.activeCount === 0) {
      gaps.push(`${role.role} rolu icin aktif giris hesabi yok.`);
    }
    if (role.totalCount > 1) {
      gaps.push(`${role.role} rolu icin birden fazla hesap var; birincil kullanici standardi net degil.`);
    }
  }
  return gaps;
}

export async function repoGetLoginSettings(): Promise<LoginSettingsDto> {
  const [settingsRow, brandingRow, roleRows] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.key, 'erp_login_settings')).limit(1),
    db.select().from(siteSettings).where(eq(siteSettings.key, 'ui_admin_config')).limit(1),
    db
      .select({
        role: userRoles.role,
        userId: users.id,
        email: users.email,
        fullName: users.full_name,
        isActive: users.is_active,
        lastLoginAt: users.last_sign_in_at,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.user_id, users.id))
      .where(inArray(userRoles.role, ['admin', 'sevkiyatci', 'operator', 'satin_almaci']))
      .orderBy(desc(users.last_sign_in_at), users.email),
  ]);

  const storedSettings = safeParseJson<Partial<LoginSettingsDto['settings']>>(settingsRow[0]?.value, {});
  const settings: LoginSettingsDto['settings'] = {
    ...DEFAULT_SETTINGS,
    ...storedSettings,
    passwordPolicy: {
      ...DEFAULT_SETTINGS.passwordPolicy,
      ...(storedSettings.passwordPolicy ?? {}),
    },
    redirects: {
      ...DEFAULT_SETTINGS.redirects,
      ...(storedSettings.redirects ?? {}),
    },
    enabledRoles: Array.isArray(storedSettings.enabledRoles) && storedSettings.enabledRoles.length > 0
      ? (storedSettings.enabledRoles.filter((value): value is LoginRole => ['admin', 'sevkiyatci', 'operator', 'satin_almaci'].includes(String(value))) as LoginRole[])
      : DEFAULT_SETTINGS.enabledRoles,
  };

  const branding = safeParseJson<{ branding?: { login_logo_url?: string; logo_url?: string } }>(brandingRow[0]?.value, {});
  const loginLogoUrl = branding?.branding?.login_logo_url || branding?.branding?.logo_url || null;

  const byRole = new Map<LoginRole, LoginRoleUserItem[]>();
  for (const role of DEFAULT_SETTINGS.enabledRoles) byRole.set(role, []);
  for (const row of roleRows) {
    const role = row.role as LoginRole;
    const list = byRole.get(role) ?? [];
    list.push({
      userId: row.userId,
      email: row.email,
      fullName: row.fullName ?? null,
      isActive: Number(row.isActive) === 1,
      lastLoginAt: toIso(row.lastLoginAt),
    });
    byRole.set(role, list);
  }

  const roles = DEFAULT_SETTINGS.enabledRoles.map((role): LoginRoleSummary => {
    const usersForRole = byRole.get(role) ?? [];
    const primary = usersForRole[0] ?? null;
    return {
      role,
      activeCount: usersForRole.filter((item) => item.isActive).length,
      totalCount: usersForRole.length,
      primaryUserId: primary?.userId ?? null,
      primaryUserName: primary?.fullName ?? null,
      primaryUserEmail: primary?.email ?? null,
      lastLoginAt: primary?.lastLoginAt ?? null,
      users: usersForRole,
    };
  });

  const runtime = {
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:8083',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigins: String(process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '').split(',').map((item) => item.trim()).filter(Boolean),
    tempLoginEnabled: String(process.env.ALLOW_TEMP_LOGIN || '') === '1',
    adminAllowlist: String(process.env.AUTH_ADMIN_EMAILS || '').split(',').map((item) => item.trim()).filter(Boolean),
  };

  const totalLoginUsers = roles.reduce((sum, role) => sum + role.totalCount, 0);
  const activeLoginUsers = roles.reduce((sum, role) => sum + role.activeCount, 0);

  return {
    settings,
    runtime,
    branding: {
      loginLogoUrl,
    },
    roles,
    summary: {
      totalLoginUsers,
      activeLoginUsers,
      passiveLoginUsers: Math.max(totalLoginUsers - activeLoginUsers, 0),
    },
    gaps: buildGaps({
      tempLoginEnabled: runtime.tempLoginEnabled,
      roles,
      passwordPolicy: settings.passwordPolicy,
    }),
  };
}

export async function repoUpdateLoginSettings(body: UpdateLoginSettingsBody): Promise<LoginSettingsDto> {
  const now = new Date();
  await db
    .insert(siteSettings)
    .values({
      id: randomUUID(),
      key: 'erp_login_settings',
      value: JSON.stringify(body),
      created_at: now,
      updated_at: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        value: JSON.stringify(body),
        updated_at: now,
      },
    });

  return repoGetLoginSettings();
}
